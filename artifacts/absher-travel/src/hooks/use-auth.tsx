import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { setAuthTokenGetter, SafeUser, useLoginUser, useRegisterUser, useLogoutUser } from "@workspace/api-client-react";

const ACCESS_TOKEN_KEY = "absher_access_token";
const REFRESH_TOKEN_KEY = "absher_refresh_token";
const USER_KEY = "absher_user";

interface AuthContextValue {
  user: SafeUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isStaff: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<SafeUser>;
  register: (input: { email?: string; phone?: string; password: string; firstName?: string; lastName?: string }) => Promise<SafeUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): SafeUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SafeUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [user, setUser] = useState<SafeUser | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  }, []);

  const persist = useCallback((authUser: SafeUser, tokens: { accessToken: string; refreshToken: string }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setAccessToken(tokens.accessToken);
    setUser(authUser);
  }, []);

  const loginMutation = useLoginUser();
  const registerMutation = useRegisterUser();
  const logoutMutation = useLogoutUser();

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginMutation.mutateAsync({ data: { email, password } });
      persist(res.user, { accessToken: res.accessToken, refreshToken: res.refreshToken });
      return res.user;
    } finally {
      setIsLoading(false);
    }
  }, [loginMutation, persist]);

  const register = useCallback(async (input: { email?: string; phone?: string; password: string; firstName?: string; lastName?: string }) => {
    setIsLoading(true);
    try {
      const res = await registerMutation.mutateAsync({ data: input as never });
      persist(res.user, { accessToken: res.accessToken, refreshToken: res.refreshToken });
      return res.user;
    } finally {
      setIsLoading(false);
    }
  }, [registerMutation, persist]);

  const logout = useCallback(() => {
    const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (refreshTokenValue) {
      logoutMutation.mutate({ data: { refreshToken: refreshTokenValue } as never });
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAccessToken(null);
    setUser(null);
  }, [logoutMutation]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    accessToken,
    isAuthenticated: Boolean(accessToken && user),
    isStaff: Boolean(user && ["agent", "admin", "super_admin"].includes(user.role)),
    isLoading,
    login,
    register,
    logout,
  }), [user, accessToken, isLoading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
