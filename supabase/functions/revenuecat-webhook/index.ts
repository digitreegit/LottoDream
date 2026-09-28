// ============================================================
// Edge Function: revenuecat-webhook
// Syncs App Store / Google Play subscriptions (via RevenueCat) into Supabase.
//
// The app calls Purchases.logIn(<supabase user id>), so RevenueCat's
// app_user_id is our profiles.id. On every event we re-fetch the subscriber
// from the RevenueCat REST API (order-safe) and upsert one row per product.
//
// Deploy with JWT verification DISABLED:
//   supabase functions deploy revenuecat-webhook --no-verify-jwt
//
// Secrets:
//   REVENUECAT_WEBHOOK_AUTH  - value you set as the webhook "Authorization header"
//                              in RevenueCat (Project → Integrations → Webhooks)
//   REVENUECAT_API_KEY       - RevenueCat secret API key (sk_...)
// ============================================================
import { admin, refreshEntitlement } from "../_shared/supabase.ts";

const WEBHOOK_AUTH = Deno.env.get("REVENUECAT_WEBHOOK_AUTH") ?? "";
const RC_API_KEY = Deno.env.get("REVENUECAT_API_KEY") ?? "";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RcSubscription = {
  expires_date: string | null;
  purchase_date: string;
  original_purchase_date: string;
  period_type: "normal" | "trial" | "intro";
  store: "app_store" | "play_store" | "stripe" | "promotional" | string;
  is_sandbox: boolean;
  unsubscribe_detected_at: string | null;
  billing_issues_detected_at: string | null;
  grace_period_expires_date: string | null;
  refunded_at: string | null;
};

const STORE_PROVIDER: Record<string, "apple" | "google"> = {
  app_store: "apple",
  play_store: "google",
};

function statusFor(s: RcSubscription, now: number): string {
  if (s.refunded_at) return "canceled";
  const expires = s.expires_date ? Date.parse(s.expires_date) : Infinity;
  const grace = s.grace_period_expires_date ? Date.parse(s.grace_period_expires_date) : 0;
  if (expires > now) return s.period_type === "trial" ? "trialing" : "active";
  if (grace > now) return "active"; // store billing grace period keeps access
  return s.billing_issues_detected_at ? "past_due" : "expired";
}

function planFor(productId: string): "monthly" | "yearly" {
  return /year|annual/i.test(productId) ? "yearly" : "monthly";
}

async function syncSubscriber(userId: string) {
  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
    { headers: { Authorization: `Bearer ${RC_API_KEY}` } },
  );
  if (!res.ok) throw new Error(`RevenueCat API ${res.status}: ${await res.text()}`);
  const { subscriber } = await res.json();
  const subs = (subscriber?.subscriptions ?? {}) as Record<string, RcSubscription>;
  const now = Date.now();

  const rows = Object.entries(subs)
    .filter(([, s]) => STORE_PROVIDER[s.store])
    .map(([productId, s]) => ({
      user_id: userId,
      provider: STORE_PROVIDER[s.store],
      provider_subscription_id: `${userId}:${productId}`,
      status: statusFor(s, now),
      plan: planFor(productId),
      price_id: productId,
      current_period_end: s.expires_date,
      trial_end: s.period_type === "trial" ? s.expires_date : null,
      cancel_at_period_end: Boolean(s.unsubscribe_detected_at),
      raw_payload: { product_id: productId, ...s },
      updated_at: new Date().toISOString(),
    }));

  if (rows.length) {
    const { error } = await admin
      .from("subscriptions")
      .upsert(rows, { onConflict: "provider,provider_subscription_id" });
    if (error) throw new Error(`subscriptions upsert failed: ${error.message}`);
  }
  await refreshEntitlement(userId);
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!WEBHOOK_AUTH || req.headers.get("Authorization") !== WEBHOOK_AUTH) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const event = payload?.event;
  if (!event) return new Response("Bad payload", { status: 400 });

  // TRANSFER moves purchases between app users; sync both sides.
  const ids = new Set<string>(
    [event.app_user_id, ...(event.transferred_from ?? []), ...(event.transferred_to ?? [])]
      .filter((id): id is string => typeof id === "string" && UUID_RE.test(id)),
  );

  try {
    for (const id of ids) {
      const { data } = await admin.from("profiles").select("id").eq("id", id).maybeSingle();
      if (data) await syncSubscriber(id);
    }
  } catch (err) {
    // 500 makes RevenueCat retry the event.
    return new Response(`Handler error: ${(err as Error).message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
