// ============================================
// Number Heatmap Grid Component
// Shows frequency as color intensity
// ============================================
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { isWebDashboard, webDash } from '../theme/webDashboard';
import { NumberFrequency } from '../types';

interface HeatmapProps {
  data: NumberFrequency[];
  maxNumber: number;
  columns?: number;
  title: string;
  onNumberPress?: (num: number) => void;
  selectedNumbers?: number[];
}

export function NumberHeatmap({
  data,
  maxNumber,
  columns = 10,
  title,
  onNumberPress,
  selectedNumbers = [],
}: HeatmapProps) {
  const { width: screenWidth } = useWindowDimensions();
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const rows: number[][] = [];

  // Keep grid inside card bounds for both PB/MM on narrow devices.
  const horizontalPadding = 16 * 2; // screen padding from parent
  const cardPadding = 12 * 2; // this component container padding
  const rowMargins = 2 * columns; // per-cell margin budget
  const availableRowWidth = screenWidth - horizontalPadding - cardPadding - rowMargins;
  const cellSize = Math.max(18, Math.min(32, Math.floor(availableRowWidth / columns)));
  const cellFontSize = cellSize <= 20 ? 10 : cellSize <= 24 ? 11 : 12;

  for (let i = 0; i < maxNumber; i += columns) {
    const row: number[] = [];
    for (let j = 1; j <= columns && i + j <= maxNumber; j++) {
      row.push(i + j);
    }
    rows.push(row);
  }

  const getColor = (num: number): string => {
    const freq = data.find((d) => d.number === num);
    if (!freq) return '#E2E8F0';
    const intensity = freq.count / maxCount;
    // Blue gradient
    const r = Math.round(49 + (226 - 49) * (1 - intensity));
    const g = Math.round(130 + (232 - 130) * (1 - intensity));
    const b = Math.round(206 + (240 - 206) * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <View style={[styles.container, isWebDashboard && styles.containerWeb]}>
      <Text style={styles.title}>{title}</Text>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((num) => {
            const isSelected = selectedNumbers.includes(num);
            return (
              <TouchableOpacity
                key={num}
                style={[
                  styles.cell,
                  { width: cellSize, height: cellSize },
                  { backgroundColor: getColor(num) },
                  isSelected && styles.selected,
                ]}
                onPress={() => onNumberPress?.(num)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cellText, { fontSize: cellFontSize }, isSelected && styles.selectedText]}>
                  {num}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Low</Text>
        <View style={styles.legendBar}>
          {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
            <View
              key={i}
              style={[
                styles.legendBlock,
                {
                  backgroundColor: `rgb(${Math.round(49 + (226 - 49) * (1 - v))}, ${Math.round(130 + (232 - 130) * (1 - v))}, ${Math.round(206 + (240 - 206) * (1 - v))})`,
                },
              ]}
            />
          ))}
        </View>
        <Text style={styles.legendText}>High</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
  },
  containerWeb: {
    borderRadius: webDash.radiusLg,
    borderWidth: 1,
    borderColor: webDash.cardBorder,
    ...(Platform.OS === 'web' ? ({ boxShadow: webDash.shadowCard } as object) : {}),
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 10,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 2,
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    margin: 1,
  },
  cellText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A202C',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  selected: {
    borderWidth: 2,
    borderColor: '#E53E3E',
  },
  selectedText: {
    color: '#E53E3E',
    fontWeight: '800',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  legendBar: {
    flexDirection: 'row',
    marginHorizontal: 8,
  },
  legendBlock: {
    width: 24,
    height: 12,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  legendText: {
    fontSize: 11,
    color: '#718096',
  },
});
