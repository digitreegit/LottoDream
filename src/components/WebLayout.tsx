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
import { useAuth } from '../hooks/useAuth';
import { signOut } from '../services/authService';

interface Props {
  children: ReactNode;
  onSignOut?: () => void;
}

export function WebLayout({ children, onSignOut }: Props) {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const isWide = width >= 768;

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  const handleSignOut = async () => {
    await signOut();
    onSignOut?.();
  };

  return (
    <View style={styles.root}>
      {/* Top bar */}
      <View style={[styles.header, isWide && styles.headerWide]}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>🎱 LottoDream</Text>
        </View>
        <View style={styles.headerRight}>
          {user && (
            <>
              <Text style={styles.email} numberOfLines={1}>
                {user.email}
              </Text>
              <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </>
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
    backgroundColor: '#0B1426',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0D1B2A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A2744',
  },
  headerWide: { paddingHorizontal: 40 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  logo: { fontSize: 18, fontWeight: '800', color: '#FFF', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  email: { color: '#A0AEC0', fontSize: 13, maxWidth: 200, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4A5568',
  },
  signOutText: { color: '#E2E8F0', fontSize: 13, fontWeight: '600', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },

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
