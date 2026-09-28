// Shared Stripe client + plan/price mapping.
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

export { Stripe };

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-06-20",
  httpClient: Stripe.createFetchHttpClient(),
});

export type Plan = "monthly" | "yearly";

export const PRICE_IDS: Record<Plan, string> = {
  monthly: Deno.env.get("STRIPE_PRICE_MONTHLY") ?? Deno.env.get("STRIPE_PREMIUM_PRICE_ID") ?? "",
  yearly: Deno.env.get("STRIPE_PRICE_YEARLY") ?? "",
};

export function planForPrice(priceId: string | null | undefined): Plan | null {
  if (!priceId) return null;
  if (priceId === PRICE_IDS.yearly) return "yearly";
  if (priceId === PRICE_IDS.monthly) return "monthly";
  return null;
}

export const APP_URL = (Deno.env.get("APP_URL") ?? "https://lottodream.net").replace(/\/$/, "");
