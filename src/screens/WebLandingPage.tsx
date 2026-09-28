// ============================================
// Web Landing Page – marketing-style website ("draw night" dark theme)
// ============================================
// Layout lives in React Native styles. Web-only polish (gradients, glow,
// glossy balls, entrance animations, hover lift) comes from one scoped
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
  ink: '#060913',
  ink2: '#0A1020',
  surface: 'rgba(255,255,255,0.035)',
  surfaceHi: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.09)',
  text: '#F4F6FB',
  muted: '#9AA4B8',
  faint: '#667085',
  teal: '#1FD3A8',
  tealDeep: '#00A383',
  gold: '#FFC857',
  red: '#FF4D5E',
  blue: '#4C8DFF',
};

const PICK_MODES = ['Balanced', 'Hot', 'Cold', 'Anti-Crowd', 'Lucky Dates'] as const;
const PICK_CYCLE_MS = 3200;

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

function prefersReducedMotion(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
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
  const [landingJackpots, setLandingJackpots] = useState<{
    powerball: LandingJackpotDisplay | null;
    megamillions: LandingJackpotDisplay | null;
  }>({ powerball: null, megamillions: null });

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
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hero demo: draw a fresh pick every few seconds.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = setInterval(() => {
      setPick(randomPowerballPick());
      setRound((r) => r + 1);
    }, PICK_CYCLE_MS);
    return () => clearInterval(id);
  }, []);

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

  const mode = PICK_MODES[round % PICK_MODES.length];
  const score = patternScore(pick.whites);
  const sum = pick.whites.reduce((a, b) => a + b, 0);
  const odd = pick.whites.filter((n) => n % 2).length;
  const pbJackpot = landingJackpots.powerball?.amountDisplay;
  const gutter = isWide ? 40 : 16;

  const navLinks: { key: SectionKey; label: string }[] = [
    { key: 'features', label: 'Features' },
    { key: 'jackpots', label: 'Jackpots' },
    { key: 'howItWorks', label: 'How it works' },
    { key: 'pricing', label: 'Pricing' },
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      ref={scrollViewRef}
      stickyHeaderIndices={[0]}
    >
      {/* ── Nav ── */}
      <View style={styles.navShell}>
        <View style={styles.navBand} {...ld('nav')}>
          <View style={[styles.container, styles.nav, { paddingHorizontal: gutter, paddingTop: 14 + insets.top }]}>
            <LottoDreamLogo width={isMid ? 168 : 140} tone="onDark" />
            {isWide ? (
              <View style={styles.navLinks}>
                {navLinks.map((l) => (
                  <Pressable key={l.key} onPress={() => scrollToSection(l.key)} {...ld('navlink')}>
                    <Text style={styles.navLink}>{l.label}</Text>
                  </Pressable>
                ))}
                <Pressable onPress={onLogin} style={styles.navGhost} {...ld('btn-ghost')}>
                  <Text style={styles.navGhostText}>Sign in</Text>
                </Pressable>
                <Pressable onPress={onRegister} style={styles.navPrimary} {...ld('btn-primary')}>
                  <Text style={styles.navPrimaryText}>Start free</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.hamburger}
                onPress={() => setMenuOpen((v) => !v)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
              >
                <View style={[styles.hamburgerBar, menuOpen && { transform: [{ translateY: 6 }, { rotate: '45deg' }] }]} />
                <View style={[styles.hamburgerBar, menuOpen && { opacity: 0 }]} />
                <View style={[styles.hamburgerBar, menuOpen && { transform: [{ translateY: -6 }, { rotate: '-45deg' }] }]} />
              </Pressable>
            )}
          </View>
        </View>
        {!isWide && menuOpen && (
          <View style={styles.mobileOverlay}>
            <Pressable style={[styles.mobileBackdrop, { height }]} onPress={() => setMenuOpen(false)} />
            <View style={styles.mobileDrawer}>
              {navLinks.map((l) => (
                <Pressable key={l.key} style={styles.mobileDrawerItem} onPress={() => scrollToSection(l.key)}>
                  <Text style={styles.mobileDrawerText}>{l.label}</Text>
                </Pressable>
              ))}
              <View style={styles.mobileDrawerCtas}>
                <Pressable style={[styles.btn, styles.btnGhost]} onPress={() => { setMenuOpen(false); onLogin(); }} {...ld('btn-ghost')}>
                  <Text style={styles.btnGhostText}>Sign in</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => { setMenuOpen(false); onRegister(); }} {...ld('btn-primary')}>
                  <Text style={styles.btnPrimaryText}>Start free trial</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* ── Hero ── */}
      <View style={styles.heroBand} {...ld('hero')}>
        <View {...ld('orb-a')} style={styles.orbA} />
        <View {...ld('orb-b')} style={styles.orbB} />
        <View style={[styles.container, styles.hero, isWide && styles.heroWide, { paddingHorizontal: gutter }]}>
          <View style={[styles.heroCopy, isWide && styles.heroCopyWide]}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} {...ld('live-dot')} />
              <Text style={styles.livePillText}>
                {pbJackpot ? (
                  <>
                    Powerball jackpot now <Text style={styles.livePillStrong}>{pbJackpot}</Text>
                  </>
                ) : (
                  '6 games · updated after every draw'
                )}
              </Text>
            </View>

            <Text style={[styles.heroTitle, isMid && styles.heroTitleMid, isWide && styles.heroTitleWide]} accessibilityRole="header">
              Play your numbers{'\n'}
              <Text style={styles.heroTitleAccent} {...ld('grad-text')}>like you mean it.</Text>
            </Text>

            <Text style={[styles.heroSub, isWide && styles.heroSubWide]}>
              AI pick strategies, live jackpots, and a daily lucky-number reading for Powerball,
              Mega Millions, Cash4Life, Take 5, NY Lotto & Pick 10 — all in one place.
            </Text>

            <View style={[styles.heroCtas, isMid && styles.heroCtasRow]}>
              <Pressable style={[styles.btn, styles.btnPrimary, styles.btnLg]} onPress={onRegister} {...ld('btn-primary')}>
                <Text style={[styles.btnPrimaryText, styles.btnLgText]}>
                  Start {PREMIUM_TRIAL_DAYS}-day free trial
                </Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnGhost, styles.btnLg]} onPress={onLogin} {...ld('btn-ghost')}>
                <Text style={[styles.btnGhostText, styles.btnLgText]}>Sign in</Text>
              </Pressable>
            </View>

            <View style={styles.trustRow}>
              {['Free plan forever', 'Cancel anytime', 'Web · iOS · Android'].map((t) => (
                <View key={t} style={styles.trustItem}>
                  <CheckIcon color={C.teal} size={14} />
                  <Text style={styles.trustText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Live pick card */}
          <View style={[styles.pickWrap, isWide && styles.pickWrapWide]}>
            <View style={styles.pickCard} {...ld('pick-card')}>
              <View style={styles.pickHeader}>
                <View>
                  <Text style={styles.pickEyebrow}>POWERBALL · AI PICK</Text>
                  <Text style={styles.pickMode}>{mode} mode</Text>
                </View>
                <View style={styles.pickChip}>
                  <Text style={styles.pickChipText}>#{String(round + 1).padStart(3, '0')}</Text>
                </View>
              </View>

              <View style={styles.ballRow}>
                {pick.whites.map((n, i) => (
                  <Ball key={`${round}-${i}`} n={n} kind="white" size={isMid ? 54 : 44} delay={i * 90} />
                ))}
                <Ball key={`${round}-pb`} n={pick.power} kind="red" size={isMid ? 54 : 44} delay={5 * 90} />
              </View>

              <View style={styles.pickStats}>
                <View style={styles.pickStatWide}>
                  <View style={styles.pickStatHead}>
                    <Text style={styles.pickStatLabel}>Pattern score</Text>
                    <Text style={styles.pickStatValue}>{score}</Text>
                  </View>
                  <View style={styles.meterTrack}>
                    <View style={[styles.meterFill, { width: `${score}%` as any }]} {...ld('meter')} />
                  </View>
                </View>
                <View style={styles.pickStat}>
                  <Text style={styles.pickStatLabel}>Sum</Text>
                  <Text style={styles.pickStatValue}>{sum}</Text>
                </View>
                <View style={styles.pickStat}>
                  <Text style={styles.pickStatLabel}>Odd / Even</Text>
                  <Text style={styles.pickStatValue}>
                    {odd} / {5 - odd}
                  </Text>
                </View>
              </View>

              <View style={styles.modeRow}>
                {PICK_MODES.map((m) => (
                  <View key={m} style={[styles.modeChip, m === mode && styles.modeChipActive]}>
                    <Text style={[styles.modeChipText, m === mode && styles.modeChipTextActive]}>{m}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.pickFoot}>
                The odds never change — the way you pick can be a lot more fun.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Jackpots ── */}
      <View style={styles.band} {...trackSection('jackpots')}>
        <View style={[styles.container, { paddingHorizontal: gutter }]}>
          <SectionHead
            eyebrow="Live jackpots"
            title="What's on the line this week"
            sub="Estimated annuitized jackpots, refreshed throughout the day."
          />
          <View style={[styles.jackpotRow, isMid && styles.rowWrap]}>
            <JackpotCard
              kind="powerball"
              logo={POWERBALL_LOGO}
              logoStyle={styles.logoPowerball}
              name="Powerball"
              amount={landingJackpots.powerball?.amountDisplay}
              nextDraw={
                landingJackpots.powerball?.nextDrawDate ??
                nextScheduledDrawOnOrAfter(new Date(), POWERBALL_DRAW_DAYS)
              }
              rules="5 of 1–69 + Powerball 1–26 · Mon, Wed, Sat"
              wide={isMid}
            />
            <JackpotCard
              kind="mega"
              logo={MEGA_MILLIONS_LOGO}
              logoStyle={styles.logoMega}
              name="Mega Millions"
              amount={landingJackpots.megamillions?.amountDisplay}
              nextDraw={
                landingJackpots.megamillions?.nextDrawDate ??
                nextScheduledDrawOnOrAfter(new Date(), MEGA_DRAW_DAYS)
              }
              rules="5 of 1–70 + Mega Ball 1–25 · Tue, Fri"
              wide={isMid}
            />
          </View>
        </View>
      </View>

      {/* ── Features (bento) ── */}
      <View style={styles.band} {...trackSection('features')}>
        <View style={[styles.container, { paddingHorizontal: gutter }]}>
          <SectionHead
            eyebrow="Features"
            title="Everything between a hunch and a ticket"
            sub="Explore the numbers, pick a strategy, and keep your favorite sets on every device."
          />
          <View style={[styles.bento, isMid && styles.rowWrap]}>
            {FEATURES.map((f, i) => (
              <View
                key={f.title}
                style={[
                  styles.featureCard,
                  isWide && (f.span === 2 ? styles.span2 : f.span === 3 ? styles.span3 : styles.span1),
                  !isWide && isMid && (f.span === 1 ? styles.half : styles.full),
                ]}
                {...ld('card')}
              >
                <View style={[styles.featureIcon, { backgroundColor: f.tint }]} {...ld(`icon-${i % 3}`)}>
                  <Svg width={26} height={26} viewBox={FEATURE_ICON_VIEWBOX}>
                    <Path d={f.svgPath} fill="none" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
                <View style={f.span > 1 && isWide ? styles.featureBodyRow : undefined}>
                  <View style={f.span > 1 && isWide ? styles.featureTextCol : undefined}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureDesc}>{f.desc}</Text>
                  </View>
                  {f.title === 'Real-time analytics' ? <HotNumbersChart /> : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── How it works ── */}
      <View style={[styles.band, styles.bandAlt]} {...trackSection('howItWorks')}>
        <View style={[styles.container, { paddingHorizontal: gutter }]}>
          <SectionHead eyebrow="How it works" title="From sign-up to your first set in minutes" />
          <View style={[styles.steps, isWide && styles.stepsWide]}>
            {STEPS.map((s, i) => (
              <View key={s.title} style={[styles.step, isWide && styles.stepWide]}>
                <Text style={styles.stepNum} {...ld('step-num')}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── Pricing ── */}
      <View style={styles.band} {...trackSection('pricing')}>
        <View style={[styles.container, { paddingHorizontal: gutter }]}>
          <SectionHead
            eyebrow="Pricing"
            title={`${PREMIUM_TRIAL_DAYS} days free. Then less than a ticket a week.`}
            sub="Pure Random stays free forever. Premium unlocks every strategy and all six games."
          />
          <View style={[styles.pricingRow, isMid && styles.rowWrap]}>
            <View style={[styles.planCard, isMid && styles.planHalf]} {...ld('card')}>
              <Text style={styles.planTier}>Free</Text>
              <View style={styles.planPriceRow}>
                <Text style={styles.planPrice}>$0</Text>
                <Text style={styles.planPer}>forever</Text>
              </View>
              <Text style={styles.planNote}>Everything you need to explore.</Text>
              <View style={styles.planList}>
                {['Pure Random picks', 'Live jackpots & draw results', 'Full draw history', 'Save up to 3 sets'].map((t) => (
                  <PlanLine key={t} text={t} />
                ))}
              </View>
              <Pressable style={[styles.btn, styles.btnGhost, styles.planBtn]} onPress={onRegister} {...ld('btn-ghost')}>
                <Text style={styles.btnGhostText}>Create free account</Text>
              </Pressable>
            </View>

            <View style={[styles.planProOuter, isMid && styles.planHalf]} {...ld('pro-border')}>
              <View style={[styles.planCard, styles.planPro]}>
                <View style={styles.planBadge} {...ld('badge')}>
                  <Text style={styles.planBadgeText}>{PREMIUM_TRIAL_DAYS} DAYS FREE</Text>
                </View>
                <Text style={[styles.planTier, { color: C.gold }]}>Premium</Text>
                <View style={styles.planPriceRow}>
                  <Text style={styles.planPrice}>{PREMIUM_PRICE_DISPLAY}</Text>
                  <Text style={styles.planPer}>{PREMIUM_PRICE_PERIOD.replace('/', 'per ')}</Text>
                </View>
                <Text style={styles.planNote}>
                  or {PREMIUM_YEARLY_PRICE_DISPLAY}
                  {PREMIUM_YEARLY_PRICE_PERIOD} —{' '}
                  <Text style={{ color: C.teal, fontWeight: '700' }}>save {PREMIUM_YEARLY_SAVINGS_PCT}%</Text>
                </Text>
                <View style={styles.planList}>
                  {[
                    '5 AI pick strategies',
                    "Today's Fortune lucky numbers",
                    'Pattern scores & backtests',
                    'All 6 games, unlimited saves',
                    'Priority support',
                  ].map((t) => (
                    <PlanLine key={t} text={t} accent />
                  ))}
                </View>
                <Pressable style={[styles.btn, styles.btnPrimary, styles.planBtn]} onPress={onRegister} {...ld('btn-primary')}>
                  <Text style={styles.btnPrimaryText}>Start free trial</Text>
                </Pressable>
                <Text style={styles.planFine}>Card required · cancel anytime before day {PREMIUM_TRIAL_DAYS}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ── Final CTA ── */}
      <View style={styles.band}>
        <View style={[styles.container, { paddingHorizontal: gutter }]}>
          <View style={[styles.finalCta, isWide && styles.finalCtaWide]} {...ld('final-cta')}>
            <View style={[styles.finalBalls, { pointerEvents: 'none' }]}>
              <Ball n={7} kind="white" size={isMid ? 64 : 46} float={0} />
              <Ball n={21} kind="gold" size={isMid ? 52 : 38} float={1} />
              <Ball n={26} kind="red" size={isMid ? 58 : 42} float={2} />
            </View>
            <Text style={[styles.finalTitle, isMid && styles.finalTitleMid]}>Your lucky numbers are waiting.</Text>
            <Text style={styles.finalSub}>
              Save your picks, track every draw, and play your own way — on the web and on your phone.
            </Text>
            <Pressable style={[styles.btn, styles.btnDark, styles.btnLg]} onPress={onRegister} {...ld('btn-dark')}>
              <Text style={[styles.btnDarkText, styles.btnLgText]}>Get started free</Text>
            </Pressable>
            <View style={styles.storeRow}>
              <View style={styles.storeBadge} accessibilityRole="image" accessibilityLabel="Download on the App Store">
                <Image source={APP_STORE_BADGE} style={styles.storeImgApple} resizeMode="contain" />
              </View>
              <View style={styles.storeBadge} accessibilityRole="image" accessibilityLabel="Get it on Google Play">
                <Image source={GOOGLE_PLAY_BADGE} style={styles.storeImgGoogle} resizeMode="contain" />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View style={[styles.container, { paddingHorizontal: gutter }]}>
          <LottoDreamLogo width={140} tone="onDark" />
          <Text style={styles.footerDisclaimer}>
            LottoDream is not affiliated with, endorsed by, or sponsored by the Multi-State Lottery
            Association, Powerball, or Mega Millions. Lottery games involve random outcomes. No system,
            including AI-based analysis, can guarantee a winning ticket or change the odds. Play
            responsibly. Must be 18+ (or the legal gambling age in your jurisdiction) to play.
          </Text>
          <Text style={styles.footerText}>Data sourced from NY Open Data · Updated after every drawing</Text>
          <Text style={styles.footerText}>© {new Date().getFullYear()} Lotto Dream. All rights reserved.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

/* ── Pieces ── */

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Text style={[styles.sectionTitle, width >= 640 && styles.sectionTitleMid]} accessibilityRole="header">
        {title}
      </Text>
      {sub ? <Text style={styles.sectionSub}>{sub}</Text> : null}
    </View>
  );
}

const BALL_FALLBACK = { white: '#E9EDF5', red: C.red, gold: C.gold } as const;

function Ball({
  n,
  kind,
  size,
  delay,
  float,
}: {
  n: number;
  kind: 'white' | 'red' | 'gold';
  size: number;
  delay?: number;
  float?: number;
}) {
  const webAnim =
    Platform.OS === 'web'
      ? ({
          dataSet: { ld: float != null ? `ball-${kind} float-${float}` : `ball-${kind} pop` },
          style: { animationDelay: `${delay ?? 0}ms` },
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
      <Text
        style={[
          styles.ballText,
          { fontSize: size * 0.38, color: kind === 'white' ? '#0B1222' : '#FFFFFF' },
        ]}
      >
        {n}
      </Text>
    </View>
  );
}

function JackpotCard({
  kind,
  logo,
  logoStyle,
  name,
  amount,
  nextDraw,
  rules,
  wide,
}: {
  kind: 'powerball' | 'mega';
  logo: any;
  logoStyle: object;
  name: string;
  amount?: string;
  nextDraw: Date;
  rules: string;
  wide: boolean;
}) {
  const [num, unit] = amount ? amount.replace('$', '').split(/\s+/, 2) : ['—', ''];
  return (
    <View
      style={[styles.jackpotCard, wide && styles.planHalf, { borderColor: kind === 'powerball' ? 'rgba(255,77,94,0.35)' : 'rgba(255,200,87,0.35)' }]}
      {...ld(`jackpot-${kind}`)}
    >
      <View style={styles.jackpotTop}>
        <View style={styles.jackpotLogoChip}>
          <Image source={logo} style={logoStyle} resizeMode="contain" accessibilityLabel={`${name} logo`} />
        </View>
        <View style={styles.nextDrawPill}>
          <Text style={styles.nextDrawText}>Next draw · {formatWeekdayShortDate(nextDraw)}</Text>
        </View>
      </View>
      <Text style={styles.jackpotLabel}>ESTIMATED JACKPOT</Text>
      <View style={styles.jackpotAmountRow}>
        {amount ? <Text style={styles.jackpotDollar}>$</Text> : null}
        <Text style={styles.jackpotAmount} {...ld(kind === 'powerball' ? 'amount-red' : 'amount-gold')}>
          {num}
        </Text>
        {unit ? <Text style={styles.jackpotUnit}>{unit}</Text> : null}
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
    <View style={styles.chart} accessibilityLabel="Example hot-number frequency chart">
      {HOT_BARS.map((b, i) => (
        <View key={b.n} style={styles.chartCol}>
          <View style={styles.chartTrack}>
            <View
              style={[styles.chartBar, { height: `${b.v * 100}%` as any, backgroundColor: i === 0 ? C.gold : C.teal }]}
              {...ld('bar')}
            />
          </View>
          <Text style={styles.chartLabel}>{b.n}</Text>
        </View>
      ))}
    </View>
  );
}

function CheckIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlanLine({ text, accent }: { text: string; accent?: boolean }) {
  return (
    <View style={styles.planLine}>
      <CheckIcon color={accent ? C.gold : C.teal} />
      <Text style={styles.planLineText}>{text}</Text>
    </View>
  );
}

/* ── Static data ── */

const FEATURES: { title: string; desc: string; svgPath: string; tint: string; span: 1 | 2 | 3 }[] = [
  {
    title: 'Real-time analytics',
    desc: 'See which numbers are running hot, which pairs show up together, and what is overdue — across years of draws.',
    svgPath: FEATURE_BAR_PATH,
    tint: C.tealDeep,
    span: 2,
  },
  {
    title: 'AI pick strategies',
    desc: 'Hot, Cold, Balanced, Anti-Crowd and Lucky Dates — or keep it pure random.',
    svgPath: FEATURE_AI_PATH,
    tint: '#7C5CFF',
    span: 1,
  },
  {
    title: "Today's Fortune",
    desc: 'A daily luck reading from your birthdate with matching numbers. Never stored.',
    svgPath: FEATURE_BOLT_PATH,
    tint: '#E0A100',
    span: 1,
  },
  {
    title: '6 lottery games',
    desc: 'Powerball, Mega Millions, Cash4Life, Take 5, NY Lotto & Pick 10.',
    svgPath: FEATURE_HISTORY_PATH,
    tint: '#E5484D',
    span: 1,
  },
  {
    title: 'Pattern scores',
    desc: 'Every pick gets a pattern score, a backtest against past draws, and a Monte Carlo view.',
    svgPath: FEATURE_PLATFORM_PATH,
    tint: '#2F6FED',
    span: 1,
  },
  {
    title: 'Private by design',
    desc: 'Your picks sync securely across web, iPhone and Android. We never sell or share your data.',
    svgPath: FEATURE_SECURE_PATH,
    tint: '#12805C',
    span: 3,
  },
];

const STEPS = [
  { title: 'Create an account', desc: 'Sign up in seconds with email or Google — the free plan never expires.' },
  { title: 'Explore the data', desc: 'Browse hot/cold trends, draw history, and live jackpots for every game.' },
  { title: 'Build your picks', desc: 'Choose a strategy, add your lucky dates, and generate a set you like.' },
  { title: 'Save & play', desc: 'Keep favorite sets, check them against each draw, and tweak as you go.' },
];

/* ── Web-only stylesheet (hooks via data-ld) ── */

const LANDING_CSS = `
[data-ld~="nav"] { backdrop-filter: saturate(160%) blur(14px); -webkit-backdrop-filter: saturate(160%) blur(14px); background: rgba(6,9,19,0.72) !important; }
[data-ld~="navlink"] > div { transition: color .15s ease; }
[data-ld~="navlink"]:hover > div { color: #FFFFFF !important; }

[data-ld~="hero"] { background:
  radial-gradient(1200px 600px at 85% -10%, rgba(31,211,168,0.16), transparent 60%),
  radial-gradient(900px 500px at -10% 30%, rgba(124,92,255,0.14), transparent 60%),
  linear-gradient(180deg, #060913 0%, #0A1020 100%) !important; }
[data-ld~="orb-a"], [data-ld~="orb-b"] { filter: blur(60px); animation: ld-drift 14s ease-in-out infinite alternate; }
[data-ld~="orb-a"] { background: radial-gradient(circle, rgba(255,200,87,0.35), transparent 70%) !important; }
[data-ld~="orb-b"] { background: radial-gradient(circle, rgba(255,77,94,0.25), transparent 70%) !important; animation-duration: 18s; }
@keyframes ld-drift { from { transform: translate(0,0) scale(1); } to { transform: translate(-40px, 30px) scale(1.15); } }

[data-ld~="grad-text"] { background: linear-gradient(92deg, #1FD3A8 0%, #FFC857 55%, #FF7A59 100%); -webkit-background-clip: text; background-clip: text; color: transparent !important; }
[data-ld~="step-num"] { background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.08)); -webkit-background-clip: text; background-clip: text; color: transparent !important; }
[data-ld~="amount-red"] { background: linear-gradient(180deg, #FFFFFF 20%, #FF9AA5 100%); -webkit-background-clip: text; background-clip: text; color: transparent !important; }
[data-ld~="amount-gold"] { background: linear-gradient(180deg, #FFFFFF 20%, #FFD98A 100%); -webkit-background-clip: text; background-clip: text; color: transparent !important; }

[data-ld~="live-dot"] { box-shadow: 0 0 0 0 rgba(31,211,168,0.7); animation: ld-pulse 1.8s ease-out infinite; }
@keyframes ld-pulse { to { box-shadow: 0 0 0 10px rgba(31,211,168,0); } }

[data-ld~="pick-card"] { background: linear-gradient(160deg, rgba(255,255,255,0.09), rgba(255,255,255,0.02)) !important; box-shadow: 0 40px 80px -30px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.12); backdrop-filter: blur(10px); }
[data-ld~="meter"] { background: linear-gradient(90deg, #1FD3A8, #FFC857) !important; transition: width .6s cubic-bezier(.2,.8,.2,1); }

[data-ld~="ball-white"] { background: radial-gradient(circle at 32% 28%, #FFFFFF 0%, #EEF1F7 38%, #B7C0D1 100%) !important; box-shadow: inset -4px -6px 12px rgba(0,0,0,0.18), 0 10px 20px -8px rgba(0,0,0,0.6); }
[data-ld~="ball-red"] { background: radial-gradient(circle at 32% 28%, #FFB3BB 0%, #FF4D5E 42%, #9E1026 100%) !important; box-shadow: inset -4px -6px 12px rgba(0,0,0,0.25), 0 10px 24px -6px rgba(255,77,94,0.55); }
[data-ld~="ball-gold"] { background: radial-gradient(circle at 32% 28%, #FFF1C7 0%, #FFC857 45%, #B7791F 100%) !important; box-shadow: inset -4px -6px 12px rgba(0,0,0,0.2), 0 10px 24px -6px rgba(255,200,87,0.5); }
[data-ld~="pop"] { animation: ld-pop .55s cubic-bezier(.2,1.4,.4,1) both; }
@keyframes ld-pop { from { transform: translateY(-18px) scale(.4) rotate(-90deg); opacity: 0; } to { transform: none; opacity: 1; } }
[data-ld~="float-0"], [data-ld~="float-1"], [data-ld~="float-2"] { animation: ld-float 5s ease-in-out infinite; }
[data-ld~="float-1"] { animation-delay: -1.6s; animation-duration: 6s; }
[data-ld~="float-2"] { animation-delay: -3.1s; animation-duration: 5.5s; }
@keyframes ld-float { 50% { transform: translateY(-10px) rotate(8deg); } }

[data-ld~="card"], [data-ld~="jackpot-powerball"], [data-ld~="jackpot-mega"] { transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
[data-ld~="card"]:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.18) !important; box-shadow: 0 24px 50px -24px rgba(0,0,0,0.8); }
[data-ld~="jackpot-powerball"] { background: radial-gradient(600px 300px at 0% 0%, rgba(255,77,94,0.28), transparent 60%), linear-gradient(160deg, #1A0B12, #0B0B16) !important; }
[data-ld~="jackpot-mega"] { background: radial-gradient(600px 300px at 0% 0%, rgba(255,200,87,0.22), transparent 60%), linear-gradient(160deg, #0B1530, #0B0B16) !important; }
[data-ld~="jackpot-powerball"]:hover, [data-ld~="jackpot-mega"]:hover { transform: translateY(-4px); }
[data-ld~="icon-0"], [data-ld~="icon-1"], [data-ld~="icon-2"] { box-shadow: inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 20px -8px rgba(0,0,0,0.6); }
[data-ld~="bar"] { transform-origin: bottom; animation: ld-grow .9s cubic-bezier(.2,.8,.2,1) both; }
@keyframes ld-grow { from { transform: scaleY(0); } }

[data-ld~="pro-border"] { background: linear-gradient(140deg, #FFC857, #1FD3A8 50%, #7C5CFF) !important; box-shadow: 0 30px 80px -30px rgba(255,200,87,0.35); }
[data-ld~="badge"] { background: linear-gradient(90deg, #FFC857, #FF9F5A) !important; }

[data-ld~="btn-primary"] { background: linear-gradient(180deg, #2BE3B6, #00A383) !important; box-shadow: 0 10px 30px -10px rgba(31,211,168,0.7), inset 0 1px 0 rgba(255,255,255,0.35); transition: transform .15s ease, box-shadow .15s ease, filter .15s ease; cursor: pointer; }
[data-ld~="btn-primary"]:hover { transform: translateY(-1px); filter: brightness(1.06); box-shadow: 0 16px 40px -12px rgba(31,211,168,0.85), inset 0 1px 0 rgba(255,255,255,0.35); }
[data-ld~="btn-ghost"] { transition: background-color .15s ease, border-color .15s ease; cursor: pointer; }
[data-ld~="btn-ghost"]:hover { background-color: rgba(255,255,255,0.08) !important; border-color: rgba(255,255,255,0.3) !important; }
[data-ld~="btn-dark"] { transition: transform .15s ease; cursor: pointer; }
[data-ld~="btn-dark"]:hover { transform: translateY(-1px); }

[data-ld~="final-cta"] { background:
  radial-gradient(700px 400px at 100% 0%, rgba(255,200,87,0.55), transparent 60%),
  radial-gradient(700px 400px at 0% 100%, rgba(124,92,255,0.45), transparent 60%),
  linear-gradient(135deg, #00A383, #0E7A67) !important; }

[data-ld~="btn-primary"]:focus-visible, [data-ld~="btn-ghost"]:focus-visible, [data-ld~="btn-dark"]:focus-visible, [data-ld~="navlink"]:focus-visible { outline: 2px solid #FFC857; outline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  [data-ld] { animation: none !important; transition: none !important; }
}
`;

/* ── Styles ── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.ink },
  scroll: { minHeight: '100%' as any, backgroundColor: C.ink },
  container: { width: '100%' as any, maxWidth: 1200, alignSelf: 'center' },

  /* Nav */
  navShell: { position: 'relative', zIndex: 30 },
  navBand: {
    backgroundColor: 'rgba(6,9,19,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 28 },
  navLink: { color: C.muted, fontSize: 14, fontWeight: '500' },
  navGhost: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  navGhostText: { color: C.text, fontSize: 14, fontWeight: '600' },
  navPrimary: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: C.tealDeep, marginLeft: -16 },
  navPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  hamburger: { width: 28, height: 20, justifyContent: 'space-between', paddingVertical: 1 },
  hamburgerBar: { height: 2, borderRadius: 2, backgroundColor: C.text },
  mobileOverlay: { position: 'absolute', top: '100%' as any, left: 0, right: 0, zIndex: 40 },
  mobileBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)' },
  mobileDrawer: {
    backgroundColor: C.ink2,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  mobileDrawerItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  mobileDrawerText: { color: C.text, fontSize: 16, fontWeight: '500' },
  mobileDrawerCtas: { flexDirection: 'row', gap: 10, marginTop: 16 },

  /* Buttons */
  btn: {
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  btnLg: { paddingHorizontal: 28, paddingVertical: 16, flexGrow: 0 },
  btnLgText: { fontSize: 16 },
  btnPrimary: { backgroundColor: C.tealDeep },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  btnGhost: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(255,255,255,0.03)' },
  btnGhostText: { color: C.text, fontSize: 15, fontWeight: '600' },
  btnDark: { backgroundColor: C.ink },
  btnDarkText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  /* Hero */
  heroBand: { position: 'relative', overflow: 'hidden', backgroundColor: C.ink2 },
  orbA: { position: 'absolute', width: 420, height: 420, borderRadius: 210, right: -80, top: 120 },
  orbB: { position: 'absolute', width: 360, height: 360, borderRadius: 180, left: '35%' as any, bottom: -160 },
  hero: { paddingTop: 48, paddingBottom: 64, gap: 48 },
  heroWide: { flexDirection: 'row', alignItems: 'center', paddingTop: 88, paddingBottom: 112, gap: 56 },
  heroCopy: {},
  heroCopyWide: { flex: 1.05 },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(31,211,168,0.35)',
    backgroundColor: 'rgba(31,211,168,0.08)',
    marginBottom: 24,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.teal },
  livePillText: { color: '#CFF7EC', fontSize: 13, fontWeight: '500' },
  livePillStrong: { color: '#FFFFFF', fontWeight: '800' },
  heroTitle: { color: C.text, fontSize: 42, lineHeight: 46, fontWeight: '800', letterSpacing: -1.2 },
  heroTitleMid: { fontSize: 58, lineHeight: 62, letterSpacing: -1.8 },
  heroTitleWide: { fontSize: 64, lineHeight: 68, letterSpacing: -2.2 },
  heroTitleAccent: { color: C.teal },
  heroSub: { color: C.muted, fontSize: 17, lineHeight: 27, marginTop: 22, maxWidth: 560 },
  heroSubWide: { fontSize: 19, lineHeight: 30 },
  heroCtas: { marginTop: 32, gap: 12 },
  heroCtasRow: { flexDirection: 'row', flexWrap: 'wrap' },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 22 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustText: { color: C.muted, fontSize: 13 },

  /* Pick card */
  pickWrap: { width: '100%' as any, maxWidth: 520, alignSelf: 'center' },
  pickWrapWide: { flex: 1, alignSelf: 'auto' as any },
  pickCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 24,
  },
  pickHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  pickEyebrow: { color: C.faint, fontSize: 11, fontWeight: '700', letterSpacing: 1.6 },
  pickMode: { color: C.text, fontSize: 20, fontWeight: '700', marginTop: 4 },
  pickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: C.border,
  },
  pickChipText: { color: C.muted, fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  ballRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginBottom: 24 },
  ball: { alignItems: 'center', justifyContent: 'center' },
  ballText: { fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  pickStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderColor: C.border,
  },
  pickStatWide: { flexBasis: '100%' as any },
  pickStatHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  pickStat: { flex: 1 },
  pickStatLabel: { color: C.faint, fontSize: 12, fontWeight: '500' },
  pickStatValue: { color: C.text, fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 2 },
  meterTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  meterFill: { height: 8, borderRadius: 4, backgroundColor: C.teal },
  modeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
  },
  modeChipActive: { backgroundColor: 'rgba(31,211,168,0.14)', borderColor: 'rgba(31,211,168,0.55)' },
  modeChipText: { color: C.faint, fontSize: 12, fontWeight: '600' },
  modeChipTextActive: { color: C.teal },
  pickFoot: { color: C.faint, fontSize: 12, marginTop: 18, lineHeight: 18 },

  /* Sections */
  band: { paddingVertical: 80, backgroundColor: C.ink },
  bandAlt: { backgroundColor: C.ink2, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.border },
  sectionHead: { marginBottom: 40, maxWidth: 720 },
  eyebrow: { color: C.teal, fontSize: 12, fontWeight: '700', letterSpacing: 2.4, marginBottom: 12 },
  sectionTitle: { color: C.text, fontSize: 30, lineHeight: 36, fontWeight: '800', letterSpacing: -0.8 },
  sectionTitleMid: { fontSize: 42, lineHeight: 48, letterSpacing: -1.2 },
  sectionSub: { color: C.muted, fontSize: 17, lineHeight: 26, marginTop: 14 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },

  /* Jackpots */
  jackpotRow: { gap: 20 },
  jackpotCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    backgroundColor: '#10101C',
    overflow: 'hidden',
  },
  jackpotTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 28 },
  jackpotLogoChip: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  logoPowerball: { width: 120, height: 28 },
  logoMega: { width: 96, height: 36 },
  nextDrawPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: C.border,
  },
  nextDrawText: { color: C.text, fontSize: 12, fontWeight: '600' },
  jackpotLabel: { color: C.faint, fontSize: 11, fontWeight: '700', letterSpacing: 1.8 },
  jackpotAmountRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 6 },
  jackpotDollar: { color: C.text, fontSize: 32, fontWeight: '700', marginBottom: 14, marginRight: 2 },
  jackpotAmount: { color: C.text, fontSize: 76, lineHeight: 84, fontWeight: '800', letterSpacing: -3, fontVariant: ['tabular-nums'] },
  jackpotUnit: { color: C.muted, fontSize: 22, fontWeight: '600', marginBottom: 16, marginLeft: 10 },
  jackpotRules: { color: C.muted, fontSize: 13, marginTop: 14 },

  /* Bento */
  bento: { gap: 16 },
  featureCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    padding: 26,
  },
  span1: { flexBasis: 'calc(33.333% - 11px)' as any, flexGrow: 0 },
  span2: { flexBasis: 'calc(66.666% - 6px)' as any, flexGrow: 0 },
  span3: { flexBasis: '100%' as any },
  half: { flexBasis: 'calc(50% - 8px)' as any },
  full: { flexBasis: '100%' as any },
  featureIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  featureBodyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 28 },
  featureTextCol: { flex: 1 },
  featureTitle: { color: C.text, fontSize: 19, fontWeight: '700', marginBottom: 8 },
  featureDesc: { color: C.muted, fontSize: 15, lineHeight: 23 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120, marginTop: 20, minWidth: 260 },
  chartCol: { flex: 1, alignItems: 'center', height: '100%' as any },
  chartTrack: { flex: 1, width: '100%' as any, justifyContent: 'flex-end' },
  chartBar: { width: '100%' as any, borderRadius: 6 },
  chartLabel: { color: C.faint, fontSize: 11, marginTop: 6, fontVariant: ['tabular-nums'] },

  /* Steps */
  steps: { gap: 28 },
  stepsWide: { flexDirection: 'row', gap: 24 },
  step: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.14)', paddingTop: 20 },
  stepWide: { flex: 1 },
  stepNum: { color: C.muted, fontSize: 56, lineHeight: 60, fontWeight: '800', letterSpacing: -2, marginBottom: 12 },
  stepTitle: { color: C.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  stepDesc: { color: C.muted, fontSize: 15, lineHeight: 23 },

  /* Pricing */
  pricingRow: { gap: 20, alignItems: 'stretch' },
  planHalf: { flexBasis: 'calc(50% - 10px)' as any, flexGrow: 1 },
  planCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    padding: 30,
  },
  planProOuter: { borderRadius: 25, padding: 1.5, backgroundColor: C.gold },
  planPro: { backgroundColor: '#0C1222', borderWidth: 0, flex: 1, borderRadius: 24 },
  planBadge: {
    position: 'absolute',
    top: 24,
    right: 24,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: C.gold,
  },
  planBadgeText: { color: '#1A1300', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  planTier: { color: C.muted, fontSize: 14, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  planPriceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 14 },
  planPrice: { color: C.text, fontSize: 52, lineHeight: 56, fontWeight: '800', letterSpacing: -1.5 },
  planPer: { color: C.muted, fontSize: 15, marginBottom: 9 },
  planNote: { color: C.muted, fontSize: 14, marginTop: 8 },
  planList: { gap: 12, marginTop: 24, marginBottom: 28 },
  planLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planLineText: { color: C.text, fontSize: 15 },
  planBtn: { marginTop: 'auto' as any, flexGrow: 0 },
  planFine: { color: C.faint, fontSize: 12, textAlign: 'center', marginTop: 12 },

  /* Final CTA */
  finalCta: {
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingVertical: 56,
    alignItems: 'center',
    backgroundColor: C.tealDeep,
    overflow: 'hidden',
  },
  finalCtaWide: { paddingVertical: 80 },
  finalBalls: { flexDirection: 'row', gap: 14, alignItems: 'center', marginBottom: 28 },
  finalTitle: { color: '#FFFFFF', fontSize: 32, lineHeight: 38, fontWeight: '800', textAlign: 'center', letterSpacing: -1 },
  finalTitleMid: { fontSize: 48, lineHeight: 54, letterSpacing: -1.6 },
  finalSub: { color: 'rgba(255,255,255,0.85)', fontSize: 17, lineHeight: 26, textAlign: 'center', marginTop: 14, marginBottom: 30, maxWidth: 560 },
  storeRow: { flexDirection: 'row', gap: 12, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' },
  storeBadge: { opacity: 0.95 },
  storeImgApple: { width: 140, height: 46 },
  storeImgGoogle: { width: 156, height: 46 },

  /* Footer */
  footer: { paddingTop: 48, paddingBottom: 56, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.ink },
  footerDisclaimer: { color: C.faint, fontSize: 13, lineHeight: 20, marginTop: 20, marginBottom: 16, maxWidth: 820 },
  footerText: { color: C.faint, fontSize: 12, marginTop: 4 },
});
