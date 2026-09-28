// ============================================
// useEntitlement – single source of truth for plan tier
// ============================================
//
// Reads the current user's `profiles` row and exposes a simple boolean
// `isPremium` that screens and gates can consume. Automatically refreshes
// when the auth user changes and when the provided `Supabase auth state`
// fires an update. Also re-queries on a window `focus` event so that when
// a user returns from the Stripe Checkout tab, the entitlement updates
// promptly. In the mobile apps it also ties RevenueCat to the signed-in user
// and trusts the store's receipt immediately after a purchase, before the
// `revenuecat-webhook` sync reaches Supabase.
//
import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode, createElement } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { getProfile } from '../services/authService';
import { iapOnPremiumChange, iapSetUser } from '../services/iap';
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
  /** Where the subscription was bought: 'stripe' | 'apple' | 'google' | 'manual'. */
  source: string | null;
  plan: 'monthly' | 'yearly' | null;
  /** First-time subscribers get the free trial; returning ones do not. */
  trialEligible: boolean;
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
  source: null,
  plan: null,
  trialEligible: true,
  loading: false,
  refresh: async () => undefined,
});

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [storePremium, setStorePremium] = useState(false);
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

  // Native: link RevenueCat to this user and mirror the store entitlement.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    setStorePremium(false);
    let unsubscribe: () => void = () => {};
    let cancelled = false;
    void iapSetUser(user?.id ?? null).then(() => {
      if (cancelled || !user) return;
      unsubscribe = iapOnPremiumChange((active) => {
        if (!mountedRef.current) return;
        setStorePremium(active);
        // A purchase just landed; pick up the webhook's profile update.
        if (active) void load();
      });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [user, load]);

  // Refresh when the user returns to the web tab (e.g. after Stripe Checkout).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onFocus = () => {
      void load();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const status = profile?.subscription_status ?? null;
  const isPremium =
    storePremium ||
    profile?.subscription_tier === 'premium' ||
    status === 'active' ||
    status === 'trialing';

  const value: EntitlementState = {
    profile,
    isPremium,
    isTrialing: status === 'trialing',
    status,
    trialEnd: profile?.trial_end ?? null,
    currentPeriodEnd: profile?.current_period_end ?? null,
    cancelAtPeriodEnd: Boolean(profile?.cancel_at_period_end),
    source: profile?.premium_source ?? (storePremium ? (Platform.OS === 'ios' ? 'apple' : 'google') : null),
    plan: profile?.subscription_plan ?? null,
    trialEligible: !profile?.has_used_trial,
    loading,
    refresh: load,
  };

  return createElement(EntitlementContext.Provider, { value }, children);
}

export function useEntitlement(): EntitlementState {
  return useContext(EntitlementContext);
}
