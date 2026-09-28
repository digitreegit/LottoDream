// Shared types for the in-app purchase layer (iap.ts on web, iap.native.ts on iOS/Android).
export type BillingPlan = 'monthly' | 'yearly';

export interface IapOffer {
  plan: BillingPlan;
  /** Localized store price, e.g. "$4.99". */
  priceString: string;
  /** Free-trial length offered by the store for this product, if the user is eligible. */
  trialDays: number | null;
}

export type IapResult =
  | { status: 'purchased' }
  | { status: 'cancelled' }
  | { status: 'error'; reason: string };
