import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const LAST_AUTH_PROVIDER_KEY = 'lottodream:last-auth-provider';

export async function getLastAuthProvider(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage === 'undefined'
        ? null
        : localStorage.getItem(LAST_AUTH_PROVIDER_KEY);
    }

    return SecureStore.getItemAsync(LAST_AUTH_PROVIDER_KEY);
  } catch {
    return null;
  }
}

export async function setLastAuthProvider(provider: string): Promise<void> {
  if (!provider) return;

  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LAST_AUTH_PROVIDER_KEY, provider);
      }
      return;
    }

    await SecureStore.setItemAsync(LAST_AUTH_PROVIDER_KEY, provider);
  } catch {
    // Best-effort storage only.
  }
}
