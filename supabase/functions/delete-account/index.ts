// ============================================================
// Edge Function: delete-account
// Permanently deletes the caller's account (required by App Store 5.1.1(v)
// and Google Play). Cancels any Stripe subscription immediately, then deletes
// the auth user; profile and user data cascade via foreign keys.
// App Store / Google Play subscriptions cannot be cancelled server-side —
// the app tells the user to cancel those in their store settings.
// ============================================================
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { admin, getCaller } from "../_shared/supabase.ts";
import { stripe } from "../_shared/stripe.ts";

const LIVE_STATUSES = new Set(["trialing", "active", "past_due", "unpaid", "paused"]);

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
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const customerId = profile?.stripe_customer_id as string | undefined;
    if (customerId) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
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
