// ============================================
// Web Layout Wrapper – header bar + centered content
// Wraps the logged-in app screens on web
// ============================================
import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../hooks/useAuth';
import { LottoDreamLogo } from './LottoDreamLogo';

interface Props {
  children: ReactNode;
  activeMenu: 'Home' | 'Analysis' | 'Predict' | 'Drawing';
  onMenuPress: (menu: 'Home' | 'Analysis' | 'Predict' | 'Drawing') => void;
  onProfilePress: () => void;
  onLogoPress: () => void;
}

export function WebLayout({ children, activeMenu, onMenuPress, onProfilePress, onLogoPress }: Props) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const isWide = width >= 768;

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.root}>
      {/* Top bar */}
      <View style={[styles.header, isWide && styles.headerWide]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onLogoPress} activeOpacity={0.85}>
            <LottoDreamLogo width={150} />
          </TouchableOpacity>
        </View>
        <View style={styles.menuRow}>
          {(['Home', 'Analysis', 'Predict', 'Drawing'] as const).map((menu) => (
            <TouchableOpacity
              key={menu}
              style={[styles.menuBtn, activeMenu === menu && styles.menuBtnActive]}
              onPress={() => onMenuPress(menu)}
            >
              <Text style={[styles.menuText, activeMenu === menu && styles.menuTextActive]}>{menu}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.headerRight}>
          {user && (
            <TouchableOpacity style={styles.profileBtn} onPress={onProfilePress}>
              <Svg width={20} height={20} viewBox="0 0 25.2 25.2">
                <Path
                  d="M18.59,19.33c-1.42-1.88-3.63-2.98-5.98-2.98s-4.57,1.1-5.98,2.98M18.59,19.33c3.71-3.3,4.05-8.99.74-12.71-3.3-3.71-8.99-4.05-12.71-.74s-4.05,8.99-.74,12.71c.23.26.48.51.74.74M18.59,19.33c-1.65,1.47-3.78,2.28-5.98,2.27-2.21,0-4.34-.81-5.98-2.27M15.61,10.36c0,1.66-1.34,3-3,3s-3-1.34-3-3,1.34-3,3-3,3,1.34,3,3Z"
                  fill="none"
                  stroke="#A0AEC0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                />
              </Svg>
              <Text style={styles.email} numberOfLines={1}>
                {user.email}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main content – centred & max-width */}
      <View style={styles.body}>
        <View style={[styles.content, isWide && styles.contentWide]}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerWide: { paddingHorizontal: 40, marginHorizontal: 16, marginTop: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  menuBtnActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
  },
  menuText: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  menuTextActive: {
    color: '#2563EB',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  email: {
    color: '#475569',
    fontSize: 13,
    maxWidth: 200,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  body: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
  },
  contentWide: {
    maxWidth: 900,
  },
});
