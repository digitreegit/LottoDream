// ============================================
// Payment Service – monthly Premium subscription (web)
// ============================================
//
// Strategy (web-only):
//   • `startPremiumCheckout()` calls the Supabase Edge Function
//     `create-checkout-session`, which returns a Stripe Checkout URL for the
//     $4.99/mo subscription (7-day free trial). We redirect the current tab.
//   • A Stripe webhook (`stripe-webhook` Edge Function) flips
//     `profiles.subscription_tier` to 'premium' for active/trialing subs.
//   • `openBillingPortal()` calls `create-billing-portal-session` so the user
//     can manage or cancel their subscription.
//
import { supabase } from '../config/supabase';
import {
  PREMIUM_PRODUCT_ID,
  PREMIUM_PRICE_CENTS,
  PREMIUM_CURRENCY,
} from '../config/constants';

export type CheckoutOutcome =
  | { status: 'redirected'; provider: 'stripe' }
  | { status: 'error'; reason: string };

async function invokeFunction(name: string): Promise<{ url?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke(name, { body: {} });
  if (error) {
    // Surface the function's JSON error message when available.
    const ctxBody = (error as any)?.context?.body;
    return { error: ctxBody?.error || error.message || 'Request failed.' };
  }
  return { url: (data as any)?.url, error: (data as any)?.error };
}

/**
 * Start the Premium subscription checkout flow. Resolves after redirecting the
 * browser to Stripe Checkout. Entitlement is observed asynchronously via
 * `useEntitlement().refresh()` / realtime profile updates.
 */
export async function startPremiumCheckout(): Promise<CheckoutOutcome> {
  try {
    if (typeof window === 'undefined') {
      return { status: 'error', reason: 'Checkout is only available on the web.' };
    }
    const { url, error } = await invokeFunction('create-checkout-session');
    if (error || !url) {
      return { status: 'error', reason: error || 'Could not start checkout.' };
    }
    window.location.assign(url);
    return { status: 'redirected', provider: 'stripe' };
  } catch (err: any) {
    return { status: 'error', reason: err?.message || 'Checkout failed.' };
  }
}

/**
 * Open the Stripe Billing Portal so the user can manage / cancel their plan.
 */
export async function openBillingPortal(): Promise<CheckoutOutcome> {
  try {
    if (typeof window === 'undefined') {
      return { status: 'error', reason: 'Billing portal is only available on the web.' };
    }
    const { url, error } = await invokeFunction('create-billing-portal-session');
    if (error || !url) {
      return { status: 'error', reason: error || 'Could not open billing portal.' };
    }
    window.location.assign(url);
    return { status: 'redirected', provider: 'stripe' };
  } catch (err: any) {
    return { status: 'error', reason: err?.message || 'Could not open billing portal.' };
  }
}

/**
 * DEVELOPMENT ONLY. Marks the current user as premium without a real payment.
 * No-op in production builds.
 */
export async function simulatePremiumGrant(): Promise<{ error: string | null }> {
  if (!__DEV__) {
    return { error: 'Disabled outside of development builds.' };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Sign in first.' };

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_tier: 'premium',
      subscription_status: 'active',
      premium_since: new Date().toISOString(),
      premium_source: 'manual',
    })
    .eq('id', user.id);

  return { error: error?.message ?? null };
}

export const PREMIUM_CHECKOUT_INFO = {
  productId: PREMIUM_PRODUCT_ID,
  amountCents: PREMIUM_PRICE_CENTS,
  currency: PREMIUM_CURRENCY,
};
