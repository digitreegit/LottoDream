// ============================================
// Lottery Ball Component
// ============================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GameType } from '../types';
import { getGameConfig } from '../config/constants';

interface LottoBallProps {
  number: number;
  isBonus?: boolean;
  game?: GameType;
  size?: number;
  highlight?: boolean;
}

function bonusColor(game: GameType): string {
  return getGameConfig(game)?.accentColor || '#E53E3E';
}

export function LottoBall({
  number,
  isBonus = false,
  game = 'powerball',
  size = 44,
  highlight = false,
}: LottoBallProps) {
  const bgColor = isBonus
    ? bonusColor(game)
    : highlight
    ? '#F6AD55'
    : '#3182CE';

  return (
    <View
      style={[
        styles.ball,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
        highlight && styles.highlight,
      ]}
    >
      <Text
        style={[
          styles.number,
          { fontSize: size * 0.4 },
        ]}
      >
        {number}
      </Text>
    </View>
  );
}

interface LottoRowProps {
  whites: number[];
  powerball: number;
  game?: GameType;
  size?: number;
  /** Force-hide the bonus ball (e.g. Take 5 / Pick 10). Defaults to auto (hide when 0). */
  showBonus?: boolean;
}

export function LottoRow({ whites, powerball, game = 'powerball', size = 44, showBonus }: LottoRowProps) {
  const renderBonus = showBonus ?? (powerball != null && powerball > 0);
  return (
    <View style={styles.row}>
      {whites.map((n, i) => (
        <LottoBall key={`w${i}`} number={n} size={size} />
      ))}
      {renderBonus && (
        <>
          <View style={styles.separator} />
          <LottoBall number={powerball} isBonus game={game} size={size} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ball: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  highlight: {
    shadowColor: '#F6AD55',
    shadowOpacity: 0.5,
  },
  number: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    width: 8,
  },
});
