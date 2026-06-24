// ============================================================
// Edge Function: stripe-webhook
// Verifies Stripe events and syncs subscription state into Supabase.
//
// IMPORTANT: Deploy with JWT verification DISABLED (Stripe calls this with a
// signature, not a Supabase JWT):
//   supabase functions deploy stripe-webhook --no-verify-jwt
//
// Secrets:
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL,
//   SUPABASE_SERVICE_ROLE_KEY
// ============================================================
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const PREMIUM_STATUSES = new Set(["trialing", "active"]);

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

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = await resolveUserId(customerId, sub.metadata?.supabase_user_id);
  if (!userId) return;

  const status = sub.status;
  const priceId = sub.items.data[0]?.price?.id ?? null;
  const currentPeriodEnd = toIso(sub.current_period_end);
  const trialEnd = toIso(sub.trial_end);
  const cancelAtPeriodEnd = sub.cancel_at_period_end ?? false;
  const isPremium = PREMIUM_STATUSES.has(status);

  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status,
      price_id: priceId,
      current_period_end: currentPeriodEnd,
      trial_end: trialEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      raw_payload: sub as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  await admin
    .from("profiles")
    .update({
      subscription_tier: isPremium ? "premium" : "basic",
      subscription_status: status,
      premium_source: "stripe",
      premium_since: isPremium ? new Date().toISOString() : null,
      stripe_customer_id: customerId,
      current_period_end: currentPeriodEnd,
      trial_end: trialEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
    })
    .eq("id", userId);
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
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            invoice.subscription as string,
          );
          await syncSubscription(sub);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    return new Response(`Handler error: ${(err as Error).message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
