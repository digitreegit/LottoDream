// ============================================
// Privacy Policy
// ============================================
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LEGAL_ENTITY, LEGAL_LAST_UPDATED, SUPPORT_EMAIL } from '../config/constants';

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

export function PrivacyPolicyScreen({ navigation }: any) {
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
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.updated}>Last updated: {LEGAL_LAST_UPDATED}</Text>

        <Text style={styles.p}>
          This Privacy Policy explains how {LEGAL_ENTITY} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
          collects, uses, shares, and protects information when you use our website and
          mobile applications (the &quot;Service&quot;). By using the Service, you agree to
          this Policy. If you do not agree, please do not use the Service.
        </Text>

        <Text style={styles.h2}>1. Information we collect</Text>
        <Text style={styles.p}>
          <Text style={styles.strong}>Account data.</Text> When you create an account we
          collect your email address, username, and, if you use Google Sign-In, the
          basic profile information Google returns (name, email, avatar URL).
        </Text>
        <Text style={styles.p}>
          <Text style={styles.strong}>App activity.</Text> We store information you create
          in the app, including saved number sets, prediction history, selected game
          (Powerball / Mega Millions), and preferences.
        </Text>
        <Text style={styles.p}>
          <Text style={styles.strong}>Payment data.</Text> When you purchase the Premium
          unlock, the card number and CVC are entered directly into our payment
          processor (Stripe on web; Apple / Google for in-app purchases) and are never
          sent to our servers. We receive a transaction ID, the last four digits of
          your card, the amount, and the status of the payment for accounting and
          receipt purposes.
        </Text>
        <Text style={styles.p}>
          <Text style={styles.strong}>Device & usage data.</Text> IP address, device and
          OS type, app version, language, crash logs, and basic analytics events
          (screens viewed, features used). We do not collect precise GPS location.
        </Text>

        <Text style={styles.h2}>2. How we use information</Text>
        <Text style={styles.p}>
          We use information to (a) operate and secure the Service and your account;
          (b) deliver Premium entitlements and related receipts; (c) detect fraud,
          abuse, and policy violations; (d) improve the Service, including training
          and evaluating our statistical prediction models on aggregated, non-identifying
          data; (e) communicate about transactions, security, and legally required
          notices; and (f) comply with legal obligations.
        </Text>
        <Text style={styles.p}>
          We do <Text style={styles.strong}>not</Text> use your personal information to
          target behavioral advertising, and we do not sell it.
        </Text>

        <Text style={styles.h2}>3. Legal bases (EEA / UK users)</Text>
        <Text style={styles.p}>
          Where GDPR / UK GDPR apply, we rely on: performance of a contract (to provide
          the Service you signed up for), our legitimate interests (security, product
          improvement, fraud prevention), consent (where required, e.g., optional
          analytics), and legal obligations.
        </Text>

        <Text style={styles.h2}>4. How we share information</Text>
        <Text style={styles.p}>
          We share information only with service providers acting on our behalf, and
          only for the purposes described above:
        </Text>
        <Text style={styles.p}>
          • <Text style={styles.strong}>Supabase / hosting providers</Text> — database,
          authentication, and infrastructure.{'\n'}
          • <Text style={styles.strong}>Stripe, Inc.</Text> — web payments and receipts.
          {'\n'}
          • <Text style={styles.strong}>Apple / Google</Text> — in-app purchases (when
          offered).{'\n'}
          • <Text style={styles.strong}>NY Open Data / state lottery sources</Text> — we
          consume public draw data; we do not share your account data with them.{'\n'}
          • <Text style={styles.strong}>Law-enforcement or regulators</Text> — if we are
          legally required, or to protect rights and safety.
        </Text>

        <Text style={styles.h2}>5. Cookies & similar technologies (web)</Text>
        <Text style={styles.p}>
          On the web we use strictly-necessary cookies / local storage to keep you
          signed in and remember preferences. We do not use third-party advertising
          cookies. You can clear cookies via your browser at any time.
        </Text>

        <Text style={styles.h2}>6. Data retention</Text>
        <Text style={styles.p}>
          We retain account and app-activity data while your account is active. If
          you delete your account, we remove personal identifiers within 30 days,
          except where we must retain certain records for tax, accounting, or
          fraud-prevention reasons (typically 7 years for payment records). Aggregated
          and de-identified data may be kept indefinitely.
        </Text>

        <Text style={styles.h2}>7. Security</Text>
        <Text style={styles.p}>
          We use TLS in transit, managed database encryption at rest, row-level
          security for per-user data isolation, and hashed / tokenized credentials.
          No system is 100% secure; we encourage strong unique passwords and the use
          of your platform&apos;s biometric or OS-level protections.
        </Text>

        <Text style={styles.h2}>8. Your rights & choices</Text>
        <Text style={styles.p}>
          Depending on where you live, you may have rights to access, correct, delete,
          port, or restrict processing of your personal data, and to object to certain
          processing. You can delete your account from the My Page screen, or email{' '}
          {SUPPORT_EMAIL}. We may ask you to verify your identity before responding.
          California residents have additional rights under the CCPA / CPRA
          (right to know, delete, correct, and opt-out of &quot;sharing&quot; — we do
          not &quot;sell&quot; or &quot;share&quot; personal information as defined by
          that law).
        </Text>

        <Text style={styles.h2}>9. Children</Text>
        <Text style={styles.p}>
          The Service is intended for adults aged 18+ (or the legal gambling age in
          your jurisdiction, if higher). We do not knowingly collect personal
          information from children under 13, and we do not direct the Service to
          them. If you believe a child provided us personal information, contact{' '}
          {SUPPORT_EMAIL} and we will delete it.
        </Text>

        <Text style={styles.h2}>10. International transfers</Text>
        <Text style={styles.p}>
          We operate from, and store data in, the United States. If you access the
          Service from outside the US, your information will be transferred to and
          processed in the US under appropriate safeguards (e.g., Standard Contractual
          Clauses where required).
        </Text>

        <Text style={styles.h2}>11. Changes</Text>
        <Text style={styles.p}>
          We may update this Policy from time to time. When we do, we update the
          &quot;Last updated&quot; date and, for material changes, provide a more
          prominent in-app notice. Continued use after the effective date constitutes
          acceptance.
        </Text>

        <Text style={styles.h2}>12. Contact</Text>
        <Text style={styles.p}>
          Questions, requests, or complaints? Email {SUPPORT_EMAIL}.
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
