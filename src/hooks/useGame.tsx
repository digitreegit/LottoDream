// ============================================
// Game Selection Context
// ============================================
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GameType, GameConfig } from '../types';
import { getGameConfig, GAME_CONFIGS, GAME_ORDER } from '../config/constants';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { isWebDashboard, webDash } from '../theme/webDashboard';

interface GameContextValue {
  game: GameType;
  config: GameConfig;
  setGame: (game: GameType) => void;
}

const GameContext = createContext<GameContextValue>({
  game: 'powerball',
  config: GAME_CONFIGS.powerball,
  setGame: () => {},
});

export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameType>('powerball');
  const config = getGameConfig(game);

  return (
    <GameContext.Provider value={{ game, config, setGame }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}

/** Horizontal chip selector across all supported games. */
export function GameSelector({ light }: { light?: boolean }) {
  const { game, setGame } = useGame();
  const dark = !light || !isWebDashboard;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      {GAME_ORDER.map((g) => {
        const cfg = getGameConfig(g);
        const active = game === g;
        const accent = cfg.accentColor;
        return (
          <TouchableOpacity
            key={g}
            onPress={() => setGame(g)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.chip,
              dark ? styles.chipDark : styles.chipLight,
              active && { borderColor: accent, backgroundColor: `${accent}1F` },
              active &&
                Platform.OS === 'web' &&
                ({ boxShadow: `0 0 0 2px ${accent}33` } as object),
            ]}
          >
            <Text style={styles.chipIcon}>{cfg.icon}</Text>
            <View>
              <Text
                style={[
                  styles.chipName,
                  dark ? styles.chipNameDark : styles.chipNameLight,
                  active && { color: accent },
                ]}
                numberOfLines={1}
              >
                {cfg.name}
              </Text>
              {cfg.reliability === 'beta' ? (
                <Text style={styles.chipBeta}>BETA</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

const styles = StyleSheet.create({
  scroll: {
    marginVertical: 8,
    flexGrow: 0,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : {}),
  },
  chipLight: {
    backgroundColor: webDash.cardBg,
    borderColor: webDash.cardBorder,
  },
  chipDark: {
    backgroundColor: '#1A2744',
    borderColor: '#2D3748',
  },
  chipIcon: {
    fontSize: 18,
  },
  chipName: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONT,
  },
  chipNameLight: {
    color: webDash.textPrimary,
  },
  chipNameDark: {
    color: '#E2E8F0',
  },
  chipBeta: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#F59E0B',
    fontFamily: FONT,
  },
});
