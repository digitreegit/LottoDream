// ============================================
// Footer matching WebLandingPage (logo + attribution)
// ============================================
import React from 'react';
import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity } from 'react-native';
import { LottoDreamLogo } from './LottoDreamLogo';
import { SUPPORT_EMAIL } from '../config/constants';

export function LandingStyleFooter() {
  return (
    <View style={styles.footerBand}>
      <View style={styles.footerInner}>
        <LottoDreamLogo width={150} />
        <Text style={styles.footerText}>
          Data sourced from NY Open Data  •  Updated after every drawing
        </Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          activeOpacity={0.8}
        >
          <Text style={styles.footerLink}>Support: {SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} Lotto Dream. All rights reserved.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerBand: Platform.select({
    web: {
      backgroundColor: '#FFFFFF',
      width: '100vw' as any,
      marginLeft: 'calc(50% - 50vw)' as any,
      marginTop: 76,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    } as any,
    default: {
      backgroundColor: '#FFFFFF',
      width: '100%' as any,
      alignSelf: 'stretch' as any,
      marginTop: 76,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    },
  }),
  footerInner: {
    maxWidth: 1280,
    width: '100%' as any,
    alignSelf: 'center' as any,
    alignItems: 'center',
    paddingVertical: 52,
    paddingHorizontal: 20,
  },
  footerText: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  footerLink: {
    color: '#00A383',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : {}),
  },
});
