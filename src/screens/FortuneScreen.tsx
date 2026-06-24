// ============================================
// Fortune Screen — Today's Fortune + lucky numbers
// ============================================
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LandingStyleFooter } from '../components/LandingStyleFooter';
import { LottoRow } from '../components/LottoBall';
import { OddsVisualizer } from '../components/OddsVisualizer';
import { AuthNoticeBanner, type AuthNoticeVariant } from '../components/AuthNoticeBanner';
import { useGame, GameSelector } from '../hooks/useGame';
import { useDraws } from '../hooks/useDraws';
import { useAuth } from '../hooks/useAuth';
import { useEntitlement } from '../hooks/useEntitlement';
import {
  computeFortune,
  generateFortuneNumbers,
  isValidBirthdate,
  type DailyFortune,
} from '../services/fortuneService';
import { savePredictionSet } from '../services/ticketService';
import type { PredictionSet } from '../types';
import { isWebDashboard, webDash, nativeDash, webDashboardScrollContent } from '../theme/webDashboard';
import {
  PREMIUM_PRICE_DISPLAY,
  PREMIUM_PRICE_PERIOD,
  PREMIUM_TRIAL_DAYS,
} from '../config/constants';

const W = isWebDashboard;
const C = W ? webDash : nativeDash;
const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

type Notice = { variant: AuthNoticeVariant; title: string; message: string };

export function FortuneScreen({ navigation }: any) {
  const { game, config } = useGame();
  const { user } = useAuth();
  const { isPremium } = useEntitlement();
  const { draws } = useDraws(game);

  const [birthdate, setBirthdate] = useState('');
  const [fortune, setFortune] = useState<DailyFortune | null>(null);
  const [luckyPick, setLuckyPick] = useState<PredictionSet | null>(null);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const goToPricing = useCallback(() => {
    try {
      navigation?.navigate?.('Pricing');
    } catch {
      // ignore
    }
  }, [navigation]);

  const handleReveal = useCallback(() => {
    if (!isValidBirthdate(birthdate.trim())) {
      setNotice({
        variant: 'warning',
        title: 'Check your date',
        message: 'Enter your birthdate as YYYY-MM-DD (e.g. 1990-03-15).',
      });
      return;
    }
    setNotice(null);
    setWorking(true);
    setTimeout(() => {
      const f = computeFortune(birthdate.trim());
      setFortune(f);
      setLuckyPick(null);
      setWorking(false);
    }, 120);
  }, [birthdate]);

  const handleLuckyNumbers = useCallback(() => {
    if (!fortune) return;
    if (!isPremium) {
      goToPricing();
      return;
    }
    if (draws.length === 0) {
      setNotice({
        variant: 'warning',
        title: 'Loading data',
        message: 'Draw history is still loading. Please try again in a moment.',
      });
      return;
    }
    setWorking(true);
    setTimeout(() => {
      try {
        const pick = generateFortuneNumbers(draws, birthdate.trim(), fortune, game);
        setLuckyPick(pick);
      } catch (e: any) {
        setNotice({ variant: 'error', title: 'Could not generate', message: e?.message || 'Try again.' });
      } finally {
        setWorking(false);
      }
    }, 120);
  }, [fortune, isPremium, draws, birthdate, game, goToPricing]);

  const handleSave = useCallback(async () => {
    if (!luckyPick) return;
    if (!user) {
      setNotice({ variant: 'warning', title: 'Sign in needed', message: 'Sign in to save your numbers.' });
      return;
    }
    const { error } = await savePredictionSet(luckyPick);
    setNotice(
      error
        ? { variant: 'error', title: 'Save failed', message: error }
        : { variant: 'success', title: 'Saved', message: 'Your lucky numbers were saved.' }
    );
  }, [luckyPick, user]);

  return (
    <View style={styles.pageRoot}>
      {notice && (
        <View style={styles.noticeStrip}>
          <AuthNoticeBanner
            variant={notice.variant}
            title={notice.title}
            message={notice.message}
            onDismiss={() => setNotice(null)}
          />
        </View>
      )}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, W && webDashboardScrollContent]}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.pageIntro}>
          <Text style={styles.eyebrow}>Today's Fortune</Text>
          <Text style={styles.title}>Your daily luck reading</Text>
          <Text style={styles.subtitle}>
            Enter your birthdate to reveal today's fortune and a set of lucky numbers tuned to it.
          </Text>
        </View>

        {/* Birthdate input */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your birthdate</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={W ? '#94A3B8' : '#4A5568'}
              value={birthdate}
              onChangeText={setBirthdate}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
            <TouchableOpacity style={styles.revealBtn} onPress={handleReveal} disabled={working}>
              {working && !fortune ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.revealBtnText}>Reveal</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.privacyNote}>
            🔒 We never store your birthdate. It is used only on this device to generate today's
            reading and is forgotten when you leave.
          </Text>
        </View>

        {fortune && (
          <>
            {/* Overall card */}
            <View style={[styles.card, styles.overallCard]}>
              <View style={styles.overallTop}>
                <View style={styles.overallScoreWrap}>
                  <Text style={styles.overallScore}>{fortune.overall}</Text>
                  <Text style={styles.overallScoreUnit}>/100</Text>
                </View>
                <View style={styles.overallTextWrap}>
                  <Text style={styles.overallHeadline}>{fortune.headline}</Text>
                  <Text style={styles.overallMessage}>{fortune.message}</Text>
                </View>
              </View>
              <View style={styles.luckyMeta}>
                <View style={styles.luckyMetaItem}>
                  <Text style={styles.luckyMetaLabel}>Lucky color</Text>
                  <View style={styles.luckyColorRow}>
                    <View style={[styles.luckyColorDot, { backgroundColor: fortune.luckyColor.hex }]} />
                    <Text style={styles.luckyMetaValue}>{fortune.luckyColor.name}</Text>
                  </View>
                </View>
                <View style={styles.luckyMetaItem}>
                  <Text style={styles.luckyMetaLabel}>Lucky hours</Text>
                  <Text style={styles.luckyMetaValue}>{fortune.luckyHour}</Text>
                </View>
              </View>
            </View>

            {/* Category bars */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Today's breakdown</Text>
              {fortune.categories
                .filter((c) => c.key !== 'overall')
                .map((c) => (
                  <View key={c.key} style={styles.catRow}>
                    <Text style={styles.catIcon}>{c.icon}</Text>
                    <View style={styles.catBody}>
                      <View style={styles.catHeader}>
                        <Text style={styles.catLabel}>{c.label}</Text>
                        <Text style={styles.catScore}>{c.score}</Text>
                      </View>
                      <View style={styles.catTrack}>
                        <View
                          style={[
                            styles.catFill,
                            { width: `${c.score}%`, backgroundColor: config.accentColor },
                          ]}
                        />
                      </View>
                      <Text style={styles.catBlurb}>{c.blurb}</Text>
                    </View>
                  </View>
                ))}
            </View>

            {/* Lucky numbers */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your lucky numbers</Text>
              <Text style={styles.cardHint}>
                Generated for {config.name} from today's fortune. Tap below to reveal.
              </Text>
              <GameSelector light={isWebDashboard} />

              {luckyPick ? (
                <>
                  <View style={styles.luckyBalls}>
                    <LottoRow
                      whites={luckyPick.whites}
                      powerball={luckyPick.powerball}
                      game={game}
                      size={42}
                      showBonus={config.hasBonus}
                    />
                  </View>
                  <OddsVisualizer prediction={luckyPick} draws={draws} />
                  <View style={[styles.luckyActions, { marginTop: 14 }]}>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={handleLuckyNumbers}>
                      <Text style={styles.secondaryBtnText}>🔄 Regenerate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => void handleSave()}>
                      <Text style={styles.primaryBtnText}>💾 Save</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleLuckyNumbers}
                  disabled={working}
                >
                  {working ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {isPremium
                        ? '✨ Reveal lucky numbers'
                        : `🔒 Unlock — ${PREMIUM_TRIAL_DAYS}-day free trial`}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              {!isPremium && (
                <Text style={styles.gateNote}>
                  Lucky numbers are a Premium feature. Try free for {PREMIUM_TRIAL_DAYS} days, then{' '}
                  {PREMIUM_PRICE_DISPLAY}
                  {PREMIUM_PRICE_PERIOD}.
                </Text>
              )}
            </View>
          </>
        )}

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            For entertainment only. Fortune readings and lucky numbers do not affect the
            mathematical odds of any lottery draw. Please play responsibly.
          </Text>
        </View>
        <LandingStyleFooter />
      </ScrollView>
    </View>
  );
}

const cardBase = {
  backgroundColor: W ? webDash.cardBg : C.cardBg,
  borderRadius: W ? webDash.radiusLg : 16,
  padding: 18,
  marginBottom: 14,
  ...(W
    ? { borderWidth: 1, borderColor: webDash.cardBorder, boxShadow: webDash.shadowCard }
    : {}),
} as const;

const styles = StyleSheet.create({
  pageRoot: { flex: 1, backgroundColor: W ? webDash.screenBg : C.screenBg },
  noticeStrip: {
    ...Platform.select({ web: {}, default: { paddingHorizontal: 16, paddingTop: 4 } }),
  },
  scroll: { flex: 1 },
  content: {
    paddingBottom: 40,
    ...Platform.select({ web: { paddingHorizontal: 0, paddingTop: 8 }, default: { padding: 16 } }),
  },
  pageIntro: { marginBottom: 12, maxWidth: 640, alignSelf: 'center', width: '100%' },
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
    marginBottom: 16,
    lineHeight: 22,
    fontFamily: FONT,
  },
  card: cardBase,
  overallCard: {
    borderWidth: 1,
    borderColor: W ? webDash.cardBorder : '#2D3748',
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: W ? webDash.textSecondary : '#A0AEC0',
    marginBottom: 8,
    fontFamily: FONT,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 6,
    fontFamily: FONT,
  },
  cardHint: {
    fontSize: 12,
    color: W ? webDash.textMuted : '#718096',
    marginBottom: 8,
    fontFamily: FONT,
  },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: W ? '#FFFFFF' : '#1A2744',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: W ? webDash.inputBorder : '#2D3748',
    fontFamily: FONT,
  },
  revealBtn: {
    backgroundColor: W ? webDash.accent : '#3182CE',
    borderRadius: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : {}),
  },
  revealBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700', fontFamily: FONT },
  privacyNote: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 16,
    color: W ? webDash.textMuted : '#718096',
    fontFamily: FONT,
  },
  overallTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  overallScoreWrap: { flexDirection: 'row', alignItems: 'flex-end' },
  overallScore: {
    fontSize: 44,
    fontWeight: '900',
    color: W ? webDash.accent : '#F6AD55',
    lineHeight: 46,
    fontFamily: FONT,
  },
  overallScoreUnit: {
    fontSize: 14,
    color: W ? webDash.textMuted : '#718096',
    marginBottom: 6,
    fontFamily: FONT,
  },
  overallTextWrap: { flex: 1 },
  overallHeadline: {
    fontSize: 17,
    fontWeight: '800',
    color: C.textPrimary,
    marginBottom: 4,
    fontFamily: FONT,
  },
  overallMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: W ? webDash.textSecondary : '#A0AEC0',
    fontFamily: FONT,
  },
  luckyMeta: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: W ? webDash.divider : '#2D3748',
    paddingTop: 12,
  },
  luckyMetaItem: { flex: 1 },
  luckyMetaLabel: {
    fontSize: 11,
    color: W ? webDash.textMuted : '#718096',
    marginBottom: 4,
    fontFamily: FONT,
  },
  luckyMetaValue: { fontSize: 14, fontWeight: '700', color: C.textPrimary, fontFamily: FONT },
  luckyColorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  luckyColorDot: { width: 14, height: 14, borderRadius: 7 },
  catRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  catIcon: { fontSize: 22 },
  catBody: { flex: 1 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catLabel: { fontSize: 13, fontWeight: '700', color: C.textPrimary, fontFamily: FONT },
  catScore: { fontSize: 13, fontWeight: '800', color: W ? webDash.accent : '#F6AD55', fontFamily: FONT },
  catTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: W ? '#EEF2F6' : '#1A2744',
    overflow: 'hidden',
  },
  catFill: { height: 8, borderRadius: 4 },
  catBlurb: {
    fontSize: 12,
    color: W ? webDash.textMuted : '#718096',
    marginTop: 4,
    fontFamily: FONT,
  },
  luckyBalls: { alignItems: 'center', marginVertical: 14 },
  luckyActions: { flexDirection: 'row', gap: 8 },
  primaryBtn: {
    flex: 1,
    backgroundColor: W ? webDash.accent : '#38A169',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : {}),
  },
  primaryBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800', fontFamily: FONT },
  secondaryBtn: {
    flex: 1,
    backgroundColor: W ? webDash.cardBgMuted : '#2D3748',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: W ? 1 : 0,
    borderColor: W ? webDash.cardBorder : 'transparent',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : {}),
  },
  secondaryBtnText: { color: C.textPrimary, fontSize: 14, fontWeight: '700', fontFamily: FONT },
  gateNote: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 17,
    color: W ? webDash.textMuted : '#718096',
    textAlign: 'center',
    fontFamily: FONT,
  },
  disclaimer: { marginTop: 4, paddingHorizontal: 4 },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    color: W ? webDash.textMuted : '#718096',
    fontStyle: 'italic',
    fontFamily: FONT,
  },
});
