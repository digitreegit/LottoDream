// ============================================
// useEntitlement – single source of truth for plan tier
// ============================================
//
// Reads the current user's `profiles` row and exposes a simple boolean
// `isPremium` that screens and gates can consume. Automatically refreshes
// when the auth user changes and when the provided `Supabase auth state`
// fires an update. Also re-queries on a window `focus` event so that when
// a user returns from the Stripe Checkout tab, the entitlement updates
// promptly.
//
import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode, createElement } from 'react';
import { AppState, Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { getProfile } from '../services/authService';
import { UserProfile } from '../types';
import { useAuth } from './useAuth';

interface EntitlementState {
  profile: UserProfile | null;
  isPremium: boolean;
  /** True while in the free trial window. */
  isTrialing: boolean;
  /** Raw Stripe-synced status, when available. */
  status: string | null;
  /** ISO timestamp when the trial ends, when trialing. */
  trialEnd: string | null;
  /** ISO timestamp when the current paid/trial period ends. */
  currentPeriodEnd: string | null;
  /** Whether the subscription is set to cancel at period end. */
  cancelAtPeriodEnd: boolean;
  /** Account hasn't used its one free trial yet. */
  trialEligible: boolean;
  /** A card is on file, so the trial converts to paid automatically. */
  hasPaymentMethod: boolean;
  /** Whole days left in the trial (rounded up), when trialing. */
  trialDaysLeft: number | null;
  /** Payment failed; Premium is paused until the card is fixed. */
  isPastDue: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const EntitlementContext = createContext<EntitlementState>({
  profile: null,
  isPremium: false,
  isTrialing: false,
  status: null,
  trialEnd: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  trialEligible: false,
  hasPaymentMethod: false,
  trialDaysLeft: null,
  isPastDue: false,
  loading: false,
  refresh: async () => undefined,
});

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    setLoading(true);
    try {
      const next = await getProfile();
      if (mountedRef.current) setProfile(next);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => {
      mountedRef.current = false;
    };
  }, [load]);

  // Listen for Supabase realtime changes on the user's profile row — fires
  // immediately when the Stripe webhook flips `subscription_tier`.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && mountedRef.current) {
            setProfile((prev) => ({ ...(prev ?? ({} as UserProfile)), ...(payload.new as UserProfile) }));
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  // Refresh when the user returns to the web tab (e.g. after Stripe Checkout).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onFocus = () => {
      void load();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  // Native: refresh when the app returns to the foreground.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void load();
    });
    return () => sub.remove();
  }, [load]);

  const status = profile?.subscription_status ?? null;
  const isPremium =
    profile?.subscription_tier === 'premium' ||
    status === 'active' ||
    status === 'trialing';

  const trialEnd = profile?.trial_end ?? null;
  const trialDaysLeft =
    status === 'trialing' && trialEnd
      ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86_400_000))
      : null;

  const value: EntitlementState = {
    profile,
    isPremium,
    isTrialing: status === 'trialing',
    status,
    trialEnd,
    currentPeriodEnd: profile?.current_period_end ?? null,
    cancelAtPeriodEnd: Boolean(profile?.cancel_at_period_end),
    trialEligible: Boolean(profile) && !profile?.trial_used_at && !status,
    hasPaymentMethod: Boolean(profile?.has_payment_method),
    trialDaysLeft,
    isPastDue: status === 'past_due' || status === 'unpaid',
    loading,
    refresh: load,
  };

  return createElement(EntitlementContext.Provider, { value }, children);
}

export function useEntitlement(): EntitlementState {
  return useContext(EntitlementContext);
}
