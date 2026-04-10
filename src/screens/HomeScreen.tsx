// ============================================
// Home Screen - Dashboard
// ============================================
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LottoRow } from '../components/LottoBall';
import { StatRow } from '../components/StatCard';
import { useDraws } from '../hooks/useDraws';
import { useGame, GameSelector } from '../hooks/useGame';
import { LottoDreamLogo } from '../components/LottoDreamLogo';

export function HomeScreen({ navigation }: any) {
  const { game, config } = useGame();
  const { draws, loading, error, analysis, refresh, latestDraw } = useDraws(game);

  const allAnalysis = analysis?.all;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={refresh}
          tintColor="#63B3ED"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <LottoDreamLogo width={190} />
        <Text style={styles.tagline}>{config.name} Smart Analysis</Text>
      </View>

      {/* Game Selector */}
      <GameSelector />

      {/* Latest Draw */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Latest Drawing</Text>
        {latestDraw ? (
          <>
            <Text style={styles.drawDate}>
              {new Date(latestDraw.draw_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            <View style={styles.ballRow}>
              <LottoRow
                whites={[latestDraw.n1, latestDraw.n2, latestDraw.n3, latestDraw.n4, latestDraw.n5]}
                powerball={latestDraw.powerball}
                game={game}
                size={48}
              />
            </View>
            {latestDraw.powerplay && (
              <Text style={styles.powerplay}>
                {config.multiplierLabel}: {latestDraw.powerplay}x
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.loadingText}>
            {loading ? 'Loading...' : error || 'No data'}
          </Text>
        )}
      </View>

      {/* Quick Stats */}
      {allAnalysis && (
        <View>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <StatRow
            stats={[
              {
                label: 'Total Draws',
                value: allAnalysis.totalDraws.toLocaleString(),
                color: '#3182CE',
              },
              {
                label: 'Hot #1',
                value: allAnalysis.hotWhite[0]?.toString() || '-',
                subtitle: 'Most frequent',
                color: '#E53E3E',
              },
              {
                label: 'Cold #1',
                value: allAnalysis.coldWhite[0]?.toString() || '-',
                subtitle: 'Least frequent',
                color: '#38B2AC',
              },
            ]}
          />
          <StatRow
            stats={[
              {
                label: 'Avg Sum',
                value: Math.round(allAnalysis.sumRange.avg),
                color: '#805AD5',
              },
              {
                label: 'Odd/Even',
                value: `${Math.round(allAnalysis.oddEvenRatio.odd * 100)}/${Math.round(allAnalysis.oddEvenRatio.even * 100)}`,
                subtitle: '%',
                color: '#D69E2E',
              },
              {
                label: 'Consec Rate',
                value: `${Math.round(allAnalysis.consecutiveRate * 100)}%`,
                color: '#DD6B20',
              },
            ]}
          />
        </View>
      )}

      {/* Hot Numbers */}
      {allAnalysis && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 Hot Numbers (All Time)</Text>
          <View style={styles.numberGrid}>
            {allAnalysis.hotWhite.map((n) => (
              <View key={n} style={[styles.numberChip, styles.hotChip]}>
                <Text style={styles.chipText}>{n}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Cold Numbers */}
      {allAnalysis && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>❄️ Cold Numbers (All Time)</Text>
          <View style={styles.numberGrid}>
            {allAnalysis.coldWhite.map((n) => (
              <View key={n} style={[styles.numberChip, styles.coldChip]}>
                <Text style={styles.chipText}>{n}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* CTA Buttons */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.ctaPrimary}
          onPress={() => navigation.navigate('Predict')}
        >
          <Text style={styles.ctaPrimaryText}>🎯 Get Smart Picks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ctaSecondary}
          onPress={() => navigation.navigate('Analysis')}
        >
          <Text style={styles.ctaSecondaryText}>📊 Full Analysis</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Draws */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Drawings</Text>
        {draws.slice(0, 10).map((draw, i) => (
          <View key={i} style={styles.recentDraw}>
            <Text style={styles.recentDate}>
              {new Date(draw.draw_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <LottoRow
              whites={[draw.n1, draw.n2, draw.n3, draw.n4, draw.n5]}
              powerball={draw.powerball}
              game={game}
              size={32}
            />
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Data source: NY Open Data{'\n'}
          Updated after every drawing
        </Text>
      </View>
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
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  tagline: {
    fontSize: 13,
    color: '#A0AEC0',
    marginTop: 4,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    backgroundColor: '#1A2744',
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  drawDate: {
    fontSize: 13,
    color: '#A0AEC0',
    textAlign: 'center',
    marginBottom: 12,
  },
  ballRow: {
    alignItems: 'center',
  },
  powerplay: {
    fontSize: 14,
    color: '#F6AD55',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  loadingText: {
    color: '#718096',
    textAlign: 'center',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  numberGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  numberChip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotChip: {
    backgroundColor: '#E53E3E44',
    borderWidth: 1,
    borderColor: '#E53E3E',
  },
  coldChip: {
    backgroundColor: '#38B2AC44',
    borderWidth: 1,
    borderColor: '#38B2AC',
  },
  chipText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  ctaContainer: {
    marginVertical: 16,
    gap: 10,
  },
  ctaPrimary: {
    backgroundColor: '#3182CE',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaPrimaryText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  ctaSecondary: {
    backgroundColor: '#2D3748',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A5568',
  },
  ctaSecondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recentDraw: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2D3748',
    alignItems: 'center',
    gap: 6,
  },
  recentDate: {
    color: '#A0AEC0',
    fontSize: 13,
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#4A5568',
    fontSize: 12,
    textAlign: 'center',
  },
});
