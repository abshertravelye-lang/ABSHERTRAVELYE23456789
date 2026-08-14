import { useBrowserLocation } from "wouter/use-browser-location";
import type { BaseLocationHook } from "wouter";
import { shouldAllowNavigation } from "@/lib/navigation-guard";

/**
 * Custom wouter location hook. Identical to the default browser-location hook
 * except that every navigation request (from <Link> clicks AND programmatic
 * `navigate()` / `setLocation()` calls) is first passed through the central
 * navigation-guard registry.
 *
 * If a registered blocker vetoes the navigation, we simply do NOT perform it —
 * the blocker is responsible for prompting the user and, on confirmation,
 * calling the returned navigate function again with `{ __bypassGuard: true }`
 * (or after clearing the blocker) to complete the move.
 */
export const useGuardedLocation: BaseLocationHook = (...args: unknown[]) => {
  // wouter passes an options object (e.g. { ssrPath }) — forward it verbatim.
  const [path, navigate] = (useBrowserLocation as unknown as (
    ...a: unknown[]
  ) => [string, (to: string, opts?: Record<string, unknown>) => void])(...args);

  const guardedNavigate = (to: string, opts?: Record<string, unknown>) => {
    if (opts && opts.__bypassGuard) {
      const { __bypassGuard: _omit, ...rest } = opts;
      navigate(to, rest);
      return;
    }
    if (!shouldAllowNavigation(to)) {
      // Vetoed — the blocker has opened its confirmation dialog.
      return;
    }
    navigate(to, opts);
  };

  return [path, guardedNavigate as (to: string, ...a: unknown[]) => unknown];
};
