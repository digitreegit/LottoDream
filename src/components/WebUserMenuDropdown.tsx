// ============================================
// Web header — user account dropdown (Dashboard / Account)
// ============================================
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type WebUserMenuAction = 'dashboard' | 'account-settings' | 'upgrade-premium';

export type WebUserPlanTier = 'basic' | 'premium';

type Props = {
  userEmail: string;
  planTier: WebUserPlanTier;
  onItem: (key: WebUserMenuAction) => void;
  onSignOut: () => void;
};

export function WebUserMenuDropdown({ userEmail, planTier, onItem, onSignOut }: Props) {
  const tierLabel = planTier === 'premium' ? 'premium' : 'basic';

  return (
    <View style={styles.card}>
      <View style={[styles.cardInner, styles.cardInnerTop]}>
        <Text style={styles.tier}>{tierLabel}</Text>
        <Text style={styles.email} numberOfLines={2}>
          {userEmail}
        </Text>

        <MenuLink label="Dashboard" onPress={() => onItem('dashboard')} style={styles.linkRowAfterDashboard} />
        <MenuLink label="Account Settings" onPress={() => onItem('account-settings')} />
      </View>

      <View style={styles.dividerFull} />

      <View style={styles.cardInner}>
        <Pressable
          style={({ pressed }) => [styles.signOutRow, pressed && styles.signOutPressed]}
          onPress={onSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign Out"
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
      </View>

      {planTier === 'basic' ? (
        <>
          <View style={styles.dividerFull} />
          <View style={[styles.cardInner, styles.cardInnerUpgrade]}>
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => onItem('upgrade-premium')}
              activeOpacity={0.88}
            >
              <Text style={styles.upgradeBtnText}>Upgrade to Premium · $4.99</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </View>
  );
}

function MenuLink({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <TouchableOpacity style={[styles.linkRow, style]} onPress={onPress} activeOpacity={0.75}>
      <Text style={styles.linkText}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Full-screen tap catcher + positioned panel (web only) */
export function WebUserMenuPortal({
  open,
  onClose,
  children,
  anchorRight,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Distance from right edge of viewport (px) — approx. align under profile icon */
  anchorRight: number;
}) {
  if (Platform.OS !== 'web' || !open) return null;

  return (
    <>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel="Close menu"
      />
      <View style={[styles.dropdownWrap, { right: anchorRight }]} pointerEvents="box-none">
        {children}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'fixed' as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    ...(Platform.OS === 'web' ? { cursor: 'default' as any } : null),
  },
  dropdownWrap: {
    position: 'fixed' as any,
    top: 72,
    zIndex: 100,
    width: 300,
    maxWidth: 'calc(100vw - 24px)' as any,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 0,
    overflow: 'hidden' as const,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
        } as object)
      : null),
  },
  cardInner: {
    paddingHorizontal: 16,
  },
  cardInnerUpgrade: {
    paddingTop: 14,
  },
  cardInnerTop: {
    paddingBottom: 22,
  },
  tier: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    textTransform: 'lowercase',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  email: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B7280',
    marginTop: 6,
    marginBottom: 22,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  linkRow: {
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  linkRowAfterDashboard: {
    marginBottom: 20,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 20,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  dividerFull: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  signOutRow: {
    paddingVertical: 14,
  },
  signOutPressed: {
    opacity: 0.7,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 20,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  upgradeBtn: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : null),
  },
  upgradeBtnText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#FFFFFF',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
