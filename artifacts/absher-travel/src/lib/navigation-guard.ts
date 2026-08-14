/**
 * Central navigation-guard registry.
 *
 * A single active "blocker" can veto an attempted navigation. The custom
 * wouter location hook (see `guarded-location.ts`) routes BOTH <Link> clicks
 * and programmatic `navigate()` calls through here, so one interception point
 * covers every in-app navigation. Browser back/forward (popstate) is handled
 * by the same blocker via the guard component.
 *
 * The blocker receives the intended destination path and returns:
 *   - true  → allow navigation (no unsaved data, or user already confirmed)
 *   - false → veto navigation and prompt the user
 * When it vetoes, it is responsible for stashing the intended destination and
 * showing the confirmation dialog itself.
 */

export type NavigationBlocker = (intendedPath: string) => boolean;

let activeBlocker: NavigationBlocker | null = null;

export function setNavigationBlocker(blocker: NavigationBlocker | null): void {
  activeBlocker = blocker;
}

/**
 * Returns true if the navigation to `intendedPath` is allowed to proceed.
 * If a blocker is registered and it vetoes, returns false (the blocker will
 * have opened its own confirmation dialog).
 */
export function shouldAllowNavigation(intendedPath: string): boolean {
  if (!activeBlocker) return true;
  return activeBlocker(intendedPath);
}

export function hasActiveBlocker(): boolean {
  return activeBlocker !== null;
}
