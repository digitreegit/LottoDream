// ============================================
// Privacy Policy
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
        <Text style={styles.updated}>Last updated: April 15, 2026</Text>

        <Text style={styles.p}>
          This Privacy Policy describes how LottoDream (&quot;we&quot;, &quot;us&quot;) collects, uses, and
          shares information when you use our website and mobile applications (the &quot;Service&quot;).
        </Text>

        <Text style={styles.h2}>1. Information we collect</Text>
        <Text style={styles.p}>
          We may collect information you provide directly (such as email address when you create an
          account), authentication data when you sign in (including through third-party providers like
          Google), and technical data such as device type, operating system, and approximate location
          derived from IP address where applicable.
        </Text>

        <Text style={styles.h2}>2. How we use information</Text>
        <Text style={styles.p}>
          We use information to provide and improve the Service, authenticate users, communicate with
          you about your account or security, analyze usage in aggregate, and comply with legal
          obligations.
        </Text>

        <Text style={styles.h2}>3. Sharing</Text>
        <Text style={styles.p}>
          We may share information with service providers who assist us (for example, hosting or
          authentication infrastructure), when required by law, or to protect rights and safety. We do
          not sell your personal information.
        </Text>

        <Text style={styles.h2}>4. Cookies and similar technologies</Text>
        <Text style={styles.p}>
          On the web, we may use cookies or local storage as needed for sign-in sessions and basic
          preferences. You can control cookies through your browser settings where supported.
        </Text>

        <Text style={styles.h2}>5. Data retention</Text>
        <Text style={styles.p}>
          We retain information for as long as necessary to provide the Service and for legitimate
          business purposes, unless a longer period is required by law.
        </Text>

        <Text style={styles.h2}>6. Security</Text>
        <Text style={styles.p}>
          We implement reasonable safeguards designed to protect your information. No method of
          transmission or storage is completely secure.
        </Text>

        <Text style={styles.h2}>7. Your choices</Text>
        <Text style={styles.p}>
          Depending on your location, you may have rights to access, correct, or delete certain personal
          information. Contact us to make a request; we may need to verify your identity.
        </Text>

        <Text style={styles.h2}>8. Children</Text>
        <Text style={styles.p}>
          The Service is not directed to children under the age of majority in their jurisdiction. We do
          not knowingly collect personal information from children.
        </Text>

        <Text style={styles.h2}>9. International users</Text>
        <Text style={styles.p}>
          If you use the Service from outside the country where we operate, your information may be
          processed in countries with different data protection laws.
        </Text>

        <Text style={styles.h2}>10. Changes</Text>
        <Text style={styles.p}>
          We may update this policy from time to time. We will post the updated policy and revise the
          &quot;Last updated&quot; date.
        </Text>

        <Text style={styles.h2}>11. Contact</Text>
        <Text style={styles.p}>
          For privacy-related questions, contact us using the support channel described in the app or on
          our website.
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
