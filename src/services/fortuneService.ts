// ============================================
// Fortune Service — "Today's Fortune" + lucky numbers
// ============================================
//
// PRIVACY: The birthdate is NEVER persisted. It is only used in-memory to
// derive a deterministic daily fortune (seeded by birthdate + today's date),
// so the same person sees a stable fortune for a given day that changes the
// next day. Nothing here writes to storage, the network, or Supabase.
//
import { Draw, GameType, PredictionSet, LuckyDate } from '../types';
import { generateLuckyDatesPrediction } from './predictionEngine';

export interface FortuneCategory {
  key: 'overall' | 'wealth' | 'love' | 'health' | 'work';
  label: string;
  icon: string;
  score: number; // 0-100
  blurb: string;
}

export interface DailyFortune {
  date: string;          // the day this fortune is for (YYYY-MM-DD)
  overall: number;       // 0-100
  headline: string;
  message: string;
  luckyColor: { name: string; hex: string };
  luckyHour: string;
  categories: FortuneCategory[];
  /** Deterministic seed string for downstream lucky-number generation. */
  seed: string;
}

const LUCKY_COLORS = [
  { name: 'Crimson', hex: '#DC2626' },
  { name: 'Gold', hex: '#D97706' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Sapphire', hex: '#2563EB' },
  { name: 'Violet', hex: '#7C3AED' },
  { name: 'Teal', hex: '#0D9488' },
  { name: 'Coral', hex: '#F43F5E' },
  { name: 'Amber', hex: '#F59E0B' },
];

const LUCKY_HOURS = [
  '6–8 AM', '8–10 AM', '10 AM–12 PM', '12–2 PM',
  '2–4 PM', '4–6 PM', '6–8 PM', '8–10 PM',
];

const HEADLINES = [
  'A bright day ahead',
  'Steady momentum',
  'Fortune favors patience',
  'Small wins add up',
  'Trust your instincts',
  'A lucky encounter awaits',
  'Keep your eyes open',
  'Good energy is flowing',
];

function fnv1a(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRng(seed: string): () => number {
  let state = fnv1a(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function scoreFrom(rng: () => number, floor = 45): number {
  return Math.round(floor + rng() * (100 - floor));
}

function blurbFor(key: FortuneCategory['key'], score: number): string {
  const tier = score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low';
  const table: Record<FortuneCategory['key'], Record<string, string>> = {
    overall: {
      high: 'The stars align — a great day to take a small chance.',
      mid: 'A balanced day. Stay positive and things go your way.',
      low: 'Slow and steady. Avoid big risks and rest up.',
    },
    wealth: {
      high: 'Unexpected luck with money may find you today.',
      mid: 'A good day to plan finances rather than splurge.',
      low: 'Hold tight on spending; better days are coming.',
    },
    love: {
      high: 'Warm connections and happy surprises are likely.',
      mid: 'Be open and kind — small gestures matter today.',
      low: 'Give relationships a little space and patience.',
    },
    health: {
      high: 'Energy is high — a perfect day to stay active.',
      mid: 'Keep a steady rhythm and hydrate well.',
      low: 'Listen to your body and get extra rest.',
    },
    work: {
      high: 'Focus is sharp — tackle that big task now.',
      mid: 'Progress comes step by step. Keep going.',
      low: 'Tie up loose ends rather than starting new things.',
    },
  };
  return table[key][tier];
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Compute a deterministic daily fortune. `birthdate` (YYYY-MM-DD) is used only
 * to seed the result and is not stored anywhere.
 */
export function computeFortune(birthdate: string, date: string = todayISO()): DailyFortune {
  const seed = `fortune:${birthdate}:${date}`;
  const rng = seededRng(seed);

  const overall = scoreFrom(rng, 50);
  const base: Array<Pick<FortuneCategory, 'key' | 'label' | 'icon' | 'score'>> = [
    { key: 'overall', label: 'Overall', icon: '🌟', score: overall },
    { key: 'wealth', label: 'Wealth', icon: '💰', score: scoreFrom(rng) },
    { key: 'love', label: 'Love', icon: '💞', score: scoreFrom(rng) },
    { key: 'health', label: 'Health', icon: '🍀', score: scoreFrom(rng) },
    { key: 'work', label: 'Work', icon: '💼', score: scoreFrom(rng) },
  ];
  const categories: FortuneCategory[] = base.map((c) => ({
    ...c,
    blurb: blurbFor(c.key, c.score),
  }));

  const color = LUCKY_COLORS[Math.floor(rng() * LUCKY_COLORS.length)];
  const hour = LUCKY_HOURS[Math.floor(rng() * LUCKY_HOURS.length)];
  const headline = HEADLINES[Math.floor(rng() * HEADLINES.length)];

  return {
    date,
    overall,
    headline,
    message: blurbFor('overall', overall),
    luckyColor: color,
    luckyHour: hour,
    categories,
    seed,
  };
}

/**
 * Generate a deterministic lucky-number set for a game from a fortune seed +
 * the user's birthdate. Reuses the prediction engine's lucky-dates strategy so
 * results respect each game's number structure.
 */
export function generateFortuneNumbers(
  draws: Draw[],
  birthdate: string,
  fortune: DailyFortune,
  game: GameType
): PredictionSet {
  const luckyDate: LuckyDate = {
    id: 'fortune-birth',
    label: 'Birthday',
    date: birthdate,
    weight: 3,
  };
  // The fortune seed makes the pick stable for the day and unique per person.
  return generateLuckyDatesPrediction(draws, [luckyDate], game, `:fortune:${fortune.seed}`);
}

/** Lightweight birthdate validation (YYYY-MM-DD, plausible range). */
export function isValidBirthdate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const year = d.getUTCFullYear();
  return year >= 1900 && d.getTime() <= Date.now();
}
