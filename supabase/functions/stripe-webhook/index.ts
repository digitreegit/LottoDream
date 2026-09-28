// ============================================================
// Edge Function: stripe-webhook
// Verifies Stripe events and syncs subscription state into Supabase.
//
// IMPORTANT: Deploy with JWT verification DISABLED (Stripe calls this with a
// signature, not a Supabase JWT):
//   supabase functions deploy stripe-webhook --no-verify-jwt
//
// Subscribe the endpoint to:
//   checkout.session.completed, customer.subscription.created,
//   customer.subscription.updated, customer.subscription.deleted,
//   customer.subscription.trial_will_end, invoice.paid,
//   invoice.payment_failed
//
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET (+ _shared/billing.ts)
// ============================================================
import { Stripe, stripe, syncSubscription } from "../_shared/billing.ts";

const cryptoProvider = Stripe.createSubtleCryptoProvider();
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

/** Always re-read from Stripe so out-of-order events can't regress state. */
async function syncById(subscriptionId: string | Stripe.Subscription | null | undefined) {
  if (!subscriptionId) return;
  const id = typeof subscriptionId === "string" ? subscriptionId : subscriptionId.id;
  await syncSubscription(await stripe.subscriptions.retrieve(id));
}

/**
 * Setup-mode Checkout (trial user adding a card): make the new card the
 * default for the trial subscription and future invoices.
 */
async function attachTrialPaymentMethod(session: Stripe.Checkout.Session) {
  const setupIntentId = typeof session.setup_intent === "string"
    ? session.setup_intent
    : session.setup_intent?.id;
  if (!setupIntentId) return;

  const intent = await stripe.setupIntents.retrieve(setupIntentId);
  const paymentMethod = typeof intent.payment_method === "string"
    ? intent.payment_method
    : intent.payment_method?.id;
  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  const subscriptionId = intent.metadata?.subscription_id;
  if (!paymentMethod || !customerId) return;

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethod },
  });
  if (subscriptionId) {
    await stripe.subscriptions.update(subscriptionId, { default_payment_method: paymentMethod });
    await syncById(subscriptionId);
  }
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
    return new Response(`Webhook signature error: ${(err as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "setup") await attachTrialPaymentMethod(session);
        else await syncById(session.subscription as string | null);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.trial_will_end": {
        await syncById((event.data.object as Stripe.Subscription).id);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        await syncById((event.data.object as Stripe.Invoice).subscription);
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
