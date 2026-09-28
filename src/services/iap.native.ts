// ============================================
// In-app purchases — iOS / Android via RevenueCat
// ============================================
//
// • RevenueCat's app user id is the Supabase user id (`iapSetUser`), so the
//   `revenuecat-webhook` Edge Function can sync purchases onto `profiles`.
// • The "premium" entitlement is attached to both products in RevenueCat;
//   the current offering has a MONTHLY and an ANNUAL package.
// • `iapOnPremiumChange` gives instant local unlock after purchase, before the
//   webhook round-trip lands in Supabase.
//
import { Platform } from 'react-native';
import Purchases, {
  PACKAGE_TYPE,
  type CustomerInfo,
  type PurchasesPackage,
} from 'react-native-purchases';
import type { BillingPlan, IapOffer, IapResult } from './iapTypes';

const ENTITLEMENT_ID = 'premium';

const API_KEY =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

export const iapAvailable = Boolean(API_KEY);

let configured = false;
let currentUserId: string | null = null;

function ensureConfigured(): boolean {
  if (!API_KEY) return false;
  if (!configured) {
    Purchases.configure({ apiKey: API_KEY });
    configured = true;
  }
  return true;
}

function hasPremium(info: CustomerInfo): boolean {
  return Boolean(info.entitlements.active[ENTITLEMENT_ID]);
}

/** Tie purchases to the signed-in Supabase user (null on sign-out). */
export async function iapSetUser(userId: string | null): Promise<void> {
  if (!ensureConfigured() || userId === currentUserId) return;
  try {
    if (userId) {
      await Purchases.logIn(userId);
    } else if (currentUserId) {
      await Purchases.logOut();
    }
    currentUserId = userId;
  } catch {
    // Non-fatal: purchases still work; the webhook syncs on the next event.
  }
}

async function getPackages(): Promise<Partial<Record<BillingPlan, PurchasesPackage>>> {
  if (!ensureConfigured()) return {};
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return {};
  return {
    monthly: current.monthly ?? current.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY),
    yearly: current.annual ?? current.availablePackages.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL),
  };
}

function trialDaysOf(pkg: PurchasesPackage): number | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;
  const n = intro.periodNumberOfUnits * intro.cycles;
  switch (intro.periodUnit) {
    case 'DAY':
      return n;
    case 'WEEK':
      return n * 7;
    case 'MONTH':
      return n * 30;
    default:
      return null;
  }
}

export async function iapGetOffers(): Promise<IapOffer[]> {
  try {
    const packages = await getPackages();
    return (Object.entries(packages) as [BillingPlan, PurchasesPackage | undefined][])
      .filter((entry): entry is [BillingPlan, PurchasesPackage] => Boolean(entry[1]))
      .map(([plan, pkg]) => ({
        plan,
        priceString: pkg.product.priceString,
        trialDays: trialDaysOf(pkg),
      }));
  } catch {
    return [];
  }
}

export async function iapPurchase(plan: BillingPlan): Promise<IapResult> {
  try {
    const pkg = (await getPackages())[plan];
    if (!pkg) return { status: 'error', reason: 'This plan is not available right now.' };
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return hasPremium(customerInfo)
      ? { status: 'purchased' }
      : { status: 'error', reason: 'Purchase completed but Premium is not active yet. Try Restore Purchases.' };
  } catch (err: any) {
    if (err?.userCancelled) return { status: 'cancelled' };
    return { status: 'error', reason: err?.message || 'Purchase failed.' };
  }
}

export async function iapRestore(): Promise<IapResult> {
  if (!ensureConfigured()) return { status: 'error', reason: 'In-app purchases are not configured.' };
  try {
    const info = await Purchases.restorePurchases();
    return hasPremium(info)
      ? { status: 'purchased' }
      : { status: 'error', reason: 'No active subscription found for this Apple / Google account.' };
  } catch (err: any) {
    return { status: 'error', reason: err?.message || 'Restore failed.' };
  }
}

/** Open the store's own subscription management screen. */
export async function iapManage(): Promise<void> {
  if (!ensureConfigured()) return;
  await Purchases.showManageSubscriptions();
}

export function iapOnPremiumChange(cb: (active: boolean) => void): () => void {
  if (!ensureConfigured()) return () => undefined;
  const listener = (info: CustomerInfo) => cb(hasPremium(info));
  Purchases.addCustomerInfoUpdateListener(listener);
  Purchases.getCustomerInfo().then(listener).catch(() => undefined);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}
