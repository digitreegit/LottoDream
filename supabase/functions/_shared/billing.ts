// ============================================================
// Shared billing helpers for the Stripe Edge Functions.
//
// Secrets (set via `supabase secrets set ...`):
//   STRIPE_SECRET_KEY          - sk_live_... / sk_test_...
//   STRIPE_PREMIUM_PRICE_ID    - price_... (recurring monthly, $4.99)
//   PREMIUM_TRIAL_DAYS         - optional, default 14
//   APP_URL                    - https://lottodream.net (web return base)
// Provided automatically by Supabase:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// ============================================================
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import {
  createClient,
  type User,
} from "https://esm.sh/@supabase/supabase-js@2.45.4";

export { Stripe };

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

export const PRICE_ID = Deno.env.get("STRIPE_PREMIUM_PRICE_ID") ?? "";
export const TRIAL_DAYS = parseInt(Deno.env.get("PREMIUM_TRIAL_DAYS") ?? "14", 10);
export const APP_URL = (Deno.env.get("APP_URL") ?? "https://lottodream.net").replace(/\/$/, "");

export const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

/** Stripe statuses that grant Premium. */
export const PREMIUM_STATUSES = new Set(["trialing", "active"]);
/** Statuses where the user still has a live subscription object. */
export const LIVE_STATUSES = new Set(["trialing", "active", "past_due", "unpaid", "incomplete"]);

export type ClientPlatform = "web" | "native";

export function parsePlatform(body: unknown): ClientPlatform {
  return (body as { platform?: string } | null)?.platform === "native" ? "native" : "web";
}

/**
 * Where Stripe-hosted pages send the user back to. Stripe only accepts
 * http(s) URLs, so native builds land on the web app with `app_return=1`,
 * which immediately bounces to the `lottodream://` scheme and closes the
 * in-app browser session (see src/web-init.ts).
 */
export function returnUrl(platform: ClientPlatform, params: Record<string, string>): string {
  const qs = new URLSearchParams(params);
  if (platform === "native") qs.set("app_return", "1");
  return `${APP_URL}/?${qs.toString()}`;
}

/** Resolve the calling Supabase user from the request's JWT. */
export async function getUser(req: Request): Promise<User | null> {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}

export interface BillingProfile {
  stripe_customer_id: string | null;
  email: string | null;
  trial_used_at: string | null;
}

export async function getBillingProfile(userId: string): Promise<BillingProfile> {
  const { data } = await admin
    .from("profiles")
    .select("stripe_customer_id, email, trial_used_at")
    .eq("id", userId)
    .maybeSingle();
  return {
    stripe_customer_id: (data?.stripe_customer_id as string) ?? null,
    email: (data?.email as string) ?? null,
    trial_used_at: (data?.trial_used_at as string) ?? null,
  };
}

/** Reuse the user's Stripe customer, creating one on first use. */
export async function ensureCustomer(user: User, profile: BillingProfile): Promise<string> {
  if (profile.stripe_customer_id) return profile.stripe_customer_id;
  const customer = await stripe.customers.create({
    email: user.email ?? profile.email ?? undefined,
    metadata: { supabase_user_id: user.id },
  });
  await admin.from("profiles").update({ stripe_customer_id: customer.id }).eq("id", user.id);
  return customer.id;
}

/** The customer's most relevant live subscription, if any. */
export async function findLiveSubscription(customerId: string): Promise<Stripe.Subscription | null> {
  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
  return subs.data.find((s: Stripe.Subscription) => LIVE_STATUSES.has(s.status)) ?? null;
}

function toIso(seconds: number | null | undefined): string | null {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

/** Map a Stripe customer to an existing profile (null once the account is deleted). */
async function resolveUserId(customerId: string, metaUserId?: string | null): Promise<string | null> {
  const query = admin.from("profiles").select("id");
  const { data } = await (metaUserId
    ? query.eq("id", metaUserId)
    : query.eq("stripe_customer_id", customerId)
  ).maybeSingle();
  return (data?.id as string) ?? null;
}

async function subscriptionHasPaymentMethod(sub: Stripe.Subscription, customerId: string): Promise<boolean> {
  if (sub.default_payment_method) return true;
  const customer = await stripe.customers.retrieve(customerId);
  if ((customer as Stripe.DeletedCustomer).deleted) return false;
  return Boolean((customer as Stripe.Customer).invoice_settings?.default_payment_method);
}

/**
 * Mirror a Stripe subscription into `subscriptions` + the billing columns on
 * `profiles`. Always pass a freshly retrieved subscription so out-of-order
 * webhook deliveries can't regress state.
 */
export async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const userId = await resolveUserId(customerId, sub.metadata?.supabase_user_id);
  if (!userId) return;

  const status = sub.status;
  const isPremium = PREMIUM_STATUSES.has(status);
  const currentPeriodEnd = toIso(sub.current_period_end);
  const trialEnd = toIso(sub.trial_end);
  const cancelAtPeriodEnd = sub.cancel_at_period_end ?? false;
  const hasPaymentMethod = await subscriptionHasPaymentMethod(sub, customerId);

  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status,
      price_id: sub.items.data[0]?.price?.id ?? null,
      current_period_end: currentPeriodEnd,
      trial_end: trialEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      raw_payload: sub as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );

  // An old, ended subscription must not overwrite a newer live one.
  if (!LIVE_STATUSES.has(status)) {
    const live = await findLiveSubscription(customerId);
    if (live && live.id !== sub.id) return;
  }

  const { data: current } = await admin
    .from("profiles")
    .select("premium_since, trial_used_at")
    .eq("id", userId)
    .maybeSingle();

  await admin
    .from("profiles")
    .update({
      subscription_tier: isPremium ? "premium" : "basic",
      subscription_status: status,
      premium_source: "stripe",
      premium_since: isPremium ? (current?.premium_since ?? new Date().toISOString()) : null,
      stripe_customer_id: customerId,
      current_period_end: currentPeriodEnd,
      trial_end: trialEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      has_payment_method: hasPaymentMethod,
      trial_used_at: current?.trial_used_at ?? (sub.trial_end ? toIso(sub.created) : null),
    })
    .eq("id", userId);
}
