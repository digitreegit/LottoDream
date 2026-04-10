// ============================================
// Game Selection Context
// ============================================
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { GameType, GameConfig } from '../types';
import { getGameConfig, GAME_CONFIGS } from '../config/constants';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

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
export function GameSelector() {
  const { game, setGame } = useGame();
  const games: GameType[] = ['powerball', 'megamillions'];

  return (
    <View style={styles.container}>
      {games.map((g) => {
        const cfg = getGameConfig(g);
        const active = game === g;
        return (
          <TouchableOpacity
            key={g}
            style={[
              styles.tab,
              active && { backgroundColor: cfg.accentColor + '33', borderColor: cfg.accentColor },
            ]}
            onPress={() => setGame(g)}
          >
            <Text style={[styles.tabText, active && { color: cfg.accentColor }]}>
              {cfg.icon} {cfg.shortName}
            </Text>
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
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1A2744',
    borderWidth: 1.5,
    borderColor: '#2D3748',
  },
  tabText: {
    color: '#A0AEC0',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
