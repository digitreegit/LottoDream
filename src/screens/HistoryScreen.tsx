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
} from 'react-native';
import { LottoRow } from '../components/LottoBall';
import { useDraws } from '../hooks/useDraws';
import { useGame, GameSelector } from '../hooks/useGame';
import { Draw } from '../types';

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
      const drawNums = [draw.n1, draw.n2, draw.n3, draw.n4, draw.n5, draw.powerball];
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
          whites={[item.n1, item.n2, item.n3, item.n4, item.n5]}
          powerball={item.powerball}
          game={game}
          size={34}
        />
        {item.powerplay && (
          <Text style={styles.pp}>{config.shortName}: {item.powerplay}x</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Drawing</Text>

      {/* Game Selector */}
      <GameSelector />

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by number (e.g. 7 14 21)"
          placeholderTextColor="#718096"
          value={search}
          onChangeText={setSearch}
          keyboardType="numeric"
        />
        {search.length > 0 && (
          <Text style={styles.searchResult}>
            {filtered.length} matches found
          </Text>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.draw_date}
        renderItem={renderDraw}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#63B3ED" />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {loading ? 'Loading draws...' : 'No draws found'}
          </Text>
        }
        initialNumToRender={20}
        maxToRenderPerBatch={20}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1426',
  },
  title: {
    fontSize: 27,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#1A2744',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2D3748',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  searchResult: {
    color: '#63B3ED',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  drawItem: {
    backgroundColor: '#1A2744',
    borderRadius: 12,
    padding: 14,
    marginVertical: 4,
    alignItems: 'center',
    gap: 8,
  },
  drawInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  drawNumber: {
    color: '#718096',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  drawDate: {
    color: '#A0AEC0',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  pp: {
    color: '#F6AD55',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  empty: {
    color: '#718096',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 18,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
