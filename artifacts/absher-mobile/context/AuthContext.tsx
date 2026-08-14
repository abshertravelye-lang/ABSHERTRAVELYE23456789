import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { setAuthTokenGetter, setAuthRefreshHandler } from '@workspace/api-client-react';
import type { SafeUser } from '@workspace/api-client-react';
import { setImageAuthToken } from '../hooks/useImageUrl';
import { registerForPush, unregisterPush } from '../lib/pushNotifications';

type AuthState = {
  user: SafeUser | null;
  accessToken: string | null;
  isLoading: boolean;
};

type AuthContextValue = AuthState & {
  setAuth: (auth: { user: SafeUser; accessToken: string; refreshToken: string }) => Promise<void>;
  updateUser: (user: SafeUser) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  accessToken: null,
  isLoading: true,
  setAuth: async () => {},
  updateUser: async () => {},
  logout: async () => {},
});

const STORAGE_KEY = '@absher_auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, accessToken: null, isLoading: true });
  const tokenRef = useRef<string | null>(null);

  // Keep the image-URL helper's token in sync so access-controlled object URLs
  // (passports, IDs, photos) render in <Image> tags, which can't send headers.
  useEffect(() => {
    setImageAuthToken(state.accessToken);
  }, [state.accessToken]);

  // Wire up auth token getter for the API client
  useEffect(() => {
    setAuthTokenGetter(() => tokenRef.current);
    // Auto-refresh expired access tokens (15 min TTL) with the stored
    // refresh token so long-lived sessions don't start failing with 401s.
    setAuthRefreshHandler(async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const stored = JSON.parse(raw);
        if (!stored.refreshToken) return false;
        const res = await fetch(`https://${process.env.EXPO_PUBLIC_DOMAIN}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: stored.refreshToken }),
        });
        if (!res.ok) {
          // Refresh token invalid/expired — clear the stale session
          tokenRef.current = null;
          await AsyncStorage.removeItem(STORAGE_KEY);
          setState({ user: null, accessToken: null, isLoading: false });
          return false;
        }
        const data = await res.json();
        tokenRef.current = data.accessToken;
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...stored, accessToken: data.accessToken, refreshToken: data.refreshToken }),
        );
        setState((s) => ({ ...s, accessToken: data.accessToken }));
        return true;
      } catch {
        return false;
      }
    });
    return () => setAuthRefreshHandler(null);
  }, []);

  // Load persisted auth on startup
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const { user, accessToken } = JSON.parse(raw);
          tokenRef.current = accessToken;
          setState({ user, accessToken, isLoading: false });
          // Register this device for push after restoring an existing session.
          if (accessToken) void registerForPush();
        } catch {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    });
  }, []);

  const setAuth = useCallback(async (auth: { user: SafeUser; accessToken: string; refreshToken: string }) => {
    tokenRef.current = auth.accessToken;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    setState({ user: auth.user, accessToken: auth.accessToken, isLoading: false });
    // Register this device for push after a successful login.
    void registerForPush();
  }, []);

  const updateUser = useCallback(async (user: SafeUser) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, user }));
      } catch {
        // keep going — in-memory state still updates
      }
    }
    setState((s) => ({ ...s, user }));
  }, []);

  const logout = useCallback(async () => {
    // Remove this device's push token BEFORE clearing local tokens (the DELETE
    // needs a valid bearer token). Fails silently.
    await unregisterPush();
    // Revoke the session on the server (best-effort) before clearing local
    // tokens. The endpoint requires auth + accepts the refresh token to revoke
    // the matching session row (see api-server/src/routes/auth.ts POST /auth/logout).
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const stored = raw ? JSON.parse(raw) : null;
      const token = tokenRef.current;
      if (token) {
        await fetch(`https://${process.env.EXPO_PUBLIC_DOMAIN}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ refreshToken: stored?.refreshToken }),
        });
      }
    } catch {
      // Ignore network/server errors — always clear the local session below.
    }
    tokenRef.current = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState({ user: null, accessToken: null, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, setAuth, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
