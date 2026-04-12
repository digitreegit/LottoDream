// ============================================
// Typography & Font Configuration
// ============================================
// Global font settings using Inter
// Font family: Inter (https://fonts.google.com/specimen/Inter)

export const FONTS = {
  family: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  weights: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
};

export const fontFamilyStyle = {
  fontFamily: FONTS.family,
};

export const fontStyles = {
  h1: {
    fontFamily: FONTS.family,
    fontSize: 30,
    fontWeight: '800' as const,
  },
  h2: {
    fontFamily: FONTS.family,
    fontSize: 27,
    fontWeight: '700' as const,
  },
  h3: {
    fontFamily: FONTS.family,
    fontSize: 22,
    fontWeight: '700' as const,
  },
  h4: {
    fontFamily: FONTS.family,
    fontSize: 17,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: FONTS.family,
    fontSize: 14,
    fontWeight: '400' as const,
  },
  bodyLarge: {
    fontFamily: FONTS.family,
    fontSize: 16,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontFamily: FONTS.family,
    fontSize: 13,
    fontWeight: '400' as const,
  },
  button: {
    fontFamily: FONTS.family,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  caption: {
    fontFamily: FONTS.family,
    fontSize: 12,
    fontWeight: '400' as const,
  },
};
