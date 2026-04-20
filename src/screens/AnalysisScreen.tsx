// ============================================
// Analysis Screen - Detailed statistics
// ============================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { LandingStyleFooter } from '../components/LandingStyleFooter';
import { NumberHeatmap } from '../components/NumberHeatmap';
import { StatRow } from '../components/StatCard';
import { LottoRow } from '../components/LottoBall';
import { useDraws } from '../hooks/useDraws';
import { useGame, GameSelector } from '../hooks/useGame';
import { isWebDashboard, webDash, nativeDash, webDashboardScrollContent } from '../theme/webDashboard';

const C = isWebDashboard ? webDash : nativeDash;

type RangeKey = 'all' | 'last10' | 'last25' | 'last50' | 'last100';

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'last10', label: '10' },
  { key: 'last25', label: '25' },
  { key: 'last50', label: '50' },
  { key: 'last100', label: '100' },
  { key: 'all', label: 'All' },
];

export function AnalysisScreen() {
  const { game, config } = useGame();
  const { loading, analysis, refresh } = useDraws(game);
  const [selectedRange, setSelectedRange] = useState<RangeKey>('last100');

  const currentAnalysis = analysis?.[selectedRange];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isWebDashboard && webDashboardScrollContent]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#63B3ED" />
      }
    >
      <View style={styles.pageIntro}>
        <Text style={styles.eyebrow}>Insights</Text>
        <Text style={styles.title}>Number analysis</Text>
        <Text style={styles.lede}>
          Frequency heatmaps, hot/cold rankings, and pair trends — switch range to zoom in on recent draws.
        </Text>
      </View>

      {/* Game Selector */}
      <GameSelector light={isWebDashboard} />

      {/* Range Selector */}
      <View style={styles.rangeRail}>
        <Text style={styles.rangeRailLabel}>Draw window</Text>
        <View style={styles.rangeSelector}>
          {RANGE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.rangeButton,
                selectedRange === opt.key && styles.rangeActive,
              ]}
              onPress={() => setSelectedRange(opt.key)}
            >
              <Text
                style={[
                  styles.rangeText,
                  selectedRange === opt.key && styles.rangeTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {currentAnalysis && (
        <>
          {/* Stats Overview */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionRule} />
            <Text style={styles.sectionTitle}>{currentAnalysis.range}</Text>
          </View>
          <StatRow
            stats={[
              { label: 'Draws', value: currentAnalysis.totalDraws, color: '#3182CE' },
              {
                label: 'Avg Sum',
                value: Math.round(currentAnalysis.sumRange.avg),
                color: '#805AD5',
              },
              {
                label: 'Consecutive',
                value: `${Math.round(currentAnalysis.consecutiveRate * 100)}%`,
                color: '#DD6B20',
              },
            ]}
          />

          <StatRow
            stats={[
              {
                label: 'Odd / Even',
                value: `${Math.round(currentAnalysis.oddEvenRatio.odd * 100)} / ${Math.round(currentAnalysis.oddEvenRatio.even * 100)}`,
                subtitle: '%',
                color: '#D69E2E',
              },
              {
                label: 'Low / High',
                value: `${Math.round(currentAnalysis.lowHighRatio.low * 100)} / ${Math.round(currentAnalysis.lowHighRatio.high * 100)}`,
                subtitle: `1-${config.lowHighSplit} / ${config.lowHighSplit + 1}-${config.whiteMax}`,
                color: '#38B2AC',
              },
            ]}
          />

          <StatRow
            stats={[
              {
                label: 'Sum Min',
                value: currentAnalysis.sumRange.min,
                color: '#718096',
              },
              {
                label: 'Sum Median',
                value: currentAnalysis.sumRange.median,
                color: '#805AD5',
              },
              {
                label: 'Sum Max',
                value: currentAnalysis.sumRange.max,
                color: '#718096',
              },
            ]}
          />

          {/* White Ball Heatmap */}
          <NumberHeatmap
            data={currentAnalysis.whiteFrequency}
            maxNumber={config.whiteMax}
            columns={10}
            title="White Ball Frequency"
          />

          {/* Bonus Ball Heatmap */}
          <NumberHeatmap
            data={currentAnalysis.powerballFrequency}
            maxNumber={config.bonusMax}
            columns={13}
            title={`${config.bonusLabel} Frequency`}
          />

          {/* Hot Numbers */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hot White Numbers</Text>
            <View style={styles.numberList}>
              {currentAnalysis.hotWhite.map((n, i) => {
                const freq = currentAnalysis.whiteFrequency.find((f) => f.number === n);
                return (
                  <View key={n} style={styles.numberRow}>
                    <Text style={styles.rank}>#{i + 1}</Text>
                    <View style={[styles.numberBadge, { backgroundColor: '#E53E3E44' }]}>
                      <Text style={styles.numberBadgeText}>{n}</Text>
                    </View>
                    <Text style={styles.freq} numberOfLines={1} ellipsizeMode="tail">
                      {freq?.count || 0}x ({freq?.percentage.toFixed(1)}%)
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          {
                            width: `${Math.min((freq?.percentage || 0) * 8, 100)}%`,
                            backgroundColor: '#E53E3E',
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Cold Numbers */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cold White Numbers</Text>
            <View style={styles.numberList}>
              {currentAnalysis.coldWhite.map((n, i) => {
                const freq = currentAnalysis.whiteFrequency.find((f) => f.number === n);
                return (
                  <View key={n} style={styles.numberRow}>
                    <Text style={styles.rank}>#{i + 1}</Text>
                    <View style={[styles.numberBadge, { backgroundColor: '#38B2AC44' }]}>
                      <Text style={styles.numberBadgeText}>{n}</Text>
                    </View>
                    <Text style={styles.freq} numberOfLines={1} ellipsizeMode="tail">
                      {freq?.count || 0}x ({freq?.percentage.toFixed(1)}%)
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Overdue Numbers */}
          {currentAnalysis.overdue.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⏰ Overdue Numbers</Text>
              <Text style={styles.cardSubtitle}>
                Numbers not appeared for an unusually long time
              </Text>
              <View style={styles.numberGrid}>
                {currentAnalysis.overdue.slice(0, 10).map((n) => {
                  const freq = currentAnalysis.whiteFrequency.find((f) => f.number === n);
                  return (
                    <View key={n} style={styles.overdueChip}>
                      <Text style={styles.chipNumber}>{n}</Text>
                      <Text style={styles.chipSub}>{freq?.lastSeen || 0} ago</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Top Pairs */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🔗 Top Number Pairs</Text>
            <Text style={styles.cardSubtitle}>
              Most frequently appearing together
            </Text>
            {currentAnalysis.pairs.slice(0, 10).map(([a, b, count], i) => (
              <View key={i} style={styles.pairRow}>
                <Text style={styles.rank}>#{i + 1}</Text>
                <LottoRow whites={[a, b]} powerball={0} size={28} />
                <Text style={styles.pairCount}>{count}x</Text>
              </View>
            ))}
          </View>
        </>
      )}
      <LandingStyleFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isWebDashboard ? webDash.screenBg : C.screenBg,
  },
  content: {
    paddingBottom: 40,
    ...Platform.select({
      web: { paddingHorizontal: 0, paddingTop: 8 },
      default: { padding: 16 },
    }),
  },
  pageIntro: {
    marginBottom: 8,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: webDash.accent,
    textTransform: 'uppercase' as const,
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    ...(!isWebDashboard ? { textAlign: 'center' as const, color: '#63B3ED' } : {}),
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: C.textPrimary,
    textAlign: isWebDashboard ? ('left' as const) : ('center' as const),
    marginBottom: 10,
    letterSpacing: -0.4,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  lede: {
    fontSize: 14,
    lineHeight: 22,
    color: isWebDashboard ? webDash.textSecondary : '#A0AEC0',
    textAlign: isWebDashboard ? ('left' as const) : ('center' as const),
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  rangeRail: {
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: isWebDashboard ? webDash.radiusLg : 16,
    ...(isWebDashboard
      ? {
          backgroundColor: webDash.cardBg,
          borderWidth: 1,
          borderColor: webDash.cardBorder,
          boxShadow: webDash.shadowCard,
        }
      : {
          backgroundColor: '#111C35',
          borderWidth: 1,
          borderColor: '#2D3748',
        }),
  },
  rangeRailLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: isWebDashboard ? webDash.textMuted : '#718096',
    textTransform: 'uppercase' as const,
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  rangeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  rangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: isWebDashboard ? webDash.cardBgMuted : '#1A2744',
    ...(isWebDashboard ? { borderWidth: 1, borderColor: webDash.cardBorder } : {}),
  },
  rangeActive: {
    backgroundColor: isWebDashboard ? webDash.accent : '#3182CE',
    ...(isWebDashboard ? { borderColor: webDash.accent } : {}),
  },
  rangeText: {
    color: isWebDashboard ? webDash.textMuted : '#A0AEC0',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  rangeTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionRule: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: isWebDashboard ? webDash.accent : '#3182CE',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: isWebDashboard ? webDash.textPrimary : '#E2E8F0',
    textAlign: 'center',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    backgroundColor: isWebDashboard ? webDash.cardBg : C.cardBg,
    borderRadius: isWebDashboard ? webDash.radiusLg : 16,
    padding: 18,
    marginVertical: 8,
    ...(isWebDashboard
      ? { borderWidth: 1, borderColor: webDash.cardBorder, boxShadow: webDash.shadowCard }
      : {}),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  cardSubtitle: {
    fontSize: 13,
    color: isWebDashboard ? webDash.textSecondary : '#718096',
    marginBottom: 12,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  numberList: {
    gap: 8,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
  },
  rank: {
    color: isWebDashboard ? webDash.textSecondary : '#718096',
    fontSize: 13,
    width: 24,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  numberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberBadgeText: {
    color: isWebDashboard ? webDash.textPrimary : '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  freq: {
    color: isWebDashboard ? webDash.textSecondary : '#A0AEC0',
    fontSize: 14,
    width: 96,
    minWidth: 96,
    maxWidth: 96,
    flexShrink: 0,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  barTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: isWebDashboard ? '#E2E8F0' : '#2D3748',
    overflow: 'hidden',
  },
  bar: {
    height: 4,
    borderRadius: 2,
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  overdueChip: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 56,
    ...(isWebDashboard
      ? {
          backgroundColor: '#FFFBEB',
          borderWidth: 1,
          borderColor: '#FDE68A',
        }
      : {
          backgroundColor: '#744210',
        }),
  },
  chipNumber: {
    fontWeight: '700',
    fontSize: 18,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    ...(isWebDashboard ? { color: webDash.textPrimary } : { color: '#FEFCBF' }),
  },
  chipSub: {
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    ...(isWebDashboard ? { color: '#B45309' } : { color: '#D69E2E' }),
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.rowBorder,
  },
  pairCount: {
    color: isWebDashboard ? webDash.textSecondary : '#A0AEC0',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
