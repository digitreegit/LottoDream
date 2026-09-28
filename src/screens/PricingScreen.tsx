// ============================================
// Pricing Screen – Free vs Premium comparison + CTAs
// ============================================
import React, { useEffect, useState } from 'react';
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
import {
  startPremiumCheckout,
  openBillingPortal,
  restorePurchases,
  type BillingPlan,
} from '../services/paymentService';
import { iapGetOffers } from '../services/iap';
import type { IapOffer } from '../services/iapTypes';
import {
  PREMIUM_PRICE_DISPLAY,
  PREMIUM_PRICE_PERIOD,
  PREMIUM_YEARLY_PRICE_DISPLAY,
  PREMIUM_YEARLY_PRICE_PERIOD,
  PREMIUM_YEARLY_SAVINGS_PCT,
  PREMIUM_TRIAL_DAYS,
  PREMIUM_CURRENCY,
  SUPPORT_EMAIL,
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

const isWeb = Platform.OS === 'web';

const DEFAULT_PRICES: Record<BillingPlan, { price: string; period: string }> = {
  monthly: { price: PREMIUM_PRICE_DISPLAY, period: PREMIUM_PRICE_PERIOD },
  yearly: { price: PREMIUM_YEARLY_PRICE_DISPLAY, period: PREMIUM_YEARLY_PRICE_PERIOD },
};

export function PricingScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const {
    isPremium,
    isTrialing,
    cancelAtPeriodEnd,
    currentPeriodEnd,
    source,
    plan: activePlan,
    trialEligible,
    refresh,
  } = useEntitlement();
  const [plan, setPlan] = useState<BillingPlan>('yearly');
  const [storeOffers, setStoreOffers] = useState<IapOffer[]>([]);
  const [checkoutStatus, setCheckoutStatus] = useState<
    null | 'loading' | 'redirected' | 'portal' | 'restoring' | 'error'
  >(null);
  const [checkoutMsg, setCheckoutMsg] = useState<string | null>(null);

  const isWide = width >= 720;

  // In the apps, show the store's own localized price and trial eligibility.
  useEffect(() => {
    if (isWeb) return;
    void iapGetOffers().then(setStoreOffers);
  }, [user]);

  const storeOffer = storeOffers.find((o) => o.plan === plan);
  const price = storeOffer?.priceString ?? DEFAULT_PRICES[plan].price;
  const period = DEFAULT_PRICES[plan].period;
  const trialDays = isWeb
    ? trialEligible
      ? PREMIUM_TRIAL_DAYS
      : null
    : storeOffer
      ? storeOffer.trialDays
      : trialEligible
        ? PREMIUM_TRIAL_DAYS
        : null;
  const [priceWhole, priceCents] = price.replace(/^[^0-9]*/, '').split('.');
  const currencySymbol = price.match(/^[^0-9]*/)?.[0] || '$';

  const handleUpgrade = async () => {
    if (!user) {
      navigation?.navigate?.('Auth') ?? navigation?.navigate?.('Login');
      return;
    }
    setCheckoutStatus('loading');
    setCheckoutMsg(null);
    const outcome = await startPremiumCheckout(plan);
    if (outcome.status === 'redirected') {
      setCheckoutStatus('redirected');
      setCheckoutMsg('Redirecting you to secure Stripe checkout…');
    } else if (outcome.status === 'purchased') {
      setCheckoutStatus(null);
      setCheckoutMsg('Welcome to Premium! 🎉');
      void refresh();
    } else if (outcome.status === 'cancelled') {
      setCheckoutStatus(null);
    } else {
      setCheckoutStatus('error');
      setCheckoutMsg(outcome.reason);
    }
  };

  const handleManage = async () => {
    setCheckoutStatus('portal');
    setCheckoutMsg(null);
    const outcome = await openBillingPortal(source);
    if (outcome.status === 'error') {
      setCheckoutStatus('error');
      setCheckoutMsg(outcome.reason);
    } else if (outcome.status !== 'redirected') {
      setCheckoutStatus(null);
    }
  };

  const handleRestore = async () => {
    setCheckoutStatus('restoring');
    setCheckoutMsg(null);
    const outcome = await restorePurchases();
    if (outcome.status === 'purchased') {
      setCheckoutStatus(null);
      setCheckoutMsg('Purchases restored — Premium is active.');
      void refresh();
    } else {
      setCheckoutStatus('error');
      setCheckoutMsg(outcome.status === 'error' ? outcome.reason : 'Restore cancelled.');
    }
  };

  const renewalText = (planPrice: string, planPeriod: string) =>
    trialDays
      ? `${trialDays}-day free trial, then ${planPrice}${planPeriod}`
      : `${planPrice}${planPeriod}`;

  const formatDate = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null;

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
          Try free for {PREMIUM_TRIAL_DAYS} days.{'\n'}Then {PREMIUM_PRICE_DISPLAY}{PREMIUM_PRICE_PERIOD} or{' '}
          {PREMIUM_YEARLY_PRICE_DISPLAY}{PREMIUM_YEARLY_PRICE_PERIOD}.
        </Text>
        <Text style={styles.heroSub}>
          New members get a {PREMIUM_TRIAL_DAYS}-day free trial — every AI mode, today's fortune
          lucky numbers, deeper analytics, and all six lottery games. Cancel anytime.
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
            <Text style={styles.featuredBadgeText}>
              {trialDays ? `${trialDays} days free` : 'Best value'}
            </Text>
          </View>
          <Text style={[styles.planName, styles.planNameOnFeatured]}>Premium</Text>

          {!isPremium ? (
            <View style={styles.planToggle} accessibilityRole="radiogroup">
              {(['monthly', 'yearly'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.planToggleOption, plan === p && styles.planToggleOptionActive]}
                  onPress={() => setPlan(p)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: plan === p }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.planToggleText, plan === p && styles.planToggleTextActive]}>
                    {p === 'monthly' ? 'Monthly' : `Yearly · save ${PREMIUM_YEARLY_SAVINGS_PCT}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <View style={styles.priceRow}>
            <Text style={[styles.priceCurrency, styles.priceOnFeatured]}>{currencySymbol}</Text>
            <Text style={[styles.priceAmount, styles.priceOnFeatured]}>
              {priceCents ? `${priceWhole}.${priceCents}` : priceWhole}
            </Text>
            <Text style={[styles.priceUnit, styles.priceOnFeatured]}>{period}</Text>
          </View>
          <Text style={[styles.planSub, styles.planSubOnFeatured]}>
            {renewalText(price, period)}. Every AI mode, today's fortune, deeper analytics,
            and unlimited saved sets. Cancel anytime.
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
            <View style={{ marginTop: 'auto' }}>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>
                  {isTrialing ? '✓ Free trial active' : '✓ Premium active'}
                </Text>
              </View>
              {currentPeriodEnd ? (
                <Text style={styles.fineprint}>
                  {cancelAtPeriodEnd
                    ? `Cancels on ${formatDate(currentPeriodEnd)}.`
                    : isTrialing
                      ? `Trial ends ${formatDate(currentPeriodEnd)}, then ${DEFAULT_PRICES[activePlan ?? 'monthly'].price}${DEFAULT_PRICES[activePlan ?? 'monthly'].period}.`
                      : `Renews ${formatDate(currentPeriodEnd)}.`}
                </Text>
              ) : null}
              <TouchableOpacity
                style={[styles.planCta, styles.planCtaGhostDark]}
                onPress={handleManage}
                activeOpacity={0.88}
                disabled={checkoutStatus === 'portal'}
              >
                {checkoutStatus === 'portal' ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.planCtaGhostDarkText}>Manage subscription</Text>
                )}
              </TouchableOpacity>
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
                  {!user
                    ? trialDays
                      ? 'Sign in to start free trial'
                      : 'Sign in to subscribe'
                    : trialDays
                      ? `Start ${trialDays}-day free trial`
                      : `Subscribe — ${price}${period}`}
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

          {!isWeb && !isPremium ? (
            <TouchableOpacity
              onPress={handleRestore}
              disabled={checkoutStatus === 'restoring'}
              style={styles.restoreBtn}
              accessibilityRole="button"
            >
              <Text style={styles.restoreText}>
                {checkoutStatus === 'restoring' ? 'Restoring…' : 'Restore purchases'}
              </Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.fineprint}>
            {isWeb
              ? `Secure checkout & billing via Stripe. ${renewalText(price, period)} in ${PREMIUM_CURRENCY}. Your card is charged automatically when the trial ends unless you cancel. Cancel anytime; taxes may apply.`
              : `${renewalText(price, period)}. Payment is charged to your ${Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account at confirmation of purchase${trialDays ? ' (after the free trial ends)' : ''}. The subscription renews automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel in your ${Platform.OS === 'ios' ? 'App Store account settings' : 'Google Play subscriptions'}.`}
          </Text>
          <View style={styles.legalLinks}>
            <Text style={styles.legalLink} onPress={() => navigation?.navigate?.('TermsOfService')}>
              Terms of Use
            </Text>
            <Text style={styles.fineprintDot}>·</Text>
            <Text style={styles.legalLink} onPress={() => navigation?.navigate?.('PrivacyPolicy')}>
              Privacy Policy
            </Text>
          </View>
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
          q={`How does the ${PREMIUM_TRIAL_DAYS}-day free trial work?`}
          a={`New members get full Premium access free for ${PREMIUM_TRIAL_DAYS} days (one trial per account). If you don't cancel before the trial ends, you're charged for the plan you picked — ${PREMIUM_PRICE_DISPLAY}${PREMIUM_PRICE_PERIOD} or ${PREMIUM_YEARLY_PRICE_DISPLAY}${PREMIUM_YEARLY_PRICE_PERIOD}. You can cancel anytime from "Manage subscription".`}
        />
        <Faq
          q="Can I cancel anytime?"
          a="Yes. Open “Manage subscription” to cancel in a couple of clicks. You keep Premium until the end of the current billing period — no further charges after that."
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
          q="How do I get a refund?"
          a={`Web subscriptions are billed via Stripe — if you were charged in error, contact ${SUPPORT_EMAIL} and we'll help. App Store and Google Play purchases are refunded by Apple or Google under their policies. Cancel before your renewal date to avoid the next charge.`}
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
  planCtaGhostDark: {
    marginTop: space.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  planCtaGhostDarkText: {
    color: '#E2E8F0',
    fontSize: 14,
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
  planToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 3,
    marginBottom: space.lg,
  },
  planToggleOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  planToggleOptionActive: {
    backgroundColor: webDash.accent,
  },
  planToggleText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FONT_FAMILY,
  },
  planToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  restoreBtn: {
    marginTop: space.md,
    alignSelf: 'center',
    paddingVertical: 6,
  },
  restoreText: {
    color: '#9CE5D2',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontFamily: FONT_FAMILY,
  },
  legalLinks: {
    flexDirection: 'row',
    gap: 6,
    marginTop: space.sm,
  },
  legalLink: {
    fontSize: 11,
    color: '#CBD5E1',
    textDecorationLine: 'underline',
    fontFamily: FONT_FAMILY,
    ...Platform.select({ web: { cursor: 'pointer' } as any, default: {} }),
  },
  fineprintDot: {
    fontSize: 11,
    color: '#94A3B8',
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
