// ============================================
// Payment Service – one-time Premium unlock
// ============================================
//
// Strategy:
//   • Web: open Stripe Checkout (Payment Link) in a new tab. A Stripe webhook
//     server-side flips `profiles.subscription_tier` to 'premium' and inserts
//     a row in `purchases`.
//   • iOS / Android: App Store & Google Play require first-party IAP for
//     digital unlocks. The real implementation should call StoreKit 2 or
//     Google Billing via Expo modules / RevenueCat. Until that is wired
//     (needs a native prebuild), mobile users are directed to the web
//     purchase flow or see an "in-app purchase coming soon" notice.
//
// Development:
//   • __DEV__ builds expose `simulatePremiumGrant()` so you can test gated UI
//     flows without real payments. In production this function is a no-op.
//
import { Platform, Linking } from 'react-native';
import { supabase } from '../config/supabase';
import {
  PREMIUM_PRODUCT_ID,
  PREMIUM_PRICE_CENTS,
  PREMIUM_CURRENCY,
  STRIPE_PREMIUM_CHECKOUT_URL,
} from '../config/constants';

export type CheckoutOutcome =
  | { status: 'redirected'; provider: 'stripe' }
  | { status: 'unsupported'; provider: 'apple_iap' | 'google_iap'; reason: string }
  | { status: 'error'; reason: string };

/**
 * Kick off the Premium purchase flow for the current platform.
 * Resolves as soon as the flow is handed off to Stripe / the store.
 * Actual entitlement flip is observed asynchronously via `useEntitlement().refresh()`.
 */
export async function startPremiumCheckout(opts?: {
  userId?: string;
  email?: string;
}): Promise<CheckoutOutcome> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return { status: 'error', reason: 'Checkout unavailable in this environment.' };
      }
      const url = new URL(STRIPE_PREMIUM_CHECKOUT_URL);
      if (opts?.userId) url.searchParams.set('client_reference_id', opts.userId);
      if (opts?.email) url.searchParams.set('prefilled_email', opts.email);
      url.searchParams.set('product', PREMIUM_PRODUCT_ID);
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
      return { status: 'redirected', provider: 'stripe' };
    }

    // Native: real IAP integration is a follow-up. For now, redirect to the
    // web checkout via the default browser so testers can still pay.
    const url = STRIPE_PREMIUM_CHECKOUT_URL;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return {
        status: 'unsupported',
        provider: Platform.OS === 'ios' ? 'apple_iap' : 'google_iap',
        reason:
          'In-app purchase is coming soon. We opened the secure web checkout in your browser.',
      };
    }
    return {
      status: 'unsupported',
      provider: Platform.OS === 'ios' ? 'apple_iap' : 'google_iap',
      reason: 'In-app purchase will be available in a future update.',
    };
  } catch (err: any) {
    return { status: 'error', reason: err?.message || 'Checkout failed.' };
  }
}

/**
 * DEVELOPMENT ONLY. Marks the current user as premium without a real payment.
 * Used to exercise gated UI in staging. No-op in production builds.
 *
 * In a real deployment, never expose this — production entitlement flips
 * must come from a verified Stripe / Apple / Google webhook.
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
