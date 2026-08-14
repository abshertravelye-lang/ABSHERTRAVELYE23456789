import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { setAuthTokenGetter, setAuthRefreshHandler, customFetch } from "@workspace/api-client-react";

const ACCESS_TOKEN_KEY = "absher_admin_access_token";
const REFRESH_TOKEN_KEY = "absher_admin_refresh_token";

export type AdminRole = "customer" | "agent" | "admin" | "super_admin";

export interface AdminUser {
  id: string;
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profilePhotoUrl?: string | null;
  role: AdminRole;
  isActive?: boolean;
  permissions?: string[];
  lastLoginAt?: string | null;
  createdAt?: string;
}

interface AdminAuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => void;
  hasPermission: (key: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

// The API server is mounted at the root `/api/...` path (not under the
// artifact's base path) — same convention as the generated client's customFetch.
function apiBase(): string {
  return "";
}

function clearStorage() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Wire the shared API client: token getter + refresh handler.
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem(ACCESS_TOKEN_KEY));
    setAuthRefreshHandler(async () => {
      const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshTokenValue) return false;
      try {
        const res = await fetch(`${apiBase()}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refreshTokenValue }),
        });
        if (!res.ok) {
          clearStorage();
          setUser(null);
          return false;
        }
        const data = await res.json();
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
        return true;
      } catch {
        return false;
      }
    });
    return () => {
      setAuthRefreshHandler(null);
    };
  }, []);

  // Load /api/auth/me on mount when an access token is present.
  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await customFetch<AdminUser>(`/api/auth/me`, { method: "GET" });
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          clearStorage();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${apiBase()}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      throw new Error("login_failed");
    }
    const data = await res.json();
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    setUser(data.user as AdminUser);
    return data.user as AdminUser;
  }, []);

  const logout = useCallback(() => {
    const refreshTokenValue = localStorage.getItem(REFRESH_TOKEN_KEY);
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (refreshTokenValue && token) {
      // fire-and-forget
      fetch(`${apiBase()}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      }).catch(() => {});
    }
    clearStorage();
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (key: string) => {
      if (!user) return false;
      if (user.role === "admin" || user.role === "super_admin") return true;
      return Array.isArray(user.permissions) && user.permissions.includes(key);
    },
    [user],
  );

  const value = useMemo<AdminAuthContextValue>(
    () => ({ user, isLoading, login, logout, hasPermission }),
    [user, isLoading, login, logout, hasPermission],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return ctx;
}

export { ACCESS_TOKEN_KEY as ADMIN_ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY as ADMIN_REFRESH_TOKEN_KEY };
