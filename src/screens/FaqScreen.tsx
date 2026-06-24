// ============================================
// FAQ Screen — categorized help
// ============================================
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { LandingStyleFooter } from '../components/LandingStyleFooter';
import { isWebDashboard, webDash, nativeDash, webDashboardScrollContent } from '../theme/webDashboard';
import {
  SUPPORT_EMAIL,
  PREMIUM_PRICE_DISPLAY,
  PREMIUM_PRICE_PERIOD,
  PREMIUM_TRIAL_DAYS,
} from '../config/constants';

const W = isWebDashboard;
const C = W ? webDash : nativeDash;
const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

interface QA {
  q: string;
  a: string;
}
interface Category {
  title: string;
  icon: string;
  items: QA[];
}

const CATEGORIES: Category[] = [
  {
    title: 'Subscription & Billing',
    icon: '💳',
    items: [
      {
        q: `How does the ${PREMIUM_TRIAL_DAYS}-day free trial work?`,
        a: `You get full Premium access free for ${PREMIUM_TRIAL_DAYS} days. If you don't cancel before the trial ends, your card is charged ${PREMIUM_PRICE_DISPLAY}${PREMIUM_PRICE_PERIOD}. Manage or cancel anytime from Pricing → Manage subscription.`,
      },
      {
        q: 'How do I cancel?',
        a: 'Open Pricing → Manage subscription to reach the secure Stripe billing portal. Cancel in a couple of clicks; you keep Premium until the end of the current period.',
      },
      {
        q: 'How do I get a refund?',
        a: `Subscriptions are billed monthly. If you were charged in error, email ${SUPPORT_EMAIL} and we'll help. Cancel before your renewal date to avoid the next charge.`,
      },
      {
        q: 'What payment methods are accepted?',
        a: 'All major credit and debit cards via Stripe, our secure payment processor. We never see or store your full card number.',
      },
    ],
  },
  {
    title: 'Number Selection',
    icon: '🎯',
    items: [
      {
        q: 'What do the prediction modes mean?',
        a: 'Hot favors frequently drawn numbers, Cold favors overdue numbers, Balanced mixes ranges, Anti-Crowd avoids commonly picked patterns, and Lucky Dates builds from your special dates. Pure Random is free for everyone.',
      },
      {
        q: 'What is the "Score" on each pick?',
        a: 'Score (0–100) is a statistical quality measure of how closely a combination matches historical draw patterns. It does NOT represent a higher chance of winning — all combinations share the same odds.',
      },
      {
        q: 'Can I pick my own numbers?',
        a: 'Yes. On the Predict screen open "Pick your own", tap numbers on the board, and save them to My Numbers.',
      },
    ],
  },
  {
    title: 'Fortune & Privacy',
    icon: '🔒',
    items: [
      {
        q: 'Do you store my birthdate?',
        a: 'No. Your birthdate is used only on your device to generate the daily fortune and lucky numbers. It is never saved to our servers or your account, and is forgotten when you leave the page.',
      },
      {
        q: 'Does the fortune change?',
        a: "Yes — the reading is deterministic for a given day, so it's stable throughout today and refreshes tomorrow.",
      },
    ],
  },
  {
    title: 'Games & Data',
    icon: '🎰',
    items: [
      {
        q: 'Which games are supported?',
        a: 'Powerball, Mega Millions, and Cash4Life (national), plus New York favorites Take 5, NY Lotto, and Pick 10. Games marked BETA are newly added while we validate their data feeds.',
      },
      {
        q: 'Where does the draw data come from?',
        a: 'Official results via the New York State Open Data (Socrata) API, refreshed regularly. We are not affiliated with any lottery operator.',
      },
    ],
  },
  {
    title: 'Account',
    icon: '👤',
    items: [
      {
        q: 'How do I create an account?',
        a: 'Sign up with your email and a password, or continue with Google. Your saved numbers sync to your account.',
      },
      {
        q: 'I forgot my password.',
        a: 'Use "Forgot password" on the sign-in screen to receive a secure reset link by email.',
      },
    ],
  },
];

function Item({ qa }: { qa: QA }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity style={styles.item} onPress={() => setOpen((o) => !o)} activeOpacity={0.8}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemQ}>{qa.q}</Text>
        <Text style={styles.itemChevron}>{open ? '−' : '+'}</Text>
      </View>
      {open && <Text style={styles.itemA}>{qa.a}</Text>}
    </TouchableOpacity>
  );
}

export function FaqScreen() {
  return (
    <View style={styles.pageRoot}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, W && webDashboardScrollContent]}
      >
        <View style={styles.pageIntro}>
          <Text style={styles.eyebrow}>Help Center</Text>
          <Text style={styles.title}>Frequently asked questions</Text>
          <Text style={styles.subtitle}>
            Everything about subscriptions, number selection, fortune, games, and your account.
          </Text>
        </View>

        {CATEGORIES.map((cat) => (
          <View key={cat.title} style={styles.category}>
            <Text style={styles.categoryTitle}>
              {cat.icon}  {cat.title}
            </Text>
            <View style={styles.card}>
              {cat.items.map((qa, i) => (
                <View key={qa.q}>
                  {i > 0 && <View style={styles.divider} />}
                  <Item qa={qa} />
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <Text style={styles.contactBody}>
            Reach our team and we'll get back to you as soon as we can.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            activeOpacity={0.85}
          >
            <Text style={styles.contactEmail}>{SUPPORT_EMAIL}</Text>
          </TouchableOpacity>
        </View>

        <LandingStyleFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageRoot: { flex: 1, backgroundColor: W ? webDash.screenBg : C.screenBg },
  scroll: { flex: 1 },
  content: {
    paddingBottom: 40,
    ...Platform.select({ web: { paddingHorizontal: 0, paddingTop: 8 }, default: { padding: 16 } }),
  },
  pageIntro: { marginBottom: 12, maxWidth: 720, alignSelf: 'center', width: '100%' },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: W ? webDash.accent : '#63B3ED',
    textTransform: 'uppercase',
    marginBottom: 8,
    textAlign: W ? 'left' : 'center',
    fontFamily: FONT,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: C.textPrimary,
    textAlign: W ? 'left' : 'center',
    marginBottom: 10,
    letterSpacing: -0.4,
    fontFamily: FONT,
  },
  subtitle: {
    fontSize: 14,
    color: W ? webDash.textSecondary : '#A0AEC0',
    textAlign: W ? 'left' : 'center',
    marginBottom: 8,
    lineHeight: 22,
    fontFamily: FONT,
  },
  category: { marginBottom: 18 },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 8,
    fontFamily: FONT,
  },
  card: {
    backgroundColor: W ? webDash.cardBg : C.cardBg,
    borderRadius: W ? webDash.radiusLg : 16,
    paddingHorizontal: 16,
    ...(W ? { borderWidth: 1, borderColor: webDash.cardBorder, boxShadow: webDash.shadowCard } : {}),
  },
  divider: { height: 1, backgroundColor: W ? webDash.divider : '#2D3748' },
  item: { paddingVertical: 14 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  itemQ: { flex: 1, fontSize: 14, fontWeight: '700', color: C.textPrimary, fontFamily: FONT },
  itemChevron: {
    fontSize: 18,
    fontWeight: '700',
    color: W ? webDash.accent : '#63B3ED',
    width: 20,
    textAlign: 'center',
  },
  itemA: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: W ? webDash.textSecondary : '#A0AEC0',
    fontFamily: FONT,
  },
  contactCard: {
    backgroundColor: W ? webDash.cardBgMuted : C.cardBg,
    borderRadius: W ? webDash.radiusLg : 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
    ...(W ? { borderWidth: 1, borderColor: webDash.cardBorder } : {}),
  },
  contactTitle: { fontSize: 16, fontWeight: '800', color: C.textPrimary, marginBottom: 6, fontFamily: FONT },
  contactBody: {
    fontSize: 13,
    color: W ? webDash.textSecondary : '#A0AEC0',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: FONT,
  },
  contactEmail: {
    fontSize: 15,
    fontWeight: '700',
    color: W ? webDash.accent : '#63B3ED',
    fontFamily: FONT,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : {}),
  },
});
