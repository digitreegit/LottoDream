/**
 * Light dashboard styles for logged-in web (align with WebLandingPage / HomeScreen).
 */
import { Platform } from 'react-native';

export const isWebDashboard = Platform.OS === 'web';

export const webDash = {
  screenBg: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#64748B',
  textMuted: '#475569',
  cardBg: '#F8FAFC',
  cardBorder: '#E2E8F0',
  inputBg: '#FFFFFF',
  inputBorder: '#E2E8F0',
  divider: '#E2E8F0',
  rowBorder: '#E2E8F0',
  accent: '#00A383',
  linkBlue: '#2563EB',
} as const;

export const nativeDash = {
  screenBg: '#0B1426',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#718096',
  cardBg: '#1A2744',
  cardBorder: '#2D3748',
  inputBg: '#1A2744',
  inputBorder: '#2D3748',
  divider: '#2D3748',
  rowBorder: '#2D3748',
} as const;
