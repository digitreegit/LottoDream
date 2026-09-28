// ============================================================
// Edge Function: create-checkout-session
// Creates a Stripe Checkout Session for the Premium subscription (monthly or
// yearly) tied to the authenticated Supabase user. First-time subscribers get
// a free trial (card required); returning users are billed immediately.
// ============================================================
//
// Body: { plan?: "monthly" | "yearly" }   (default "monthly")
//
// Secrets (set via `supabase secrets set ...`):
//   STRIPE_SECRET_KEY          - sk_live_... / sk_test_...
//   STRIPE_PRICE_MONTHLY       - price_... ($4.99 / month)
//   STRIPE_PRICE_YEARLY        - price_... ($39.99 / year)
//   PREMIUM_TRIAL_DAYS         - optional, default 14
//   APP_URL                    - https://lottodream.net (success/cancel base)
// Provided automatically by Supabase:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { admin, getCaller } from "../_shared/supabase.ts";
import { APP_URL, PRICE_IDS, stripe, type Plan } from "../_shared/stripe.ts";

const TRIAL_DAYS = parseInt(Deno.env.get("PREMIUM_TRIAL_DAYS") ?? "14", 10);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const user = await getCaller(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const plan: Plan = body?.plan === "yearly" ? "yearly" : "monthly";
    const priceId = PRICE_IDS[plan];
    if (!priceId) return jsonResponse({ error: `Price not configured for ${plan} plan` }, 500);

    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, email, subscription_tier, premium_source, has_used_trial")
      .eq("id", user.id)
      .maybeSingle();

    // Already subscribed (on any platform) — send them to manage instead.
    if (profile?.subscription_tier === "premium") {
      return jsonResponse(
        { error: "You already have Premium.", source: profile.premium_source },
        409,
      );
    }

    let customerId = profile?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? profile?.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await admin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // One free trial per account, whichever platform it was used on.
    const { count: priorSubs } = await admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    const trialEligible = !profile?.has_used_trial && !priorSubs && TRIAL_DAYS > 0;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_collection: "always",
      subscription_data: {
        ...(trialEligible ? { trial_period_days: TRIAL_DAYS } : {}),
        metadata: { supabase_user_id: user.id, plan },
      },
      allow_promotion_codes: true,
      success_url: `${APP_URL}/?checkout=success`,
      cancel_url: `${APP_URL}/?checkout=cancelled`,
    });

    return jsonResponse({ url: session.url, trial: trialEligible });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
