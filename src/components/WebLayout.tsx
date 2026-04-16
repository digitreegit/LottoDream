// ============================================
// Web Layout – landing-aligned nav + max-width content
// ============================================
import React, { ReactNode, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LottoDreamLogo } from './LottoDreamLogo';
import { UserCircleIcon } from './UserCircleIcon';

const APP_MENUS = ['Home', 'Analysis', 'Predict', 'Drawing'] as const;

interface Props {
  children: ReactNode;
  activeMenu: 'Home' | 'Analysis' | 'Predict' | 'Drawing';
  onMenuPress: (menu: 'Home' | 'Analysis' | 'Predict' | 'Drawing') => void;
  onProfilePress: () => void;
  onLogoPress: () => void;
}

export function WebLayout({ children, activeMenu, onMenuPress, onProfilePress, onLogoPress }: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 768;
  const [menuOpen, setMenuOpen] = useState(false);

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.root}>
      <View style={styles.navShell}>
        <View style={styles.navBand}>
          <View style={styles.navInner}>
            <View style={[styles.nav, isWide && styles.navWide, { paddingTop: 20 + insets.top }]}>
              <View style={styles.navLogoWrap}>
                <TouchableOpacity onPress={onLogoPress} activeOpacity={0.85}>
                  <LottoDreamLogo width={200} />
                </TouchableOpacity>
              </View>
              {isWide ? (
                <View style={styles.navLinks}>
                  {APP_MENUS.map((menu) => (
                    <TouchableOpacity key={menu} onPress={() => onMenuPress(menu)} activeOpacity={0.75}>
                      <Text style={[styles.navLink, activeMenu === menu && styles.navLinkActive]}>{menu}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.profileIconBtn}
                    onPress={onProfilePress}
                    accessibilityLabel="My account"
                    activeOpacity={0.8}
                  >
                    <UserCircleIcon size={26} color="#1F2937" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.navRightCompact}>
                  <TouchableOpacity
                    onPress={onProfilePress}
                    style={styles.profileIconBtnCompact}
                    accessibilityLabel="My account"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <UserCircleIcon size={26} color="#1F2937" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.hamburger}
                    onPress={() => setMenuOpen((v) => !v)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel={menuOpen ? 'Close menu' : 'Open menu'}
                  >
                    <View style={[styles.hamburgerBar, styles.hamburgerBarTop, menuOpen && styles.hamburgerBarTopOpen]} />
                    <View style={[styles.hamburgerBar, styles.hamburgerBarMid, menuOpen && styles.hamburgerBarMidOpen]} />
                    <View style={[styles.hamburgerBar, styles.hamburgerBarBot, menuOpen && styles.hamburgerBarBotOpen]} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>

        {!isWide && menuOpen && (
          <View style={styles.mobileOverlay}>
            <TouchableOpacity
              style={[styles.mobileOverlayBackdrop, { height }]}
              activeOpacity={1}
              onPress={() => setMenuOpen(false)}
            />
            <View style={styles.mobileDrawer}>
              {APP_MENUS.map((menu) => (
                <TouchableOpacity
                  key={menu}
                  style={styles.mobileDrawerItem}
                  onPress={() => {
                    onMenuPress(menu);
                    setMenuOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.mobileDrawerText,
                      activeMenu === menu && styles.mobileDrawerTextActive,
                    ]}
                  >
                    {menu}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={[styles.contentInner, isWide && styles.contentInnerWide]}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  navShell: {
    position: 'relative' as const,
    zIndex: 30,
  },
  navBand: {
    backgroundColor: '#FFFFFF',
    width: '100vw' as any,
    marginLeft: 'calc(50% - 50vw)' as any,
  },
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
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  navLink: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '400',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  navLinkActive: {
    color: '#00A383',
    fontWeight: '600',
  },
  profileIconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  navRightCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  profileIconBtnCompact: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburger: {
    width: 40,
    height: 40,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hamburgerBar: {
    width: 19,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#1F2937',
    position: 'absolute',
  },
  hamburgerBarTop: { top: 11 },
  hamburgerBarMid: { top: 18 },
  hamburgerBarBot: { top: 25 },
  hamburgerBarTopOpen: { top: 18, transform: [{ rotate: '45deg' }] },
  hamburgerBarMidOpen: { opacity: 0 },
  hamburgerBarBotOpen: { top: 18, transform: [{ rotate: '-45deg' }] },
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
  mobileDrawerText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  mobileDrawerTextActive: {
    color: '#00A383',
    fontWeight: '600',
  },
  body: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  contentInner: {
    flex: 1,
    width: '100%',
    maxWidth: 1280,
    paddingHorizontal: 16,
  },
  contentInnerWide: {
    paddingHorizontal: 40,
  },
});
