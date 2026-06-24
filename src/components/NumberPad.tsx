// ============================================
// NumberPad — tap-to-pick manual number selection
// Works for any game (variable main count + optional bonus).
// ============================================
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { GameConfig } from '../types';
import { isWebDashboard, webDash } from '../theme/webDashboard';

const W = isWebDashboard;
const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

interface NumberPadProps {
  config: GameConfig;
  selectedMains: number[];
  selectedBonus: number | null;
  onToggleMain: (n: number) => void;
  onSelectBonus: (n: number) => void;
}

function range(max: number): number[] {
  return Array.from({ length: max }, (_, i) => i + 1);
}

export function NumberPad({
  config,
  selectedMains,
  selectedBonus,
  onToggleMain,
  onSelectBonus,
}: NumberPadProps) {
  const accent = config.accentColor;
  const mains = useMemo(() => range(config.mainMax), [config.mainMax]);
  const bonuses = useMemo(
    () => (config.hasBonus ? range(config.bonusMax) : []),
    [config.hasBonus, config.bonusMax]
  );
  const mainFull = selectedMains.length >= config.mainCount;

  return (
    <View>
      <View style={styles.headerRow}>
        <Text style={styles.sectionLabel}>
          Pick {config.mainCount} numbers (1–{config.mainMax})
        </Text>
        <Text style={[styles.counter, { color: accent }]}>
          {selectedMains.length}/{config.mainCount}
        </Text>
      </View>

      <View style={styles.grid}>
        {mains.map((n) => {
          const selected = selectedMains.includes(n);
          const disabled = !selected && mainFull;
          return (
            <TouchableOpacity
              key={n}
              activeOpacity={0.8}
              disabled={disabled}
              onPress={() => onToggleMain(n)}
              style={[
                styles.cell,
                selected && { backgroundColor: accent, borderColor: accent },
                disabled && styles.cellDisabled,
              ]}
            >
              <Text style={[styles.cellText, selected && styles.cellTextSelected]}>{n}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {config.hasBonus ? (
        <>
          <View style={styles.headerRow}>
            <Text style={styles.sectionLabel}>
              {config.bonusLabel || 'Bonus'} (1–{config.bonusMax})
            </Text>
            <Text style={[styles.counter, { color: accent }]}>
              {selectedBonus ? selectedBonus : '—'}
            </Text>
          </View>
          <View style={styles.grid}>
            {bonuses.map((n) => {
              const selected = selectedBonus === n;
              return (
                <TouchableOpacity
                  key={n}
                  activeOpacity={0.8}
                  onPress={() => onSelectBonus(n)}
                  style={[
                    styles.cell,
                    styles.bonusCell,
                    selected && { backgroundColor: accent, borderColor: accent },
                  ]}
                >
                  <Text style={[styles.cellText, selected && styles.cellTextSelected]}>{n}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : null}
    </View>
  );
}

const cellBg = W ? '#FFFFFF' : '#1A2744';
const cellBorder = W ? webDash.cardBorder : '#2D3748';
const textColor = W ? webDash.textPrimary : '#E2E8F0';

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: W ? webDash.textSecondary : '#A0AEC0',
    fontFamily: FONT,
  },
  counter: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: FONT,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cellBg,
    borderWidth: 1,
    borderColor: cellBorder,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : {}),
  },
  bonusCell: {
    borderStyle: 'dashed',
  },
  cellDisabled: {
    opacity: 0.35,
  },
  cellText: {
    fontSize: 14,
    fontWeight: '700',
    color: textColor,
    fontFamily: FONT,
  },
  cellTextSelected: {
    color: '#FFFFFF',
  },
});
