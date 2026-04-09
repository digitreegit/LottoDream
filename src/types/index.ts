// ============================================
// LottoDream - Type Definitions
// ============================================

/** Supported lottery games */
export type GameType = 'powerball' | 'megamillions';

/** Game configuration */
export interface GameConfig {
  type: GameType;
  name: string;
  shortName: string;
  icon: string;
  whiteMax: number;
  bonusMax: number;
  whiteCount: number;
  bonusLabel: string;        // "Powerball" or "Mega Ball"
  multiplierLabel: string;   // "Power Play" or "Megaplier"
  accentColor: string;
  apiUrl: string;
  dbTable: string;
  lowHighSplit: number;      // boundary for low/high analysis
}

/** A single lottery draw record (works for both games) */
export interface Draw {
  id?: number;
  game: GameType;
  draw_date: string; // ISO date string
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  powerball: number;     // bonus ball (Powerball or Mega Ball)
  powerplay: number | null; // multiplier
  created_at?: string;
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
  explanation: string;
  createdAt: string;
}

export type PredictionMode =
  | 'hot'        // 자주 나온 번호 위주
  | 'cold'       // 오래 안 나온 번호 위주
  | 'balanced'   // 핫+콜드 혼합
  | 'anticrowd'  // 사람들이 안 고르는 패턴
  | 'random';    // 순수 랜덤

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
