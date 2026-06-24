// ============================================
// My Page Screen - User profile & settings
// ============================================
import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Platform,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useEntitlement } from '../hooks/useEntitlement';
import { getProfile, signOut } from '../services/authService';
import { PREMIUM_PRICE_DISPLAY, SUPPORT_EMAIL } from '../config/constants';
import {
  getSavedNumberSets,
  getNumberCollectionItems,
  addNumberCollectionItem,
  deleteNumberCollectionItem,
  type NumberCollectionSource,
} from '../services/ticketService';
import { getGameConfig } from '../config/constants';
import { LandingStyleFooter } from '../components/LandingStyleFooter';
import { AppFeedbackModal, type AppFeedbackVariant } from '../components/AppFeedbackModal';
import { LottoRow } from '../components/LottoBall';
import { GameType, NumberCollectionItem, SavedNumberSet, UserProfile } from '../types';
import { isWebDashboard, webDash, nativeDash, webDashboardScrollContent } from '../theme/webDashboard';
import { landingCtaPrimaryButton, landingCtaPrimaryButtonText } from '../theme/landingCta';

const C = isWebDashboard ? webDash : nativeDash;

const SOURCE_LABELS: Record<NumberCollectionSource, string> = {
  manual: '✏️ Manual favorite',
  analysis_tracking: '📊 From analysis',
  history_watch: '📜 History / draws',
};

type MyPageRouteParams = {
  focus?:
    | 'saved'
    | 'collection'
    | 'faq'
    | 'support'
    | 'account'
    | 'password'
    | 'payment'
    | 'upgrade';
};

export function MyPageScreen({ navigation }: any) {
  const { user } = useAuth();
  const { isPremium } = useEntitlement();
  const route = useRoute();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedNumbers, setSavedNumbers] = useState<SavedNumberSet[]>([]);
  const [collectionItems, setCollectionItems] = useState<NumberCollectionItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [savedNumbersOpen, setSavedNumbersOpen] = useState(true);
  const [numberCollectionOpen, setNumberCollectionOpen] = useState(false);
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [savingCollection, setSavingCollection] = useState(false);
  const [collGame, setCollGame] = useState<GameType>('powerball');
  const [collName, setCollName] = useState('');
  const [collSource, setCollSource] = useState<NumberCollectionSource>('manual');
  const [collWhites, setCollWhites] = useState(['', '', '', '', '']);
  const [collPb, setCollPb] = useState('');
  const [collectionFormError, setCollectionFormError] = useState<string | null>(null);
  const [pendingDeleteCollection, setPendingDeleteCollection] = useState<NumberCollectionItem | null>(null);
  const [deletingCollection, setDeletingCollection] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState<{
    title: string;
    message: string;
    variant: AppFeedbackVariant;
  } | null>(null);
  const [signOutConfirmVisible, setSignOutConfirmVisible] = useState(false);

  useEffect(() => {
    const focus = (route.params as MyPageRouteParams | undefined)?.focus;
    if (!focus) return;

    if (focus === 'saved') {
      setSavedNumbersOpen(true);
      setNumberCollectionOpen(false);
    } else if (focus === 'collection') {
      setNumberCollectionOpen(true);
      setSavedNumbersOpen(false);
    } else if (focus === 'account') {
      setSavedNumbersOpen(false);
      setNumberCollectionOpen(false);
    } else if (focus === 'faq') {
      navigation.navigate('FAQ');
    } else if (focus === 'support') {
      void Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
    } else if (focus === 'password') {
      setAlertFeedback({
        variant: 'info',
        title: 'Change password',
        message:
          'Sign out and use “Forgot password?” on the login screen, or the reset link from your email. In-app password updates will be added later.',
      });
    } else if (focus === 'payment') {
      setAlertFeedback({
        variant: 'info',
        title: 'Payment method',
        message: 'Saved payment methods will be available in a future update.',
      });
    } else if (focus === 'upgrade') {
      try {
        navigation?.navigate?.('Pricing');
      } catch {
        setAlertFeedback({
          variant: 'info',
          title: 'Premium',
          message: 'Open the Pricing tab from the menu to upgrade.',
        });
      }
    }

    navigation.setParams({ focus: undefined } as never);
  }, [route.params, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        setProfile(null);
        setSavedNumbers([]);
        setCollectionItems([]);
        return undefined;
      }

      let cancelled = false;
      setLoadingData(true);
      Promise.all([getProfile(), getSavedNumberSets(5), getNumberCollectionItems(50)])
        .then(([nextProfile, nextSaved, nextColl]) => {
          if (!cancelled) {
            setProfile(nextProfile);
            setSavedNumbers(nextSaved);
            setCollectionItems(nextColl);
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingData(false);
        });

      return () => {
        cancelled = true;
      };
    }, [user])
  );

  const openCollectionModal = useCallback(() => {
    setCollGame('powerball');
    setCollName('');
    setCollSource('manual');
    setCollWhites(['', '', '', '', '']);
    setCollPb('');
    setCollectionFormError(null);
    setCollectionModalVisible(true);
  }, []);

  const submitCollectionModal = useCallback(async () => {
    const cfg = getGameConfig(collGame);
    const parsed = collWhites.map((s) => parseInt(s.trim(), 10));
    if (parsed.some((n) => Number.isNaN(n))) {
      setCollectionFormError(`Enter five integers (1–${cfg.whiteMax}).`);
      return;
    }
    if (new Set(parsed).size !== 5) {
      setCollectionFormError('Main numbers must be unique.');
      return;
    }
    for (const n of parsed) {
      if (n < 1 || n > cfg.whiteMax) {
        setCollectionFormError(`Each main number must be between 1 and ${cfg.whiteMax}.`);
        return;
      }
    }
    const pb = parseInt(collPb.trim(), 10);
    if (Number.isNaN(pb)) {
      setCollectionFormError(`Enter ${cfg.bonusLabel} (1–${cfg.bonusMax}).`);
      return;
    }
    if (pb < 1 || pb > cfg.bonusMax) {
      setCollectionFormError(`${cfg.bonusLabel} must be between 1 and ${cfg.bonusMax}.`);
      return;
    }
    setCollectionFormError(null);
    setSavingCollection(true);
    try {
      const { error } = await addNumberCollectionItem({
        game: collGame,
        name: collName.trim() || undefined,
        source: collSource,
        whites: parsed,
        powerball: pb,
      });
      if (error) {
        setCollectionFormError(error);
        return;
      }
      setCollectionModalVisible(false);
      const next = await getNumberCollectionItems(50);
      setCollectionItems(next);
    } catch (e: any) {
      setCollectionFormError(e?.message || 'Unknown error.');
    } finally {
      setSavingCollection(false);
    }
  }, [collGame, collName, collSource, collWhites, collPb]);

  const confirmDeleteCollection = useCallback((item: NumberCollectionItem) => {
    setPendingDeleteCollection(item);
  }, []);

  const cancelDeleteCollection = useCallback(() => {
    setPendingDeleteCollection(null);
  }, []);

  const runDeleteCollection = useCallback(async () => {
    const item = pendingDeleteCollection;
    if (!item) return;
    setDeletingCollection(true);
    try {
      const { error } = await deleteNumberCollectionItem(item.id);
      if (error) {
        setAlertFeedback({ title: 'Could not remove', message: error, variant: 'error' });
        return;
      }
      setCollectionItems((prev) => prev.filter((x) => x.id !== item.id));
      setPendingDeleteCollection(null);
    } finally {
      setDeletingCollection(false);
    }
  }, [pendingDeleteCollection]);

  const performSignOut = async () => {
    try {
      await signOut();
      if (Platform.OS !== 'web') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth' }],
        });
      }
    } catch (error: any) {
      setAlertFeedback({
        title: 'Sign out failed',
        message: error?.message || 'Please try again.',
        variant: 'error',
      });
    }
  };

  const handleSignOut = () => {
    setSignOutConfirmVisible(true);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loginPromptIcon}>🔒</Text>
          <Text style={styles.loginPromptTitle}>Sign In Required</Text>
          <Text style={styles.loginPromptText}>
            Sign in to access your profile and saved numbers.
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <>
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isWebDashboard && webDashboardScrollContent]}
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.username || user.email || '?')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>{profile?.username || 'User'}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View
          style={[
            styles.planPill,
            isPremium ? styles.planPillPremium : styles.planPillBasic,
          ]}
        >
          <Text
            style={[
              styles.planPillText,
              isPremium ? styles.planPillTextPremium : styles.planPillTextBasic,
            ]}
          >
            {isPremium ? '★ Premium member' : 'Free plan'}
          </Text>
        </View>
      </View>

      {/* Upgrade card — only for non-premium users */}
      {!isPremium && (
        <TouchableOpacity
          style={styles.upgradeCard}
          onPress={() => navigation.navigate('Pricing')}
          activeOpacity={0.9}
        >
          <View style={styles.upgradeCardLeft}>
            <Text style={styles.upgradeCardEyebrow}>UNLOCK</Text>
            <Text style={styles.upgradeCardTitle}>
              All 5 AI prediction modes
            </Text>
            <Text style={styles.upgradeCardSub}>
              One-time {PREMIUM_PRICE_DISPLAY} • no subscription
            </Text>
          </View>
          <View style={styles.upgradeCardCta}>
            <Text style={styles.upgradeCardCtaText}>Upgrade</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>Account</Text>
        <MenuItem icon="✏️" label="Edit Profile" onPress={() => {}} />
        <MenuItem
          icon="💳"
          label={isPremium ? 'Billing & receipts' : 'Pricing & plans'}
          onPress={() => navigation.navigate('Pricing')}
        />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>My Lottery</Text>
        <TouchableOpacity
          style={[menuStyles.item, styles.accordionHeaderWeb]}
          onPress={() => setSavedNumbersOpen((o) => !o)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ expanded: savedNumbersOpen }}
          accessibilityLabel="Saved Numbers"
        >
          <Text style={menuStyles.icon}>💾</Text>
          <Text style={menuStyles.label}>Saved Numbers</Text>
          <Text style={menuStyles.chevron}>{savedNumbersOpen ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {savedNumbersOpen ? (
          <View style={styles.savedNumbersInLottery}>
            {loadingData ? (
              <ActivityIndicator style={styles.lotterySavedLoading} color={isWebDashboard ? webDash.accent : '#63B3ED'} />
            ) : savedNumbers.length === 0 ? (
              <Text style={styles.emptyText}>No saved numbers yet.</Text>
            ) : (
              savedNumbers.map((item) => (
                <View key={item.id} style={styles.ticketCard}>
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketGame}>{item.game.toUpperCase()}</Text>
                    <Text style={styles.ticketStatus}>{item.name || 'Saved set'}</Text>
                  </View>
                  <LottoRow whites={item.whites} powerball={item.powerball} game={item.game} size={28} />
                </View>
              ))
            )}
          </View>
        ) : null}
        <View style={styles.lotterySectionDivider} />
        <TouchableOpacity
          style={[menuStyles.item, styles.accordionHeaderWeb]}
          onPress={() => setNumberCollectionOpen((o) => !o)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ expanded: numberCollectionOpen }}
          accessibilityLabel="Number Collection"
        >
          <Text style={menuStyles.icon}>📈</Text>
          <Text style={menuStyles.label}>Number Collection</Text>
          <Text style={menuStyles.chevron}>{numberCollectionOpen ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        {numberCollectionOpen ? (
          <View style={styles.collectionBody}>
            <Text style={styles.collectionIntro}>
              Keep favorite combos here, or note sets you are watching from Analysis and draw History.
            </Text>
            <View style={styles.collectionActions}>
              <TouchableOpacity
                style={[styles.collectionBtn, styles.collectionBtnPrimary]}
                onPress={openCollectionModal}
                activeOpacity={0.85}
              >
                <Text style={styles.collectionBtnPrimaryText}>＋ Add combination</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.collectionBtn}
                onPress={() => navigation.navigate('Analysis')}
                activeOpacity={0.85}
              >
                <Text style={styles.collectionBtnText}>Open Analysis</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.collectionBtn}
                onPress={() => navigation.navigate('History')}
                activeOpacity={0.85}
              >
                <Text style={styles.collectionBtnText}>Drawing history</Text>
              </TouchableOpacity>
            </View>
            {loadingData ? (
              <ActivityIndicator style={styles.lotterySavedLoading} color={isWebDashboard ? webDash.accent : '#63B3ED'} />
            ) : collectionItems.length === 0 ? (
              <Text style={styles.emptyText}>No entries yet. Add a combination or visit Analysis / History.</Text>
            ) : (
              collectionItems.map((item) => (
                <View key={item.id} style={styles.ticketCard}>
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketGame}>{item.game.toUpperCase()}</Text>
                    <TouchableOpacity onPress={() => confirmDeleteCollection(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={styles.collectionRemove}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.collectionMeta}>
                    {(item.name || 'Untitled') + ' · ' + (SOURCE_LABELS[item.source as NumberCollectionSource] || item.source)}
                  </Text>
                  <LottoRow whites={item.whites} powerball={item.powerball} game={item.game} size={28} />
                </View>
              ))
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>Support</Text>
        <MenuItem
          icon="❓"
          label="FAQ"
          onPress={() => navigation.navigate('FAQ')}
        />
        <MenuItem
          icon="💬"
          label="Customer Support"
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        />
        <MenuItem icon="📄" label="Terms of Service" onPress={() => navigation.navigate('TermsOfService')} />
        <MenuItem icon="🔒" label="Privacy Policy" onPress={() => navigation.navigate('PrivacyPolicy')} />
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>LottoDream v1.0.0</Text>
      <LandingStyleFooter />
    </ScrollView>

      <Modal
        visible={collectionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setCollectionModalVisible(false);
          setCollectionFormError(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add to collection</Text>
            <Text style={styles.modalHint}>Five main numbers + bonus for the selected game.</Text>

            <Text style={styles.modalFieldLabel}>Game</Text>
            <View style={styles.gamePickRow}>
              {(['powerball', 'megamillions'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.gameChip, collGame === g && styles.gameChipOn]}
                  onPress={() => {
                    setCollGame(g);
                    setCollectionFormError(null);
                  }}
                >
                  <Text style={[styles.gameChipText, collGame === g && styles.gameChipTextOn]}>
                    {g === 'powerball' ? 'Powerball' : 'Mega Millions'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalFieldLabel}>Label (optional)</Text>
            <TextInput
              style={styles.modalInput}
              value={collName}
              onChangeText={setCollName}
              placeholder="e.g. Weekly lucky set"
              placeholderTextColor={isWebDashboard ? '#94A3B8' : '#718096'}
            />

            <Text style={styles.modalFieldLabel}>How you use it</Text>
            <View style={styles.sourcePickCol}>
              {(Object.keys(SOURCE_LABELS) as NumberCollectionSource[]).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.sourceRow, collSource === key && styles.sourceRowOn]}
                  onPress={() => setCollSource(key)}
                >
                  <Text style={[styles.sourceRowText, collSource === key && styles.sourceRowTextOn]}>
                    {SOURCE_LABELS[key]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalFieldLabel}>Main numbers (5)</Text>
            <View style={styles.whiteInputsRow}>
              {collWhites.map((v, i) => (
                <TextInput
                  key={i}
                  style={styles.whiteInput}
                  value={v}
                  onChangeText={(t) => {
                    setCollectionFormError(null);
                    const next = [...collWhites];
                    next[i] = t.replace(/[^0-9]/g, '');
                    setCollWhites(next);
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="–"
                  placeholderTextColor={isWebDashboard ? '#94A3B8' : '#718096'}
                />
              ))}
            </View>

            <Text style={styles.modalFieldLabel}>{getGameConfig(collGame).bonusLabel}</Text>
            <TextInput
              style={styles.modalInput}
              value={collPb}
              onChangeText={(t) => {
                setCollectionFormError(null);
                setCollPb(t.replace(/[^0-9]/g, ''));
              }}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="–"
              placeholderTextColor={isWebDashboard ? '#94A3B8' : '#718096'}
            />

            {collectionFormError ? (
              <Text style={styles.collectionInlineError}>{collectionFormError}</Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setCollectionModalVisible(false);
                  setCollectionFormError(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, savingCollection && styles.modalSaveBtnDisabled]}
                onPress={() => void submitCollectionModal()}
                disabled={savingCollection}
              >
                {savingCollection ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={pendingDeleteCollection != null}
        transparent
        animationType="fade"
        onRequestClose={cancelDeleteCollection}
      >
        <View style={styles.confirmBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={cancelDeleteCollection}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
          />
          <View style={styles.confirmCardWrap} pointerEvents="box-none">
            <View style={styles.confirmCard}>
              <Text style={styles.confirmTitle}>Remove from collection?</Text>
              <Text style={styles.confirmSubtitle}>
                This will not affect Saved Numbers from Predict — only this collection entry.
              </Text>
              {pendingDeleteCollection ? (
                <View style={styles.confirmPreview}>
                  <Text style={styles.confirmPreviewMeta}>
                    {pendingDeleteCollection.game.toUpperCase()}
                    {(pendingDeleteCollection.name ? ` · ${pendingDeleteCollection.name}` : '')}
                  </Text>
                  <LottoRow
                    whites={pendingDeleteCollection.whites}
                    powerball={pendingDeleteCollection.powerball}
                    game={pendingDeleteCollection.game}
                    size={30}
                  />
                </View>
              ) : null}
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={styles.confirmBtnSecondary}
                  onPress={cancelDeleteCollection}
                  disabled={deletingCollection}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmBtnSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtnDanger, deletingCollection && styles.modalSaveBtnDisabled]}
                  onPress={() => void runDeleteCollection()}
                  disabled={deletingCollection}
                  activeOpacity={0.85}
                >
                  {deletingCollection ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.confirmBtnDangerText}>Remove</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <AppFeedbackModal
        visible={alertFeedback != null}
        title={alertFeedback?.title ?? ''}
        message={alertFeedback?.message ?? ''}
        variant={alertFeedback?.variant ?? 'error'}
        confirmLabel="OK"
        onConfirm={() => setAlertFeedback(null)}
      />

      <AppFeedbackModal
        visible={signOutConfirmVisible}
        title="Sign out?"
        message="You will need to sign in again to access your profile and saved numbers."
        variant="warning"
        cancelLabel="Cancel"
        onCancel={() => setSignOutConfirmVisible(false)}
        confirmLabel="Sign out"
        confirmDestructive
        onConfirm={() => {
          setSignOutConfirmVisible(false);
          void performSignOut();
        }}
      />
    </>
  );
}

function MenuItem({
  icon,
  label,
  detail,
  onPress,
}: {
  icon: string;
  label: string;
  detail?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[menuStyles.item, styles.menuItemRowWeb]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={menuStyles.icon}>{icon}</Text>
      <Text style={menuStyles.label}>{label}</Text>
      <Text style={menuStyles.detail}>{detail || '›'}</Text>
    </TouchableOpacity>
  );
}

const menuStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: isWebDashboard ? webDash.rowBorder : '#2D3748',
  },
  icon: {
    fontSize: 18,
    marginRight: 12,
  },
  label: {
    flex: 1,
    color: isWebDashboard ? webDash.textPrimary : '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  detail: {
    color: isWebDashboard ? webDash.textSecondary : '#718096',
    fontSize: 13,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  chevron: {
    color: isWebDashboard ? webDash.textSecondary : '#718096',
    fontSize: 12,
    fontWeight: '600',
    minWidth: 22,
    textAlign: 'right',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.screenBg,
  },
  content: {
    paddingBottom: 40,
    ...Platform.select({
      web: { paddingHorizontal: 0, paddingTop: 12 },
      default: { padding: 16 },
    }),
  },
  accordionHeaderWeb: Platform.select({
    web: { cursor: 'pointer' as const },
    default: {},
  }),
  menuItemRowWeb: Platform.select({
    web: { cursor: 'pointer' as const },
    default: {},
  }),
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loginPromptIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loginPromptTitle: {
    color: C.textPrimary,
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  loginPromptText: {
    color: isWebDashboard ? webDash.textSecondary : '#A0AEC0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  loginButton: {
    ...(isWebDashboard ? landingCtaPrimaryButton : {}),
    backgroundColor: isWebDashboard ? landingCtaPrimaryButton.backgroundColor : '#3182CE',
    borderRadius: isWebDashboard ? landingCtaPrimaryButton.borderRadius : 12,
    paddingHorizontal: 40,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginButtonText: {
    ...(isWebDashboard ? landingCtaPrimaryButtonText : {}),
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: isWebDashboard ? webDash.accent : '#3182CE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  username: {
    color: C.textPrimary,
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  email: {
    color: isWebDashboard ? webDash.textSecondary : '#A0AEC0',
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  planPill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  planPillBasic: {
    backgroundColor: isWebDashboard ? webDash.cardBgMuted : '#1F2A44',
    borderColor: isWebDashboard ? webDash.cardBorder : '#2D3748',
  },
  planPillPremium: {
    backgroundColor: isWebDashboard ? 'rgba(234, 179, 8, 0.12)' : 'rgba(250, 204, 21, 0.15)',
    borderColor: isWebDashboard ? 'rgba(234, 179, 8, 0.5)' : '#FACC15',
  },
  planPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  planPillTextBasic: {
    color: isWebDashboard ? webDash.textSecondary : '#A0AEC0',
  },
  planPillTextPremium: {
    color: isWebDashboard ? '#92400E' : '#FACC15',
  },
  upgradeCard: {
    marginTop: 18,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: isWebDashboard ? 'rgba(234, 179, 8, 0.5)' : '#7B61FF',
    backgroundColor: isWebDashboard ? 'rgba(254, 252, 232, 0.9)' : '#2D1B69',
    ...(isWebDashboard
      ? ({
          boxShadow:
            '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 24px -12px rgba(180, 83, 9, 0.18)',
          cursor: 'pointer' as const,
        } as object)
      : {}),
  },
  upgradeCardLeft: { flex: 1, gap: 4 },
  upgradeCardEyebrow: {
    color: isWebDashboard ? '#B45309' : '#FDE68A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  upgradeCardTitle: {
    color: isWebDashboard ? '#92400E' : '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  upgradeCardSub: {
    color: isWebDashboard ? '#78350F' : '#CBD5E1',
    fontSize: 12,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  upgradeCardCta: {
    backgroundColor: isWebDashboard ? '#B45309' : '#7B61FF',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  upgradeCardCtaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  savedNumbersInLottery: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  lotterySavedLoading: {
    marginVertical: 16,
  },
  lotterySectionDivider: {
    borderTopWidth: 1,
    borderTopColor: isWebDashboard ? webDash.rowBorder : '#2D3748',
    marginTop: 8,
    marginBottom: 0,
  },
  emptyText: {
    color: isWebDashboard ? webDash.textSecondary : '#A0AEC0',
    fontSize: 13,
    marginTop: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  ticketCard: {
    backgroundColor: isWebDashboard ? '#FFFFFF' : '#0F1B33',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    gap: 10,
    ...(isWebDashboard ? { borderWidth: 1, borderColor: webDash.cardBorder } : {}),
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketGame: {
    color: isWebDashboard ? webDash.accent : '#63B3ED',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  ticketStatus: {
    color: isWebDashboard ? webDash.textSecondary : '#A0AEC0',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  menuSection: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...(isWebDashboard ? { borderWidth: 1, borderColor: webDash.cardBorder } : {}),
  },
  menuTitle: {
    color: isWebDashboard ? webDash.accent : '#63B3ED',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  signOutButton: {
    backgroundColor: '#E53E3E22',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E53E3E44',
  },
  signOutText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  version: {
    color: isWebDashboard ? webDash.textSecondary : '#4A5568',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  collectionBody: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  collectionIntro: {
    color: isWebDashboard ? webDash.textMuted : '#A0AEC0',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 12,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  collectionActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  collectionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: isWebDashboard ? '#FFFFFF' : '#1A2744',
    borderWidth: 1,
    borderColor: isWebDashboard ? webDash.cardBorder : '#2D3748',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : null),
  },
  collectionBtnPrimary: {
    backgroundColor: isWebDashboard ? webDash.accent : '#3182CE',
    borderColor: isWebDashboard ? webDash.accent : '#3182CE',
  },
  collectionBtnText: {
    color: isWebDashboard ? webDash.textPrimary : '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  collectionBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  collectionMeta: {
    color: isWebDashboard ? webDash.textMuted : '#718096',
    fontSize: 11,
    marginBottom: 6,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  collectionRemove: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%' as const,
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    backgroundColor: isWebDashboard ? '#FFFFFF' : '#1A2744',
    ...(isWebDashboard ? { borderWidth: 1, borderColor: webDash.cardBorder } : {}),
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 6,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  modalHint: {
    fontSize: 12,
    color: isWebDashboard ? webDash.textSecondary : '#A0AEC0',
    marginBottom: 16,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: isWebDashboard ? webDash.textMuted : '#A0AEC0',
    marginBottom: 6,
    marginTop: 10,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  collectionInlineError: {
    fontSize: 13,
    fontWeight: '500',
    color: '#DC2626',
    marginTop: 12,
    marginBottom: 4,
    lineHeight: 18,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  gamePickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gameChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isWebDashboard ? webDash.cardBorder : '#2D3748',
    backgroundColor: isWebDashboard ? webDash.cardBg : '#0F1B33',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : null),
  },
  gameChipOn: {
    borderColor: isWebDashboard ? webDash.accent : '#63B3ED',
    backgroundColor: isWebDashboard ? 'rgba(0, 163, 131, 0.12)' : '#2C5282',
  },
  gameChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: isWebDashboard ? webDash.textSecondary : '#A0AEC0',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  gameChipTextOn: {
    color: isWebDashboard ? webDash.accent : '#FFFFFF',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: isWebDashboard ? webDash.inputBorder : '#2D3748',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: C.textPrimary,
    backgroundColor: isWebDashboard ? webDash.inputBg : '#0F1B33',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  sourcePickCol: {
    gap: 6,
  },
  sourceRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isWebDashboard ? webDash.cardBorder : '#2D3748',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : null),
  },
  sourceRowOn: {
    borderColor: isWebDashboard ? webDash.accent : '#63B3ED',
    backgroundColor: isWebDashboard ? 'rgba(0, 163, 131, 0.08)' : '#2C5282',
  },
  sourceRowText: {
    fontSize: 13,
    color: isWebDashboard ? webDash.textPrimary : '#E2E8F0',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  sourceRowTextOn: {
    fontWeight: '600',
    color: isWebDashboard ? webDash.accent : '#FFFFFF',
  },
  whiteInputsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  whiteInput: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderColor: isWebDashboard ? webDash.inputBorder : '#2D3748',
    borderRadius: 10,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: C.textPrimary,
    backgroundColor: isWebDashboard ? webDash.inputBg : '#0F1B33',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : null),
  },
  modalCancelText: {
    color: isWebDashboard ? webDash.textSecondary : '#A0AEC0',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  modalSaveBtn: {
    backgroundColor: isWebDashboard ? webDash.accent : '#3182CE',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : null),
  },
  modalSaveBtnDisabled: {
    opacity: 0.6,
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmCardWrap: {
    width: '100%' as const,
    maxWidth: 380,
    zIndex: 1,
  },
  confirmCard: {
    borderRadius: 16,
    padding: 22,
    backgroundColor: isWebDashboard ? '#FFFFFF' : '#1A2744',
    ...(isWebDashboard ? { borderWidth: 1, borderColor: webDash.cardBorder } : {}),
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.textPrimary,
    marginBottom: 8,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  confirmSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: isWebDashboard ? webDash.textSecondary : '#A0AEC0',
    marginBottom: 16,
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  confirmPreview: {
    backgroundColor: isWebDashboard ? webDash.cardBg : '#0F1B33',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    alignItems: 'center',
    gap: 10,
    ...(isWebDashboard ? { borderWidth: 1, borderColor: webDash.cardBorder } : {}),
  },
  confirmPreviewMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: isWebDashboard ? webDash.accent : '#63B3ED',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  confirmBtnSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: isWebDashboard ? webDash.cardBorder : '#4A5568',
    backgroundColor: isWebDashboard ? '#FFFFFF' : 'transparent',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : null),
  },
  confirmBtnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: isWebDashboard ? webDash.textPrimary : '#E2E8F0',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  confirmBtnDanger: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    minWidth: 100,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? ({ cursor: 'pointer' as const } as object) : null),
  },
  confirmBtnDangerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});
