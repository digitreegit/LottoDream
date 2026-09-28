// ============================================================
// Edge Function: create-checkout-session
// Returns a Stripe-hosted URL for whatever the user needs next:
//
//   • Trialing without a card  → Checkout in `setup` mode. The card is saved
//     to the existing trial subscription (webhook), so billing starts when
//     the trial ends — no second trial, no double charge.
//   • Already paying / past due → Billing Portal (manage or fix payment).
//   • Free                      → Checkout in `subscription` mode. Includes
//     the free trial only if the account hasn't used it yet.
//
// Body: { platform?: "web" | "native" }
// ============================================================
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import {
  ensureCustomer,
  findLiveSubscription,
  getBillingProfile,
  getUser,
  parsePlatform,
  PRICE_ID,
  returnUrl,
  stripe,
  TRIAL_DAYS,
} from "../_shared/billing.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    if (!PRICE_ID) return jsonResponse({ error: "Price not configured" }, 500);

    const user = await getUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const platform = parsePlatform(await req.json().catch(() => null));
    const profile = await getBillingProfile(user.id);
    const customerId = await ensureCustomer(user, profile);
    const live = await findLiveSubscription(customerId);

    if (live?.status === "trialing" && !live.default_payment_method) {
      const session = await stripe.checkout.sessions.create({
        mode: "setup",
        customer: customerId,
        client_reference_id: user.id,
        currency: "usd",
        setup_intent_data: {
          metadata: { supabase_user_id: user.id, subscription_id: live.id },
        },
        success_url: returnUrl(platform, { checkout: "success" }),
        cancel_url: returnUrl(platform, { checkout: "cancelled" }),
      });
      return jsonResponse({ url: session.url, kind: "add_payment_method" });
    }

    if (live) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl(platform, { portal: "closed" }),
      });
      return jsonResponse({ url: portal.url, kind: "portal" });
    }

    const trialEligible = !profile.trial_used_at;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      subscription_data: {
        ...(trialEligible ? { trial_period_days: TRIAL_DAYS } : {}),
        metadata: { supabase_user_id: user.id },
      },
      allow_promotion_codes: true,
      success_url: returnUrl(platform, { checkout: "success" }),
      cancel_url: returnUrl(platform, { checkout: "cancelled" }),
    });
    return jsonResponse({ url: session.url, kind: "subscribe" });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
