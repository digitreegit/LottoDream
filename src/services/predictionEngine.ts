// ============================================
// Prediction Engine
// Generates lottery number recommendations
// ============================================
import { Draw, PredictionSet, PredictionMode, AnalysisResult, GameType, GameConfig, LuckyDate } from '../types';
import { analyzeDraws } from './analysisEngine';
import { getGameConfig } from '../config/constants';
import * as Crypto from 'expo-crypto';

/**
 * Generate a set of predicted numbers
 */
export function generatePrediction(
  draws: Draw[],
  mode: PredictionMode,
  game: GameType = 'powerball'
): PredictionSet {
  const config = getGameConfig(game);
  const analysis = analyzeDraws(draws, 'prediction', config);
  const recent = analyzeDraws(draws.slice(0, 50), 'recent', config);

  let whites: number[];
  let pb: number;
  let score: number;
  let explanation: string;

  switch (mode) {
    case 'hot':
      ({ whites, pb, score, explanation } = hotStrategy(analysis, recent, config));
      break;
    case 'cold':
      ({ whites, pb, score, explanation } = coldStrategy(analysis, recent, config));
      break;
    case 'balanced':
      ({ whites, pb, score, explanation } = balancedStrategy(analysis, recent, config));
      break;
    case 'anticrowd':
      ({ whites, pb, score, explanation } = antiCrowdStrategy(analysis, config));
      break;
    case 'random':
    default:
      ({ whites, pb, score, explanation } = randomStrategy(config));
      break;
  }

  // Apply distribution filters for quality
  const finalScore = adjustScore(whites, pb, analysis, score, config);

  return {
    id: generateId(),
    game,
    whites: whites.sort((a, b) => a - b),
    powerball: pb,
    mode,
    score: finalScore,
    explanation,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate 5 prediction sets (one per mode)
 */
export function generateAllPredictions(draws: Draw[], game: GameType = 'powerball'): PredictionSet[] {
  const modes: PredictionMode[] = ['hot', 'cold', 'balanced', 'anticrowd', 'random'];
  return modes.map((mode) => generatePrediction(draws, mode, game));
}

// ---- Strategy Implementations ----

function hotStrategy(
  all: AnalysisResult,
  recent: AnalysisResult,
  config: GameConfig
): { whites: number[]; pb: number; score: number; explanation: string } {
  // Weight recent frequency x2 + all-time x1
  const scored = all.whiteFrequency.map((f) => {
    const recentF = recent.whiteFrequency.find((r) => r.number === f.number);
    return {
      number: f.number,
      score: f.percentage + (recentF?.percentage || 0) * 2,
    };
  });
  scored.sort((a, b) => b.score - a.score);

  // Pick top 15, then randomly select 5 (adds variation)
  const pool = scored.slice(0, 15).map((s) => s.number);
  const whites = pickRandom(pool, config.whiteCount);

  // Powerball: pick from top hot
  const pbScored = all.powerballFrequency
    .map((f) => {
      const recentF = recent.powerballFrequency.find((r) => r.number === f.number);
      return { number: f.number, score: f.percentage + (recentF?.percentage || 0) * 2 };
    })
    .sort((a, b) => b.score - a.score);
  const pb = pbScored[Math.floor(Math.random() * 5)].number;

  return {
    whites,
    pb,
    score: 72,
    explanation: '🔥 자주 출현한 핫 넘버 위주로 선별. 최근 50회 빈도에 가중치를 줌.',
  };
}

function coldStrategy(
  all: AnalysisResult,
  recent: AnalysisResult,
  config: GameConfig
): { whites: number[]; pb: number; score: number; explanation: string } {
  // Numbers overdue + low recent frequency
  const scored = all.whiteFrequency.map((f) => ({
    number: f.number,
    score: f.lastSeen * 2 + (100 - f.percentage),
  }));
  scored.sort((a, b) => b.score - a.score);

  const pool = scored.slice(0, 15).map((s) => s.number);
  const whites = pickRandom(pool, config.whiteCount);

  const pbScored = all.powerballFrequency
    .map((f) => ({ number: f.number, score: f.lastSeen }))
    .sort((a, b) => b.score - a.score);
  const pb = pbScored[Math.floor(Math.random() * 5)].number;

  return {
    whites,
    pb,
    score: 65,
    explanation: '❄️ 오래 나오지 않은 콜드 넘버 위주. "곧 나올 차례"라는 전략.',
  };
}

function balancedStrategy(
  all: AnalysisResult,
  recent: AnalysisResult,
  config: GameConfig
): { whites: number[]; pb: number; score: number; explanation: string } {
  // Mix: 2 hot + 2 cold + 1 medium
  const sorted = [...all.whiteFrequency].sort((a, b) => b.count - a.count);
  const hot = sorted.slice(0, 15).map((f) => f.number);
  const cold = sorted.slice(-15).map((f) => f.number);
  const mid = sorted.slice(25, 45).map((f) => f.number);

  const whites = [
    ...pickRandom(hot, 2),
    ...pickRandom(cold, 2),
    ...pickRandom(mid, 1),
  ];

  // Ensure no duplicates
  const deduped = ensureUnique(whites, config.whiteCount, config.whiteMax);

  const pb = Math.floor(Math.random() * config.bonusMax) + 1;

  return {
    whites: deduped,
    pb,
    score: 78,
    explanation: '⚖️ 핫2 + 콜드2 + 중간1 혼합. 균형 잡힌 분포를 목표로 함.',
  };
}

function antiCrowdStrategy(
  all: AnalysisResult,
  config: GameConfig
): { whites: number[]; pb: number; score: number; explanation: string } {
  // Avoid "popular" patterns people commonly pick:
  // - Birthday numbers (1-31)
  // - Patterns (7, 11, 13, 21, 22, etc.)
  // - Sequences
  const popularNumbers = new Set([
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    17, 19, 21, 22, 23, 25, 27, 29, 31,
  ]);

  const unpopularPool: number[] = [];
  for (let i = 1; i <= config.whiteMax; i++) {
    if (!popularNumbers.has(i)) unpopularPool.push(i);
  }

  // Allow 1 popular number for variety
  const popular = pickRandom(
    Array.from(popularNumbers).filter((n) => n <= config.whiteMax),
    1
  );
  const unpopular = pickRandom(unpopularPool, 4);
  const whites = [...popular, ...unpopular];

  // Prefer higher bonus numbers (less popular)
  const highStart = Math.max(1, config.bonusMax - 9);
  const pb = Math.floor(Math.random() * (config.bonusMax - highStart + 1)) + highStart;

  return {
    whites,
    pb,
    score: 70,
    explanation: '🎯 사람들이 잘 안 고르는 패턴. 당첨 시 분배금이 높을 가능성.',
  };
}

function randomStrategy(config: GameConfig): {
  whites: number[];
  pb: number;
  score: number;
  explanation: string;
} {
  const whites: number[] = [];
  while (whites.length < config.whiteCount) {
    const n = Math.floor(Math.random() * config.whiteMax) + 1;
    if (!whites.includes(n)) whites.push(n);
  }
  const pb = Math.floor(Math.random() * config.bonusMax) + 1;

  return {
    whites,
    pb,
    score: 50,
    explanation: '🎲 완전 랜덤 추첨. 모든 조합은 동일한 확률.',
  };
}

// ---- Utility Functions ----

function pickRandom(arr: number[], count: number): number[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function ensureUnique(numbers: number[], targetCount: number, max: number): number[] {
  const unique = [...new Set(numbers)];
  while (unique.length < targetCount) {
    const n = Math.floor(Math.random() * max) + 1;
    if (!unique.includes(n)) unique.push(n);
  }
  return unique.slice(0, targetCount);
}

/**
 * Adjust score based on distribution quality
 */
function adjustScore(
  whites: number[],
  _pb: number,
  analysis: AnalysisResult,
  baseScore: number,
  config: GameConfig
): number {
  let score = baseScore;
  const sorted = [...whites].sort((a, b) => a - b);

  // Check odd/even balance (ideal: 2-3 or 3-2)
  const odds = sorted.filter((n) => n % 2 !== 0).length;
  if (odds >= 2 && odds <= 3) score += 5;

  // Check low/high balance
  const lows = sorted.filter((n) => n <= config.lowHighSplit).length;
  if (lows >= 2 && lows <= 3) score += 5;

  // Check sum range (typical winning range: 100-200)
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum >= 100 && sum <= 200) score += 5;
  if (analysis.sumRange.avg > 0) {
    const diff = Math.abs(sum - analysis.sumRange.avg);
    if (diff < 30) score += 3;
  }

  // Check for consecutive numbers (common in ~25% of draws)
  let hasConsec = false;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) hasConsec = true;
  }
  if (hasConsec && analysis.consecutiveRate > 0.2) score += 2;

  return Math.min(score, 100);
}

function generateId(): string {
  return `pred_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ---- Lucky Dates Strategy ----

/**
 * Extract candidate numbers from a YYYY-MM-DD date string within [1, whiteMax].
 */
export function extractNumbersFromDate(dateStr: string, whiteMax: number): number[] {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return [];
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return [];

  const raw: number[] = [];

  // Day (1-31)
  if (day >= 1 && day <= whiteMax) raw.push(day);

  // Month (1-12)
  if (month >= 1 && month <= whiteMax) raw.push(month);

  // Last 2 digits of year, wrapped into [1, whiteMax]
  const y2 = year % 100;
  const y2mapped = y2 === 0 ? whiteMax : ((y2 - 1) % whiteMax) + 1;
  if (y2mapped >= 1 && y2mapped <= whiteMax) raw.push(y2mapped);

  // Sum of all date digits (e.g. 1999-07-23 → 1+9+9+9+0+7+2+3 = 40 → wrap)
  const digitSum = dateStr
    .replace(/[^0-9]/g, '')
    .split('')
    .reduce((acc, ch) => acc + parseInt(ch, 10), 0);
  const dsMapped = digitSum === 0 ? 1 : ((digitSum - 1) % whiteMax) + 1;
  if (dsMapped >= 1 && dsMapped <= whiteMax) raw.push(dsMapped);

  // Day + Month
  const dm = day + month;
  if (dm >= 1 && dm <= whiteMax) raw.push(dm);

  return [...new Set(raw)];
}

function luckyDatesStrategy(
  luckyDates: LuckyDate[],
  all: AnalysisResult,
  config: GameConfig
): { whites: number[]; pb: number; score: number; explanation: string } {
  // Build weighted pool: each lucky number repeated by its weight
  const weightedPool: number[] = [];
  for (const ld of luckyDates) {
    const nums = extractNumbersFromDate(ld.date, config.whiteMax);
    for (const n of nums) {
      for (let i = 0; i < ld.weight; i++) {
        weightedPool.push(n);
      }
    }
  }

  // Baseline: top-20 hot numbers appear once each as fallback
  const basePool = all.hotWhite.slice(0, 20);
  const combined = [...weightedPool, ...basePool];

  // Shuffle and pick first 5 unique valid numbers
  const shuffled = combined.slice().sort(() => Math.random() - 0.5);
  const whites: number[] = [];
  for (const n of shuffled) {
    if (n >= 1 && n <= config.whiteMax && !whites.includes(n)) {
      whites.push(n);
      if (whites.length === config.whiteCount) break;
    }
  }
  // Fill any remaining slots with random numbers
  while (whites.length < config.whiteCount) {
    const n = Math.floor(Math.random() * config.whiteMax) + 1;
    if (!whites.includes(n)) whites.push(n);
  }

  const pb = Math.floor(Math.random() * config.bonusMax) + 1;
  const labels = luckyDates.map((ld) => ld.label).join(', ');

  return {
    whites,
    pb,
    score: 68,
    explanation: `✨ ${labels}에서 추출한 행운 번호에 가중치를 부여해 선별.`,
  };
}

/**
 * Generate a lucky-dates prediction set using user-defined date entries.
 */
export function generateLuckyDatesPrediction(
  draws: Draw[],
  luckyDates: LuckyDate[],
  game: GameType = 'powerball'
): PredictionSet {
  const config = getGameConfig(game);
  const analysis = analyzeDraws(draws, 'prediction', config);
  const { whites, pb, score, explanation } = luckyDatesStrategy(luckyDates, analysis, config);
  const finalScore = adjustScore(whites, pb, analysis, score, config);

  return {
    id: generateId(),
    game,
    whites: whites.sort((a, b) => a - b),
    powerball: pb,
    mode: 'lucky',
    score: finalScore,
    explanation,
    createdAt: new Date().toISOString(),
  };
}

// ---- Monte Carlo Simulation ----

/**
 * Run Monte Carlo simulation to score a specific combination
 * Returns how many times this combination would have won various prize tiers
 */
export function monteCarloScore(
  whites: number[],
  powerball: number,
  draws: Draw[],
  simulations = 10000,
  game: GameType = 'powerball'
): { matchDistribution: Record<string, number>; expectedValue: number } {
  const config = getGameConfig(game);
  const matchDist: Record<string, number> = {
    '0+0': 0, '0+1': 0, '1+0': 0, '1+1': 0,
    '2+0': 0, '2+1': 0, '3+0': 0, '3+1': 0,
    '4+0': 0, '4+1': 0, '5+0': 0, '5+1': 0,
  };

  // Prize values (approximate)
  const prizeValues: Record<string, number> = {
    '0+1': 4, '1+1': 4, '2+1': 7, '3+0': 7,
    '3+1': 100, '4+0': 100, '4+1': 50000,
    '5+0': 1000000, '5+1': 292201338, // jackpot placeholder
  };

  const sortedWhites = [...whites].sort((a, b) => a - b);

  for (let i = 0; i < simulations; i++) {
    // Generate random draw
    const simWhites: number[] = [];
    while (simWhites.length < 5) {
      const n = Math.floor(Math.random() * config.whiteMax) + 1;
      if (!simWhites.includes(n)) simWhites.push(n);
    }
    const simPB = Math.floor(Math.random() * config.bonusMax) + 1;

    // Count matches
    const whiteMatches = sortedWhites.filter((n) => simWhites.includes(n)).length;
    const pbMatch = powerball === simPB ? 1 : 0;
    const key = `${whiteMatches}+${pbMatch}`;
    matchDist[key] = (matchDist[key] || 0) + 1;
  }

  // Calculate expected value
  let ev = 0;
  for (const [key, count] of Object.entries(matchDist)) {
    const prize = prizeValues[key] || 0;
    ev += (count / simulations) * prize;
  }

  return { matchDistribution: matchDist, expectedValue: ev };
}
