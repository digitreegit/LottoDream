// ============================================================
// Edge Function: create-billing-portal-session
// Opens the Stripe Billing Portal so web subscribers can manage / cancel.
// (App Store / Google Play subscribers manage through their store.)
// ============================================================
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { admin, getCaller } from "../_shared/supabase.ts";
import { APP_URL, stripe } from "../_shared/stripe.ts";

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

    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, premium_source")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.premium_source === "apple" || profile?.premium_source === "google") {
      const store = profile.premium_source === "apple" ? "App Store" : "Google Play";
      return jsonResponse(
        { error: `Your subscription is billed through ${store}. Manage it from the LottoDream app or your ${store} account settings.` },
        409,
      );
    }

    const customerId = profile?.stripe_customer_id as string | undefined;
    if (!customerId) return jsonResponse({ error: "No subscription found" }, 404);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_URL}/?portal=closed`,
    });

    return jsonResponse({ url: session.url });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
