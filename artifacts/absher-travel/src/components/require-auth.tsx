import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

/**
 * Gates a route (or a fragment of one) behind login, matching the spec's
 * "guest browsing, forced login for sensitive actions" auth model.
 * Redirects to /login?redirect=<path> and preserves the original destination.
 */
export function RequireAuth({ children, staffOnly }: { children: React.ReactNode; staffOnly?: boolean }) {
  const { isAuthenticated, isStaff, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || (staffOnly && !isStaff)) {
      const redirect = encodeURIComponent(location);
      setLocation(`/login?redirect=${redirect}`);
    }
  }, [isAuthenticated, isStaff, staffOnly, isLoading, location, setLocation]);

  if (!isAuthenticated || (staffOnly && !isStaff)) return null;
  return <>{children}</>;
}
