// ============================================
// Supabase Configuration
// ============================================
// TODO: Replace with your actual Supabase project credentials
// Get these from: https://supabase.com/dashboard → Project Settings → API

import { GameType, GameConfig } from '../types';

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

export function isSupabaseConfigured(): boolean {
  return (
    !!SUPABASE_URL &&
    !!SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
    SUPABASE_ANON_KEY !== 'YOUR_ANON_KEY'
  );
}

export function getSupabaseConfigError(): string | null {
  if (!isSupabaseConfigured()) {
    return 'Supabase credentials are missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env, then restart Expo.';
  }

  if (!SUPABASE_URL.startsWith('https://') || !SUPABASE_URL.includes('.supabase.co')) {
    return 'EXPO_PUBLIC_SUPABASE_URL is invalid. Expected format: https://<project-id>.supabase.co';
  }

  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.trim().length < 20) {
    return 'EXPO_PUBLIC_SUPABASE_ANON_KEY looks invalid. Copy the full API key from Supabase Dashboard > Project Settings > API, then restart Expo.';
  }

  return null;
}

// NY Open Data API endpoints (Socrata SODA — https://data.ny.gov/resource/<id>.json)
export const POWERBALL_API_URL =
  'https://data.ny.gov/resource/d6yy-54nr.json';
export const MEGAMILLIONS_API_URL =
  'https://data.ny.gov/resource/5xaw-6ayf.json';
export const CASH4LIFE_API_URL =
  'https://data.ny.gov/resource/kwxv-fwze.json';
export const TAKE5_API_URL =
  'https://data.ny.gov/resource/dg63-4siq.json';
export const NYLOTTO_API_URL =
  'https://data.ny.gov/resource/6nbc-h7bj.json';
export const PICK10_API_URL =
  'https://data.ny.gov/resource/bycu-cw7c.json';

// Official draw feeds (MUSL/operator endpoints)
export const POWERBALL_OFFICIAL_API_URLS = [
  process.env.EXPO_PUBLIC_POWERBALL_OFFICIAL_API_URL || 'https://www.powerball.com/api/v1/numbers/powerball/recent?_format=json',
  'https://www.powerball.com/api/v1/numbers/powerball/recent10?_format=json',
];

export const MEGAMILLIONS_OFFICIAL_API_URLS = [
  process.env.EXPO_PUBLIC_MEGAMILLIONS_OFFICIAL_API_URL || 'https://www.powerball.com/api/v1/numbers/megamillions/recent?_format=json',
];

// Legacy constants (kept for backward compat)
export const POWERBALL_WHITE_MAX = 69;
export const POWERBALL_RED_MAX = 26;
export const POWERBALL_WHITE_COUNT = 5;
export const POINTS_PER_TICKET = 3;

// Game configurations
export const GAME_CONFIGS: Record<GameType, GameConfig> = {
  powerball: {
    type: 'powerball',
    name: 'Powerball',
    shortName: 'PB',
    icon: '🔴',
    mainCount: 5,
    mainMax: 69,
    hasBonus: true,
    bonusMax: 26,
    drawsPerDay: 1,
    reliability: 'stable',
    storage: 'legacy5',
    whiteMax: 69,
    whiteCount: 5,
    bonusLabel: 'Powerball',
    multiplierLabel: 'Power Play',
    accentColor: '#E53E3E',
    apiUrl: POWERBALL_API_URL,
    officialApiUrls: POWERBALL_OFFICIAL_API_URLS,
    dbTable: 'draws',
    lowHighSplit: 34,
  },
  megamillions: {
    type: 'megamillions',
    name: 'Mega Millions',
    shortName: 'MM',
    icon: '🟡',
    mainCount: 5,
    mainMax: 70,
    hasBonus: true,
    bonusMax: 25,
    drawsPerDay: 1,
    reliability: 'stable',
    storage: 'legacy5',
    whiteMax: 70,
    whiteCount: 5,
    bonusLabel: 'Mega Ball',
    multiplierLabel: 'Megaplier',
    accentColor: '#D69E2E',
    apiUrl: MEGAMILLIONS_API_URL,
    officialApiUrls: MEGAMILLIONS_OFFICIAL_API_URLS,
    dbTable: 'draws_megamillions',
    lowHighSplit: 35,
  },
  cash4life: {
    type: 'cash4life',
    name: 'Cash4Life',
    shortName: 'C4L',
    icon: '💵',
    mainCount: 5,
    mainMax: 60,
    hasBonus: true,
    bonusMax: 4,
    drawsPerDay: 1,
    reliability: 'stable',
    storage: 'array',
    whiteMax: 60,
    whiteCount: 5,
    bonusLabel: 'Cash Ball',
    multiplierLabel: '',
    accentColor: '#16A34A',
    apiUrl: CASH4LIFE_API_URL,
    officialApiUrls: [],
    dbTable: 'draws_cash4life',
    lowHighSplit: 30,
  },
  take5: {
    type: 'take5',
    name: 'Take 5',
    shortName: 'T5',
    icon: '🖐️',
    mainCount: 5,
    mainMax: 39,
    hasBonus: false,
    bonusMax: 0,
    drawsPerDay: 2,
    reliability: 'beta',
    storage: 'array',
    whiteMax: 39,
    whiteCount: 5,
    bonusLabel: '',
    multiplierLabel: '',
    accentColor: '#7C3AED',
    apiUrl: TAKE5_API_URL,
    officialApiUrls: [],
    dbTable: 'draws_take5',
    lowHighSplit: 20,
  },
  nylotto: {
    type: 'nylotto',
    name: 'NY Lotto',
    shortName: 'LOTTO',
    icon: '🗽',
    mainCount: 6,
    mainMax: 59,
    hasBonus: true,
    bonusMax: 59,
    drawsPerDay: 1,
    reliability: 'beta',
    storage: 'array',
    whiteMax: 59,
    whiteCount: 6,
    bonusLabel: 'Bonus',
    multiplierLabel: '',
    accentColor: '#0EA5E9',
    apiUrl: NYLOTTO_API_URL,
    officialApiUrls: [],
    dbTable: 'draws_nylotto',
    lowHighSplit: 30,
  },
  pick10: {
    type: 'pick10',
    name: 'Pick 10',
    shortName: 'P10',
    icon: '🔟',
    mainCount: 20,
    mainMax: 80,
    hasBonus: false,
    bonusMax: 0,
    drawsPerDay: 1,
    reliability: 'beta',
    storage: 'array',
    whiteMax: 80,
    whiteCount: 20,
    bonusLabel: '',
    multiplierLabel: '',
    accentColor: '#F59E0B',
    apiUrl: PICK10_API_URL,
    officialApiUrls: [],
    dbTable: 'draws_pick10',
    lowHighSplit: 40,
  },
};

/** Games available in the picker, ordered. Beta games shown with a badge. */
export const GAME_ORDER: GameType[] = [
  'powerball',
  'megamillions',
  'cash4life',
  'take5',
  'nylotto',
  'pick10',
];

export function getGameConfig(game: GameType): GameConfig {
  return GAME_CONFIGS[game];
}

// ============================================
// Monetization — monthly Premium subscription
// ============================================

/** Product identifier used across Stripe. */
export const PREMIUM_PRODUCT_ID = 'premium_monthly';

/** User-facing price in cents (monthly recurring). */
export const PREMIUM_PRICE_CENTS = 499;
export const PREMIUM_CURRENCY = 'USD';

/** Formatted price used in marketing copy and CTAs. */
export const PREMIUM_PRICE_DISPLAY = '$4.99';
export const PREMIUM_PRICE_PERIOD = '/month';
export const PREMIUM_TRIAL_DAYS = 7;

/**
 * Stripe Price ID for the recurring monthly subscription. Created in the Stripe
 * Dashboard (Products -> recurring monthly price). Consumed by the Supabase
 * Edge Function `create-checkout-session`.
 */
export const STRIPE_PREMIUM_PRICE_ID =
  process.env.EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID || '';

/**
 * Supabase Edge Function base. Defaults to `${SUPABASE_URL}/functions/v1`.
 */
export const EDGE_FUNCTIONS_URL =
  process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL ||
  (SUPABASE_URL && !SUPABASE_URL.includes('YOUR_PROJECT_ID')
    ? `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1`
    : '');

/** Support email surfaced in legal text, FAQ, and receipts. */
export const SUPPORT_EMAIL =
  process.env.EXPO_PUBLIC_SUPPORT_EMAIL || 'contact@skyface.com';

/** Legal entity name used in Terms / Privacy. */
export const LEGAL_ENTITY = 'LottoDream';

/** Public marketing domain. */
export const APP_DOMAIN = 'lottodream.net';

/** Used for "Last updated" on policy docs — single source of truth. */
export const LEGAL_LAST_UPDATED = 'June 24, 2026';
