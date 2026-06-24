// ============================================
// History Screen - Draw history with search
// ============================================
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  Platform,
} from 'react-native';
import { LandingStyleFooter } from '../components/LandingStyleFooter';
import { LottoRow } from '../components/LottoBall';
import { useDraws } from '../hooks/useDraws';
import { useGame, GameSelector } from '../hooks/useGame';
import { Draw, drawNumbers, drawBonus, drawMultiplier } from '../types';
import { isWebDashboard, webDash, nativeDash, webDashboardScrollContent } from '../theme/webDashboard';

const C = isWebDashboard ? webDash : nativeDash;

export function HistoryScreen() {
  const { game, config } = useGame();
  const { draws, loading, refresh } = useDraws(game);
  const [search, setSearch] = useState('');

  // Filter draws by number search
  const filtered = useMemo(() => {
    if (!search.trim()) return draws;
    const nums = search
      .split(/[,\s]+/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));

    if (nums.length === 0) return draws;

    return draws.filter((draw) => {
      const bonus = drawBonus(draw);
      const drawNums = [...drawNumbers(draw), ...(bonus != null ? [bonus] : [])];
      return nums.every((n) => drawNums.includes(n));
    });
  }, [draws, search]);

  const renderDraw = ({ item, index }: { item: Draw; index: number }) => {
    const date = new Date(item.draw_date);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.drawItem}>
        <View style={styles.drawInfo}>
          <Text style={styles.drawNumber}>#{draws.length - index}</Text>
          <Text style={styles.drawDate}>
            {dayNames[date.getUTCDay()]},{' '}
            {date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              timeZone: 'UTC',
            })}
          </Text>
        </View>
        <LottoRow
          whites={drawNumbers(item)}
          powerball={drawBonus(item) ?? 0}
          game={game}
          size={34}
        />
        {drawMultiplier(item) ? (
          <Text style={styles.pp}>{config.shortName}: {drawMultiplier(item)}x</Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.pageIntro}>
        <Text style={styles.eyebrow}>Archive</Text>
        <Text style={styles.title}>Drawing results</Text>
        <Text style={styles.lede}>
          Full draw history with quick number search — comma or space separated.
        </Text>
      </View>

      {/* Game Selector */}
      <GameSelector light={isWebDashboard} />

      {/* Search */}
      <View style={styles.searchCard}>
        <Text style={styles.searchLabel}>Filter by numbers</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="e.g. 7 14 21 or 7, 14, 21"
          placeholderTextColor={isWebDashboard ? '#94A3B8' : '#718096'}
          value={search}
          onChangeText={setSearch}
          keyboardType="numeric"
        />
        {search.length > 0 && (
          <Text style={styles.searchResult}>
            {filtered.length} match{filtered.length === 1 ? '' : 'es'}
          </Text>
        )}
      </View>

      <FlatList
        style={styles.flatList}
        data={filtered}
        keyExtractor={(item) => item.draw_date}
        renderItem={renderDraw}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#63B3ED" />
        }
        contentContainerStyle={[styles.list, isWebDashboard && webDashboardScrollContent]}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? 'Loading draws...' : 'No draws found'}
          </Text>
        }
        ListFooterComponent={LandingStyleFooter}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    backgroundColor: isWebDashboard ? webDash.screenBg : C.screenBg,
  },
  flatList: {
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  pageIntro: {
    paddingTop: 8,
    marginBottom: 8,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: isWebDashboard ? webDash.accent : '#63B3ED',
    textTransform: 'uppercase' as const,
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    ...(!isWebDashboard ? { textAlign: 'center' as const } : {}),
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
    marginBottom: 4,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  searchCard: {
    paddingHorizontal: isWebDashboard ? 14 : 16,
    paddingVertical: isWebDashboard ? 14 : 12,
    marginBottom: 12,
    borderRadius: isWebDashboard ? webDash.radiusLg : 14,
    ...(isWebDashboard
      ? {
          backgroundColor: webDash.cardBg,
          borderWidth: 1,
          borderColor: webDash.cardBorder,
          boxShadow: webDash.shadowCard,
        }
      : {
          backgroundColor: 'transparent',
        }),
  },
  searchLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: isWebDashboard ? webDash.textMuted : '#718096',
    textTransform: 'uppercase' as const,
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  searchInput: {
    backgroundColor: isWebDashboard ? webDash.cardBgMuted : '#1A2744',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: isWebDashboard ? webDash.textPrimary : '#FFFFFF',
    borderWidth: 1,
    borderColor: isWebDashboard ? webDash.inputBorder : '#2D3748',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  searchResult: {
    color: isWebDashboard ? webDash.accent : '#63B3ED',
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  list: {
    paddingHorizontal: isWebDashboard ? 0 : 16,
    paddingBottom: 40,
    ...Platform.select({
      web: { paddingTop: 4 },
      default: {},
    }),
  },
  drawItem: {
    backgroundColor: isWebDashboard ? webDash.cardBg : C.cardBg,
    borderRadius: isWebDashboard ? webDash.radiusMd : 12,
    padding: 16,
    marginVertical: 6,
    alignItems: 'center',
    gap: 10,
    ...(isWebDashboard
      ? { borderWidth: 1, borderColor: webDash.cardBorder, boxShadow: webDash.shadowCard }
      : {}),
  },
  drawInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  drawNumber: {
    color: isWebDashboard ? webDash.textSecondary : '#718096',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  drawDate: {
    color: isWebDashboard ? webDash.textMuted : '#A0AEC0',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  pp: {
    color: '#D97706',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  empty: {
    color: isWebDashboard ? webDash.textSecondary : '#718096',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 18,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
