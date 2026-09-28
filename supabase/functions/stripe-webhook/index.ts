// ============================================================
// Edge Function: stripe-webhook
// Verifies Stripe events and syncs subscription state into Supabase.
//
// IMPORTANT: Deploy with JWT verification DISABLED (Stripe calls this with a
// signature, not a Supabase JWT):
//   supabase functions deploy stripe-webhook --no-verify-jwt
//
// Secrets:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_MONTHLY,
//   STRIPE_PRICE_YEARLY (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected)
// ============================================================
import { admin, refreshEntitlement } from "../_shared/supabase.ts";
import { planForPrice, Stripe, stripe } from "../_shared/stripe.ts";

const cryptoProvider = Stripe.createSubtleCryptoProvider();
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

function toIso(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function resolveUserId(
  customerId: string,
  metaUserId?: string | null,
): Promise<string | null> {
  if (metaUserId) return metaUserId;
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return (data?.id as string) ?? null;
}

// Events can arrive out of order, so always re-read the subscription from
// Stripe and store its current state rather than the event snapshot.
async function syncSubscription(subscriptionId: string) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = await resolveUserId(customerId, sub.metadata?.supabase_user_id);
  if (!userId) return;

  const priceId = sub.items.data[0]?.price?.id ?? null;
  const plan = planForPrice(priceId) ??
    (sub.items.data[0]?.price?.recurring?.interval === "year" ? "yearly" : "monthly");

  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      provider: "stripe",
      provider_subscription_id: sub.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      plan,
      price_id: priceId,
      current_period_end: toIso(sub.current_period_end),
      trial_end: toIso(sub.trial_end),
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      raw_payload: sub as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider,provider_subscription_id" },
  );
  if (error) throw new Error(`subscriptions upsert failed: ${error.message}`);

  await refreshEntitlement(userId);
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      WEBHOOK_SECRET,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    return new Response(`Webhook signature error: ${(err as Error).message}`, {
      status: 400,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) await syncSubscription(session.subscription as string);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed": {
        await syncSubscription((event.data.object as Stripe.Subscription).id);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) await syncSubscription(invoice.subscription as string);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    // 500 makes Stripe retry the event.
    return new Response(`Handler error: ${(err as Error).message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
