// ============================================
// Auth Service
// ============================================
import { supabase } from '../config/supabase';
import { getSupabaseConfigError } from '../config/constants';
import { UserProfile } from '../types';
import { Platform, Linking } from 'react-native';

const AUTH_TIMEOUT_MS = 15000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs = AUTH_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timed out. Please try again.'));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function formatAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid api key')) {
    return 'Supabase API key is invalid. Check EXPO_PUBLIC_SUPABASE_ANON_KEY in .env and restart Expo.';
  }
  return message;
}

export async function signUp(
  email: string,
  password: string,
  username: string
): Promise<{ user: any; session: any; error: string | null }> {
  const configError = getSupabaseConfigError();
  if (configError) {
    return {
      user: null,
      session: null,
      error: configError,
    };
  }

  try {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username },
        },
      })
    );

    if (error) return { user: null, session: null, error: formatAuthError(error.message) };
    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    return { user: null, session: null, error: formatAuthError(err?.message || 'Sign up failed') };
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<{ user: any; session: any; error: string | null }> {
  const configError = getSupabaseConfigError();
  if (configError) {
    return {
      user: null,
      session: null,
      error: configError,
    };
  }

  try {
    const { data, error } = await withTimeout(
      supabase.auth.signInWithPassword({
        email,
        password,
      })
    );

    if (error) return { user: null, session: null, error: formatAuthError(error.message) };
    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    return { user: null, session: null, error: formatAuthError(err?.message || 'Sign in failed') };
  }
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const configError = getSupabaseConfigError();
  if (configError) {
    return { error: configError };
  }

  try {
    if (Platform.OS === 'web') {
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await withTimeout(
        supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        })
      );

      return { error: error?.message ? formatAuthError(error.message) : null };
    }

    const { data, error } = await withTimeout(
      supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          redirectTo: 'lottodream://auth/callback',
        },
      })
    );

    if (error) {
      return { error: formatAuthError(error.message) };
    }

    if (!data?.url) {
      return { error: 'Google login URL could not be created. Please try again.' };
    }

    const canOpen = await Linking.canOpenURL(data.url);
    if (!canOpen) {
      return { error: 'Cannot open Google login page on this device.' };
    }

    await Linking.openURL(data.url);
    return { error: null };
  } catch (err: any) {
    return { error: formatAuthError(err?.message || 'Google sign in failed') };
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) {
    throw new Error(formatAuthError(error.message));
  }
}

export async function getProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data;
}

export async function updateProfile(
  updates: Partial<Pick<UserProfile, 'username' | 'address' | 'phone'>>
): Promise<{ error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  return { error: error?.message || null };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requestPasswordReset(
  email: string
): Promise<{ error: string | null }> {
  const configError = getSupabaseConfigError();
  if (configError) {
    return { error: configError };
  }

  const redirectTo =
    Platform.OS === 'web'
      ? (typeof window !== 'undefined' ? window.location.origin : undefined)
      : 'lottodream://reset-password';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  return { error: error?.message ? formatAuthError(error.message) : null };
}

export async function updatePassword(
  newPassword: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  return { error: error?.message || null };
}
