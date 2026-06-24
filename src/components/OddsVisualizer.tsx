// ============================================
// OddsVisualizer — statistical quality, backtest & tier distribution
// ============================================
//
// HONESTY: This visualizes statistical *quality* of a combination, NOT a higher
// chance of winning. Every combination has identical jackpot odds. The Monte
// Carlo tier bars show how often a combination would have matched lower prize
// tiers across random simulated draws — useful intuition, not a probability edge.
//
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Draw, PredictionSet } from '../types';
import { monteCarloScore } from '../services/predictionEngine';
import { getGameConfig } from '../config/constants';
import { isWebDashboard, webDash, nativeDash } from '../theme/webDashboard';

const W = isWebDashboard;
const C = W ? webDash : nativeDash;
const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

interface Props {
  prediction: PredictionSet;
  draws?: Draw[];
  /** Number of Monte Carlo simulations (lower = faster). */
  simulations?: number;
}

function pct(n: number): string {
  if (n <= 0) return '0%';
  if (n < 0.01) return '<0.01%';
  if (n < 1) return `${n.toFixed(2)}%`;
  return `${n.toFixed(1)}%`;
}

export function OddsVisualizer({ prediction, draws, simulations = 4000 }: Props) {
  const config = getGameConfig(prediction.game);
  const accent = config.accentColor;

  const tiers = useMemo(() => {
    if (!draws || draws.length === 0) return null;
    const { matchDistribution } = monteCarloScore(
      prediction.whites,
      prediction.powerball,
      draws,
      simulations,
      prediction.game
    );
    const total = Object.values(matchDistribution).reduce((a, b) => a + b, 0) || 1;
    // "Any prize-like match" tiers: 3+ mains, 4+ mains, 5 mains.
    const sumWhere = (minWhites: number) =>
      Object.entries(matchDistribution).reduce((acc, [key, count]) => {
        const whites = parseInt(key.split('+')[0], 10);
        return whites >= minWhites ? acc + count : acc;
      }, 0);
    return [
      { label: '3+ matches', value: (sumWhere(3) / total) * 100 },
      { label: '4+ matches', value: (sumWhere(4) / total) * 100 },
      { label: 'All matches', value: (sumWhere(config.mainCount) / total) * 100 },
    ];
  }, [draws, prediction, simulations, config.mainCount]);

  const bt = prediction.backtest;
  // Scale tier bars relative to the largest so small probabilities stay visible.
  const maxTier = tiers ? Math.max(...tiers.map((t) => t.value), 0.0001) : 1;

  return (
    <View style={styles.wrap}>
      {/* Quality score gauge */}
      <View style={styles.block}>
        <View style={styles.rowBetween}>
          <Text style={styles.blockLabel}>Statistical quality</Text>
          <Text style={[styles.scoreVal, { color: accent }]}>{prediction.score}/100</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${prediction.score}%`, backgroundColor: accent }]} />
        </View>
      </View>

      {/* Backtest summary */}
      {bt && bt.sampleSize > 0 ? (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{bt.avgWhiteMatches.toFixed(2)}</Text>
            <Text style={styles.statLabel}>avg matches</Text>
          </View>
          {config.hasBonus ? (
            <View style={styles.stat}>
              <Text style={styles.statNum}>{pct(bt.powerballHitRate * 100)}</Text>
              <Text style={styles.statLabel}>{config.bonusLabel || 'bonus'} hit</Text>
            </View>
          ) : null}
          <View style={styles.stat}>
            <Text style={styles.statNum}>{pct(bt.tier3PlusRate * 100)}</Text>
            <Text style={styles.statLabel}>3-tier+ rate</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{bt.sampleSize}</Text>
            <Text style={styles.statLabel}>draws tested</Text>
          </View>
        </View>
      ) : null}

      {/* Monte Carlo tier distribution */}
      {tiers ? (
        <View style={styles.block}>
          <Text style={styles.blockLabel}>Simulated match likelihood</Text>
          {tiers.map((t) => (
            <View key={t.label} style={styles.tierRow}>
              <Text style={styles.tierLabel}>{t.label}</Text>
              <View style={styles.tierTrack}>
                <View
                  style={[
                    styles.tierFill,
                    {
                      width: `${Math.max(2, (t.value / maxTier) * 100)}%`,
                      backgroundColor: accent,
                    },
                  ]}
                />
              </View>
              <Text style={styles.tierVal}>{pct(t.value)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.disclaimer}>
        For intuition only. Every combination shares the same jackpot odds — these bars show
        statistical quality and simulated lower-tier matches, not a better chance of winning.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: W ? webDash.divider : '#2D3748',
  },
  block: { gap: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  blockLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: W ? webDash.textSecondary : '#A0AEC0',
    fontFamily: FONT,
  },
  scoreVal: { fontSize: 14, fontWeight: '800', fontFamily: FONT },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: W ? '#EEF2F6' : '#1A2744',
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4 },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stat: {
    flex: 1,
    minWidth: 70,
    backgroundColor: W ? webDash.cardBgMuted : '#1A2744',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    ...(W ? { borderWidth: 1, borderColor: webDash.cardBorder } : {}),
  },
  statNum: {
    fontSize: 15,
    fontWeight: '800',
    color: C.textPrimary,
    fontFamily: FONT,
  },
  statLabel: {
    fontSize: 10,
    color: W ? webDash.textMuted : '#718096',
    marginTop: 2,
    fontFamily: FONT,
  },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierLabel: {
    width: 86,
    fontSize: 11,
    color: W ? webDash.textSecondary : '#A0AEC0',
    fontFamily: FONT,
  },
  tierTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: W ? '#EEF2F6' : '#1A2744',
    overflow: 'hidden',
  },
  tierFill: { height: 7, borderRadius: 4 },
  tierVal: {
    width: 64,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
    color: C.textPrimary,
    fontFamily: FONT,
  },
  disclaimer: {
    fontSize: 10,
    lineHeight: 15,
    color: W ? webDash.textMuted : '#718096',
    fontStyle: 'italic',
    fontFamily: FONT,
    ...(Platform.OS === 'web' ? {} : {}),
  },
});
