// ============================================
// In-app purchases — web stub
// ============================================
// Web subscribers pay through Stripe (see paymentService.ts). The native
// implementation lives in iap.native.ts and is picked by Metro on iOS/Android.
import type { BillingPlan, IapOffer, IapResult } from './iapTypes';

export const iapAvailable = false;

export async function iapSetUser(_userId: string | null): Promise<void> {}

export async function iapGetOffers(): Promise<IapOffer[]> {
  return [];
}

export async function iapPurchase(_plan: BillingPlan): Promise<IapResult> {
  return { status: 'error', reason: 'In-app purchases are only available in the mobile app.' };
}

export async function iapRestore(): Promise<IapResult> {
  return { status: 'error', reason: 'In-app purchases are only available in the mobile app.' };
}

export async function iapManage(): Promise<void> {}

export function iapOnPremiumChange(_cb: (active: boolean) => void): () => void {
  return () => undefined;
}
