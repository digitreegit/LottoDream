// ============================================
// Web Landing Page – marketing site, Apple HIG-inspired dark theme
// ============================================
// Layout lives in React Native styles. Web-only polish (nav blur, glossy
// balls, subtle transitions, hover/focus states) comes from one scoped
// stylesheet keyed by `data-ld` attributes — see LANDING_CSS below.
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LottoDreamLogo } from '../components/LottoDreamLogo';
import { fetchLandingGameJackpots, type LandingJackpotDisplay } from '../services/jackpotDisplayService';
import {
  PREMIUM_PRICE_DISPLAY,
  PREMIUM_PRICE_PERIOD,
  PREMIUM_TRIAL_DAYS,
  PREMIUM_YEARLY_PRICE_DISPLAY,
  PREMIUM_YEARLY_PRICE_PERIOD,
  PREMIUM_YEARLY_SAVINGS_PCT,
} from '../config/constants';

interface Props {
  onLogin: () => void;
  onRegister: () => void;
}

/** Paths from feature icons (viewBox 0 0 25.2 25.2); bar / ai / bolt / history / platform / secure */
const FEATURE_BAR_PATH =
  'M3.23,13.42c0-.62.5-1.12,1.12-1.12h2.25c.62,0,1.12.5,1.12,1.12v6.75c0,.62-.5,1.12-1.12,1.12h-2.25c-.62,0-1.12-.5-1.12-1.12h0v-6.75ZM9.98,8.92c0-.62.5-1.12,1.12-1.12h2.25c.62,0,1.12.5,1.12,1.12v11.25c0,.62-.5,1.12-1.12,1.12h-2.25c-.62,0-1.12-.5-1.12-1.12v-11.25ZM16.73,4.42c0-.62.5-1.12,1.12-1.12h2.25c.62,0,1.12.5,1.12,1.12v15.75c0,.62-.5,1.12-1.12,1.12h-2.25c-.62,0-1.12-.5-1.12-1.12V4.42Z';

const FEATURE_AI_PATH =
  'M10.41,16.5l-.81,2.85-.81-2.85c-.43-1.49-1.6-2.66-3.09-3.09l-2.85-.81,2.85-.81c1.49-.43,2.66-1.6,3.09-3.09l.81-2.85.81,2.85c.43,1.49,1.6,2.66,3.09,3.09l2.85.81-2.85.81c-1.49.43-2.66,1.6-3.09,3.09h0ZM18.86,9.33l-.26,1.03-.26-1.03c-.3-1.21-1.25-2.15-2.45-2.46l-1.04-.26,1.04-.26c1.21-.3,2.15-1.25,2.46-2.46l.26-1.04.26,1.03c.3,1.21,1.25,2.15,2.46,2.46l1.03.26-1.03.26c-1.21.3-2.15,1.25-2.46,2.46h-.01ZM17.49,21.18l-.39,1.18-.39-1.18c-.22-.67-.75-1.2-1.42-1.42l-1.18-.39,1.18-.39c.67-.22,1.2-.75,1.42-1.42l.39-1.18.39,1.18c.22.67.75,1.2,1.42,1.42l1.18.39-1.18.39c-.67.22-1.2.75-1.42,1.42Z';

const FEATURE_BOLT_PATH =
  'M4.35,14.1L14.85,2.85l-2.25,8.25h8.25l-10.5,11.25,2.25-8.25H4.35Z';

const FEATURE_HISTORY_PATH =
  'M9.6,12.28h3.75M9.6,15.28h3.75M9.6,18.28h3.75M16.35,19.03h2.25c1.24,0,2.25-1.01,2.25-2.25V6.39c0-1.14-.84-2.1-1.98-2.19-.37-.03-.75-.06-1.12-.08M11.95,4.11c-.06.21-.1.43-.1.66,0,.41.34.75.75.75h4.5c.41,0,.75-.34.75-.75,0-.23-.03-.45-.1-.66M11.95,4.11c.29-.94,1.16-1.59,2.15-1.59h1.5c1.01,0,1.87.67,2.15,1.59M11.95,4.11c-.38.02-.75.05-1.12.08-1.13.09-1.98,1.06-1.98,2.19v2.14M8.85,8.53h-3.38c-.62,0-1.12.5-1.12,1.12v11.25c0,.62.5,1.12,1.12,1.12h9.75c.62,0,1.12-.5,1.12-1.12v-11.25c0-.62-.5-1.12-1.12-1.12h-6.38.01ZM7.35,12.28h0ZM7.35,15.28h0ZM7.35,18.28h0Z';

const FEATURE_PLATFORM_PATH =
  'M7.03,10.35l-4.18,2.25,4.18,2.25M7.03,10.35l5.57,3,5.57-3M7.03,10.35l-4.18-2.25L12.6,2.85l9.75,5.25-4.18,2.25M18.17,10.35l4.18,2.25-4.18,2.25M18.17,14.85l4.18,2.25-9.75,5.25-9.75-5.25,4.18-2.25M18.17,14.85l-5.57,3-5.57-3';

const FEATURE_SECURE_PATH =
  'M9.19,13.33l2.66,2.23,4.65-4.96M12.6,3.27c-2.26,2.15-5.28,3.33-8.4,3.29-.4,1.21-.6,2.48-.6,3.75,0,5.59,3.82,10.29,9,11.62,5.18-1.33,9-6.03,9-11.62,0-1.31-.21-2.57-.6-3.75h-.15c-3.2,0-6.1-1.25-8.25-3.28h0Z';

const FEATURE_ICON_VIEWBOX = '0 0 25.2 25.2';
/** Nav height (~67px); bands start with 80px padding so the heading clears it. */
const STICKY_NAV_OFFSET = 16;
const POWERBALL_LOGO = require('../../assets/powerball-logo.png');
const MEGA_MILLIONS_LOGO = require('../../assets/mega-millions-logo.png');
const APP_STORE_BADGE = require('../../assets/badge-appstore.png');
const GOOGLE_PLAY_BADGE = require('../../assets/badge-googleplay.png');

/** Mon, Wed, Sat (JS getDay: 0 Sun … 6 Sat) */
const POWERBALL_DRAW_DAYS = [1, 3, 6];
/** Tue, Fri */
const MEGA_DRAW_DAYS = [2, 5];

const C = {
  bg: '#000000',
  bgAlt: '#0A0A0C',
  card: '#161618',
  cardHi: '#232326',
  sep: 'rgba(255,255,255,0.14)',
  text: '#F5F5F7',
  muted: '#A1A1A6',
  faint: '#86868B',
  /** Single brand accent for links, icons and highlights (11:1 on black). */
  accent: '#2DD4A7',
  /** Accent fill behind white labels (4.5:1). */
  accentFill: '#00866B',
  chartBar: 'rgba(255,255,255,0.18)',
  /** Lottery-ball colors are content, not UI accents. */
  gold: '#FFC857',
  red: '#FF4D5E',
};

/** SF Pro on Apple devices, platform UI font elsewhere. */
const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Segoe UI", Roboto, sans-serif';

const PICK_MODES = ['Balanced', 'Hot', 'Cold', 'Anti-Crowd', 'Lucky Dates'] as const;

type SectionKey = 'features' | 'jackpots' | 'howItWorks' | 'pricing';

/** Attach a landing-stylesheet hook (web only; ignored on native). */
function ld(name: string): object {
  return Platform.OS === 'web' ? ({ dataSet: { ld: name } } as object) : {};
}

function formatWeekdayShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function nextScheduledDrawOnOrAfter(from: Date, weekdays: number[]): Date {
  const start = new Date(from);
  start.setHours(12, 0, 0, 0);
  for (let add = 0; add < 21; add++) {
    const t = new Date(start);
    t.setDate(start.getDate() + add);
    if (weekdays.includes(t.getDay())) return t;
  }
  return start;
}

function randomPowerballPick(): { whites: number[]; power: number } {
  const set = new Set<number>();
  while (set.size < 5) set.add(1 + Math.floor(Math.random() * 69));
  return {
    whites: [...set].sort((a, b) => a - b),
    power: 1 + Math.floor(Math.random() * 26),
  };
}

/** Display-only pattern score: how close the pick sits to typical sum / odd-even balance. */
function patternScore(whites: number[]): number {
  const sum = whites.reduce((a, b) => a + b, 0);
  const odd = whites.filter((n) => n % 2).length;
  const sumPenalty = Math.min(Math.abs(sum - 175) / 3, 30);
  const balancePenalty = Math.abs(odd - 2.5) * 6;
  return Math.round(Math.max(55, 99 - sumPenalty - balancePenalty));
}

/** Inject the landing stylesheet once (web). */
function useLandingStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById('ld-landing-css')) return;
    const el = document.createElement('style');
    el.id = 'ld-landing-css';
    el.textContent = LANDING_CSS;
    document.head.appendChild(el);
  }, []);
}

export function WebLandingPage({ onLogin, onRegister }: Props) {
  useLandingStyles();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 900;
  const isMid = width >= 640;

  const scrollViewRef = useRef<ScrollView>(null);
  const [sectionY, setSectionY] = useState<Record<SectionKey, number>>({
    features: 0,
    jackpots: 0,
    howItWorks: 0,
    pricing: 0,
  });
  const sectionRefs = useRef<Partial<Record<SectionKey, View | null>>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [jackpotsLoading, setJackpotsLoading] = useState(true);
  const [landingJackpots, setLandingJackpots] = useState<{
    powerball: LandingJackpotDisplay | null;
    megamillions: LandingJackpotDisplay | null;
  }>({ powerball: null, megamillions: null });

  // Hero demo is driven by the visitor (HIG: give people agency, avoid time-boxed UI).
  const [modeIndex, setModeIndex] = useState(0);
  const [round, setRound] = useState(0);
  const [pick, setPick] = useState(() => ({
    whites: [7, 19, 33, 48, 62],
    power: 11,
  }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const j = await fetchLandingGameJackpots();
        if (!cancelled) setLandingJackpots(j);
      } catch {
        if (!cancelled) setLandingJackpots({ powerball: null, megamillions: null });
      } finally {
        if (!cancelled) setJackpotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const generatePick = (nextMode = modeIndex) => {
    setModeIndex(nextMode);
    setPick(randomPowerballPick());
    setRound((r) => r + 1);
  };

  const trackSection = (key: SectionKey) => ({
    ref: (node: View | null) => {
      sectionRefs.current[key] = node;
    },
    onLayout: (event: { nativeEvent: { layout: { y: number } } }) => {
      const y = event.nativeEvent.layout.y;
      setSectionY((prev) => (prev[key] === y ? prev : { ...prev, [key]: y }));
    },
  });

  const scrollToSection = (key: SectionKey) => {
    setMenuOpen(false);
    let y = sectionY[key];
    // On web, onLayout offsets are skewed by the sticky-header wrapper, so
    // measure the band's real position inside the scroll container instead.
    const node = sectionRefs.current[key] as unknown as HTMLElement | null;
    const scroller = (scrollViewRef.current as any)?.getScrollableNode?.() as HTMLElement | undefined;
    if (Platform.OS === 'web' && node?.getBoundingClientRect && scroller) {
      y = node.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    }
    scrollViewRef.current?.scrollTo({ y: Math.max(y - STICKY_NAV_OFFSET, 0), animated: true });
  };

  const mode = PICK_MODES[modeIndex];
  const score = patternScore(pick.whites);
  const sum = pick.whites.reduce((a, b) => a + b, 0);
  const odd = pick.whites.filter((n) => n % 2).length;
  const pbJackpot = landingJackpots.powerball?.amountDisplay;
  const gutter = isWide ? 40 : 20;
  const bandPad = { paddingVertical: isWide ? 112 : 72 };
  const ballSize = isMid ? 56 : 44;

  const navLinks: { key: SectionKey; label: string }[] = [
    { key: 'jackpots', label: 'Jackpots' },
    { key: 'features', label: 'Features' },
    { key: 'howItWorks', label: 'How It Works' },
    { key: 'pricing', label: 'Pricing' },
  ];

  return (
    <ScrollView
      style={styles.root}
      {...ld('root')}
      contentContainerStyle={styles.scroll}
      ref={scrollViewRef}
      stickyHeaderIndices={[0]}
    >
      {/* ── Nav ── */}
      <View style={styles.navShell}>
        <View style={styles.navBand} {...ld('nav')}>
          <View style={[styles.container, styles.nav, { paddingHorizontal: gutter, paddingTop: insets.top }]}>
            <LottoDreamLogo width={isMid ? 148 : 132} tone="onDark" />
            {isWide ? (
              <View style={styles.navLinks}>
                {navLinks.map((l) => (
                  <Pressable key={l.key} onPress={() => scrollToSection(l.key)} accessibilityRole="link" {...ld('navlink')}>
                    <Text style={styles.navLink}>{l.label}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={onLogin} accessibilityRole="link" {...ld('navlink')}>
                  <Text style={styles.navLink}>Sign In</Text>
                </Pressable>
                <Button label="Start Free Trial" onPress={onRegister} size="sm" />
              </View>
            ) : (
              <Pressable
                style={styles.hamburger}
                onPress={() => setMenuOpen((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
                accessibilityState={{ expanded: menuOpen }}
              >
                <View style={[styles.hamburgerBar, menuOpen && { transform: [{ translateY: 3.5 }, { rotate: '45deg' }] }]} />
                <View style={[styles.hamburgerBar, menuOpen && { transform: [{ translateY: -3.5 }, { rotate: '-45deg' }] }]} />
              </Pressable>
            )}
          </View>
        </View>
        {!isWide && menuOpen && (
          <View style={styles.mobileOverlay}>
            <Pressable style={[styles.mobileBackdrop, { height }]} onPress={() => setMenuOpen(false)} accessibilityLabel="Close menu" />
            <View style={[styles.mobileDrawer, { paddingHorizontal: gutter }]}>
              {navLinks.map((l) => (
                <Pressable key={l.key} style={styles.mobileDrawerItem} onPress={() => scrollToSection(l.key)} accessibilityRole="link">
                  <Text style={styles.mobileDrawerText}>{l.label}</Text>
                </Pressable>
              ))}
              <View style={styles.mobileDrawerCtas}>
                <Button label="Sign In" variant="secondary" onPress={() => { setMenuOpen(false); onLogin(); }} grow />
                <Button label="Start Free Trial" onPress={() => { setMenuOpen(false); onRegister(); }} grow />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── Hero ── */}
      <View style={styles.heroBand}>
        <View style={[styles.container, styles.hero, isWide && styles.heroWide, { paddingHorizontal: gutter }]}>
          <Text style={[styles.heroKicker, isMid && styles.heroKickerMid]}>
            {pbJackpot ? `Powerball jackpot: ${pbJackpot}` : 'Six games. Updated after every draw.'}
          </Text>
          <Text
            style={[styles.heroTitle, isMid && styles.heroTitleMid, isWide && styles.heroTitleWide]}
            accessibilityRole="header"
          >
            Play your numbers.{'\n'}
            <Text style={styles.heroTitleAccent}>Like you mean it.</Text>
          </Text>
          <Text style={[styles.heroSub, isMid && styles.heroSubMid]}>
            Smart pick strategies, live jackpots, and a daily lucky-number reading for six US lottery games.
          </Text>
          <View style={styles.heroCtas}>
            <Button label={`Try ${PREMIUM_TRIAL_DAYS} Days Free`} onPress={onRegister} size="lg" />
            <Button label="Sign In" onPress={onLogin} variant="link" size="lg" chevron />
          </View>
          <Text style={styles.heroFine}>Free plan available · Cancel anytime · Web, iPhone, and Android</Text>
        </View>

        {/* Interactive pick demo */}
        <View style={[styles.pickWrap, { paddingHorizontal: gutter }]}>
          <View style={[styles.pickCard, isMid && styles.pickCardMid]}>
            <View style={styles.pickHeader}>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.pickTitle}>Powerball pick</Text>
                <Text style={styles.pickSubtitle}>{mode} strategy</Text>
              </View>
              <Button label="New Pick" variant="tinted" size="sm" onPress={() => generatePick()} />
            </View>

            <View
              style={styles.ballRow}
              accessibilityLabel={`Numbers ${pick.whites.join(', ')}, Powerball ${pick.power}`}
              {...({ 'aria-live': 'polite' } as object)}
            >
              {pick.whites.map((n, i) => (
                <Ball key={`${round}-${i}`} n={n} kind="white" size={ballSize} delay={round ? i * 50 : undefined} />
              ))}
              <Ball key={`${round}-pb`} n={pick.power} kind="red" size={ballSize} delay={round ? 250 : undefined} />
            </View>

            <View style={styles.pickStats}>
              <View style={styles.pickStat}>
                <Text style={styles.pickStatLabel} numberOfLines={1}>{isMid ? 'Pattern score' : 'Score'}</Text>
                <Text style={styles.pickStatValue}>{score}</Text>
                <View style={styles.meterTrack}>
                  <View style={[styles.meterFill, { width: `${score}%` as any }]} {...ld('meter')} />
                </View>
              </View>
              <View style={styles.pickStatDivider} />
              <View style={styles.pickStat}>
                <Text style={styles.pickStatLabel}>Sum</Text>
                <Text style={styles.pickStatValue}>{sum}</Text>
              </View>
              <View style={styles.pickStatDivider} />
              <View style={styles.pickStat}>
                <Text style={styles.pickStatLabel}>Odd / even</Text>
                <Text style={styles.pickStatValue}>
                  {odd} / {5 - odd}
                </Text>
              </View>
            </View>

            <View style={styles.segmented} accessibilityRole="radiogroup" accessibilityLabel="Pick strategy">
              {PICK_MODES.map((m, i) => {
                const selected = i === modeIndex;
                return (
                  <Pressable
                    key={m}
                    onPress={() => generatePick(i)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    style={({ pressed }) => [
                      styles.segment,
                      { minHeight: isMid ? 36 : 44 },
                      selected && styles.segmentSelected,
                      pressed && styles.pressed,
                    ]}
                    {...ld('segment')}
                  >
                    <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{m}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.pickFoot}>
              Every combination has the same odds. Strategies change how you pick, not your chances.
            </Text>
          </View>
        </View>
      </View>

      {/* ── Jackpots ── */}
      <View style={[styles.band, bandPad]} {...trackSection('jackpots')}>
        <View style={[styles.container, { paddingHorizontal: gutter }]}>
          <SectionHead
            eyebrow="Live jackpots"
            title="What’s on the line this week."
            sub="Estimated annuity jackpots, refreshed throughout the day."
          />
          <View style={[styles.cardRow, isMid && styles.rowWrap]}>
            <JackpotCard
              logo={POWERBALL_LOGO}
              logoStyle={styles.logoPowerball}
              name="Powerball"
              amount={landingJackpots.powerball?.amountDisplay}
              loading={jackpotsLoading}
              nextDraw={
                landingJackpots.powerball?.nextDrawDate ??
                nextScheduledDrawOnOrAfter(new Date(), POWERBALL_DRAW_DAYS)
              }
              rules="5 of 1–69 plus Powerball 1–26 · Mon, Wed, Sat"
              wide={isMid}
            />
            <JackpotCard
              logo={MEGA_MILLIONS_LOGO}
              logoStyle={styles.logoMega}
              name="Mega Millions"
              amount={landingJackpots.megamillions?.amountDisplay}
              loading={jackpotsLoading}
              nextDraw={
                landingJackpots.megamillions?.nextDrawDate ??
                nextScheduledDrawOnOrAfter(new Date(), MEGA_DRAW_DAYS)
              }
              rules="5 of 1–70 plus Mega Ball 1–24 · Tue, Fri"
              wide={isMid}
            />
          </View>
        </View>
      </View>

      {/* ── Features ── */}
      <View style={[styles.band, styles.bandAlt, bandPad]} {...trackSection('features')}>
        <View style={[styles.container, { paddingHorizontal: gutter }]}>
          <SectionHead
            eyebrow="Features"
            title="Everything between a hunch and a ticket."
            sub="Explore the numbers, choose a strategy, and keep your favorite sets on every device."
          />
          <View style={[styles.bento, isMid && styles.rowWrap]}>
            {FEATURES.map((f) => (
              <View
                key={f.title}
                style={[
                  styles.featureCard,
                  isWide && (f.span === 2 ? styles.span2 : f.span === 3 ? styles.span3 : styles.span1),
                  !isWide && isMid && (f.span === 1 ? styles.half : styles.full),
                ]}
              >
                <View style={f.span > 1 && isWide ? styles.featureBodyRow : undefined}>
                  <View style={f.span > 1 && isWide ? styles.featureTextCol : undefined}>
                    <Svg width={30} height={30} viewBox={FEATURE_ICON_VIEWBOX} style={styles.featureIcon}>
                      <Path d={f.svgPath} fill="none" stroke={C.accent} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                  {f.chart ? <HotNumbersChart /> : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── How it works ── */}
      <View style={[styles.band, bandPad]} {...trackSection('howItWorks')}>
        <View style={[styles.container, { paddingHorizontal: gutter }]}>
          <SectionHead eyebrow="How it works" title="From sign-up to your first set in minutes." />
          <View style={[styles.steps, isWide && styles.stepsWide]}>
            {STEPS.map((s, i) => (
              <View key={s.title} style={[styles.step, isWide && styles.stepWide]}>
                <Text style={styles.stepNum}>Step {i + 1}</Text>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── Pricing ── */}
      <View style={[styles.band, styles.bandAlt, bandPad]} {...trackSection('pricing')}>
        <View style={[styles.container, { paddingHorizontal: gutter }]}>
          <SectionHead
            eyebrow="Pricing"
            title={`${PREMIUM_TRIAL_DAYS} days free. Then less than a ticket a week.`}
            sub="Pure Random stays free forever. Premium unlocks every strategy and all six games."
          />
          <View style={[styles.cardRow, styles.pricingRow, isMid && styles.rowWrap]}>
            <View style={[styles.planCard, isMid && styles.half]}>
              <Text style={styles.planTier}>Free</Text>
              <View style={styles.planPriceRow}>
                <Text style={styles.planPrice}>$0</Text>
                <Text style={styles.planPer}>forever</Text>
              </View>
              <Text style={styles.planNote}>Everything you need to explore.</Text>
              <View style={styles.planList}>
                {['Pure Random picks', 'Live jackpots and draw results', 'Full draw history', 'Save up to 3 sets'].map((t) => (
                  <PlanLine key={t} text={t} />
                ))}
              </View>
              <View style={styles.planBtn}>
                <Button label="Create Free Account" variant="secondary" onPress={onRegister} grow />
              </View>
            </View>

            <View style={[styles.planCard, styles.planPro, isMid && styles.half]}>
              <View style={styles.planTierRow}>
                <Text style={styles.planTier}>Premium</Text>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{PREMIUM_TRIAL_DAYS} days free</Text>
                </View>
              </View>
              <View style={styles.planPriceRow}>
                <Text style={styles.planPrice}>{PREMIUM_PRICE_DISPLAY}</Text>
                <Text style={styles.planPer}>{PREMIUM_PRICE_PERIOD.replace('/', 'per ')}</Text>
              </View>
              <Text style={styles.planNote}>
                or {PREMIUM_YEARLY_PRICE_DISPLAY}
                {PREMIUM_YEARLY_PRICE_PERIOD} and save {PREMIUM_YEARLY_SAVINGS_PCT}%
              </Text>
              <View style={styles.planList}>
                {[
                  '5 pick strategies',
                  "Today's Fortune lucky numbers",
                  'Pattern scores and backtests',
                  'All 6 games, unlimited saves',
                  'Priority support',
                ].map((t) => (
                  <PlanLine key={t} text={t} />
                ))}
              </View>
              <View style={styles.planBtn}>
                <Button label="Start Free Trial" onPress={onRegister} grow />
                <Text style={styles.planFine}>Card required. Cancel anytime before day {PREMIUM_TRIAL_DAYS}.</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ── Final CTA ── */}
      <View style={[styles.band, bandPad]}>
        <View style={[styles.container, styles.finalCta, { paddingHorizontal: gutter }]}>
          <View style={styles.finalBalls} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <Ball n={7} kind="white" size={isMid ? 60 : 46} />
            <Ball n={21} kind="gold" size={isMid ? 60 : 46} />
            <Ball n={26} kind="red" size={isMid ? 60 : 46} />
          </View>
          <Text style={[styles.finalTitle, isMid && styles.finalTitleMid]} accessibilityRole="header">
            Lucky numbers, ready when you are.
          </Text>
          <Text style={[styles.finalSub, isMid && styles.heroSubMid]}>
            Save picks, track every draw, and play your way — on the web and on your phone.
          </Text>
          <Button label="Start Free Trial" onPress={onRegister} size="lg" />
          <View style={styles.storeRow}>
            <View accessibilityRole="image" accessibilityLabel="Download on the App Store">
              <Image source={APP_STORE_BADGE} style={styles.storeImgApple} resizeMode="contain" />
            </View>
            <View accessibilityRole="image" accessibilityLabel="Get it on Google Play">
              <Image source={GOOGLE_PLAY_BADGE} style={styles.storeImgGoogle} resizeMode="contain" />
            </View>
          </View>
        </View>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View style={[styles.container, { paddingHorizontal: gutter }]}>
          <Text style={styles.footerDisclaimer}>
            LottoDream is not affiliated with, endorsed by, or sponsored by the Multi-State Lottery
            Association, Powerball, or Mega Millions. Lottery games involve random outcomes. No system,
            including AI-based analysis, can guarantee a winning ticket or change the odds. Play
            responsibly. Must be 18+ (or the legal gambling age in your jurisdiction) to play.
          </Text>
          <View style={styles.footerRule} />
          <View style={[styles.footerBottom, isMid && styles.footerBottomRow]}>
            <Text style={styles.footerText}>© {new Date().getFullYear()} Lotto Dream. All rights reserved.</Text>
            <Text style={styles.footerText}>Data from NY Open Data · Updated after every drawing</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

/* ── Pieces ── */

/** Capsule button with a press state (HIG: custom buttons always need one). */
function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  grow,
  chevron,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tinted' | 'link';
  size?: 'sm' | 'md' | 'lg';
  grow?: boolean;
  chevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        styles[`btn_${size}`],
        styles[`btn_${variant}`],
        grow && styles.btnGrow,
        pressed && styles.pressed,
      ]}
      {...ld(`btn btn-${variant}`)}
    >
      <Text style={[styles.btnText, styles[`btnText_${size}`], styles[`btnText_${variant}`]]}>
        {label}
        {chevron ? ' ›' : ''}
      </Text>
    </Pressable>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  const { width } = useWindowDimensions();
  const isMid = width >= 640;
  return (
    <View style={styles.sectionHead}>
      <Text style={[styles.eyebrow, isMid && styles.eyebrowMid]}>{eyebrow}</Text>
      <Text
        style={[styles.sectionTitle, isMid && styles.sectionTitleMid, width >= 900 && styles.sectionTitleWide]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {sub ? <Text style={[styles.sectionSub, isMid && styles.sectionSubMid]}>{sub}</Text> : null}
    </View>
  );
}

const BALL_FALLBACK = { white: '#E9EDF5', red: C.red, gold: C.gold } as const;

function Ball({ n, kind, size, delay }: { n: number; kind: 'white' | 'red' | 'gold'; size: number; delay?: number }) {
  const webAnim =
    Platform.OS === 'web'
      ? ({
          dataSet: { ld: delay != null ? `ball-${kind} pop` : `ball-${kind}` },
          style: delay != null ? { animationDelay: `${delay}ms` } : undefined,
        } as any)
      : {};
  return (
    <View
      {...webAnim}
      style={[
        styles.ball,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: BALL_FALLBACK[kind] },
        webAnim.style,
      ]}
    >
      <Text style={[styles.ballText, { fontSize: size * 0.38, color: kind === 'white' ? '#1D1D1F' : '#FFFFFF' }]}>
        {n}
      </Text>
    </View>
  );
}

function JackpotCard({
  logo,
  logoStyle,
  name,
  amount,
  loading,
  nextDraw,
  rules,
  wide,
}: {
  logo: any;
  logoStyle: object;
  name: string;
  amount?: string;
  loading: boolean;
  nextDraw: Date;
  rules: string;
  wide: boolean;
}) {
  const [num, unit] = amount ? amount.replace('$', '').split(/\s+/, 2) : ['', ''];
  return (
    <View style={[styles.jackpotCard, wide && styles.half]}>
      <View style={styles.jackpotTop}>
        <View style={styles.jackpotLogoChip}>
          <Image source={logo} style={logoStyle} resizeMode="contain" accessibilityLabel={`${name} logo`} />
        </View>
        <Text style={styles.nextDrawText}>Next draw {formatWeekdayShortDate(nextDraw)}</Text>
      </View>
      <Text style={styles.jackpotLabel}>Estimated jackpot</Text>
      <View style={styles.jackpotAmountRow}>
        {amount ? (
          <>
            <Text style={styles.jackpotDollar}>$</Text>
            <Text style={styles.jackpotAmount}>{num}</Text>
            {unit ? <Text style={styles.jackpotUnit}>{unit}</Text> : null}
          </>
        ) : loading ? (
          <View style={styles.jackpotSkeleton} accessibilityLabel="Loading jackpot" />
        ) : (
          <Text style={styles.jackpotPending}>Available after the next draw</Text>
        )}
      </View>
      <Text style={styles.jackpotRules}>{rules}</Text>
    </View>
  );
}

const HOT_BARS = [
  { n: 23, v: 0.92 },
  { n: 61, v: 0.81 },
  { n: 32, v: 0.74 },
  { n: 39, v: 0.66 },
  { n: 21, v: 0.6 },
  { n: 10, v: 0.52 },
  { n: 63, v: 0.47 },
];

function HotNumbersChart() {
  return (
    <View
      style={styles.chartWrap}
      accessible
      accessibilityLabel="Sample chart of most-drawn Powerball numbers. 23 is drawn most often, followed by 61, 32, 39, 21, 10, and 63."
    >
      <View style={styles.chart}>
        {HOT_BARS.map((b, i) => (
          <View key={b.n} style={styles.chartCol}>
            <View style={styles.chartTrack}>
              <View
                style={[styles.chartBar, { height: `${b.v * 100}%` as any, backgroundColor: i === 0 ? C.accent : C.chartBar }]}
                {...ld('bar')}
              />
            </View>
            <Text style={[styles.chartLabel, i === 0 && styles.chartLabelTop]}>{b.n}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.chartCaption}>Most-drawn white balls (sample)</Text>
    </View>
  );
}

function CheckIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlanLine({ text }: { text: string }) {
  return (
    <View style={styles.planLine}>
      <CheckIcon color={C.accent} />
      <Text style={styles.planLineText}>{text}</Text>
    </View>
  );
}

/* ── Static data ── */

const FEATURES: { title: string; desc: string; svgPath: string; span: 1 | 2 | 3; chart?: boolean }[] = [
  {
    title: 'Real-time analytics',
    desc: 'See which numbers are running hot, which pairs show up together, and what’s overdue — across years of draws.',
    svgPath: FEATURE_BAR_PATH,
    span: 2,
    chart: true,
  },
  {
    title: 'Pick strategies',
    desc: 'Hot, Cold, Balanced, Anti-Crowd, and Lucky Dates — or keep it pure random.',
    svgPath: FEATURE_AI_PATH,
    span: 1,
  },
  {
    title: 'Today’s Fortune',
    desc: 'A daily luck reading from your birthdate, with matching numbers. Never stored.',
    svgPath: FEATURE_BOLT_PATH,
    span: 1,
  },
  {
    title: 'Six lottery games',
    desc: 'Powerball, Mega Millions, Cash4Life, Take 5, NY Lotto, and Pick 10.',
    svgPath: FEATURE_HISTORY_PATH,
    span: 1,
  },
  {
    title: 'Pattern scores',
    desc: 'Every pick gets a pattern score, a backtest against past draws, and a Monte Carlo view.',
    svgPath: FEATURE_PLATFORM_PATH,
    span: 1,
  },
  {
    title: 'Private by design',
    desc: 'Picks sync securely across web, iPhone, and Android. We never sell or share your data.',
    svgPath: FEATURE_SECURE_PATH,
    span: 3,
  },
];

const STEPS = [
  { title: 'Create an account', desc: 'Sign up in seconds with email or Google. The free plan never expires.' },
  { title: 'Explore the data', desc: 'Browse hot and cold trends, draw history, and live jackpots for every game.' },
  { title: 'Build a pick', desc: 'Choose a strategy, add lucky dates, and generate a set you like.' },
  { title: 'Save and play', desc: 'Keep favorite sets, check them against each draw, and adjust as you go.' },
];

/* ── Web-only stylesheet (hooks via data-ld) ── */

const LANDING_CSS = `
[data-ld~="root"], [data-ld~="root"] * { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
[data-ld~="root"] div[dir] { font-family: inherit; }

[data-ld~="nav"] { backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px); background: rgba(0,0,0,0.72) !important; }
[data-ld~="navlink"] { cursor: pointer; }
[data-ld~="navlink"] > div { transition: color .2s ease; }
[data-ld~="navlink"]:hover > div { color: #FFFFFF !important; }

[data-ld~="ball-white"] { background: radial-gradient(circle at 35% 30%, #FFFFFF 0%, #F2F3F6 45%, #C9CDD6 100%) !important; box-shadow: inset -3px -4px 10px rgba(0,0,0,0.12), 0 6px 14px -8px rgba(0,0,0,0.7); }
[data-ld~="ball-red"] { background: radial-gradient(circle at 35% 30%, #FF8C97 0%, #FF4D5E 45%, #B3182E 100%) !important; box-shadow: inset -3px -4px 10px rgba(0,0,0,0.2), 0 6px 14px -8px rgba(0,0,0,0.7); }
[data-ld~="ball-gold"] { background: radial-gradient(circle at 35% 30%, #FFE7A8 0%, #FFC857 45%, #C08A22 100%) !important; box-shadow: inset -3px -4px 10px rgba(0,0,0,0.18), 0 6px 14px -8px rgba(0,0,0,0.7); }
[data-ld~="pop"] { animation: ld-pop .35s cubic-bezier(.25,.1,.25,1) both; }
@keyframes ld-pop { from { transform: scale(.88); opacity: 0; } to { transform: none; opacity: 1; } }

[data-ld~="meter"] { transition: width .4s cubic-bezier(.25,.1,.25,1); }
[data-ld~="bar"] { transform-origin: bottom; animation: ld-grow .7s cubic-bezier(.25,.1,.25,1) both; }
@keyframes ld-grow { from { transform: scaleY(0); } }

[data-ld~="btn"], [data-ld~="segment"] { cursor: pointer; transition: background-color .2s ease, filter .2s ease, transform .1s ease; }
[data-ld~="btn-primary"]:hover { filter: brightness(1.12); }
[data-ld~="btn-secondary"]:hover, [data-ld~="btn-tinted"]:hover { filter: brightness(1.25); }
[data-ld~="btn-link"]:hover > div { text-decoration: underline; }
[data-ld~="segment"]:hover { background-color: rgba(255,255,255,0.08); }
[data-ld~="btn"]:focus-visible, [data-ld~="segment"]:focus-visible, [data-ld~="navlink"]:focus-visible { outline: 2px solid #2DD4A7; outline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  [data-ld] { animation: none !important; transition: none !important; }
}
`;

/* ── Styles ── */

const styles = StyleSheet.create<any>({
  root: { flex: 1, backgroundColor: C.bg, fontFamily: FONT_STACK },
  scroll: { minHeight: '100%', backgroundColor: C.bg },
  container: { width: '100%', maxWidth: 1080, alignSelf: 'center' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },

  /* Nav */
  navShell: { position: 'relative', zIndex: 30 },
  navBand: { backgroundColor: 'rgba(0,0,0,0.9)', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.sep },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  navLink: { color: C.muted, fontSize: 14, paddingVertical: 10 },
  hamburger: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center', gap: 5, marginRight: -10 },
  hamburgerBar: { width: 18, height: 1.5, borderRadius: 1, backgroundColor: C.text },
  mobileOverlay: { position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 40 },
  mobileBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  mobileDrawer: { backgroundColor: C.bgAlt, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.sep, paddingTop: 4, paddingBottom: 20 },
  mobileDrawerItem: { minHeight: 52, justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.sep },
  mobileDrawerText: { color: C.text, fontSize: 20, fontWeight: '600', letterSpacing: -0.3 },
  mobileDrawerCtas: { flexDirection: 'row', gap: 12, marginTop: 20 },

  /* Buttons */
  btn: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  btnGrow: { flexGrow: 1, flexBasis: 0 },
  btn_sm: { minHeight: 36, paddingHorizontal: 16 },
  btn_md: { minHeight: 44, paddingHorizontal: 22 },
  btn_lg: { minHeight: 50, paddingHorizontal: 28 },
  btn_primary: { backgroundColor: C.accentFill },
  btn_secondary: { backgroundColor: C.cardHi },
  btn_tinted: { backgroundColor: 'rgba(45,212,167,0.14)' },
  btn_link: { paddingHorizontal: 8 },
  btnText: { fontWeight: '600', textAlign: 'center' },
  btnText_sm: { fontSize: 14 },
  btnText_md: { fontSize: 16 },
  btnText_lg: { fontSize: 17 },
  btnText_primary: { color: '#FFFFFF' },
  btnText_secondary: { color: C.text },
  btnText_tinted: { color: C.accent },
  btnText_link: { color: C.accent },

  /* Hero */
  heroBand: { backgroundColor: C.bg, paddingBottom: 96 },
  hero: { alignItems: 'center', paddingTop: 56, paddingBottom: 48 },
  heroWide: { paddingTop: 96, paddingBottom: 64 },
  heroKicker: { color: C.accent, fontSize: 15, fontWeight: '600', textAlign: 'center', marginBottom: 14 },
  heroKickerMid: { fontSize: 17 },
  heroTitle: { color: C.text, fontSize: 44, lineHeight: 48, fontWeight: '700', letterSpacing: -1, textAlign: 'center' },
  heroTitleMid: { fontSize: 64, lineHeight: 68, letterSpacing: -1.6 },
  heroTitleWide: { fontSize: 80, lineHeight: 84, letterSpacing: -2.2 },
  heroTitleAccent: { color: C.muted },
  heroSub: { color: C.muted, fontSize: 19, lineHeight: 27, marginTop: 20, maxWidth: 620, textAlign: 'center' },
  heroSubMid: { fontSize: 21, lineHeight: 30 },
  heroCtas: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 32 },
  heroFine: { color: C.faint, fontSize: 14, marginTop: 20, textAlign: 'center' },

  /* Pick demo */
  pickWrap: { width: '100%', maxWidth: 680, alignSelf: 'center' },
  pickCard: { borderRadius: 28, backgroundColor: C.card, padding: 20 },
  pickCardMid: { padding: 32 },
  pickHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 24 },
  pickTitle: { color: C.text, fontSize: 21, fontWeight: '600', letterSpacing: -0.3 },
  pickSubtitle: { color: C.muted, fontSize: 15, marginTop: 2 },
  ballRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginBottom: 24 },
  ball: { alignItems: 'center', justifyContent: 'center' },
  ballText: { fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  pickStats: { flexDirection: 'row', borderRadius: 16, backgroundColor: C.cardHi, paddingVertical: 16, paddingHorizontal: 4 },
  pickStat: { flex: 1, paddingHorizontal: 12 },
  pickStatDivider: { width: StyleSheet.hairlineWidth, backgroundColor: C.sep },
  pickStatLabel: { color: C.muted, fontSize: 13 },
  pickStatValue: { color: C.text, fontSize: 24, fontWeight: '600', fontVariant: ['tabular-nums'], marginTop: 4, letterSpacing: -0.4 },
  meterTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', marginTop: 10 },
  meterFill: { height: 4, borderRadius: 2, backgroundColor: C.accent },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 20 },
  segment: { paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  segmentSelected: { backgroundColor: C.text },
  segmentText: { color: C.muted, fontSize: 14, fontWeight: '500' },
  segmentTextSelected: { color: '#000000', fontWeight: '600' },
  pickFoot: { color: C.faint, fontSize: 13, lineHeight: 19, marginTop: 20 },

  /* Sections */
  band: { backgroundColor: C.bg },
  bandAlt: { backgroundColor: C.bgAlt },
  sectionHead: { alignItems: 'center', alignSelf: 'center', maxWidth: 760, marginBottom: 48 },
  eyebrow: { color: C.accent, fontSize: 17, fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  eyebrowMid: { fontSize: 19 },
  sectionTitle: { color: C.text, fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.6, textAlign: 'center' },
  sectionTitleMid: { fontSize: 44, lineHeight: 50, letterSpacing: -1 },
  sectionTitleWide: { fontSize: 52, lineHeight: 58, letterSpacing: -1.3 },
  sectionSub: { color: C.muted, fontSize: 17, lineHeight: 25, marginTop: 16, textAlign: 'center' },
  sectionSubMid: { fontSize: 21, lineHeight: 30 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  cardRow: { gap: 20 },
  half: { flexBasis: 'calc(50% - 10px)', flexGrow: 1 },
  full: { flexBasis: '100%' },

  /* Jackpots */
  jackpotCard: { borderRadius: 28, padding: 28, backgroundColor: C.card },
  jackpotTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 32 },
  jackpotLogoChip: { backgroundColor: '#F5F5F7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  logoPowerball: { width: 120, height: 28 },
  logoMega: { width: 96, height: 36 },
  nextDrawText: { color: C.muted, fontSize: 14 },
  jackpotLabel: { color: C.muted, fontSize: 15 },
  jackpotAmountRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 4, minHeight: 76 },
  jackpotDollar: { color: C.text, fontSize: 32, fontWeight: '600', marginBottom: 12, marginRight: 2 },
  jackpotAmount: { color: C.text, fontSize: 68, lineHeight: 76, fontWeight: '700', letterSpacing: -2.2, fontVariant: ['tabular-nums'] },
  jackpotUnit: { color: C.muted, fontSize: 24, fontWeight: '600', marginBottom: 13, marginLeft: 10 },
  jackpotSkeleton: { width: 200, height: 52, borderRadius: 12, backgroundColor: C.cardHi, marginBottom: 12 },
  jackpotPending: { flex: 1, color: C.muted, fontSize: 24, lineHeight: 30, fontWeight: '600', letterSpacing: -0.3, paddingBottom: 12 },
  jackpotRules: { color: C.faint, fontSize: 14, marginTop: 16 },

  /* Features */
  bento: { gap: 20 },
  featureCard: { borderRadius: 28, backgroundColor: C.card, padding: 28 },
  span1: { flexBasis: 'calc(33.333% - 14px)', flexGrow: 0 },
  span2: { flexBasis: 'calc(66.666% - 7px)', flexGrow: 0 },
  span3: { flexBasis: '100%' },
  featureIcon: { marginBottom: 20 },
  featureBodyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 32 },
  featureTextCol: { flex: 1 },
  featureTitle: { color: C.text, fontSize: 21, fontWeight: '600', letterSpacing: -0.3, marginBottom: 8 },
  featureDesc: { color: C.muted, fontSize: 17, lineHeight: 25 },
  chartWrap: { marginTop: 24, minWidth: 260 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120 },
  chartCol: { flex: 1, alignItems: 'center', height: '100%' },
  chartTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 6 },
  chartLabel: { color: C.faint, fontSize: 12, marginTop: 6, fontVariant: ['tabular-nums'] },
  chartLabelTop: { color: C.text, fontWeight: '600' },
  chartCaption: { color: C.faint, fontSize: 12, marginTop: 10 },

  /* Steps */
  steps: { gap: 32 },
  stepsWide: { flexDirection: 'row', gap: 28 },
  step: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.sep, paddingTop: 20 },
  stepWide: { flex: 1 },
  stepNum: { color: C.accent, fontSize: 15, fontWeight: '600', marginBottom: 10 },
  stepTitle: { color: C.text, fontSize: 21, fontWeight: '600', letterSpacing: -0.3, marginBottom: 8 },
  stepDesc: { color: C.muted, fontSize: 17, lineHeight: 25 },

  /* Pricing */
  pricingRow: { alignItems: 'stretch', maxWidth: 880, alignSelf: 'center', width: '100%' },
  planCard: { borderRadius: 28, backgroundColor: C.card, padding: 32, borderWidth: 1, borderColor: 'transparent' },
  planPro: { borderColor: 'rgba(45,212,167,0.45)' },
  planTierRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  planTier: { color: C.text, fontSize: 24, fontWeight: '600', letterSpacing: -0.3 },
  planBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(45,212,167,0.14)' },
  planBadgeText: { color: C.accent, fontSize: 13, fontWeight: '600' },
  planPriceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 20 },
  planPrice: { color: C.text, fontSize: 48, lineHeight: 52, fontWeight: '700', letterSpacing: -1.4, fontVariant: ['tabular-nums'] },
  planPer: { color: C.muted, fontSize: 17, marginBottom: 8 },
  planNote: { color: C.muted, fontSize: 15, marginTop: 8 },
  planList: { gap: 14, marginTop: 28, marginBottom: 32 },
  planLine: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planLineText: { color: C.text, fontSize: 17 },
  planBtn: { marginTop: 'auto', flexDirection: 'column', gap: 12 },
  planFine: { color: C.faint, fontSize: 13, textAlign: 'center' },

  /* Final CTA */
  finalCta: { alignItems: 'center' },
  finalBalls: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 32 },
  finalTitle: { color: C.text, fontSize: 36, lineHeight: 42, fontWeight: '700', textAlign: 'center', letterSpacing: -0.8 },
  finalTitleMid: { fontSize: 56, lineHeight: 62, letterSpacing: -1.4 },
  finalSub: { color: C.muted, fontSize: 19, lineHeight: 27, textAlign: 'center', marginTop: 16, marginBottom: 32, maxWidth: 560 },
  storeRow: { flexDirection: 'row', gap: 12, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' },
  storeImgApple: { width: 140, height: 46 },
  storeImgGoogle: { width: 156, height: 46 },

  /* Footer */
  footer: { paddingTop: 32, paddingBottom: 48, backgroundColor: C.bgAlt, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.sep },
  footerDisclaimer: { color: C.faint, fontSize: 12, lineHeight: 18 },
  footerRule: { height: StyleSheet.hairlineWidth, backgroundColor: C.sep, marginVertical: 16 },
  footerBottom: { gap: 6 },
  footerBottomRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  footerText: { color: C.faint, fontSize: 12 },
});
