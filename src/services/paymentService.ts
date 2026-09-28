// ============================================
// Payment Service – Premium subscription via Stripe (web + iOS + Android)
// ============================================
//
// All billing runs through Supabase Edge Functions; the client never talks
// to Stripe directly and never writes billing columns (a DB trigger blocks it).
//
//   • `startFreeTrial()`   – one tap, no card. `start-trial` creates a 14-day
//                            trialing subscription and unlocks Premium now.
//   • `openCheckout()`     – `create-checkout-session` picks the next step:
//                            add a card to a trial, subscribe, or the portal.
//   • `openBillingPortal()`– manage / cancel.
//   • `deleteAccount()`    – cancels billing and deletes the account.
//
// Web redirects the current tab. Native opens Stripe in an in-app browser
// that closes when Stripe returns to `lottodream://billing` (bounced through
// the web app, see src/web-init.ts).
//
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../config/supabase';
import { APP_SCHEME, IOS_PURCHASE_MODE } from '../config/constants';

export type StripeFlowOutcome =
  /** Web: the tab is navigating to Stripe. */
  | { status: 'redirected' }
  /** Native: the in-app browser closed; `checkout` is set when Stripe returned. */
  | { status: 'returned'; checkout: 'success' | 'cancelled' | null }
  | { status: 'error'; reason: string };

export type TrialOutcome =
  | { status: 'started'; trialEnd: string | null }
  | { status: 'error'; reason: string; code?: string };

/** Whether this build may show purchase / trial CTAs. */
export function canPurchaseInApp(): boolean {
  return !(Platform.OS === 'ios' && IOS_PURCHASE_MODE === 'web_only');
}

const platform = Platform.OS === 'web' ? 'web' : 'native';

async function invokeFunction<T extends Record<string, any>>(
  name: string,
): Promise<{ data?: T; error?: string; code?: string }> {
  const { data, error } = await supabase.functions.invoke(name, { body: { platform } });
  if (error) {
    // FunctionsHttpError carries the Response; surface the function's JSON error.
    const body = await (error as any)?.context?.json?.().catch(() => null);
    return { error: body?.error || error.message || 'Request failed.', code: body?.code };
  }
  if ((data as any)?.error) return { error: (data as any).error, code: (data as any).code };
  return { data: data as T };
}

async function openStripeUrl(url: string): Promise<StripeFlowOutcome> {
  if (Platform.OS === 'web') {
    window.location.assign(url);
    return { status: 'redirected' };
  }
  const result = await WebBrowser.openAuthSessionAsync(url, `${APP_SCHEME}://billing`);
  if (result.type !== 'success') return { status: 'returned', checkout: null };
  const checkout = Linking.parse(result.url).queryParams?.checkout;
  return {
    status: 'returned',
    checkout: checkout === 'success' || checkout === 'cancelled' ? checkout : null,
  };
}

async function runStripeFlow(fn: string, fallback: string): Promise<StripeFlowOutcome> {
  try {
    const { data, error } = await invokeFunction<{ url?: string }>(fn);
    if (error || !data?.url) return { status: 'error', reason: error || fallback };
    return await openStripeUrl(data.url);
  } catch (err: any) {
    return { status: 'error', reason: err?.message || fallback };
  }
}

/** Start the one-per-account, no-card free trial. */
export async function startFreeTrial(): Promise<TrialOutcome> {
  try {
    const { data, error, code } = await invokeFunction<{ trial_end?: string }>('start-trial');
    if (error) return { status: 'error', reason: error, code };
    return { status: 'started', trialEnd: data?.trial_end ?? null };
  } catch (err: any) {
    return { status: 'error', reason: err?.message || 'Could not start your free trial.' };
  }
}

/** Subscribe, or add a card to an active trial (the server decides). */
export function openCheckout(): Promise<StripeFlowOutcome> {
  return runStripeFlow('create-checkout-session', 'Could not start checkout.');
}

/** Open the Stripe Billing Portal so the user can manage / cancel their plan. */
export function openBillingPortal(): Promise<StripeFlowOutcome> {
  return runStripeFlow('create-billing-portal-session', 'Could not open billing portal.');
}

/** Permanently delete the account (cancels any subscription first). */
export async function deleteAccount(): Promise<{ error: string | null }> {
  try {
    const { error } = await invokeFunction('delete-account');
    if (error) return { error };
    await supabase.auth.signOut().catch(() => undefined);
    return { error: null };
  } catch (err: any) {
    return { error: err?.message || 'Could not delete your account.' };
  }
}
