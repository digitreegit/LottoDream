// ============================================================
// Edge Function: delete-account
// In-app account deletion (required by App Store guideline 5.1.1(v) and
// Google Play). Cancels any live Stripe subscription immediately, then
// deletes the auth user; profile + user data cascade via FK.
// ============================================================
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { admin, getBillingProfile, getUser, LIVE_STATUSES, stripe } from "../_shared/billing.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const user = await getUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const { stripe_customer_id: customerId } = await getBillingProfile(user.id);
    if (customerId) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 });
      for (const sub of subs.data) {
        if (LIVE_STATUSES.has(sub.status)) await stripe.subscriptions.cancel(sub.id);
      }
    }

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ deleted: true });
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 500);
  }
});
