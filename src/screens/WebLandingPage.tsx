// ============================================
// Web Landing Page – marketing-style website
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LottoDreamLogo } from '../components/LottoDreamLogo';
import { fetchLandingGameJackpots, type LandingJackpotDisplay } from '../services/jackpotDisplayService';

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

const FEATURE_ICON_SIZE = 32.4;
const STICKY_NAV_OFFSET = 88;
const POWERBALL_LOGO = require('../../assets/powerball-logo.png');
const MEGA_MILLIONS_LOGO = require('../../assets/mega-millions-logo.png');
const APP_STORE_BADGE = require('../../assets/badge-appstore.png');
const GOOGLE_PLAY_BADGE = require('../../assets/badge-googleplay.png');

/** Mon, Wed, Sat (JS getDay: 0 Sun … 6 Sat) */
const POWERBALL_DRAW_DAYS = [1, 3, 6];
/** Tue, Fri */
const MEGA_DRAW_DAYS = [2, 5];

function formatWeekdayShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

export function WebLandingPage({ onLogin, onRegister }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 768;
  
  const scrollViewRef = useRef<ScrollView>(null);
  const [sectionY, setSectionY] = useState({ features: 0, howItWorks: 0, supportedGames: 0 });
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [landingJackpots, setLandingJackpots] = useState<{
    powerball: LandingJackpotDisplay | null;
    megamillions: LandingJackpotDisplay | null;
  }>({ powerball: null, megamillions: null });

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

  const scrollToSection = (sectionKey: 'features' | 'howItWorks' | 'supportedGames') => {
    const yOffset = Math.max(sectionY[sectionKey] - STICKY_NAV_OFFSET, 0);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        y: yOffset,
        animated: true,
      });
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      ref={scrollViewRef}
      stickyHeaderIndices={[0]}
    >
      {/* ── Navbar: full-width white band; logo & links capped at 1280 like main column ── */}
      <View style={styles.navShell}>
        <View style={styles.navBand}>
          <View style={styles.navInner}>
            <View style={[styles.nav, isWide && styles.navWide, { paddingTop: 20 + insets.top }]}>
              <View style={styles.navLogoWrap}>
                <LottoDreamLogo width={200} />
              </View>
              {isWide ? (
                <View style={styles.navLinks}>
                  <TouchableOpacity onPress={() => scrollToSection('features')}>
                    <Text style={styles.navLink}>Features</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => scrollToSection('howItWorks')}>
                    <Text style={styles.navLink}>How It Works</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => scrollToSection('supportedGames')}>
                    <Text style={styles.navLink}>Supported Games</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.navLoginBtn, { backgroundColor: hoveredButton === 'navSignIn' ? 'rgba(113, 128, 150, 0.15)' : 'rgba(113, 128, 150, 0.08)' }]}
                    {...({ onMouseEnter: () => setHoveredButton('navSignIn'), onMouseLeave: () => setHoveredButton(null) } as any)}
                    onPress={onLogin}
                  >
                    <Text style={styles.navLoginText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.hamburger} onPress={() => setMenuOpen(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <View style={[styles.hamburgerBar, styles.hamburgerBarTop, menuOpen && styles.hamburgerBarTopOpen]} />
                  <View style={[styles.hamburgerBar, styles.hamburgerBarMid, menuOpen && styles.hamburgerBarMidOpen]} />
                  <View style={[styles.hamburgerBar, styles.hamburgerBarBot, menuOpen && styles.hamburgerBarBotOpen]} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        {/* ── Mobile Drawer Overlay ── */}
        {!isWide && menuOpen && (
          <View style={styles.mobileOverlay}>
            <TouchableOpacity
              style={[styles.mobileOverlayBackdrop, { height }]}
              activeOpacity={1}
              onPress={() => setMenuOpen(false)}
            />
            <View style={styles.mobileDrawer}>
              <TouchableOpacity style={styles.mobileDrawerItem} onPress={() => { scrollToSection('features'); setMenuOpen(false); }}>
                <Text style={styles.mobileDrawerText}>Features</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mobileDrawerItem} onPress={() => { scrollToSection('howItWorks'); setMenuOpen(false); }}>
                <Text style={styles.mobileDrawerText}>How It Works</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mobileDrawerItem} onPress={() => { scrollToSection('supportedGames'); setMenuOpen(false); }}>
                <Text style={styles.mobileDrawerText}>Supported Games</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.88}
                style={[
                  styles.ctaPrimary,
                  styles.ctaPrimaryWide,
                  { marginTop: 12 },
                  Platform.OS === 'web' && styles.ctaPrimaryWeb,
                  { backgroundColor: hoveredButton === 'mobileSignIn' ? '#00B896' : '#00A383' },
                ]}
                onPress={() => { onLogin(); setMenuOpen(false); }}
                {...({ onMouseEnter: () => setHoveredButton('mobileSignIn'), onMouseLeave: () => setHoveredButton(null) } as any)}
              >
                <Text style={styles.ctaPrimaryText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* ── Hero ── */}
      <View style={[styles.hero, isWide && styles.heroWide]}>
        <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>
          Smarter Lottery Picks{`\n`}
          <Text style={styles.heroTitleAccent}>Powered by AI</Text>
        </Text>
        <Text style={[styles.heroSub, isWide && styles.heroSubWide]}>
          Analyze Powerball & Mega Millions draw history, discover hot/cold patterns,
          and generate AI-powered number picks — all in one place.
        </Text>
        <View style={[styles.heroCtas, isWide && styles.heroCtasWide]}>
          <TouchableOpacity
            activeOpacity={0.88}
            style={[
              styles.ctaPrimary,
              styles.ctaPrimaryWide,
              Platform.OS === 'web' && styles.ctaPrimaryWeb,
              { backgroundColor: hoveredButton === 'getStarted' ? '#00B896' : '#00A383' },
            ]}
            onPress={onRegister}
            {...({ onMouseEnter: () => setHoveredButton('getStarted'), onMouseLeave: () => setHoveredButton(null) } as any)}
          >
            <Text style={styles.ctaPrimaryText}>Getting Started</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Feature Cards ── */}
      <View 
        style={[styles.section, styles.featuresSection, isWide && styles.sectionWide]}
        onLayout={(event) => {
          setSectionY((prev) => ({
            ...prev,
            features: event.nativeEvent.layout.y,
          }));
        }}
      >
        <Text style={styles.sectionTitle}>Dashboard powered Lottery Tools</Text>
        <Text style={styles.sectionSub}>
        Track numbers, generate combinations, and turn lucky dates into personalized picks.
        </Text>

          <View style={[styles.featureGrid, isWide && styles.featureGridWide]}>
            {FEATURES.map((f, i) => (
              <View key={i} style={[styles.featureCard, isWide && styles.featureCardWide]}>
                <View style={styles.featureSvgWrap}>
                  <Svg width={FEATURE_ICON_SIZE} height={FEATURE_ICON_SIZE} viewBox={FEATURE_ICON_VIEWBOX}>
                    <Path
                      d={f.svgPath}
                      fill="none"
                      stroke="#148c74"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
      </View>

      {/* ── How It Works (full-bleed gray band on web) ── */}
      <View
        style={styles.howItWorksBand}
        onLayout={(event) => {
          setSectionY((prev) => ({
            ...prev,
            howItWorks: event.nativeEvent.layout.y,
          }));
        }}
      >
        <View style={[styles.section, isWide && styles.sectionWide]}>
          <Text style={[styles.sectionTitle]}>How It Works</Text>
          <Text style={[styles.sectionSub, styles.howItWorksSub]}>
            Four steps from sign up to your first personalized number set.
          </Text>

          <View style={[styles.stepsRow, isWide && styles.stepsRowWide]}>
            {STEPS.map((s, i) => (
              <View key={i} style={[styles.stepCard, isWide && styles.stepCardWide]}>
                <View style={[styles.stepBadgeRow, isWide && styles.stepBadgeRowWide]}>
                  {isWide && <View style={[styles.stepHLine, i === 0 && styles.stepHLineHidden]} />}
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNum}>{i + 1}</Text>
                  </View>
                  {isWide && <View style={[styles.stepHLine, i === STEPS.length - 1 && styles.stepHLineHidden]} />}
                </View>
                <Text style={[styles.stepTitle, isWide && styles.stepTitleWide]}>{s.title}</Text>
                <Text style={[styles.stepDesc, isWide && styles.stepDescWide]}>{s.desc}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── Games ── */}
      <View
        style={[styles.section, isWide && styles.sectionWide, styles.supportedGamesSection]}
        onLayout={(event) => {
          setSectionY((prev) => ({
            ...prev,
            supportedGames: event.nativeEvent.layout.y,
          }));
        }}
      >
        <Text style={[styles.sectionTitle]}>Supported Games</Text>
        <View style={[styles.gamesRow, isWide && styles.gamesRowWide]}>
          <View style={[styles.gameCard, isWide && styles.gameCardWide]}>
            <Image source={POWERBALL_LOGO} style={styles.gameLogoPowerball} />
            <Text style={styles.gameResultPrimary}>
              {landingJackpots.powerball?.amountDisplay ?? '—'}
            </Text>
            <Text style={styles.gameResultMeta}>
              Next drawing:{' '}
              {formatWeekdayShortDate(
                landingJackpots.powerball?.nextDrawDate ??
                  nextScheduledDrawOnOrAfter(new Date(), POWERBALL_DRAW_DAYS)
              )}
            </Text>
            <Text style={styles.gameTitle}>Powerball</Text>
            <Text style={styles.gameDesc}>
              5 white balls (1-69) + 1 Powerball (1-26){'\n'}
              Draws: Mon, Wed, Sat
            </Text>
          </View>
          <View style={[styles.gameCard, isWide && styles.gameCardWide]}>
            <Image source={MEGA_MILLIONS_LOGO} style={styles.gameLogoMegaMillions} />
            <Text style={styles.gameResultPrimary}>
              {landingJackpots.megamillions?.amountDisplay ?? '—'}
            </Text>
            <Text style={styles.gameResultMeta}>
              Next drawing:{' '}
              {formatWeekdayShortDate(
                landingJackpots.megamillions?.nextDrawDate ??
                  nextScheduledDrawOnOrAfter(new Date(), MEGA_DRAW_DAYS)
              )}
            </Text>
            <Text style={styles.gameTitle}>Mega Millions</Text>
            <Text style={styles.gameDesc}>
              5 white balls (1-70) + 1 Mega Ball (1-25){'\n'}
              Draws: Tue, Fri
            </Text>
          </View>
        </View>
      </View>

      {/* ── CTA Banner ── */}
      <View style={[styles.ctaBanner, isWide && styles.ctaBannerWide]}>
        <Text style={[styles.ctaBannerTitle, isWide && styles.ctaBannerTitleWide]}>
          Ready to Play Smarter?
        </Text>
        <Text style={styles.ctaBannerSub}>
          Sign up now to save your picks, track results, and play with your own lucky number combos — on any device.
        </Text>
        <TouchableOpacity
          activeOpacity={0.88}
          style={[
            styles.ctaPrimary,
            styles.ctaPrimaryWide,
            Platform.OS === 'web' && styles.ctaPrimaryWeb,
            { backgroundColor: hoveredButton === 'ctaBanner' ? '#00B896' : '#00A383' },
          ]}
          onPress={onRegister}
          {...({ onMouseEnter: () => setHoveredButton('ctaBanner'), onMouseLeave: () => setHoveredButton(null) } as any)}
        >
          <Text style={styles.ctaPrimaryText}>Getting Started</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.storeBadgesRow, isWide && styles.storeBadgesRowWide]}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.storeBadgeHit, Platform.OS === 'web' && styles.storeBadgeHitWeb]}
          accessibilityRole="link"
          accessibilityLabel="Download on the App Store"
        >
          <Image source={APP_STORE_BADGE} style={styles.storeBadgeImageApp} resizeMode="contain" />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.storeBadgeHit, Platform.OS === 'web' && styles.storeBadgeHitWeb]}
          accessibilityRole="link"
          accessibilityLabel="Get it on Google Play"
        >
          <Image source={GOOGLE_PLAY_BADGE} style={styles.storeBadgeImageGoogle} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {/* ── Footer: full-width band & border; content max 1280 ── */}
      <View style={styles.footerBand}>
        <View style={styles.footerInner}>
          <LottoDreamLogo width={150} />
          <Text style={styles.footerText}>
            Data sourced from NY Open Data  •  Updated after every drawing
          </Text>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Skyface, LLC. All rights reserved.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

/* ── Static data ── */

const FEATURES = [
  {
    title: 'Real-time Analytics',
    desc: 'See which numbers are trending, which pairs appear most often, and where the odds are shifting.',
    svgPath: FEATURE_BAR_PATH,
  },
  {
    title: 'AI-backed Predictions',
    desc: 'Six prediction modes by AI: Hot, Cold, Balanced, Anti-Crowd, Random, and Lucky Numbers.',
    svgPath: FEATURE_AI_PATH,
  },
  {
    title: 'Lucky Numbers',
    desc: 'Convert birthdays, anniversaries, and special dates into number sets you can play.',
    svgPath: FEATURE_BOLT_PATH,
  },
  {
    title: 'Draw History',
    desc: 'Complete draw history with search & filters. Never miss a result again.',
    svgPath: FEATURE_HISTORY_PATH,
  },
  {
    title: 'Cross-Platform',
    desc: 'Use on the web, iOS, or Android — your account and data sync everywhere.',
    svgPath: FEATURE_PLATFORM_PATH,
  },
  {
    title: 'Secure & Private',
    desc: 'Your data is encrypted and stored securely. We never share your information.',
    svgPath: FEATURE_SECURE_PATH,
  },
];

const STEPS = [
  {
    title: 'Create Account',
    desc: 'Register in seconds and get immediate access to the web dashboard and analytics tools.',
  },
  {
    title: 'Analyze Numbers',
    desc: 'Explore hot/cold trends, draw history, and AI-generated predictions at a glance.',
  },
  {
    title: 'Build Your Picks',
    desc: 'Use lucky dates, balanced analytics, or AI suggestions to create number combinations.',
  },
  {
    title: 'Save & Play',
    desc: 'Keep your favorite picks, review live results, and adjust your strategy.',
  },
];

/* ── Styles ── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { minHeight: '100%' as any, maxWidth: 1280, width: '100%' as any, alignSelf: 'center' as any },

  /* Nav */
  navShell: {
    position: 'relative',
    zIndex: 30,
  },
  navBand: Platform.select({
    web: {
      backgroundColor: '#FFFFFF',
      width: '100vw' as any,
      marginLeft: 'calc(50% - 50vw)' as any,
    } as any,
    default: {
      backgroundColor: '#FFFFFF',
      width: '100%' as any,
      alignSelf: 'stretch' as any,
    },
  }),
  navInner: {
    maxWidth: 1280,
    width: '100%' as any,
    alignSelf: 'center' as any,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexWrap: 'nowrap',
    gap: 12,
    zIndex: 20,
  },
  navWide: { paddingHorizontal: 40 },
  navLogoWrap: { justifyContent: 'center', minHeight: 24 },
    /* Hamburger */
    hamburger: {
      width: 34,
      height: 34,
      borderWidth: 1,
      borderColor: '#CBD5E1',
      borderRadius: 4,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    hamburgerBar: {
      width: 16,
      height: 2,
      borderRadius: 2,
      backgroundColor: '#1F2937',
      position: 'absolute',
    },
    hamburgerBarTop: { top: 9 },
    hamburgerBarMid: { top: 15 },
    hamburgerBarBot: { top: 21 },
    hamburgerBarTopOpen: { top: 15, transform: [{ rotate: '45deg' }] },
    hamburgerBarMidOpen: { opacity: 0 },
    hamburgerBarBotOpen: { top: 15, transform: [{ rotate: '-45deg' }] },
    /* Mobile Drawer */
    mobileOverlay: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      zIndex: 40,
    },
    mobileOverlayBackdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.46)',
    },
    mobileDrawer: {
      position: 'relative',
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E2E8F0',
      paddingHorizontal: 16,
      paddingBottom: 24,
      zIndex: 41,
    },
    mobileDrawerItem: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F5F9',
    },
    mobileDrawerText: { fontSize: 15, color: '#1F2937', fontWeight: '500' },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  navLink: { color: '#1F2937', fontSize: 13, fontWeight: '400', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  navLoginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
  },
  navLoginText: { color: '#111827', fontSize: 13, fontWeight: '500', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },

  /* Hero */
  hero: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 88,
    paddingBottom: 80,
  },
  heroWide: { paddingTop: 112, paddingBottom: 88 },
  heroTitle: {
    fontSize: 44,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 56,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  heroTitleWide: { fontSize: 60, lineHeight: 72, fontWeight: '700' },
  heroTitleAccent: {
    color: '#00A585',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontWeight: '700',
  },
  heroSub: {
    fontSize: 16,
    color: '#334155',
    textAlign: 'center',
    marginTop: 20,
    maxWidth: 620,
    lineHeight: 24,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  heroSubWide: { fontSize: 18, lineHeight: 30, maxWidth: 680 },
  heroCtas: {
    flexDirection: 'column',
    marginTop: 36,
    marginBottom: 0,
    alignItems: 'center',
    width: '100%' as any,
    alignSelf: 'center' as any,
    zIndex: 1,
  },
  heroCtasWide: { maxWidth: 600 },
  ctaPrimary: {
    backgroundColor: '#00A383',
    borderRadius: 9999,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 0,
    flexShrink: 0,
  },
  ctaPrimaryWide: {
    alignSelf: 'center',
    minWidth: 220,
  },
  ctaPrimaryWeb: {
    cursor: 'pointer',
  } as any,
  ctaPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  ctaOutline: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.08)',
  },
  ctaOutlineText: { color: '#111827', fontSize: 17, fontWeight: '500', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  /* Section */
  section: { paddingHorizontal: 20, paddingVertical: 76 },
  featuresSection: { marginBottom: 50 },
  sectionWide: { paddingHorizontal: 40, alignItems: 'center' as any },
  /** Gray band edge-to-edge on web despite scroll content maxWidth */
  howItWorksBand: Platform.select({
    web: {
      backgroundColor: '#F8FAFC',
      width: '100vw' as any,
      marginLeft: 'calc(50% - 50vw)' as any,
    } as any,
    default: {
      backgroundColor: '#F8FAFC',
      width: '100%' as any,
      alignSelf: 'stretch' as any,
    },
  }),
  sectionTitle: {
    fontSize: 28,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  sectionSub: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom:48,
    maxWidth: 700,
    alignSelf: 'center' as any,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  howItWorksTitle: { fontWeight: '600' },
  howItWorksSub: { marginBottom: 40, maxWidth: 520 },

  /* Feature Cards */
  featureGrid: { gap: 16, width: '100%' },
  featureGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 960,
    gap: 20,
  },
  featureCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  featureCardWide: { width: 280, flexGrow: 0 },
  featureSvgWrap: {
    marginBottom: 12,
    width: FEATURE_ICON_SIZE,
    height: FEATURE_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 6, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  featureDesc: { fontSize: 13, color: '#475569', lineHeight: 20, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },

  /* Steps — timeline (wide) / stacked (narrow) */
  stepsRow: { gap: 28, width: '100%', maxWidth: 960, alignSelf: 'center' as any },
  stepsRowWide: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 0,
    width: '100%' as any,
  },
  stepCard: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    width: '100%',
  },
  stepCardWide: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 0,
  },
  stepBadgeRow: {
    alignItems: 'center',
    marginBottom: 14,
  },
  stepBadgeRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  stepHLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    minWidth: 0,
  },
  stepHLineHidden: {
    backgroundColor: 'transparent',
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  stepNum: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  stepTitleWide: {
    maxWidth: 190,
    alignSelf: 'center' as any,
  },
  stepDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  stepDescWide: {
    maxWidth: 190,
    alignSelf: 'center' as any,
  },

  /* Games */
  /** Tighter space before CTA: half of `section` bottom padding (76 → 38) */
  supportedGamesSection: { paddingBottom: 38 },
  gamesRow: { gap: 16, width: '100%' },
  gamesRowWide: {
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: 816,
    gap: 24,
  },
  supportedGamesTitle: { marginBottom: 40 },
  gameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    marginVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
  gameCardWide: { width: 340 },
  gameLogoPowerball: {
    width: 220,
    height: 72,
    marginBottom: 16,
    resizeMode: 'contain',
  },
  gameLogoMegaMillions: {
    width: 260,
    height: 72,
    marginBottom: 16,
    resizeMode: 'contain',
  },
  gameResultPrimary: {
    fontSize: 32,
    fontWeight: '700',
    color: '#148c74',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
    letterSpacing: 0.2,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  gameResultMeta: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 18,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  gameTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  gameDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },

  /* CTA Banner */
  ctaBanner: {
    marginVertical: 40,
    marginHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 48,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  ctaBannerWide: { marginHorizontal: 40, paddingVertical: 56, paddingHorizontal: 40 },
  ctaBannerTitle: {
    fontSize: 27,
    fontWeight: '500',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  ctaBannerTitleWide: { fontSize: 31 },
  ctaBannerSub: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 480,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  /* Store badges */
  storeBadgesRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: -6,
    marginBottom: 44,
  },
  storeBadgesRowWide: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  storeBadgeHit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeBadgeHitWeb: Platform.select({
    web: { cursor: 'pointer' } as any,
    default: {},
  }),
  /** badge-appstore.png 426×142 */
  storeBadgeImageApp: {
    height: 50,
    width: Math.round((50 * 426) / 142),
  },
  /** badge-googleplay.png 478×142 */
  storeBadgeImageGoogle: {
    height: 50,
    width: Math.round((50 * 478) / 142),
  },

  /* Footer */
  footerBand: Platform.select({
    web: {
      backgroundColor: '#FFFFFF',
      width: '100vw' as any,
      marginLeft: 'calc(50% - 50vw)' as any,
      marginTop: 76,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    } as any,
    default: {
      backgroundColor: '#FFFFFF',
      width: '100%' as any,
      alignSelf: 'stretch' as any,
      marginTop: 76,
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    },
  }),
  footerInner: {
    maxWidth: 1280,
    width: '100%' as any,
    alignSelf: 'center' as any,
    alignItems: 'center',
    paddingVertical: 52,
    paddingHorizontal: 20,
  },
  footerText: { color: '#64748B', fontSize: 12, textAlign: 'center', marginTop: 4, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
});
