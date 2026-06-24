// ============================================================
// Edge Function: create-checkout-session
// Creates a Stripe Checkout Session for the $4.99/mo subscription
// with a 7-day free trial, tied to the authenticated Supabase user.
// ============================================================
//
// Secrets (set via `supabase secrets set ...`):
//   STRIPE_SECRET_KEY          - sk_live_... / sk_test_...
//   STRIPE_PREMIUM_PRICE_ID    - price_... (recurring monthly)
//   PREMIUM_TRIAL_DAYS         - e.g. "7" (optional, default 7)
//   APP_URL                    - https://lottodream.net (success/cancel base)
// Provided automatically by Supabase:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
//
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

const PRICE_ID = Deno.env.get("STRIPE_PREMIUM_PRICE_ID") ?? "";
const TRIAL_DAYS = parseInt(Deno.env.get("PREMIUM_TRIAL_DAYS") ?? "7", 10);
const APP_URL = (Deno.env.get("APP_URL") ?? "https://lottodream.net").replace(/\/$/, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    if (!PRICE_ID) return jsonResponse({ error: "Price not configured" }, 500);

    // Authenticate the caller using their JWT.
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) return jsonResponse({ error: "Unauthorized" }, 401);

    // Service-role client for trusted reads/writes.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Reuse an existing Stripe customer if we have one.
    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .maybeSingle();

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

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        metadata: { supabase_user_id: user.id },
      },
      allow_promotion_codes: true,
      success_url: `${APP_URL}/?checkout=success`,
      cancel_url: `${APP_URL}/?checkout=cancelled`,
    });

    return jsonResponse({ url: session.url });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
