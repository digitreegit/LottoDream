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
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  
  const scrollViewRef = useRef<ScrollView>(null);
  const [sectionY, setSectionY] = useState({ features: 0, howItWorks: 0 });
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const scrollToSection = (sectionKey: 'features' | 'howItWorks') => {
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
      <View style={[styles.nav, isWide && styles.navWide]}>
        <View style={styles.navLogoWrap}>
          <LottoDreamLogo width={150} />
        </View>
        <View style={styles.navLinks}>
          <TouchableOpacity onPress={() => scrollToSection('features')}>
            <Text style={styles.navLink}>Features</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => scrollToSection('howItWorks')}>
            <Text style={styles.navLink}>How It Works</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navLoginBtn, { backgroundColor: hoveredButton === 'navSignIn' ? 'rgba(113, 128, 150, 0.15)' : 'rgba(113, 128, 150, 0.08)' }]} 
            {...({ onMouseEnter: () => setHoveredButton('navSignIn'), onMouseLeave: () => setHoveredButton(null) } as any)}
            onPress={onLogin}
          >
            <Text style={styles.navLoginText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Hero ── */}
      <View style={[styles.hero, isWide && styles.heroWide]}>
        <Text style={styles.heroEmoji}>🎯</Text>
        <Text style={[styles.heroTitle, isWide && styles.heroTitleWide]}>
          Smart Lottery Analysis{'\n'}Powered by AI
        </Text>
        <Text style={[styles.heroSub, isWide && styles.heroSubWide]}>
          Analyze Powerball & Mega Millions draw history, discover hot/cold patterns,
          and generate AI-powered number picks — all in one place.
        </Text>
        <View style={[styles.heroCtas, isWide && styles.heroCtasWide]}>
          <TouchableOpacity 
            style={[styles.ctaPrimary, { backgroundColor: hoveredButton === 'getStarted' ? '#5BA4FF' : '#3182CE' }]}
            onPress={onRegister}
            {...({ onMouseEnter: () => setHoveredButton('getStarted'), onMouseLeave: () => setHoveredButton(null) } as any)}
          >
            <Text style={styles.ctaPrimaryText}>Get Started</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.ctaOutline, { backgroundColor: hoveredButton === 'signIn' ? 'rgba(71, 85, 105, 0.15)' : 'rgba(71, 85, 105, 0.08)' }]}
            onPress={onLogin}
            {...({ onMouseEnter: () => setHoveredButton('signIn'), onMouseLeave: () => setHoveredButton(null) } as any)}
          >
            <Text style={styles.ctaOutlineText}>Sign In</Text>
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
        <Text style={styles.sectionTitle}>What You Get</Text>
        <Text style={styles.sectionSub}>
          Everything you need to play smarter, not harder.
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
      <View style={[styles.section, isWide && styles.sectionWide]}>
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
        <LottoDreamLogo width={138} />
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
    title: 'Deep Analysis',
    desc: 'Frequency heatmaps, hot/cold tracking, pair analysis, odd/even ratios across all historical draws.',
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
  root: { flex: 1, backgroundColor: '#0B1426' },
  scroll: { minHeight: '100%' as any },

  /* Nav */
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#0B1426',
    borderBottomWidth: 1,
    borderBottomColor: '#1A2744',
    flexWrap: 'wrap',
    gap: 12,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 10,
  },
  navWide: { paddingHorizontal: 48 },
  navLogoWrap: { justifyContent: 'center', minHeight: 24 },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  navLink: { color: '#A0AEC0', fontSize: 13, fontWeight: '400', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  navLoginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#718096',
    backgroundColor: 'rgba(113, 128, 150, 0.08)',
  },
  navLoginText: { color: '#E2E8F0', fontSize: 13, fontWeight: '500', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },

  /* Hero */
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 48,
  },
  heroWide: { paddingTop: 80, paddingBottom: 64 },
  heroEmoji: { fontSize: 104, marginBottom: 16 },
  heroTitle: {
    fontSize: 32,
    fontWeight: '500',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 42,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  heroTitleWide: { fontSize: 48, lineHeight: 60, fontWeight: '500' },
  heroSub: {
    fontSize: 16,
    color: '#A0AEC0',
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 560,
    lineHeight: 24,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  heroSubWide: { fontSize: 18, lineHeight: 28, maxWidth: 640 },
  heroCtas: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 32,
    width: '100%',
    maxWidth: 340,
  },
  heroCtasWide: { flexDirection: 'row', maxWidth: 420 },
  ctaPrimary: {
    backgroundColor: '#3182CE',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  ctaPrimaryText: { color: '#FFF', fontSize: 17, fontWeight: '500', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  ctaOutline: {
    borderWidth: 1,
    borderColor: '#4A5568',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: 'rgba(71, 85, 105, 0.08)',
  },
  ctaOutlineText: { color: '#E2E8F0', fontSize: 17, fontWeight: '500', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  /* Section */
  section: { paddingHorizontal: 24, paddingVertical: 48 },
  featuresSection: { marginBottom: 50 },
  sectionWide: { paddingHorizontal: 48, alignItems: 'center' as any },
  sectionAlt: { backgroundColor: '#111C32' },
  sectionTitle: {
    fontSize: 27,
    fontWeight: '500',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  sectionSub: {
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 500,
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
    backgroundColor: '#1A2744',
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
  featureTitle: { fontSize: 17, fontWeight: '600', color: '#FFF', marginBottom: 6, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  featureDesc: { fontSize: 13, color: '#A0AEC0', lineHeight: 20, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },

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
  stepNum: { color: '#FFF', fontSize: 18, fontWeight: '700', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  stepDesc: { fontSize: 13, color: '#A0AEC0', textAlign: 'center', lineHeight: 19, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },

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
    backgroundColor: '#1A2744',
    borderRadius: 16,
    borderWidth: 2,
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
  gameTitle: { fontSize: 22, fontWeight: '500', color: '#FFF', marginBottom: 8, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  gameDesc: { fontSize: 13, color: '#A0AEC0', textAlign: 'center', lineHeight: 21, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },

  /* CTA Banner */
  ctaBanner: {
    backgroundColor: '#1A365D',
    margin: 24,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  ctaBannerWide: { marginHorizontal: 48, padding: 48 },
  ctaBannerTitle: {
    fontSize: 27,
    fontWeight: '500',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  ctaBannerTitleWide: { fontSize: 31 },
  ctaBannerSub: {
    fontSize: 14,
    color: '#A0AEC0',
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
    paddingHorizontal: 24,
    marginTop: -6,
    marginBottom: 24,
  },
  storeBadgesRowWide: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  storeBadge: {
    minWidth: 180,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#4A5568',
    backgroundColor: 'rgba(71, 85, 105, 0.06)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  storeBadgeSub: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  storeBadgeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  /* Footer */
  footer: {
    alignItems: 'center',
    marginTop: 50,
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: '#1A2744',
  },
  footerText: { color: '#4A5568', fontSize: 12, textAlign: 'center', marginTop: 4, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
});
