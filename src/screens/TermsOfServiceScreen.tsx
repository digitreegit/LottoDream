// ============================================
// Terms of Service
// ============================================
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  LEGAL_ENTITY,
  LEGAL_LAST_UPDATED,
  PREMIUM_PRICE_DISPLAY,
  SUPPORT_EMAIL,
} from '../config/constants';

const BACK_CHEVRON_COLOR = '#00A383';

function BackChevron({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M14 6L8 12L14 18"
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TermsOfServiceScreen({ navigation }: any) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <BackChevron color={BACK_CHEVRON_COLOR} />
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
      >
        <Text style={styles.title}>Terms of Service</Text>
        <Text style={styles.updated}>Last updated: {LEGAL_LAST_UPDATED}</Text>

        <Text style={styles.p}>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of{' '}
          {LEGAL_ENTITY} (the &quot;Service&quot;), including our website and mobile
          applications. By creating an account or using the Service you agree to these
          Terms. If you do not agree, do not use the Service.
        </Text>

        <Text style={styles.h2}>1. What the Service is — and is not</Text>
        <Text style={styles.p}>
          {LEGAL_ENTITY} is an informational and entertainment product. It analyses
          historical draw data for the US Powerball and Mega Millions lotteries and
          produces statistical summaries and machine-generated number suggestions. We are{' '}
          <Text style={styles.strong}>not</Text> a lottery operator, ticket retailer,
          broker, or agent. We do not sell, deliver, or redeem lottery tickets. We are
          not affiliated with, endorsed by, or sponsored by the Multi-State Lottery
          Association, any state lottery, Powerball, or Mega Millions.
        </Text>

        <Text style={styles.h2}>2. No guarantee of winnings</Text>
        <Text style={styles.p}>
          Lottery outcomes are random. No statistical model, &quot;hot/cold&quot; analysis,
          pattern, AI, or combination of these can predict a winning ticket or improve
          the objective probability of winning beyond the published odds of the game.
          Any numbers, predictions, scores, confidence levels, or modes (including
          &quot;Hot&quot;, &quot;Cold&quot;, &quot;Balanced&quot;, &quot;Anti-Crowd&quot;, &quot;Lucky Dates&quot;, and
          &quot;Pure Random&quot;) are provided for entertainment only. You play, and lose,
          at your own risk.
        </Text>

        <Text style={styles.h2}>3. Eligibility & responsible play</Text>
        <Text style={styles.p}>
          You must be at least 18 years old, or the legal age to participate in
          lottery games in your jurisdiction, whichever is higher. You are solely
          responsible for complying with all laws and regulations that apply where
          you live, including any laws that restrict or prohibit lottery participation.
          If gambling is illegal for you, do not use the Service to inform ticket
          purchases. If play is becoming a problem, help is available — for example
          in the US via 1-800-GAMBLER.
        </Text>

        <Text style={styles.h2}>4. Your account</Text>
        <Text style={styles.p}>
          You agree to provide accurate information, keep your credentials confidential,
          and be responsible for all activity under your account. Notify us promptly at{' '}
          {SUPPORT_EMAIL} if you suspect unauthorized access. We may suspend or
          terminate accounts that violate these Terms or that we reasonably believe have
          been compromised or used fraudulently.
        </Text>

        <Text style={styles.h2}>5. Premium unlock & payments</Text>
        <Text style={styles.p}>
          {LEGAL_ENTITY} offers a free tier (Pure Random and basic features) and a
          one-time Premium unlock ({PREMIUM_PRICE_DISPLAY} USD, or the equivalent local
          price shown at checkout) that enables additional prediction modes and
          personalization features. The Premium unlock is a one-time, non-recurring
          purchase; it is not a subscription. Prices, taxes, and available payment
          methods may vary by region and may change with notice.
        </Text>
        <Text style={styles.p}>
          Purchases on the web are processed by Stripe, Inc. In-app purchases on iOS
          and Android, when offered, are processed by Apple and Google respectively
          and are governed by their payment terms. You authorize the applicable
          processor to charge your selected payment method for the amount displayed at
          checkout.
        </Text>

        <Text style={styles.h2}>6. Refunds</Text>
        <Text style={styles.p}>
          Because Premium features are digital content delivered immediately on
          purchase, sales are generally final. Refunds for app-store purchases are
          handled exclusively by Apple or Google per their refund policies. For web
          purchases, you may request a refund within 14 days of purchase by emailing{' '}
          {SUPPORT_EMAIL}; we will review your request in good faith. Nothing in this
          section limits any non-waivable consumer rights you have under the laws of
          your jurisdiction.
        </Text>

        <Text style={styles.h2}>7. Acceptable use</Text>
        <Text style={styles.p}>
          You agree not to: (a) reverse engineer, scrape, or bulk-download the Service
          except as allowed by law; (b) interfere with or attempt to breach the
          security or integrity of the Service; (c) use the Service in violation of
          applicable law, including gambling, consumer-protection, or export laws;
          (d) share a paid account with other individuals; or (e) use automated
          systems to access the Service other than as we explicitly permit.
        </Text>

        <Text style={styles.h2}>8. Intellectual property</Text>
        <Text style={styles.p}>
          The Service, including its branding, software, models, UI, and content, is
          owned by {LEGAL_ENTITY} or its licensors and is protected by applicable
          intellectual-property laws. We grant you a limited, revocable, non-exclusive,
          non-transferable license to use the Service for your personal, non-commercial
          use. Third-party trademarks (including Powerball® and Mega Millions®) are the
          property of their respective owners.
        </Text>

        <Text style={styles.h2}>9. Disclaimer of warranties</Text>
        <Text style={styles.p}>
          The Service, including all predictions, statistics, jackpots, draw times,
          and historical data, is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without
          warranties of any kind, express or implied, including merchantability,
          fitness for a particular purpose, accuracy, or non-infringement. Jackpot
          amounts and draw schedules are sourced from public data and may be delayed
          or incorrect. Always confirm official results with the state lottery before
          claiming a prize.
        </Text>

        <Text style={styles.h2}>10. Limitation of liability</Text>
        <Text style={styles.p}>
          To the maximum extent permitted by law, {LEGAL_ENTITY}, its affiliates,
          officers, employees, and licensors are not liable for any indirect,
          incidental, special, consequential, exemplary, or punitive damages, or for
          any loss of profits, revenue, data, goodwill, or for lottery losses or
          foregone winnings, arising out of or relating to your use of the Service —
          even if we were advised of the possibility. Our aggregate liability for any
          claim is limited to the greater of (a) the total amount you paid us in the
          twelve months before the event giving rise to the claim, or (b) US $20.
        </Text>

        <Text style={styles.h2}>11. Indemnification</Text>
        <Text style={styles.p}>
          You agree to defend, indemnify, and hold harmless {LEGAL_ENTITY} and its
          affiliates from any claims, damages, liabilities, and expenses (including
          reasonable attorneys&apos; fees) arising from your use of the Service or
          violation of these Terms.
        </Text>

        <Text style={styles.h2}>12. Termination</Text>
        <Text style={styles.p}>
          You may stop using the Service at any time and delete your account from the
          My Page screen. We may suspend or terminate your access if you violate these
          Terms, misuse the Service, or if we discontinue the Service. Sections that
          by their nature should survive termination (e.g., IP, disclaimers, liability,
          indemnity, governing law) will survive.
        </Text>

        <Text style={styles.h2}>13. Governing law & disputes</Text>
        <Text style={styles.p}>
          These Terms are governed by the laws of the State of Delaware, United States,
          without regard to conflict-of-law rules. Any dispute will be resolved
          exclusively in the state or federal courts located in Delaware, and you
          consent to personal jurisdiction there. Nothing in this section deprives
          consumers of mandatory protections under the law of their place of residence.
        </Text>

        <Text style={styles.h2}>14. Changes to these Terms</Text>
        <Text style={styles.p}>
          We may update these Terms from time to time. When we do, we will update the
          &quot;Last updated&quot; date and, for material changes, provide a more
          prominent notice. Your continued use of the Service after the effective date
          constitutes acceptance of the updated Terms.
        </Text>

        <Text style={styles.h2}>15. Contact</Text>
        <Text style={styles.p}>
          Questions about these Terms? Email us at {SUPPORT_EMAIL}.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start' as any,
  },
  backLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00A383',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center' as any,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  updated: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 20,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  h2: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginTop: 18,
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  p: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 10,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  strong: {
    fontWeight: '700',
    color: '#111827',
  },
});
