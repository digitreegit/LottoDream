// ============================================
// Game Selection Context
// ============================================
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GameType, GameConfig } from '../types';
import { getGameConfig, GAME_CONFIGS } from '../config/constants';
import { View, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
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

/** Toggle button between Powerball and Mega Millions */
export function GameSelector({ light }: { light?: boolean }) {
  const { game, setGame } = useGame();
  const games: GameType[] = ['powerball', 'megamillions'];

  const logoMap = {
    powerball: require('../../assets/powerball-logo.png'),
    megamillions: require('../../assets/mega-millions-logo.png'),
  };

  return (
    <View style={[styles.container, light && isWebDashboard && styles.containerLight]}>
      {games.map((g) => {
        const cfg = getGameConfig(g);
        const active = game === g;
        return (
          <TouchableOpacity
            key={g}
            style={[
              styles.tab,
              light && styles.tabLight,
              light &&
                isWebDashboard &&
                active && {
                  backgroundColor: `${cfg.accentColor}18`,
                  borderColor: cfg.accentColor,
                  ...(Platform.OS === 'web'
                    ? ({ boxShadow: '0 0 0 2px rgba(15, 23, 42, 0.06)' } as object)
                    : {}),
                },
              light && isWebDashboard && !active && styles.tabLightIdle,
              light &&
                active &&
                !isWebDashboard && { backgroundColor: cfg.accentColor + '33', borderColor: cfg.accentColor },
              !light && active && { backgroundColor: cfg.accentColor + '33', borderColor: cfg.accentColor },
            ]}
            onPress={() => setGame(g)}
          >
            <Image
              source={logoMap[g as keyof typeof logoMap]}
              style={[styles.logo, active && { opacity: 1 }, !active && { opacity: 0.6 }]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  containerLight: {
    padding: 6,
    borderRadius: 999,
    backgroundColor: webDash.cardBg,
    borderWidth: 1,
    borderColor: webDash.cardBorder,
    gap: 6,
    ...(Platform.OS === 'web' ? ({ boxShadow: webDash.shadowCard } as object) : {}),
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1A2744',
    borderWidth: 1.5,
    borderColor: '#2D3748',
  },
  tabLight: {
    backgroundColor: '#FFFFFF',
    borderColor: webDash.cardBorder,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  tabLightIdle: {
    opacity: 0.92,
  },
  logo: {
    width: 60,
    height: 40,
    resizeMode: 'contain',
  },
});
