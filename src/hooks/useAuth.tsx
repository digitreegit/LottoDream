// ============================================
// Auth Context & Hook
// ============================================
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../config/supabase';
import { Session, User } from '@supabase/supabase-js';
import { setLastAuthProvider } from '../utils/authProviderStorage';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  session: null,
  loading: true,
  initialized: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    initialized: false,
  });

  useEffect(() => {
    const inferProvider = (user: User | null): string | null => {
      if (!user) return null;

      const providersFromMeta = (user.app_metadata as { providers?: string[] } | undefined)?.providers;
      if (Array.isArray(providersFromMeta) && providersFromMeta.includes('google')) {
        return 'google';
      }

      const providerFromMeta = (user.app_metadata as { provider?: string } | undefined)?.provider;
      if (providerFromMeta === 'google') return 'google';
      if (providerFromMeta) return providerFromMeta;

      const googleIdentity = user.identities?.find((identity) => identity.provider === 'google');
      if (googleIdentity?.provider) return 'google';

      const firstIdentityProvider = (user.identities?.[0] as { provider?: string } | undefined)?.provider;
      return firstIdentityProvider || null;
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const provider = inferProvider(session?.user ?? null);
      if (provider) {
        void setLastAuthProvider(provider);
      }

      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        initialized: true,
      });
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const provider = inferProvider(session?.user ?? null);
        if (provider) {
          void setLastAuthProvider(provider);
        }

        setState((prev) => ({
          ...prev,
          user: session?.user ?? null,
          session,
          loading: false,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={state}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
