// ============================================
// In-app notice for auth screens (web + RN)
// ============================================
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export type AuthNoticeVariant = 'success' | 'warning' | 'error' | 'info' | 'pending';

const VARIANT_BG: Record<AuthNoticeVariant, string> = {
  success: '#059669',
  warning: '#EA580C',
  error: '#DC2626',
  info: '#2563EB',
  pending: '#7C3AED',
};

function defaultAutoDismissMs(variant: AuthNoticeVariant): number | null {
  if (variant === 'error' || variant === 'warning') return null;
  return 8000;
}

function BannerIcon({ variant }: { variant: AuthNoticeVariant }) {
  const stroke = '#FFFFFF';
  const sw = 2;
  const vb = '0 0 24 24';
  switch (variant) {
    case 'success':
      return (
        <Svg width={22} height={22} viewBox={vb} fill="none">
          <Circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth={sw} />
          <Path d="M8 12.5l2.5 2.5L16 9.5" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'warning':
      return (
        <Svg width={22} height={22} viewBox={vb} fill="none">
          <Path
            d="M12 4.5L4.5 19.5h15L12 4.5Z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <Path d="M12 10v4M12 17h.01" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'error':
      return (
        <Svg width={22} height={22} viewBox={vb} fill="none">
          <Circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth={sw} />
          <Path d="M9 9l6 6M15 9l-6 6" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'info':
      return (
        <Svg width={22} height={22} viewBox={vb} fill="none">
          <Circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth={sw} />
          <Path d="M12 10v6M12 7h.01" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'pending':
      return (
        <Svg width={22} height={22} viewBox={vb} fill="none">
          <Circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth={sw} />
          <Path
            d="M12 7v3l2 1.5"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    default:
      return null;
  }
}

export interface AuthNoticeBannerProps {
  variant: AuthNoticeVariant;
  title: string;
  message: string;
  onDismiss: () => void;
  /** Milliseconds until auto-dismiss; `null` = manual only. Default depends on variant. */
  autoDismissMs?: number | null;
}

export function AuthNoticeBanner({
  variant,
  title,
  message,
  onDismiss,
  autoDismissMs,
}: AuthNoticeBannerProps) {
  const ms = autoDismissMs === undefined ? defaultAutoDismissMs(variant) : autoDismissMs;

  useEffect(() => {
    if (ms == null || ms <= 0) return;
    const t = setTimeout(onDismiss, ms);
    return () => clearTimeout(t);
  }, [ms, onDismiss]);

  return (
    <View
      style={[styles.wrap, { backgroundColor: VARIANT_BG[variant] }]}
      accessibilityRole="alert"
    >
      <View style={styles.iconCol}>
        <BannerIcon variant={variant} />
      </View>
      <Text style={styles.text} numberOfLines={5}>
        <Text style={styles.title}>{title}</Text>
        {message ? ` ${message}` : ''}
      </Text>
      <TouchableOpacity
        onPress={onDismiss}
        style={styles.closeHit}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel="Dismiss notification"
      >
        <Text style={styles.close}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 40,
    alignSelf: 'stretch',
    gap: 10,
  },
  iconCol: {
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  title: {
    fontWeight: '700',
  },
  closeHit: {
    paddingLeft: 4,
    justifyContent: 'center',
  },
  close: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '400',
    marginTop: -2,
  },
});
