// ============================================
// LottoDream - Type Definitions
// ============================================

/**
 * Supported lottery games.
 * National multi-state: powerball, megamillions, cash4life.
 * NY popular draw games: take5, nylotto, pick10.
 */
export type GameType =
  | 'powerball'
  | 'megamillions'
  | 'cash4life'
  | 'take5'
  | 'nylotto'
  | 'pick10';

/** Reliability of a game's data source / sync, surfaced in UI. */
export type GameDataReliability = 'stable' | 'beta';

/** How draws for a game are persisted in Supabase. */
export type GameStorageShape = 'legacy5' | 'array';

/** Game configuration */
export interface GameConfig {
  type: GameType;
  name: string;
  shortName: string;
  icon: string;
  /** Canonical generalized fields */
  mainCount: number;         // how many main numbers are drawn (5, 6, 20...)
  mainMax: number;           // max value of a main number
  hasBonus: boolean;         // whether the game has a bonus ball
  bonusMax: number;          // max value of the bonus ball (0 when none)
  drawsPerDay: number;       // 1 for most, 2 for Take 5 (midday/evening)
  reliability: GameDataReliability;
  storage: GameStorageShape; // legacy5 = n1..n5 columns, array = numbers[] column
  /**
   * Backwards-compatible aliases (kept so existing screens keep working).
   * whiteMax === mainMax, whiteCount === mainCount.
   */
  whiteMax: number;
  whiteCount: number;
  bonusLabel: string;        // "Powerball", "Mega Ball", "Cash Ball", "Bonus"...
  multiplierLabel: string;   // "Power Play" or "Megaplier"
  accentColor: string;
  apiUrl: string;
  officialApiUrls: string[];
  dbTable: string;
  lowHighSplit: number;      // boundary for low/high analysis
}

/**
 * A single lottery draw record (generalized for all games).
 *
 * `numbers` + `bonus` are the canonical representation. The `n1..n5` /
 * `powerball` fields are legacy aliases kept populated for 5-ball games so
 * that older UI keeps rendering; new code should prefer `drawNumbers()` /
 * `drawBonus()` helpers below.
 */
export interface Draw {
  id?: number;
  game: GameType;
  draw_date: string; // ISO date string
  /** Canonical main numbers (length === game's mainCount). */
  numbers: number[];
  /** Canonical bonus ball, or null for games without one. */
  bonus: number | null;
  /** Which daily slot (Take 5 has midday/evening). */
  slot?: 'midday' | 'evening' | null;
  multiplier?: number | null; // generalized multiplier (Power Play / Megaplier)
  // ---- Legacy aliases (5-ball games only) ----
  n1?: number;
  n2?: number;
  n3?: number;
  n4?: number;
  n5?: number;
  powerball?: number;        // bonus ball alias
  powerplay?: number | null; // multiplier alias
  created_at?: string;
}

/** Canonical main numbers for a draw (handles legacy + array shapes). */
export function drawNumbers(draw: Draw): number[] {
  if (Array.isArray(draw.numbers) && draw.numbers.length > 0) return draw.numbers;
  const legacy = [draw.n1, draw.n2, draw.n3, draw.n4, draw.n5].filter(
    (n): n is number => typeof n === 'number'
  );
  return legacy;
}

/** Canonical bonus ball for a draw, or null when the game has none. */
export function drawBonus(draw: Draw): number | null {
  if (draw.bonus !== undefined && draw.bonus !== null) return draw.bonus;
  if (typeof draw.powerball === 'number') return draw.powerball;
  return null;
}

/** Canonical multiplier for a draw, or null. */
export function drawMultiplier(draw: Draw): number | null {
  if (draw.multiplier !== undefined && draw.multiplier !== null) return draw.multiplier;
  if (draw.powerplay !== undefined && draw.powerplay !== null) return draw.powerplay;
  return null;
}

/** Frequency stats for a single number */
export interface NumberFrequency {
  number: number;
  count: number;
  percentage: number;
  lastSeen: number; // draws since last appearance
}

/** Analysis result for a range of draws */
export interface AnalysisResult {
  totalDraws: number;
  range: string; // e.g. "Last 100 draws"
  whiteFrequency: NumberFrequency[];
  powerballFrequency: NumberFrequency[];
  hotWhite: number[]; // top 10 most frequent white
  coldWhite: number[]; // top 10 least frequent white
  hotPowerball: number[];
  coldPowerball: number[];
  overdue: number[]; // numbers not seen in a while
  pairs: [number, number, number][]; // [n1, n2, count]
  oddEvenRatio: { odd: number; even: number };
  lowHighRatio: { low: number; high: number }; // 1-34 low, 35-69 high
  sumRange: { min: number; max: number; avg: number; median: number };
  consecutiveRate: number; // % of draws with consecutive numbers
}

/** Generated lottery number set */
export interface PredictionSet {
  id: string;
  game: GameType;
  whites: number[]; // 5 sorted white balls
  powerball: number; // bonus ball
  mode: PredictionMode;
  score: number; // 0-100 confidence/quality score
  backtest?: {
    sampleSize: number;
    avgWhiteMatches: number;
    powerballHitRate: number;
    tier3PlusRate: number;
  };
  explanation: string;
  createdAt: string;
}

export type PredictionMode =
  | 'hot'        // 자주 나온 번호 위주
  | 'cold'       // 오래 안 나온 번호 위주
  | 'balanced'   // 핫+콜드 혼합
  | 'anticrowd'  // 사람들이 안 고르는 패턴
  | 'random'     // 순수 랜덤
  | 'lucky';     // 특별한 날짜 기반 개인 픽

/** A user-defined lucky date entry */
export interface LuckyDate {
  id: string;
  label: string;    // e.g. "Birthday", "Anniversary"
  date: string;     // YYYY-MM-DD
  weight: 1 | 2 | 3;  // influence level: normal / strong / very strong
}

/** User profile */
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  address?: string;
  phone?: string;
  points: number;
  referral_code?: string;
  created_at: string;
  /** 'basic' (free) or 'premium' ($4.99/mo subscription). Backed by profiles.subscription_tier. */
  subscription_tier?: SubscriptionTier;
  /** Timestamp when premium was activated (Stripe webhook / IAP receipt). */
  premium_since?: string | null;
  /** Which provider granted premium, for receipt display. */
  premium_source?: PremiumSource | null;
  /** Stripe subscription status synced by the webhook. */
  subscription_status?: SubscriptionStatus | null;
  /** ISO timestamp the current paid/trial period ends. */
  current_period_end?: string | null;
  /** ISO timestamp the free trial ends (if trialing). */
  trial_end?: string | null;
  /** Whether the subscription will cancel at period end. */
  cancel_at_period_end?: boolean | null;
}

export type SubscriptionTier = 'basic' | 'premium';

export type PremiumSource = 'stripe' | 'apple_iap' | 'google_iap' | 'manual';

/** Mirrors Stripe subscription.status values we care about. */
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

/** Prediction modes that require a premium unlock. */
export const PREMIUM_PREDICTION_MODES: readonly PredictionMode[] = [
  'hot',
  'cold',
  'balanced',
  'anticrowd',
  'lucky',
] as const;

/** The one mode that stays free forever. */
export const FREE_PREDICTION_MODES: readonly PredictionMode[] = ['random'] as const;

export function isPremiumMode(mode: PredictionMode): boolean {
  return (PREMIUM_PREDICTION_MODES as readonly PredictionMode[]).includes(mode);
}

/** Purchase/ticket record */
export interface TicketPurchase {
  id: string;
  user_id: string;
  game: GameType;
  whites: number[];
  powerball: number;
  draw_date: string;
  points_spent: number;
  status: 'pending' | 'purchased' | 'drawn' | 'won' | 'lost';
  prize_amount?: number;
  created_at: string;
}

export interface SavedNumberSet {
  id: string;
  user_id: string;
  game: GameType;
  name?: string;
  whites: number[];
  powerball: number;
  created_at: string;
}

/** User-curated combinations (favorites, analysis/history tracking) */
export interface NumberCollectionItem {
  id: string;
  user_id: string;
  game: GameType;
  name?: string;
  /** manual | analysis_tracking | history_watch */
  source: string;
  whites: number[];
  powerball: number;
  created_at: string;
}

/** Navigation param types */
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Analysis: undefined;
  Predict: undefined;
  History: undefined;
  MyPage: undefined;
};
