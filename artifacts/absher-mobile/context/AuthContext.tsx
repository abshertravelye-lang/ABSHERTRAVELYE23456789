import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { setAuthTokenGetter, setAuthRefreshHandler } from '@workspace/api-client-react';
import type { SafeUser } from '@workspace/api-client-react';
import { setImageAuthToken } from '../hooks/useImageUrl';
import { registerForPush, unregisterPush } from '../lib/pushNotifications';
import {
  clearSession,
  loadSession,
  saveSession,
  updateStoredTokens,
  updateStoredUser,
} from '../lib/secureAuthStorage';

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

type MobileRefreshHandler = () => Promise<string | null>;

const AuthContext = createContext<AuthContextValue>({
  user: null,
  accessToken: null,
  isLoading: true,
  setAuth: async () => {},
  updateUser: async () => {},
  logout: async () => {},
});

let mobileRefreshHandler: MobileRefreshHandler | null = null;

/** Used by multipart uploads, whose FormData body cannot be replayed by customFetch. */
export async function refreshMobileAccessToken(): Promise<string | null> {
  return mobileRefreshHandler ? mobileRefreshHandler() : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, accessToken: null, isLoading: true });
  const tokenRef = useRef<string | null>(null);
  // Refresh token lives only in SecureStore + this ref — never in AsyncStorage.
  const refreshTokenRef = useRef<string | null>(null);

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
    const refreshSession: MobileRefreshHandler = async () => {
      try {
        const refreshToken = refreshTokenRef.current;
        if (!refreshToken) return null;
        const res = await fetch(`https://${process.env.EXPO_PUBLIC_DOMAIN}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) {
          // Refresh token invalid/expired — clear the stale session
          tokenRef.current = null;
          refreshTokenRef.current = null;
          await clearSession();
          setState({ user: null, accessToken: null, isLoading: false });
          return null;
        }
        const data = await res.json();
        tokenRef.current = data.accessToken;
        refreshTokenRef.current = data.refreshToken;
        await updateStoredTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
        setState((s) => ({ ...s, accessToken: data.accessToken }));
        return data.accessToken as string;
      } catch {
        return null;
      }
    };

    mobileRefreshHandler = refreshSession;
    setAuthRefreshHandler(async () => !!(await refreshSession()));
    return () => {
      mobileRefreshHandler = null;
      setAuthRefreshHandler(null);
    };
  }, []);

  // Load persisted auth on startup (SecureStore, with transparent migration
  // from the legacy AsyncStorage blob).
  useEffect(() => {
    loadSession()
      .then((session) => {
        if (session?.accessToken) {
          tokenRef.current = session.accessToken;
          refreshTokenRef.current = session.refreshToken;
          setState({ user: session.user, accessToken: session.accessToken, isLoading: false });
          // Register this device for push after restoring an existing session.
          void registerForPush();
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      })
      .catch(() => {
        setState((s) => ({ ...s, isLoading: false }));
      });
  }, []);

  const setAuth = useCallback(async (auth: { user: SafeUser; accessToken: string; refreshToken: string }) => {
    tokenRef.current = auth.accessToken;
    refreshTokenRef.current = auth.refreshToken;
    await saveSession(auth);
    setState({ user: auth.user, accessToken: auth.accessToken, isLoading: false });
    // Register this device for push after a successful login.
    void registerForPush();
  }, []);

  const updateUser = useCallback(async (user: SafeUser) => {
    await updateStoredUser(user);
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
      const token = tokenRef.current;
      if (token) {
        await fetch(`https://${process.env.EXPO_PUBLIC_DOMAIN}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ refreshToken: refreshTokenRef.current }),
        });
      }
    } catch {
      // Ignore network/server errors — always clear the local session below.
    }
    tokenRef.current = null;
    refreshTokenRef.current = null;
    await clearSession();
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
