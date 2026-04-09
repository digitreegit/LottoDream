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

// NY Open Data API endpoints
export const POWERBALL_API_URL =
  'https://data.ny.gov/resource/d6yy-54nr.json';
export const MEGAMILLIONS_API_URL =
  'https://data.ny.gov/resource/5xaw-6ayf.json';

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
    whiteMax: 69,
    bonusMax: 26,
    whiteCount: 5,
    bonusLabel: 'Powerball',
    multiplierLabel: 'Power Play',
    accentColor: '#E53E3E',
    apiUrl: POWERBALL_API_URL,
    dbTable: 'draws',
    lowHighSplit: 34,
  },
  megamillions: {
    type: 'megamillions',
    name: 'Mega Millions',
    shortName: 'MM',
    icon: '🟡',
    whiteMax: 70,
    bonusMax: 25,
    whiteCount: 5,
    bonusLabel: 'Mega Ball',
    multiplierLabel: 'Megaplier',
    accentColor: '#D69E2E',
    apiUrl: MEGAMILLIONS_API_URL,
    dbTable: 'draws_megamillions',
    lowHighSplit: 35,
  },
};

export function getGameConfig(game: GameType): GameConfig {
  return GAME_CONFIGS[game];
}
