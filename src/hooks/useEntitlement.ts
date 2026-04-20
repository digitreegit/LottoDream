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
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { getProfile } from '../services/authService';
import { UserProfile } from '../types';
import { useAuth } from './useAuth';

interface EntitlementState {
  profile: UserProfile | null;
  isPremium: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const EntitlementContext = createContext<EntitlementState>({
  profile: null,
  isPremium: false,
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

  const value: EntitlementState = {
    profile,
    isPremium: profile?.subscription_tier === 'premium',
    loading,
    refresh: load,
  };

  return createElement(EntitlementContext.Provider, { value }, children);
}

export function useEntitlement(): EntitlementState {
  return useContext(EntitlementContext);
}
