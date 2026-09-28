// ============================================================
// Edge Function: start-trial
// One tap, no card: creates a Stripe subscription in `trialing` state for
// PREMIUM_TRIAL_DAYS (default 14). If no payment method is added before the
// trial ends, Stripe cancels it and the user drops back to Free — nobody is
// charged by surprise. One trial per account (profiles.trial_used_at).
// ============================================================
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  admin,
  ensureCustomer,
  findLiveSubscription,
  getBillingProfile,
  getUser,
  PRICE_ID,
  stripe,
  syncSubscription,
  TRIAL_DAYS,
} from "../_shared/billing.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    if (!PRICE_ID) return jsonResponse({ error: "Price not configured" }, 500);

    const user = await getUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const profile = await getBillingProfile(user.id);
    if (profile.trial_used_at) {
      return jsonResponse({ error: "Your free trial has already been used.", code: "trial_used" }, 409);
    }

    const customerId = await ensureCustomer(user, profile);
    if (await findLiveSubscription(customerId)) {
      return jsonResponse({ error: "You already have a subscription.", code: "already_subscribed" }, 409);
    }

    // Atomically claim the trial so double taps can't create two.
    const { data: claimed } = await admin
      .from("profiles")
      .update({ trial_used_at: new Date().toISOString() })
      .eq("id", user.id)
      .is("trial_used_at", null)
      .select("id");
    if (!claimed?.length) {
      return jsonResponse({ error: "Your free trial has already been used.", code: "trial_used" }, 409);
    }

    try {
      const sub = await stripe.subscriptions.create(
        {
          customer: customerId,
          items: [{ price: PRICE_ID }],
          trial_period_days: TRIAL_DAYS,
          trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
          payment_settings: { save_default_payment_method: "on_subscription" },
          metadata: { supabase_user_id: user.id, source: "no_card_trial" },
        },
        { idempotencyKey: `trial-${user.id}` },
      );
      // Sync now so the app unlocks instantly; the webhook will confirm.
      await syncSubscription(sub);
      return jsonResponse({
        status: sub.status,
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      });
    } catch (err) {
      await admin.from("profiles").update({ trial_used_at: null }).eq("id", user.id);
      throw err;
    }
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
