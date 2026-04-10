// ============================================
// Stats Card Component
// ============================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export function StatCard({ label, value, subtitle, color = '#3182CE' }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
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
