// ============================================
// Terms of Service
// ============================================
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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
        <Text style={styles.updated}>Last updated: April 15, 2026</Text>

        <Text style={styles.p}>
          These Terms of Service (&quot;Terms&quot;) govern your use of LottoDream (the
          &quot;Service&quot;), including our website and mobile applications. By accessing or using
          the Service, you agree to these Terms.
        </Text>

        <Text style={styles.h2}>1. The Service</Text>
        <Text style={styles.p}>
          LottoDream provides informational tools and features related to lottery games. The Service is
          for entertainment and personal use only. We do not operate official lottery games, sell
          tickets, or guarantee any outcome. Number suggestions, statistics, or predictions are not
          promises of results.
        </Text>

        <Text style={styles.h2}>2. Eligibility</Text>
        <Text style={styles.p}>
          You must be at least the age of majority in your jurisdiction to use the Service. You are
          responsible for complying with all laws that apply to you, including rules about online
          services and gambling or lottery participation where you live.
        </Text>

        <Text style={styles.h2}>3. Accounts</Text>
        <Text style={styles.p}>
          You agree to provide accurate account information and to keep your credentials secure. You
          are responsible for activity under your account. Notify us promptly if you suspect
          unauthorized access.
        </Text>

        <Text style={styles.h2}>4. Acceptable use</Text>
        <Text style={styles.p}>
          You may not misuse the Service, attempt to interfere with its operation, scrape or reverse
          engineer it except as allowed by law, or use it for unlawful purposes. We may suspend or
          terminate access for violations.
        </Text>

        <Text style={styles.h2}>5. Intellectual property</Text>
        <Text style={styles.p}>
          The Service, including branding, software, and content we provide, is owned by LottoDream
          or its licensors. These Terms do not grant you ownership of any intellectual property rights.
        </Text>

        <Text style={styles.h2}>6. Disclaimers</Text>
        <Text style={styles.p}>
          The Service is provided &quot;as is&quot; without warranties of any kind, to the fullest extent
          permitted by law. We do not warrant uninterrupted or error-free operation.
        </Text>

        <Text style={styles.h2}>7. Limitation of liability</Text>
        <Text style={styles.p}>
          To the maximum extent permitted by law, LottoDream and its affiliates will not be liable for
          indirect, incidental, special, consequential, or punitive damages, or any loss of profits or
          data, arising from your use of the Service.
        </Text>

        <Text style={styles.h2}>8. Changes</Text>
        <Text style={styles.p}>
          We may update these Terms from time to time. We will post the revised Terms and update the
          &quot;Last updated&quot; date. Continued use after changes constitutes acceptance of the updated
          Terms.
        </Text>

        <Text style={styles.h2}>9. Contact</Text>
        <Text style={styles.p}>
          For questions about these Terms, contact us using the support channel described in the app or
          on our website.
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
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
