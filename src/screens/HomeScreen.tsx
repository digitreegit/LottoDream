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
  Platform,
} from 'react-native';
import { LottoRow } from '../components/LottoBall';
import { StatRow } from '../components/StatCard';
import { useDraws } from '../hooks/useDraws';
import { useGame, GameSelector } from '../hooks/useGame';
import { LottoDreamLogo } from '../components/LottoDreamLogo';
import { LandingStyleFooter } from '../components/LandingStyleFooter';
import { landingCtaPrimaryButton, landingCtaPrimaryButtonText } from '../theme/landingCta';

const isWeb = Platform.OS === 'web';

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
      {!isWeb && (
        <View style={styles.header}>
          <LottoDreamLogo width={190} />
          <Text style={styles.tagline}>{config.name} Smart Analysis</Text>
        </View>
      )}
      {isWeb && (
        <View style={styles.webHeader}>
          <Text style={styles.webTitle}>{config.name} Smart Analysis</Text>
          <Text style={styles.webSubtitle}>Latest draws, quick stats, and shortcuts to tools</Text>
        </View>
      )}

      {/* Game Selector */}
      <GameSelector light={isWeb} />

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

      <LandingStyleFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...Platform.select({
      web: { backgroundColor: '#FFFFFF' },
      default: { backgroundColor: '#0B1426' },
    }),
  },
  content: {
    paddingBottom: 40,
    ...Platform.select({
      web: { paddingHorizontal: 0, paddingTop: 12 },
      default: { padding: 16 },
    }),
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  webHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 4,
  },
  webTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  webSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 520,
    lineHeight: 20,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  tagline: {
    fontSize: 13,
    color: '#A0AEC0',
    marginTop: 4,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
    ...Platform.select({
      web: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
      },
      default: {
        backgroundColor: '#1A2744',
      },
    }),
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 12,
    ...Platform.select({
      web: {
        color: '#111827',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      default: { color: '#FFFFFF' },
    }),
  },
  drawDate: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    ...Platform.select({
      web: { color: '#64748B', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
      default: { color: '#A0AEC0' },
    }),
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
    textAlign: 'center',
    fontSize: 15,
    ...Platform.select({
      web: { color: '#64748B' },
      default: { color: '#718096' },
    }),
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    ...Platform.select({
      web: {
        color: '#111827',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      default: { color: '#FFFFFF' },
    }),
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
    fontWeight: '600',
    fontSize: 14,
    ...Platform.select({
      web: { color: '#111827' },
      default: { color: '#FFFFFF' },
    }),
  },
  ctaContainer: {
    marginVertical: 16,
    gap: 10,
  },
  ctaPrimary: {
    alignItems: 'center',
    ...Platform.select({
      web: {
        ...landingCtaPrimaryButton,
        minHeight: 52,
        paddingVertical: 14,
      },
      default: {
        backgroundColor: '#3182CE',
        borderRadius: 14,
        paddingVertical: 18,
      },
    }),
  },
  ctaPrimaryText: {
    ...Platform.select({
      web: {
        ...landingCtaPrimaryButtonText,
        fontSize: 17,
        fontWeight: '600',
      },
      default: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
      },
    }),
  },
  ctaSecondary: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      web: {
        backgroundColor: '#F8FAFC',
        borderColor: '#CBD5E1',
      },
      default: {
        backgroundColor: '#2D3748',
        borderColor: '#4A5568',
      },
    }),
  },
  ctaSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    ...Platform.select({
      web: {
        color: '#111827',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      default: { color: '#FFFFFF' },
    }),
  },
  recentDraw: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
    gap: 6,
    ...Platform.select({
      web: { borderBottomColor: '#E2E8F0' },
      default: { borderBottomColor: '#2D3748' },
    }),
  },
  recentDate: {
    fontSize: 13,
    ...Platform.select({
      web: { color: '#64748B' },
      default: { color: '#A0AEC0' },
    }),
  },
});
