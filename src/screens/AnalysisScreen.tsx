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
} from 'react-native';
import { NumberHeatmap } from '../components/NumberHeatmap';
import { StatRow } from '../components/StatCard';
import { LottoRow } from '../components/LottoBall';
import { useDraws } from '../hooks/useDraws';
import { useGame, GameSelector } from '../hooks/useGame';

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
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#63B3ED" />
      }
    >
      <Text style={styles.title}>📊 Number Analysis</Text>

      {/* Game Selector */}
      <GameSelector />

      {/* Range Selector */}
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

      {currentAnalysis && (
        <>
          {/* Stats Overview */}
          <Text style={styles.sectionTitle}>{currentAnalysis.range}</Text>
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
            <Text style={styles.cardTitle}>🔥 Hot White Numbers</Text>
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
            <Text style={styles.cardTitle}>❄️ Cold White Numbers</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1426',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 16,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  rangeSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  rangeButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1A2744',
  },
  rangeActive: {
    backgroundColor: '#3182CE',
  },
  rangeText: {
    color: '#A0AEC0',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  rangeTextActive: {
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#A0AEC0',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    backgroundColor: '#1A2744',
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#718096',
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
    color: '#718096',
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
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  freq: {
    color: '#A0AEC0',
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
    backgroundColor: '#2D3748',
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
    backgroundColor: '#744210',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    minWidth: 56,
  },
  chipNumber: {
    color: '#FEFCBF',
    fontWeight: '700',
    fontSize: 20,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  chipSub: {
    color: '#D69E2E',
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  pairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
  },
  pairCount: {
    color: '#A0AEC0',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
