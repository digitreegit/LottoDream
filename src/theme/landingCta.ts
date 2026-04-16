/**
 * Primary CTA styles — keep in sync with WebLandingPage `ctaPrimary` / `ctaPrimaryText`.
 */
export const landingCtaPrimaryButton = {
  backgroundColor: '#00A383',
  borderRadius: 36,
  minHeight: 48,
  paddingVertical: 10,
  paddingHorizontal: 36,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

export const landingCtaPrimaryButtonDisabled = {
  backgroundColor: '#D1D5DB',
};

export const landingCtaPrimaryButtonText = {
  color: '#FFFFFF',
  fontSize: 16,
  lineHeight: 22,
  fontWeight: '500' as const,
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};
