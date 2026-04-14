// ============================================
// Web Landing Page – marketing-style website
// ============================================
import React, { useRef, useState } from 'react';
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

interface Props {
  onLogin: () => void;
  onRegister: () => void;
}

const BAR_ICON_PATH =
  'M387.2,307.43c0-.62.5-1.12,1.12-1.12h2.25c.62,0,1.12.5,1.12,1.12v6.75c0,.62-.5,1.12-1.12,1.12h-2.25c-.62,0-1.12-.5-1.12-1.12h0v-6.75ZM393.95,302.93c0-.62.5-1.12,1.12-1.12h2.25c.62,0,1.12.5,1.12,1.12v11.25c0,.62-.5,1.12-1.12,1.12h-2.25c-.62,0-1.12-.5-1.12-1.12v-11.25ZM400.7,298.43c0-.62.5-1.12,1.12-1.12h2.25c.62,0,1.12.5,1.12,1.12v15.75c0,.62-.5,1.12-1.12,1.12h-2.25c-.62,0-1.12-.5-1.12-1.12v-15.75Z';

const SMART_ICON_PATH =
  'M392.45,297.31v1.5M388.7,302.56h-1.5M405.2,302.56h-1.5M388.7,306.31h-1.5M405.2,306.31h-1.5M388.7,310.06h-1.5M405.2,310.06h-1.5M392.45,313.81v1.5M396.2,297.31v1.5M396.2,313.81v1.5M399.95,297.31v1.5M399.95,313.81v1.5M390.95,313.81h10.5c1.24,0,2.25-1.01,2.25-2.25v-10.5c0-1.24-1.01-2.25-2.25-2.25h-10.5c-1.24,0-2.25,1.01-2.25,2.25v10.5c0,1.24,1.01,2.25,2.25,2.25ZM391.7,301.81h9v9h-9v-9Z';

const HISTORY_ICON_PATH =
  'M387.75,306h16.5M387.75,309.75h16.5M387.75,313.5h16.5M389.62,298.5h12.75c1.04,0,1.88.84,1.88,1.88s-.84,1.88-1.88,1.88h-12.75c-1.04,0-1.88-.84-1.88-1.88s.84-1.88,1.88-1.88Z';

const DOLLAR_ICON_PATH =
  'M396.2,300.31v12M393.2,309.49l.88.66c1.17.88,3.07.88,4.24,0,1.17-.88,1.17-2.3,0-3.18-.59-.44-1.35-.66-2.12-.66-.73,0-1.45-.22-2-.66-1.11-.88-1.11-2.3,0-3.18s2.9-.88,4.01,0l.41.33M405.2,306.31c0,4.97-4.03,9-9,9s-9-4.03-9-9,4.03-9,9-9,9,4.03,9,9Z';

const PLATFORM_ICON_PATH =
  'M390.43,303.75l-4.18,2.25,4.18,2.25M390.43,303.75l5.57,3,5.57-3M390.43,303.75l-4.18-2.25,9.75-5.25,9.75,5.25-4.18,2.25M401.57,303.75l4.18,2.25-4.18,2.25M401.57,308.25l4.18,2.25-9.75,5.25-9.75-5.25,4.18-2.25M401.57,308.25l-5.57,3-5.57-3';

const SECURE_ICON_PATH =
  'M393,306.71l2.25,2.25,3.75-5.25M396,296.67c-2.26,2.15-5.28,3.33-8.4,3.29-.4,1.21-.6,2.48-.6,3.75,0,5.59,3.82,10.29,9,11.62,5.18-1.33,9-6.03,9-11.62,0-1.31-.21-2.57-.6-3.75h-.15c-3.2,0-6.1-1.25-8.25-3.28Z';

const FEATURE_ICON_SIZE = 32.4;
const STICKY_NAV_OFFSET = 88;
const POWERBALL_LOGO = require('../../assets/powerball-logo.png');
const MEGA_MILLIONS_LOGO = require('../../assets/mega-millions-logo.png');

export function WebLandingPage({ onLogin, onRegister }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 768;
  
  const scrollViewRef = useRef<ScrollView>(null);
  const [sectionY, setSectionY] = useState({ features: 0, howItWorks: 0, supportedGames: 0 });
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
      {/* ── Navbar ── */}
      <View style={styles.navShell}>
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
              <TouchableOpacity style={styles.mobileDrawerSignIn} onPress={() => { onLogin(); setMenuOpen(false); }}>
                <Text style={styles.mobileDrawerSignInText}>Sign In</Text>
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
          and generate AI-powered number picks - all in one place.
        </Text>
        <View style={[styles.heroCtas, isWide && styles.heroCtasWide]}>
          <TouchableOpacity
            activeOpacity={0.88}
            style={[
              styles.ctaPrimary,
              !isWide && styles.ctaPrimaryMobile,
              isWide && styles.ctaPrimaryWide,
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
                {f.svgPath ? (
                  <View style={styles.featureSvgWrap}>
                    <Svg width={FEATURE_ICON_SIZE} height={FEATURE_ICON_SIZE} viewBox="386 296 20 20">
                      <Path
                        d={f.svgPath}
                        fill="none"
                        stroke="#3182CE"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                ) : (
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                )}
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
      </View>

      {/* ── How It Works ── */}
      <View 
        style={[styles.section, styles.sectionAlt, isWide && styles.sectionWide]}
        onLayout={(event) => {
          setSectionY((prev) => ({
            ...prev,
            howItWorks: event.nativeEvent.layout.y,
          }));
        }}
      >
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={[styles.stepsRow, isWide && styles.stepsRowWide]}>
          {STEPS.map((s, i) => (
            <View key={i} style={[styles.stepCard, isWide && styles.stepCardWide]}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Games ── */}
      <View
        style={[styles.section, isWide && styles.sectionWide]}
        onLayout={(event) => {
          setSectionY((prev) => ({
            ...prev,
            supportedGames: event.nativeEvent.layout.y,
          }));
        }}
      >
        <Text style={[styles.sectionTitle, styles.supportedGamesTitle]}>Supported Games</Text>
        <View style={[styles.gamesRow, isWide && styles.gamesRowWide]}>
          <View style={[styles.gameCard, isWide && styles.gameCardWide, { borderColor: '#E53E3E' }]}>
            <Image source={POWERBALL_LOGO} style={styles.gameLogoPowerball} />
            <Text style={styles.gameTitle}>Powerball</Text>
            <Text style={styles.gameDesc}>
              5 white balls (1-69) + 1 Powerball (1-26){'\n'}
              Draws: Mon, Wed, Sat
            </Text>
          </View>
          <View style={[styles.gameCard, isWide && styles.gameCardWide, { borderColor: '#D69E2E' }]}>
            <Image source={MEGA_MILLIONS_LOGO} style={styles.gameLogoMegaMillions} />
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
        {/* @ts-ignore */}
        <TouchableOpacity 
          style={[styles.ctaBannerBtn, { backgroundColor: hoveredButton === 'ctaBanner' ? '#5BA4FF' : '#3182CE' }]}
          onPress={onRegister}
          {...({ onMouseEnter: () => setHoveredButton('ctaBanner'), onMouseLeave: () => setHoveredButton(null) } as any)}
        >
          <Text style={styles.ctaBannerBtnText}>Get Started</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.storeBadgesRow, isWide && styles.storeBadgesRowWide]}>
        {/* @ts-ignore */}
        <TouchableOpacity 
          style={[styles.storeBadge, { backgroundColor: hoveredButton === 'appStore' ? 'rgba(71, 85, 105, 0.12)' : 'rgba(71, 85, 105, 0.06)' }]}
          {...({ onMouseEnter: () => setHoveredButton('appStore'), onMouseLeave: () => setHoveredButton(null) } as any)}
        >
          <Text style={styles.storeBadgeSub}>Download on the</Text>
          <Text style={styles.storeBadgeTitle}>App Store</Text>
        </TouchableOpacity>
        {/* @ts-ignore */}
        <TouchableOpacity 
          style={[styles.storeBadge, { backgroundColor: hoveredButton === 'googlePlay' ? 'rgba(71, 85, 105, 0.12)' : 'rgba(71, 85, 105, 0.06)' }]}
          {...({ onMouseEnter: () => setHoveredButton('googlePlay'), onMouseLeave: () => setHoveredButton(null) } as any)}
        >
          <Text style={styles.storeBadgeSub}>GET IT ON</Text>
          <Text style={styles.storeBadgeTitle}>Google Play</Text>
        </TouchableOpacity>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <LottoDreamLogo width={150} />
        <Text style={styles.footerText}>
          Data sourced from NY Open Data  •  Updated after every drawing
        </Text>
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} LottoDream. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

/* ── Static data ── */

const FEATURES = [
  {
    icon: '📊',
    title: 'Real-time Analytics',
    desc: 'See which numbers are trending, which pairs appear most often, and where the odds are shifting.',
    svgPath: BAR_ICON_PATH,
  },
  {
    icon: '🎯',
    title: 'AI Smart Picks',
    desc: '5 prediction modes: Hot, Cold, Balanced, Anti-Crowd, and Random — each backed by real statistics.',
    svgPath: SMART_ICON_PATH,
  },
  {
    icon: '📋',
    title: 'Draw History',
    desc: 'Complete draw history with search & filters. Never miss a result again.',
    svgPath: HISTORY_ICON_PATH,
  },
  {
    icon: '✨',
    title: 'Lucky Dates',
    desc: 'Pick your own lucky numbers from birthdays, anniversaries, or any special date — add weights to personalize your combo.',
  },
  {
    icon: '📱',
    title: 'Cross-Platform',
    desc: 'Use on the web, iOS, or Android — your account and data sync everywhere.',
    svgPath: PLATFORM_ICON_PATH,
  },
  {
    icon: '🔒',
    title: 'Secure & Private',
    desc: 'Your data is encrypted and stored securely. We never share your information.',
    svgPath: SECURE_ICON_PATH,
  },
];

const STEPS = [
  {
    title: 'Create Account',
    desc: 'Sign up for free in 30 seconds. No credit card needed.',
  },
  {
    title: 'Explore & Analyze',
    desc: 'View draw history, frequency analysis, and hot/cold number trends.',
  },
  {
    title: 'Get Smart Picks',
    desc: 'Generate AI-powered number combinations using 5 different strategies.',
  },
  {
    title: 'Save & Play',
    desc: 'Save your favorite picks or build a Lucky Dates combo from meaningful numbers. Track your sets anytime.',
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
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
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
    mobileDrawerSignIn: {
      marginTop: 12,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: '#3585c6',
      alignItems: 'center',
    },
    mobileDrawerSignInText: { fontSize: 15, color: '#fff', fontWeight: '600' },
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
    alignItems: 'stretch',
    width: '100%' as any,
    alignSelf: 'center' as any,
    zIndex: 1,
  },
  heroCtasWide: { alignItems: 'center', maxWidth: 600 },
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
  ctaPrimaryMobile: {
    alignSelf: 'stretch',
    width: '100%' as any,
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
  sectionAlt: { backgroundColor: '#F8FAFC' },
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
  featureIcon: { fontSize: FEATURE_ICON_SIZE, marginBottom: 12 },
  featureTitle: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 6, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  featureDesc: { fontSize: 13, color: '#475569', lineHeight: 20, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },

  /* Steps */
  stepsRow: { gap: 16, width: '100%' },
  stepsRowWide: {
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: 960,
    gap: 24,
  },
  stepCard: {
    alignItems: 'center',
    padding: 20,
    width: '100%',
  },
  stepCardWide: { width: 200, flexGrow: 0 },
  stepBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3182CE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  stepNum: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  stepDesc: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 19, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },

  /* Games */
  gamesRow: { gap: 16, width: '100%' },
  gamesRowWide: {
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: 816,
    gap: 24,
  },
  supportedGamesTitle: { marginBottom: 40 },
  gameCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 28,
    marginVertical: 20,
    alignItems: 'center',
    width: '100%',
  },
  gameCardWide: { width: 340 },
  gameLogoPowerball: {
    width: 180,
    height: 72,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  gameLogoMegaMillions: {
    width: 200,
    height: 72,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  gameTitle: { fontSize: 22, fontWeight: '500', color: '#111827', marginBottom: 8, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  gameDesc: { fontSize: 13, color: '#475569', textAlign: 'center', lineHeight: 21, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },

  /* CTA Banner */
  ctaBanner: {
    backgroundColor: '#EEF2FF',
    marginVertical: 40,
    marginHorizontal: 20,
    borderRadius: 20,
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
  ctaBannerBtn: {
    backgroundColor: '#3182CE',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  ctaBannerBtnText: { color: '#FFF', fontSize: 17, fontWeight: '600', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },

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
  },
  storeBadge: {
    minWidth: 180,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  storeBadgeSub: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  storeBadgeTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    marginTop: 76,
    paddingVertical: 52,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerText: { color: '#64748B', fontSize: 12, textAlign: 'center', marginTop: 4, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
});
