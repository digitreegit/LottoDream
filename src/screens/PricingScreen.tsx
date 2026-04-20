// ============================================
// Pricing Screen – Free vs Premium comparison + CTAs
// ============================================
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../hooks/useAuth';
import { useEntitlement } from '../hooks/useEntitlement';
import { startPremiumCheckout } from '../services/paymentService';
import {
  PREMIUM_PRICE_DISPLAY,
  PREMIUM_CURRENCY,
} from '../config/constants';
import {
  FONT_FAMILY,
  space,
  webDash,
  webDashboardScrollContentWide,
  isWebDashboard,
} from '../theme/webDashboard';
import { LandingStyleFooter } from '../components/LandingStyleFooter';

type Feature = {
  label: string;
  free: boolean | string;
  premium: boolean | string;
  subtitle?: string;
};

const FEATURES: Feature[] = [
  { label: 'Pure Random number generation', free: true, premium: true },
  {
    label: 'Powerball & Mega Millions draw history',
    subtitle: 'Full archive, search & filters',
    free: true,
    premium: true,
  },
  {
    label: 'Live jackpot & next drawing dates',
    free: true,
    premium: true,
  },
  {
    label: 'AI prediction modes',
    subtitle: 'Hot, Cold, Balanced, Anti-Crowd, Lucky Dates',
    free: false,
    premium: '5 modes included',
  },
  {
    label: 'Backtested score for every pick',
    subtitle: 'Pattern quality vs. historical draws',
    free: false,
    premium: true,
  },
  {
    label: 'Lucky Dates personalization',
    subtitle: 'Weight birthdays & anniversaries',
    free: false,
    premium: true,
  },
  {
    label: 'Frequency, hot/cold & pair analysis',
    subtitle: 'Full analysis dashboard',
    free: 'Limited',
    premium: true,
  },
  {
    label: 'Save predictions & number collection',
    free: 'Up to 3',
    premium: 'Unlimited',
  },
  {
    label: 'Cross-device sync (Web, iOS, Android)',
    free: true,
    premium: true,
  },
  {
    label: 'Priority support',
    free: false,
    premium: true,
  },
];

function Check({ on }: { on: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d={on ? 'M5 12l5 5L20 7' : 'M6 6L18 18M6 18L18 6'}
        fill="none"
        stroke={on ? webDash.accent : webDash.textSoft}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Cell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <Text style={styles.cellText}>{value}</Text>;
  }
  return (
    <View style={styles.cellCenter}>
      <Check on={value} />
    </View>
  );
}

interface Props {
  navigation?: any;
}

export function PricingScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { isPremium, refresh } = useEntitlement();
  const [checkoutStatus, setCheckoutStatus] = useState<
    null | 'loading' | 'redirected' | 'mobile-notice' | 'error'
  >(null);
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null);

  const isWide = width >= 720;

  const handleUpgrade = async () => {
    if (!user) {
      navigation?.navigate?.('Auth') ?? navigation?.navigate?.('Login');
      return;
    }
    setCheckoutStatus('loading');
    setCheckoutMsg(null);
    const outcome = await startPremiumCheckout({
      userId: user.id,
      email: user.email ?? undefined,
    });
    if (outcome.status === 'redirected') {
      setCheckoutStatus('redirected');
      setCheckoutMsg(
        'Checkout opened in a new tab. When your payment is complete, your account will unlock automatically.',
      );
      void refresh();
    } else if (outcome.status === 'unsupported') {
      setCheckoutStatus('mobile-notice');
      setCheckoutMsg(outcome.reason);
    } else {
      setCheckoutStatus('error');
      setCheckoutMsg(outcome.reason);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.scrollContent,
        isWebDashboard && webDashboardScrollContentWide,
      ]}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Pricing</Text>
        <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>
          Start free.{'\n'}Unlock every AI mode for {PREMIUM_PRICE_DISPLAY}.
        </Text>
        <Text style={styles.heroSub}>
          One-time purchase. No subscription, no auto-renew. Pay once and keep every
          premium feature across Web, iOS, and Android.
        </Text>
      </View>

      <View style={[styles.plans, isWide && styles.plansWide]}>
        {/* Free plan */}
        <View style={[styles.planCard, isWide && styles.planCardWide]}>
          <Text style={styles.planName}>Free</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceCurrency}>$</Text>
            <Text style={styles.priceAmount}>0</Text>
            <Text style={styles.priceUnit}>/ forever</Text>
          </View>
          <Text style={styles.planSub}>
            Everything you need to explore LottoDream — plus unlimited pure-random
            picks.
          </Text>
          <View style={styles.planBullets}>
            <Bullet text="Pure Random picks for Powerball & Mega Millions" />
            <Bullet text="Full draw history with search" />
            <Bullet text="Live jackpot & next drawing dates" />
            <Bullet text="Save up to 3 favorite sets" />
          </View>
          <View
            style={[styles.planCta, styles.planCtaGhost, !user && styles.planCtaHidden]}
            pointerEvents={user ? 'auto' : 'none'}
          >
            <Text style={styles.planCtaGhostText}>
              {user ? 'You’re on the Free plan' : ''}
            </Text>
          </View>
        </View>

        {/* Premium plan */}
        <View style={[styles.planCard, styles.planCardFeatured, isWide && styles.planCardWide]}>
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>Best value</Text>
          </View>
          <Text style={[styles.planName, styles.planNameOnFeatured]}>Premium</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceCurrency, styles.priceOnFeatured]}>$</Text>
            <Text style={[styles.priceAmount, styles.priceOnFeatured]}>4.99</Text>
            <Text style={[styles.priceUnit, styles.priceOnFeatured]}>
              / one-time
            </Text>
          </View>
          <Text style={[styles.planSub, styles.planSubOnFeatured]}>
            Every AI mode, deeper analytics, and unlimited saved sets — on every
            device you sign into.
          </Text>
          <View style={styles.planBullets}>
            <Bullet
              text="5 AI prediction modes: Hot, Cold, Balanced, Anti-Crowd, Lucky Dates"
              onFeatured
            />
            <Bullet text="Backtest scores for every generated pick" onFeatured />
            <Bullet text="Full analysis dashboard: pairs, overdue, sums" onFeatured />
            <Bullet text="Unlimited saved sets & number collection" onFeatured />
            <Bullet text="Priority support" onFeatured />
          </View>

          {isPremium ? (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>✓ Premium active</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.planCta,
                styles.planCtaPrimary,
                checkoutStatus === 'loading' && styles.planCtaDisabled,
              ]}
              onPress={handleUpgrade}
              activeOpacity={0.88}
              disabled={checkoutStatus === 'loading'}
            >
              {checkoutStatus === 'loading' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.planCtaPrimaryText}>
                  {user ? `Unlock Premium — ${PREMIUM_PRICE_DISPLAY}` : 'Sign in to unlock'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {checkoutMsg ? (
            <Text
              style={[
                styles.checkoutNote,
                checkoutStatus === 'error' && styles.checkoutNoteError,
              ]}
            >
              {checkoutMsg}
            </Text>
          ) : null}

          <Text style={styles.fineprint}>
            {`Secure checkout via Stripe on the web, and via Apple / Google in-app\npurchase on mobile. Prices shown in ${PREMIUM_CURRENCY}; taxes may apply.`}
          </Text>
        </View>
      </View>

      {/* Comparison table */}
      <View style={styles.tableCard}>
        <Text style={styles.tableTitle}>Feature comparison</Text>

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderLabel, styles.tableCol1]}>Feature</Text>
          <Text style={[styles.tableHeaderLabel, styles.tableCol2]}>Free</Text>
          <Text style={[styles.tableHeaderLabel, styles.tableCol3]}>Premium</Text>
        </View>

        {FEATURES.map((f, i) => (
          <View key={i} style={[styles.tableRow, i === FEATURES.length - 1 && styles.tableRowLast]}>
            <View style={styles.tableCol1}>
              <Text style={styles.featureLabel}>{f.label}</Text>
              {f.subtitle ? <Text style={styles.featureSub}>{f.subtitle}</Text> : null}
            </View>
            <View style={styles.tableCol2}>
              <Cell value={f.free} />
            </View>
            <View style={styles.tableCol3}>
              <Cell value={f.premium} />
            </View>
          </View>
        ))}
      </View>

      {/* FAQ */}
      <View style={styles.faq}>
        <Text style={styles.faqTitle}>Questions, answered</Text>
        <Faq
          q="Will I be charged every month?"
          a="No. Premium is a one-time purchase. Once you unlock it, the features stay on your account with no recurring charge."
        />
        <Faq
          q="Is LottoDream an official lottery operator?"
          a="No. We are not affiliated with Powerball®, Mega Millions®, MUSL, or any lottery operator. LottoDream is an entertainment tool. We do not sell tickets and cannot guarantee winnings."
        />
        <Faq
          q="Does Premium improve my chances of winning?"
          a="No pattern, algorithm, or person can change the mathematical odds of a lottery draw. Premium gives you statistical analysis and more ways to choose numbers — not higher probability."
        />
        <Faq
          q="Can I get a refund?"
          a="Web purchases via Stripe follow our refund policy — contact support within 14 days of purchase if the product is defective or if you were charged in error. Purchases made through the App Store or Google Play are governed by the store’s refund policy."
        />
        <Faq
          q="Does one purchase work on all my devices?"
          a="Yes. Sign in with the same account on Web, iOS, or Android and Premium features unlock automatically."
        />
      </View>

      <LandingStyleFooter />
    </ScrollView>
  );
}

function Bullet({ text, onFeatured }: { text: string; onFeatured?: boolean }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletIcon, onFeatured && styles.bulletIconOnFeatured]}>
        <Svg width={10} height={10} viewBox="0 0 24 24">
          <Path
            d="M5 12l5 5L20 7"
            fill="none"
            stroke={onFeatured ? '#FFFFFF' : webDash.accent}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
      <Text style={[styles.bulletText, onFeatured && styles.bulletTextOnFeatured]}>
        {text}
      </Text>
    </View>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <View style={styles.faqItem}>
      <Text style={styles.faqQ}>{q}</Text>
      <Text style={styles.faqA}>{a}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: webDash.screenBg },
  scrollContent: {
    paddingBottom: 60,
    ...Platform.select({
      web: { paddingHorizontal: 0, paddingTop: space.huge },
      default: { padding: space.lg, paddingTop: space.xxl },
    }),
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
    paddingBottom: space.huge,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: webDash.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: space.md,
    fontFamily: FONT_FAMILY,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: webDash.textPrimary,
    textAlign: 'center',
    lineHeight: 40,
    fontFamily: FONT_FAMILY,
    letterSpacing: -0.5,
  },
  heroTitleWide: {
    fontSize: 44,
    lineHeight: 52,
  },
  heroSub: {
    marginTop: space.lg,
    fontSize: 15,
    lineHeight: 24,
    color: webDash.textSecondary,
    textAlign: 'center',
    maxWidth: 560,
    fontFamily: FONT_FAMILY,
  },
  plans: {
    flexDirection: 'column',
    gap: space.lg,
    paddingHorizontal: space.lg,
  },
  plansWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: space.xxl,
    paddingHorizontal: space.xxl,
  },
  planCard: {
    flex: 1,
    backgroundColor: webDash.cardBg,
    borderRadius: webDash.radiusLg,
    borderWidth: 1,
    borderColor: webDash.cardBorder,
    padding: space.xxl,
    ...Platform.select({
      web: { boxShadow: webDash.shadowCard } as object,
      default: {},
    }),
  },
  planCardWide: {
    maxWidth: 480,
  },
  planCardFeatured: {
    borderColor: webDash.accent,
    backgroundColor: '#0B1A2A',
    ...Platform.select({
      web: {
        boxShadow:
          '0 0 0 3px rgba(0, 163, 131, 0.18), 0 20px 40px -12px rgba(15, 23, 42, 0.25)',
      } as object,
      default: {},
    }),
  },
  featuredBadge: {
    position: 'absolute',
    top: -12,
    right: space.xl,
    backgroundColor: webDash.accent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    fontFamily: FONT_FAMILY,
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    color: webDash.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: space.sm,
    fontFamily: FONT_FAMILY,
  },
  planNameOnFeatured: {
    color: '#9CE5D2',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: space.md,
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: '700',
    color: webDash.textPrimary,
    marginBottom: 10,
    fontFamily: FONT_FAMILY,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: webDash.textPrimary,
    lineHeight: 52,
    letterSpacing: -1,
    fontFamily: FONT_FAMILY,
  },
  priceUnit: {
    fontSize: 14,
    color: webDash.textMuted,
    marginBottom: 12,
    marginLeft: 6,
    fontFamily: FONT_FAMILY,
  },
  priceOnFeatured: {
    color: '#FFFFFF',
  },
  planSub: {
    fontSize: 14,
    lineHeight: 22,
    color: webDash.textSecondary,
    marginBottom: space.xl,
    fontFamily: FONT_FAMILY,
  },
  planSubOnFeatured: {
    color: '#CBD5E1',
  },
  planBullets: {
    gap: space.md,
    marginBottom: space.xl,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
  },
  bulletIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: webDash.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bulletIconOnFeatured: {
    backgroundColor: webDash.accent,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: webDash.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  bulletTextOnFeatured: {
    color: '#E2E8F0',
  },
  planCta: {
    marginTop: 'auto',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  planCtaHidden: { opacity: 0 },
  planCtaDisabled: { opacity: 0.6 },
  planCtaGhost: {
    backgroundColor: webDash.cardBgMuted,
    borderWidth: 1,
    borderColor: webDash.cardBorder,
  },
  planCtaGhostText: {
    color: webDash.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  planCtaPrimary: {
    backgroundColor: webDash.accent,
  },
  planCtaPrimaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  activeBadge: {
    marginTop: 'auto',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  activeBadgeText: {
    color: '#A7F3D0',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: FONT_FAMILY,
  },
  checkoutNote: {
    marginTop: space.md,
    fontSize: 13,
    lineHeight: 20,
    color: '#9CE5D2',
    fontFamily: FONT_FAMILY,
  },
  checkoutNoteError: {
    color: '#FCA5A5',
  },
  fineprint: {
    marginTop: space.md,
    fontSize: 11,
    lineHeight: 16,
    color: '#94A3B8',
    fontFamily: FONT_FAMILY,
  },
  tableCard: {
    marginTop: space.huge,
    marginHorizontal: space.lg,
    backgroundColor: webDash.cardBg,
    borderRadius: webDash.radiusLg,
    borderWidth: 1,
    borderColor: webDash.cardBorder,
    padding: space.xxl,
    ...Platform.select({ web: { boxShadow: webDash.shadowCard } as object, default: {} }),
  },
  tableTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: webDash.textPrimary,
    marginBottom: space.lg,
    fontFamily: FONT_FAMILY,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: webDash.cardBorder,
    marginBottom: space.sm,
  },
  tableHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: webDash.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: FONT_FAMILY,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: webDash.divider,
    minHeight: 56,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCol1: { flex: 2.2, paddingRight: space.md },
  tableCol2: { flex: 0.9, alignItems: 'center' },
  tableCol3: { flex: 0.9, alignItems: 'center' },
  featureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: webDash.textPrimary,
    fontFamily: FONT_FAMILY,
  },
  featureSub: {
    fontSize: 12,
    color: webDash.textMuted,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },
  cellText: {
    fontSize: 13,
    fontWeight: '600',
    color: webDash.textSecondary,
    textAlign: 'center',
    fontFamily: FONT_FAMILY,
  },
  cellCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faq: {
    marginTop: space.huge,
    marginHorizontal: space.lg,
    gap: space.lg,
  },
  faqTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: webDash.textPrimary,
    marginBottom: space.sm,
    fontFamily: FONT_FAMILY,
  },
  faqItem: {
    backgroundColor: webDash.cardBgMuted,
    borderRadius: webDash.radiusMd,
    borderWidth: 1,
    borderColor: webDash.cardBorder,
    padding: space.lg,
  },
  faqQ: {
    fontSize: 15,
    fontWeight: '700',
    color: webDash.textPrimary,
    marginBottom: 6,
    fontFamily: FONT_FAMILY,
  },
  faqA: {
    fontSize: 14,
    lineHeight: 22,
    color: webDash.textSecondary,
    fontFamily: FONT_FAMILY,
  },
});
