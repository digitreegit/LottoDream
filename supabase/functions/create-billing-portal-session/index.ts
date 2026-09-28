// ============================================================
// Edge Function: create-billing-portal-session
// Opens the Stripe Billing Portal so subscribers can manage / cancel.
// Body: { platform?: "web" | "native" }
// ============================================================
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getBillingProfile, getUser, parsePlatform, returnUrl, stripe } from "../_shared/billing.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const platform = parsePlatform(await req.json().catch(() => null));
    const { stripe_customer_id: customerId } = await getBillingProfile(user.id);
    if (!customerId) return jsonResponse({ error: "No subscription found" }, 404);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl(platform, { portal: "closed" }),
    });
    return jsonResponse({ url: session.url });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
