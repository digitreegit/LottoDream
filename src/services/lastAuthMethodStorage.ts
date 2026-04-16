// ============================================
// Remember last sign-in method for Login UI hints
// ============================================
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'lottodream_last_auth_method';

export type LastAuthMethod = 'email' | 'google';

export async function setLastAuthMethod(method: LastAuthMethod): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, method);
      return;
    }
    await SecureStore.setItemAsync(STORAGE_KEY, method);
  } catch {
    // Non-fatal: badge is optional UX
  }
}

export async function getLastAuthMethod(): Promise<LastAuthMethod | null> {
  try {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'email' || v === 'google' ? v : null;
    }
    const v = await SecureStore.getItemAsync(STORAGE_KEY);
    return v === 'email' || v === 'google' ? v : null;
  } catch {
    return null;
  }
}
