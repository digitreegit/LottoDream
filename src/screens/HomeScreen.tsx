// ============================================
// Home Screen - Dashboard (dual-game hero layout)
// ============================================
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { LottoRow } from '../components/LottoBall';
import { StatRow } from '../components/StatCard';
import { useDraws } from '../hooks/useDraws';
import { useGame } from '../hooks/useGame';
import { LottoDreamLogo } from '../components/LottoDreamLogo';
import { LandingStyleFooter } from '../components/LandingStyleFooter';
import { landingCtaPrimaryButton, landingCtaPrimaryButtonText } from '../theme/landingCta';
import { getGameConfig } from '../config/constants';
import { webDash, webDashboardScrollContent } from '../theme/webDashboard';
import { fetchLandingGameJackpots, type LandingJackpotDisplay } from '../services/jackpotDisplayService';
import { drawNumbers, drawBonus, drawMultiplier, type Draw, type GameType } from '../types';

const isWeb = Platform.OS === 'web';

const LOGO: Partial<Record<GameType, any>> = {
  powerball: require('../../assets/powerball-logo.png'),
  megamillions: require('../../assets/mega-millions-logo.png'),
};

function formatLongDrawDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatNextDrawLine(d: Date) {
  return d
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    })
    .toUpperCase();
}

/** NJ-style white main balls + solid bonus */
function HeroNumberRow({
  whites,
  bonus,
  bonusHex,
}: {
  whites: number[];
  bonus: number;
  bonusHex: string;
}) {
  return (
    <View style={heroStyles.ballRow}>
      {whites.map((n, i) => (
        <View key={`${n}-${i}`} style={heroStyles.whiteBall}>
          <Text style={heroStyles.whiteBallText}>{n}</Text>
        </View>
      ))}
      <View style={[heroStyles.bonusBall, { backgroundColor: bonusHex }]}>
        <Text style={heroStyles.bonusBallText}>{bonus}</Text>
      </View>
    </View>
  );
}

const heroStyles = StyleSheet.create({
  ballRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  whiteBall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteBallText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  bonusBall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bonusBallText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});

function LotteryHeroCard({
  gameType,
  selected,
  latestDraw,
  loading,
  error,
  jackpot,
  onSelect,
  onPastDrawings,
}: {
  gameType: GameType;
  selected: boolean;
  latestDraw: Draw | null;
  loading: boolean;
  error: string | null;
  jackpot: LandingJackpotDisplay | null;
  onSelect: () => void;
  onPastDrawings: () => void;
}) {
  const cfg = getGameConfig(gameType);
  const isPb = gameType === 'powerball';
  const bandColor = isPb ? '#B91C1C' : '#1D4ED8';
  const bonusHex = isPb ? '#DC2626' : '#2563EB';

  return (
    <View style={[styles.heroCard, selected && styles.heroCardSelected]}>
      <TouchableOpacity
        onPress={onSelect}
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`Select ${cfg.name} for stats below`}
        style={styles.heroCardBodyTouchable}
      >
        <View style={styles.heroCardTop}>
          {LOGO[gameType] ? (
            <Image source={LOGO[gameType]} style={styles.heroLogo} resizeMode="contain" />
          ) : (
            <Text style={styles.heroFallbackName}>{cfg.name}</Text>
          )}
        </View>

        <View style={[styles.heroJackpotBand, { backgroundColor: bandColor }]}>
          <Text style={styles.heroJackpotLabel}>ESTIMATED JACKPOT*</Text>
          <Text style={styles.heroJackpotAmount} numberOfLines={1}>
            {jackpot?.amountDisplay ?? '—'}
          </Text>
          <Text style={styles.heroJackpotHint}>Annuitized; cash option varies by jurisdiction.</Text>
          <View style={styles.heroNextDrawBox}>
            <Text style={styles.heroNextDrawLabel}>NEXT DRAW</Text>
            <Text style={styles.heroNextDrawValue}>
              {jackpot ? formatNextDrawLine(jackpot.nextDrawDate) : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.heroNumbersSection}>
          <Text style={styles.heroNumbersCaption}>
            CURRENT WINNING NUMBERS
            {latestDraw ? ` (${formatLongDrawDate(latestDraw.draw_date)})` : ''}
          </Text>
          {loading ? (
            <Text style={styles.heroLoading}>Loading…</Text>
          ) : error ? (
            <Text style={styles.heroError}>{error}</Text>
          ) : latestDraw ? (
            <>
              <HeroNumberRow
                whites={drawNumbers(latestDraw)}
                bonus={drawBonus(latestDraw) ?? 0}
                bonusHex={bonusHex}
              />
              {drawMultiplier(latestDraw) != null && (drawMultiplier(latestDraw) as number) > 0 ? (
                <Text style={styles.heroMultiplier}>
                  {cfg.multiplierLabel?.toUpperCase() || 'MULTIPLIER'} ×{drawMultiplier(latestDraw)}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.heroLoading}>No draw data</Text>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.heroPastBtn} onPress={onPastDrawings} activeOpacity={0.88}>
        <Text style={styles.heroPastBtnText}>PAST DRAWINGS</Text>
      </TouchableOpacity>
    </View>
  );
}

export function HomeScreen({ navigation }: any) {
  const { game, setGame } = useGame();
  const { width } = useWindowDimensions();
  const stackHero = width < 720;

  const pb = useDraws('powerball');
  const mm = useDraws('megamillions');

  const [jackpots, setJackpots] = useState<{
    powerball: LandingJackpotDisplay | null;
    megamillions: LandingJackpotDisplay | null;
  } | null>(null);

  const loadJackpots = useCallback(async () => {
    try {
      const j = await fetchLandingGameJackpots();
      setJackpots(j);
    } catch {
      setJackpots({ powerball: null, megamillions: null });
    }
  }, []);

  useEffect(() => {
    void loadJackpots();
  }, [loadJackpots]);

  const loadingBoth = pb.loading || mm.loading;

  const onRefresh = useCallback(async () => {
    await Promise.all([pb.refresh(), mm.refresh(), loadJackpots()]);
  }, [pb, mm, loadJackpots]);

  const allAnalysis = game === 'powerball' ? pb.analysis?.all : mm.analysis?.all;
  const draws = game === 'powerball' ? pb.draws : mm.draws;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isWeb && webDashboardScrollContent]}
      refreshControl={
        <RefreshControl refreshing={loadingBoth} onRefresh={onRefresh} tintColor="#63B3ED" />
      }
    >
      {!isWeb && (
        <View style={styles.header}>
          <LottoDreamLogo width={190} />
          <Text style={styles.tagline}>Powerball & Mega Millions</Text>
        </View>
      )}

      <View
        style={[
          styles.dualHeroRow,
          isWeb && !stackHero ? styles.dualHeroRowWide : styles.dualHeroRowStacked,
        ]}
      >
        <LotteryHeroCard
          gameType="powerball"
          selected={game === 'powerball'}
          latestDraw={pb.latestDraw}
          loading={pb.loading}
          error={pb.error}
          jackpot={jackpots?.powerball ?? null}
          onSelect={() => setGame('powerball')}
          onPastDrawings={() => {
            setGame('powerball');
            navigation.navigate('History');
          }}
        />
        <LotteryHeroCard
          gameType="megamillions"
          selected={game === 'megamillions'}
          latestDraw={mm.latestDraw}
          loading={mm.loading}
          error={mm.error}
          jackpot={jackpots?.megamillions ?? null}
          onSelect={() => setGame('megamillions')}
          onPastDrawings={() => {
            setGame('megamillions');
            navigation.navigate('History');
          }}
        />
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

      <View style={styles.ctaContainer}>
        <TouchableOpacity style={styles.ctaPrimary} onPress={() => navigation.navigate('Predict')}>
          <Text style={styles.ctaPrimaryText}>🎯 Get Smart Picks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctaSecondary} onPress={() => navigation.navigate('Analysis')}>
          <Text style={styles.ctaSecondaryText}>📊 Full Analysis</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Drawings ({getGameConfig(game).name})</Text>
        {draws.slice(0, 10).map((draw, i) => (
          <View key={`${draw.draw_date}-${i}`} style={styles.recentDraw}>
            <Text style={styles.recentDate}>
              {new Date(draw.draw_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <LottoRow
              whites={drawNumbers(draw)}
              powerball={drawBonus(draw) ?? 0}
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
      web: { backgroundColor: webDash.screenBg },
      default: { backgroundColor: '#0B1426' },
    }),
  },
  content: {
    paddingBottom: 40,
    ...Platform.select({
      web: { paddingHorizontal: 0, paddingTop: 72 },
      default: { padding: 16 },
    }),
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  tagline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  dualHeroRow: {
    gap: 12,
    marginBottom: 8,
  },
  dualHeroRowWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 32,
  },
  dualHeroRowStacked: {
    flexDirection: 'column',
  },
  heroCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: webDash.cardBorder,
    ...Platform.select({
      web: {
        boxShadow: webDash.shadowCard,
      } as object,
      default: {
        marginBottom: 12,
        width: '100%' as const,
      },
    }),
  },
  heroCardSelected: {
    borderColor: webDash.accent,
    borderWidth: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 0 0 3px rgba(0, 163, 131, 0.2), 0 12px 28px -10px rgba(15, 23, 42, 0.15)',
      } as object,
      default: {},
    }),
  },
  heroCardBodyTouchable: {
    flexShrink: 0,
  },
  heroCardTop: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  heroLogo: {
    width: '100%',
    height: 44,
    maxWidth: 220,
  },
  heroFallbackName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  heroJackpotBand: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 14,
  },
  heroJackpotLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.92)',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  heroJackpotAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 6,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  heroJackpotHint: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 6,
    lineHeight: 14,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  heroNextDrawBox: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  heroNextDrawLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748B',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  heroNextDrawValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  heroNumbersSection: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  heroNumbersCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.3,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  heroLoading: {
    textAlign: 'center',
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  heroError: {
    textAlign: 'center',
    fontSize: 13,
    color: '#DC2626',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  heroMultiplier: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  heroPastBtn: {
    ...Platform.select({
      web: {
        backgroundColor: '#0F172A',
        borderTopWidth: 0,
      },
      default: {
        backgroundColor: '#FACC15',
        borderTopWidth: 1,
        borderTopColor: '#EAB308',
      },
    }),
    paddingVertical: 14,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : null),
  },
  heroPastBtnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    ...Platform.select({
      web: { color: '#F8FAFC' },
      default: { color: '#14532D' },
    }),
  },
  card: {
    borderRadius: webDash.radiusLg,
    padding: 18,
    marginVertical: 8,
    ...Platform.select({
      web: {
        backgroundColor: webDash.cardBg,
        borderWidth: 1,
        borderColor: webDash.cardBorder,
        boxShadow: webDash.shadowCard,
      } as object,
      default: {
        backgroundColor: '#1A2744',
      },
    }),
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
    ...Platform.select({
      web: {
        color: webDash.textPrimary,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      default: { color: '#FFFFFF' },
    }),
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    ...Platform.select({
      web: {
        color: webDash.textMuted,
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
