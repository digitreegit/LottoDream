// ============================================
// Stats Card Component
// ============================================
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { isWebDashboard, webDash } from '../theme/webDashboard';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export function StatCard({ label, value, subtitle, color = '#3182CE' }: StatCardProps) {
  return (
    <View style={[styles.card, isWebDashboard && styles.cardWeb]}>
      <Text style={[styles.label, isWebDashboard && styles.labelWeb]}>{label}</Text>
      <Text style={[styles.value, isWebDashboard && styles.valueWeb, { color }]}>{value}</Text>
      {subtitle && <Text style={[styles.subtitle, isWebDashboard && styles.subtitleWeb]}>{subtitle}</Text>}
    </View>
  );
}

interface StatRowProps {
  stats: StatCardProps[];
}

export function StatRow({ stats }: StatRowProps) {
  return (
    <View style={styles.row}>
      {stats.map((s, i) => (
        <StatCard key={i} {...s} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    margin: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardWeb: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: webDash.cardBorder,
    marginHorizontal: 8,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        } as object)
      : {}),
    shadowOpacity: 0,
    elevation: 0,
  },
  labelWeb: {
    fontSize: 14,
  },
  valueWeb: {
    fontSize: 28,
  },
  subtitleWeb: {
    fontSize: 13,
  },
  label: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  value: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  subtitle: {
    fontSize: 11,
    color: '#A0AEC0',
    marginTop: 2,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  row: {
    flexDirection: 'row',
    marginVertical: 4,
  },
});
