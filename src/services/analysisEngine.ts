// ============================================
// Analysis Engine
// Statistical analysis of lottery draws
// ============================================
import { Draw, AnalysisResult, NumberFrequency, GameConfig, drawNumbers, drawBonus } from '../types';
import { getGameConfig } from '../config/constants';

/**
 * Run full analysis on a set of draws
 */
export function analyzeDraws(draws: Draw[], label: string, config?: GameConfig): AnalysisResult {
  const totalDraws = draws.length;
  if (totalDraws === 0) {
    return emptyResult(label);
  }

  const game = draws[0]?.game || 'powerball';
  const cfg = config || getGameConfig(game);
  const whiteMax = cfg.mainMax ?? cfg.whiteMax;
  const bonusMax = cfg.bonusMax;
  const hasBonus = cfg.hasBonus ?? bonusMax > 0;
  const lowHighSplit = cfg.lowHighSplit;
  const mainCount = cfg.mainCount ?? cfg.whiteCount;

  // 1. Frequency counts
  const whiteCounts = new Map<number, number>();
  const pbCounts = new Map<number, number>();
  const lastSeenWhite = new Map<number, number>();
  const lastSeenPB = new Map<number, number>();

  // Init
  for (let i = 1; i <= whiteMax; i++) {
    whiteCounts.set(i, 0);
    lastSeenWhite.set(i, totalDraws);
  }
  for (let i = 1; i <= bonusMax; i++) {
    pbCounts.set(i, 0);
    lastSeenPB.set(i, totalDraws);
  }

  // 2. Pair tracking
  const pairCounts = new Map<string, number>();

  // 3. Distribution tracking
  let totalOdd = 0, totalEven = 0;
  let totalLow = 0, totalHigh = 0;
  const sums: number[] = [];
  let consecutiveDraws = 0;

  // Process each draw (sorted newest first)
  draws.forEach((draw, idx) => {
    const whites = drawNumbers(draw).slice().sort((a, b) => a - b);
    const bonus = drawBonus(draw);
    const count = whites.length || mainCount;

    // White ball frequencies
    whites.forEach((n) => {
      whiteCounts.set(n, (whiteCounts.get(n) || 0) + 1);
      if (lastSeenWhite.get(n) === totalDraws) {
        lastSeenWhite.set(n, idx);
      }
    });

    // Bonus ball frequency (skip games without a bonus)
    if (hasBonus && bonus != null) {
      pbCounts.set(bonus, (pbCounts.get(bonus) || 0) + 1);
      if (lastSeenPB.get(bonus) === totalDraws) {
        lastSeenPB.set(bonus, idx);
      }
    }

    // Pairs
    for (let i = 0; i < whites.length; i++) {
      for (let j = i + 1; j < whites.length; j++) {
        const key = `${whites[i]}-${whites[j]}`;
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
      }
    }

    // Odd/Even
    const oddCount = whites.filter((n) => n % 2 !== 0).length;
    totalOdd += oddCount;
    totalEven += count - oddCount;

    // Low/High (split depends on game config)
    const lowCount = whites.filter((n) => n <= lowHighSplit).length;
    totalLow += lowCount;
    totalHigh += count - lowCount;

    // Sum
    const sum = whites.reduce((a, b) => a + b, 0);
    sums.push(sum);

    // Consecutive check
    let hasConsecutive = false;
    for (let i = 0; i < whites.length - 1; i++) {
      if (whites[i + 1] - whites[i] === 1) {
        hasConsecutive = true;
        break;
      }
    }
    if (hasConsecutive) consecutiveDraws++;
  });

  // Build frequency arrays
  const whiteFrequency: NumberFrequency[] = [];
  for (let i = 1; i <= whiteMax; i++) {
    const count = whiteCounts.get(i) || 0;
    whiteFrequency.push({
      number: i,
      count,
      percentage: (count / totalDraws) * 100,
      lastSeen: lastSeenWhite.get(i) || totalDraws,
    });
  }

  const powerballFrequency: NumberFrequency[] = [];
  for (let i = 1; i <= bonusMax; i++) {
    const count = pbCounts.get(i) || 0;
    powerballFrequency.push({
      number: i,
      count,
      percentage: (count / totalDraws) * 100,
      lastSeen: lastSeenPB.get(i) || totalDraws,
    });
  }

  // Sort by frequency
  const sortedWhite = [...whiteFrequency].sort((a, b) => b.count - a.count);
  const sortedPB = [...powerballFrequency].sort((a, b) => b.count - a.count);

  // Top pairs
  const topPairs: [number, number, number][] = Array.from(pairCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([key, count]) => {
      const [a, b] = key.split('-').map(Number);
      return [a, b, count];
    });

  // Overdue: numbers not seen for a long time relative to expected frequency
  const expectedWhiteFreq = (mainCount / whiteMax);
  const overdueThreshold = Math.ceil(1 / expectedWhiteFreq) * 1.5;
  const overdue = whiteFrequency
    .filter((f) => f.lastSeen >= overdueThreshold)
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .map((f) => f.number);

  // Sum stats
  const sortedSums = [...sums].sort((a, b) => a - b);
  const medianSum = sortedSums[Math.floor(sortedSums.length / 2)];

  return {
    totalDraws,
    range: label,
    whiteFrequency,
    powerballFrequency,
    hotWhite: sortedWhite.slice(0, 10).map((f) => f.number),
    coldWhite: sortedWhite.slice(-10).map((f) => f.number),
    hotPowerball: sortedPB.slice(0, 5).map((f) => f.number),
    coldPowerball: sortedPB.slice(-5).map((f) => f.number),
    overdue,
    pairs: topPairs,
    oddEvenRatio: {
      odd: totalOdd / (totalDraws * mainCount),
      even: totalEven / (totalDraws * mainCount),
    },
    lowHighRatio: {
      low: totalLow / (totalDraws * mainCount),
      high: totalHigh / (totalDraws * mainCount),
    },
    sumRange: {
      min: Math.min(...sums),
      max: Math.max(...sums),
      avg: sums.reduce((a, b) => a + b, 0) / sums.length,
      median: medianSum,
    },
    consecutiveRate: consecutiveDraws / totalDraws,
  };
}

function emptyResult(label: string): AnalysisResult {
  return {
    totalDraws: 0,
    range: label,
    whiteFrequency: [],
    powerballFrequency: [],
    hotWhite: [],
    coldWhite: [],
    hotPowerball: [],
    coldPowerball: [],
    overdue: [],
    pairs: [],
    oddEvenRatio: { odd: 0, even: 0 },
    lowHighRatio: { low: 0, high: 0 },
    sumRange: { min: 0, max: 0, avg: 0, median: 0 },
    consecutiveRate: 0,
  };
}

/**
 * Multi-range analysis: all, last 50, last 100
 */
export function multiRangeAnalysis(
  allDraws: Draw[],
  config?: GameConfig
): Record<string, AnalysisResult> {
  return {
    all: analyzeDraws(allDraws, `All time (${allDraws.length} draws)`, config),
    last50: analyzeDraws(allDraws.slice(0, 50), 'Last 50 draws', config),
    last100: analyzeDraws(allDraws.slice(0, 100), 'Last 100 draws', config),
    last25: analyzeDraws(allDraws.slice(0, 25), 'Last 25 draws', config),
    last10: analyzeDraws(allDraws.slice(0, 10), 'Last 10 draws', config),
  };
}
