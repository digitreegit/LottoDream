// ============================================
// My Page Screen - User profile & settings
// ============================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { getProfile, signOut } from '../services/authService';
import { addDemoPoints, getSavedNumberSets, getTicketPurchases } from '../services/ticketService';
import { LottoRow } from '../components/LottoBall';
import { SavedNumberSet, TicketPurchase, UserProfile } from '../types';

export function MyPageScreen({ navigation }: any) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tickets, setTickets] = useState<TicketPurchase[]>([]);
  const [savedNumbers, setSavedNumbers] = useState<SavedNumberSet[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (user) {
      setLoadingData(true);
      Promise.all([getProfile(), getTicketPurchases(5), getSavedNumberSets(5)])
        .then(([nextProfile, nextTickets, nextSaved]) => {
          setProfile(nextProfile);
          setTickets(nextTickets);
          setSavedNumbers(nextSaved);
        })
        .finally(() => setLoadingData(false));
    }
  }, [user]);

  const handleChargePoints = async () => {
    const { error } = await addDemoPoints(30);
    if (error) {
      Alert.alert('Charge Failed', error);
      return;
    }

    const nextProfile = await getProfile();
    setProfile(nextProfile);
    Alert.alert('Points Added', '30 demo points were added to your account.');
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loginPromptIcon}>🔒</Text>
          <Text style={styles.loginPromptTitle}>Sign In Required</Text>
          <Text style={styles.loginPromptText}>
            Sign in to access your profile, saved numbers, and purchase history.
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.username || user.email || '?')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>{profile?.username || 'User'}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* Points Balance */}
      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>Points Balance</Text>
        <Text style={styles.pointsValue}>
          {(profile?.points || 0).toLocaleString()}
        </Text>
        <TouchableOpacity style={styles.chargeButton} onPress={handleChargePoints}>
          <Text style={styles.chargeText}>+ Add 30 Demo Points</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Saved Sets</Text>
          <Text style={styles.summaryValue}>{savedNumbers.length}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Purchases</Text>
          <Text style={styles.summaryValue}>{tickets.length}</Text>
        </View>
      </View>

      {loadingData ? (
        <ActivityIndicator style={styles.loadingIndicator} color="#63B3ED" />
      ) : (
        <>
          <View style={styles.menuSection}>
            <Text style={styles.menuTitle}>Recent Purchases</Text>
            {tickets.length === 0 ? (
              <Text style={styles.emptyText}>No purchased tickets yet.</Text>
            ) : (
              tickets.map((ticket) => (
                <View key={ticket.id} style={styles.ticketCard}>
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketGame}>{ticket.game.toUpperCase()}</Text>
                    <Text style={styles.ticketStatus}>{ticket.status}</Text>
                  </View>
                  <LottoRow whites={ticket.whites} powerball={ticket.powerball} game={ticket.game} size={28} />
                  <Text style={styles.ticketMeta}>Draw: {ticket.draw_date} · {ticket.points_spent} pts</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.menuTitle}>Saved Numbers</Text>
            {savedNumbers.length === 0 ? (
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
        </>
      )}

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>Account</Text>
        <MenuItem icon="✏️" label="Edit Profile" onPress={() => {}} />
        <MenuItem icon="💳" label="Payment Methods" onPress={() => {}} />
        <MenuItem icon="📊" label="Charge History" onPress={() => {}} />
        <MenuItem icon="🎫" label="Purchase History" onPress={() => {}} />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>Lottery</Text>
        <MenuItem icon="📋" label="My Tickets" onPress={() => {}} />
        <MenuItem icon="💾" label="Saved Numbers" onPress={() => {}} />
        <MenuItem icon="🏆" label="Winning History" onPress={() => {}} />
        <MenuItem icon="📈" label="Number Collection" onPress={() => {}} />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>Social</Text>
        <MenuItem
          icon="🤝"
          label="Referral Code"
          detail={profile?.referral_code || '-'}
          onPress={() => {
            if (profile?.referral_code) {
              Alert.alert('Your Referral Code', profile.referral_code);
            }
          }}
        />
        <MenuItem icon="👥" label="Invite Friends" onPress={() => {}} />
      </View>

      <View style={styles.menuSection}>
        <Text style={styles.menuTitle}>Support</Text>
        <MenuItem icon="❓" label="FAQ" onPress={() => {}} />
        <MenuItem icon="💬" label="Customer Support" onPress={() => {}} />
        <MenuItem icon="📄" label="Terms of Service" onPress={() => {}} />
        <MenuItem icon="🔒" label="Privacy Policy" onPress={() => {}} />
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>LottoDream v1.0.0</Text>
    </ScrollView>
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
    <TouchableOpacity style={menuStyles.item} onPress={onPress}>
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
    borderBottomColor: '#2D3748',
  },
  icon: {
    fontSize: 18,
    marginRight: 12,
  },
  label: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  detail: {
    color: '#718096',
    fontSize: 13,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1426',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
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
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  loginPromptText: {
    color: '#A0AEC0',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  loginButton: {
    backgroundColor: '#3182CE',
    borderRadius: 12,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3182CE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  username: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  email: {
    color: '#A0AEC0',
    fontSize: 14,
    marginTop: 4,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  pointsCard: {
    backgroundColor: '#1A2744',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F6AD5544',
  },
  pointsLabel: {
    color: '#A0AEC0',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  pointsValue: {
    color: '#F6AD55',
    fontSize: 37,
    fontWeight: '700',
    marginVertical: 8,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  chargeButton: {
    backgroundColor: '#F6AD5533',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#F6AD55',
  },
  chargeText: {
    color: '#F6AD55',
    fontWeight: '600',
    fontSize: 14,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1A2744',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '700',
    marginTop: 8,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  emptyText: {
    color: '#A0AEC0',
    fontSize: 13,
    marginTop: 8,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  ticketCard: {
    backgroundColor: '#0F1B33',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    gap: 10,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketGame: {
    color: '#63B3ED',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  ticketStatus: {
    color: '#A0AEC0',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  ticketMeta: {
    color: '#718096',
    fontSize: 12,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  menuSection: {
    backgroundColor: '#1A2744',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  menuTitle: {
    color: '#63B3ED',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
    color: '#FC8181',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Rubik, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  version: {
    color: '#4A5568',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});
