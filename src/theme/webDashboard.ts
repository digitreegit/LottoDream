/**
 * Design tokens for the logged-in web dashboard. Shared with native screens
 * via `nativeDash` for a consistent visual language across platforms.
 *
 * Keep this file vocabulary-focused (colors, radii, shadows, spacing) — no
 * component-specific styles. Screens compose these tokens into their own
 * StyleSheets.
 */
import { Platform } from 'react-native';

export const isWebDashboard = Platform.OS === 'web';

/** Readable column for long-form content (analysis, predict, settings). */
export const WEB_CONTENT_MAX_WIDTH = 960;
/** Wider column for dashboards / home hero where side-by-side cards breathe. */
export const WEB_DASHBOARD_MAX_WIDTH = 1120;

export const webDashboardScrollContent = {
  width: '100%' as const,
  maxWidth: WEB_CONTENT_MAX_WIDTH,
  alignSelf: 'center' as const,
};

export const webDashboardScrollContentWide = {
  width: '100%' as const,
  maxWidth: WEB_DASHBOARD_MAX_WIDTH,
  alignSelf: 'center' as const,
};

/** Spacing scale (4px grid). */
export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  mega: 56,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Layered shadow system — each level expresses a different elevation. */
export const shadow = {
  /** Subtle card resting on canvas */
  sm: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px -4px rgba(15, 23, 42, 0.06)',
  /** Default card */
  md: '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 24px -8px rgba(15, 23, 42, 0.08)',
  /** Featured / hover */
  lg: '0 4px 8px rgba(15, 23, 42, 0.06), 0 24px 48px -16px rgba(15, 23, 42, 0.18)',
  /** Floating (modals, dropdowns) */
  xl: '0 16px 48px -12px rgba(15, 23, 42, 0.28)',
  /** Premium CTA glow */
  accent:
    '0 8px 16px -4px rgba(0, 163, 131, 0.24), 0 16px 32px -8px rgba(0, 163, 131, 0.18)',
} as const;

export const webDash = {
  /** Default page canvas */
  canvasBg: '#F5F7FB',
  /** Screen body — now slightly tinted so cards can read crisply */
  screenBg: '#FAFBFE',
  /** Sticky/top region with subtle grid */
  headerBg: '#FFFFFF',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textSoft: '#94A3B8',

  cardBg: '#FFFFFF',
  cardBgMuted: '#F8FAFC',
  cardBgElevated: '#FFFFFF',
  cardBorder: '#E5EAF2',
  cardBorderStrong: '#CBD5E1',

  inputBg: '#FFFFFF',
  inputBorder: '#E2E8F0',
  inputBorderFocus: '#00A383',

  divider: '#EDF1F7',
  rowBorder: '#EEF2F6',

  /** Brand teal */
  accent: '#00A383',
  accentHover: '#00B896',
  accentDeep: '#007F65',
  accentSoft: 'rgba(0, 163, 131, 0.10)',
  accentSoftStrong: 'rgba(0, 163, 131, 0.18)',

  /** Premium gold */
  premium: '#B45309',
  premiumSoft: 'rgba(234, 179, 8, 0.12)',
  premiumBorder: 'rgba(234, 179, 8, 0.45)',

  danger: '#DC2626',
  dangerSoft: 'rgba(220, 38, 38, 0.10)',
  warning: '#D97706',
  success: '#059669',

  linkBlue: '#2563EB',
  navInk: '#334155',

  /** Brand gradient for hero bands */
  heroGradient: 'linear-gradient(135deg, #00A383 0%, #1D7B9A 60%, #2563EB 100%)',
  heroGradientDark: 'linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #334155 100%)',
  premiumGradient: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',

  shadowCard: shadow.md,
  shadowCardHover: shadow.lg,
  shadowFloat: shadow.xl,

  radiusLg: radius.lg,
  radiusMd: radius.md,
  radiusSm: radius.sm,
} as const;

export const nativeDash = {
  screenBg: '#0B1426',
  screenBgElevated: '#111C35',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#718096',
  textSoft: '#4A5568',
  cardBg: '#1A2744',
  cardBgMuted: '#111C35',
  cardBorder: '#2D3748',
  inputBg: '#1A2744',
  inputBorder: '#2D3748',
  divider: '#2D3748',
  rowBorder: '#2D3748',
  accent: '#38BDF8',
  accentSoft: 'rgba(56, 189, 248, 0.12)',
  premium: '#FACC15',
  premiumSoft: 'rgba(250, 204, 21, 0.15)',
  danger: '#F87171',
} as const;

export const FONT_FAMILY =
  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
