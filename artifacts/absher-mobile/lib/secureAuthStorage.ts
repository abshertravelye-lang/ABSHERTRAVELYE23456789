/**
 * Secure session storage.
 *
 * Tokens (access + refresh) live in expo-secure-store (Keychain on iOS,
 * EncryptedSharedPreferences on Android, localStorage polyfill on web).
 * The user profile is larger than SecureStore's 2 KB per-value guidance and
 * is not a credential, so it stays in AsyncStorage under a separate key.
 *
 * Existing sessions stored under the legacy AsyncStorage key are migrated
 * transparently on first read so nobody gets logged out by the upgrade.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { SafeUser } from '@workspace/api-client-react';

const TOKENS_KEY = 'absher_auth_tokens'; // SecureStore: [A-Za-z0-9._-] only
const USER_KEY = '@absher_auth_user';
const LEGACY_KEY = '@absher_auth';

// expo-secure-store has NO web implementation — fall back to AsyncStorage
// (localStorage) there. Web preview is dev-only; native devices always get
// Keychain / EncryptedSharedPreferences.
const useSecureStore = Platform.OS !== 'web';

export type StoredSession = {
  user: SafeUser | null;
  accessToken: string | null;
  refreshToken: string | null;
};

type StoredTokens = { accessToken: string; refreshToken: string };

async function readTokens(): Promise<StoredTokens | null> {
  try {
    const raw = useSecureStore
      ? await SecureStore.getItemAsync(TOKENS_KEY)
      : await AsyncStorage.getItem(TOKENS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken) return null;
    return parsed as StoredTokens;
  } catch {
    return null;
  }
}

async function writeTokens(tokens: StoredTokens): Promise<void> {
  const raw = JSON.stringify(tokens);
  if (useSecureStore) {
    await SecureStore.setItemAsync(TOKENS_KEY, raw);
  } else {
    await AsyncStorage.setItem(TOKENS_KEY, raw);
  }
}

/** One-time migration from the legacy AsyncStorage blob. */
async function migrateLegacy(): Promise<StoredSession | null> {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const session: StoredSession = {
      user: parsed?.user ?? null,
      accessToken: parsed?.accessToken ?? null,
      refreshToken: parsed?.refreshToken ?? null,
    };
    if (session.accessToken && session.refreshToken) {
      await writeTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken });
    }
    if (session.user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(session.user));
    }
    await AsyncStorage.removeItem(LEGACY_KEY);
    return session;
  } catch {
    return null;
  }
}

export async function loadSession(): Promise<StoredSession | null> {
  const tokens = await readTokens();
  if (tokens) {
    let user: SafeUser | null = null;
    try {
      const rawUser = await AsyncStorage.getItem(USER_KEY);
      if (rawUser) user = JSON.parse(rawUser);
    } catch {
      user = null;
    }
    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }
  return migrateLegacy();
}

export async function saveSession(session: {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  await Promise.all([
    writeTokens({ accessToken: session.accessToken, refreshToken: session.refreshToken }),
    AsyncStorage.setItem(USER_KEY, JSON.stringify(session.user)),
  ]);
}

export async function updateStoredTokens(tokens: StoredTokens): Promise<void> {
  await writeTokens(tokens);
}

export async function updateStoredUser(user: SafeUser): Promise<void> {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // in-memory state still updates
  }
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    useSecureStore
      ? SecureStore.deleteItemAsync(TOKENS_KEY).catch(() => {})
      : AsyncStorage.removeItem(TOKENS_KEY).catch(() => {}),
    AsyncStorage.removeItem(USER_KEY).catch(() => {}),
    AsyncStorage.removeItem(LEGACY_KEY).catch(() => {}),
  ]);
}
