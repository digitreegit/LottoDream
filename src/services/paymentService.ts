// ============================================
// Payment Service – Premium subscription (monthly / yearly)
// ============================================
//
//   • Web: Stripe Checkout via the `create-checkout-session` Edge Function
//     (free trial for first-time subscribers, card required), managed via the
//     Stripe Billing Portal.
//   • iOS / Android: App Store / Google Play in-app purchase through
//     RevenueCat (see iap.native.ts), managed in the store.
//   • Both land in `profiles.subscription_tier` via their webhooks
//     (`stripe-webhook`, `revenuecat-webhook`), read by `useEntitlement`.
//
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { iapManage, iapPurchase, iapRestore } from './iap';
import type { BillingPlan } from './iapTypes';

export type { BillingPlan };

export type CheckoutOutcome =
  | { status: 'redirected'; provider: 'stripe' }
  | { status: 'purchased'; provider: 'iap' }
  | { status: 'cancelled' }
  | { status: 'error'; reason: string };

const isWeb = Platform.OS === 'web';

async function invokeFunction(
  name: string,
  body: Record<string, unknown> = {},
): Promise<{ url?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    // Surface the function's JSON error message when available.
    const ctx = (error as any)?.context;
    let message: string | undefined;
    try {
      message = typeof ctx?.json === 'function' ? (await ctx.json())?.error : ctx?.body?.error;
    } catch {
      message = undefined;
    }
    return { error: message || error.message || 'Request failed.' };
  }
  return { url: (data as any)?.url, error: (data as any)?.error };
}

/**
 * Start a Premium subscription. On web this redirects to Stripe Checkout; in
 * the apps it opens the native App Store / Google Play purchase sheet.
 */
export async function startPremiumCheckout(plan: BillingPlan = 'monthly'): Promise<CheckoutOutcome> {
  if (!isWeb) {
    const result = await iapPurchase(plan);
    if (result.status === 'purchased') return { status: 'purchased', provider: 'iap' };
    return result;
  }
  try {
    const { url, error } = await invokeFunction('create-checkout-session', { plan });
    if (error || !url) {
      return { status: 'error', reason: error || 'Could not start checkout.' };
    }
    window.location.assign(url);
    return { status: 'redirected', provider: 'stripe' };
  } catch (err: any) {
    return { status: 'error', reason: err?.message || 'Checkout failed.' };
  }
}

/** Restore App Store / Google Play purchases (required by Apple). */
export async function restorePurchases(): Promise<CheckoutOutcome> {
  const result = await iapRestore();
  if (result.status === 'purchased') return { status: 'purchased', provider: 'iap' };
  return result;
}

/**
 * Let the user manage / cancel. `source` is where the subscription was bought
 * (`profiles.premium_source`); each provider can only be managed in its own place.
 */
export async function openBillingPortal(source: string | null): Promise<CheckoutOutcome> {
  if (source === 'apple' || source === 'google') {
    if (isWeb) {
      const store = source === 'apple' ? 'App Store' : 'Google Play';
      return {
        status: 'error',
        reason: `Your subscription is billed through ${store}. Manage it in the LottoDream app or your ${store} settings.`,
      };
    }
    await iapManage();
    return { status: 'cancelled' };
  }
  if (!isWeb) {
    return {
      status: 'error',
      reason: 'Your subscription was purchased on lottodream.net. Sign in there to manage or cancel it.',
    };
  }
  try {
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
 * Permanently delete the signed-in account. Cancels any web (Stripe)
 * subscription; App Store / Google Play subscriptions must be cancelled by the
 * user in their store settings.
 */
export async function deleteAccount(): Promise<{ error: string | null }> {
  const { error } = await invokeFunction('delete-account');
  if (error) return { error };
  await supabase.auth.signOut();
  return { error: null };
}
