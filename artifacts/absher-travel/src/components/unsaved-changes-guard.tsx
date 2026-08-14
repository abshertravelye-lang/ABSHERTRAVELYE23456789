import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { setNavigationBlocker } from "@/lib/navigation-guard";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

/**
 * Guards an in-progress form against accidental data loss.
 *
 * While `enabled` is true (form is dirty and not yet submitted):
 *  - ALL in-app navigation — <Link> clicks AND programmatic `navigate()` calls
 *    — is routed through the central navigation-guard registry (see
 *    `lib/guarded-location.ts`), which lets this component veto and prompt.
 *  - Browser back/forward (popstate) is intercepted: the intended destination
 *    is captured, the user is kept on the page, and on confirm we navigate to
 *    that destination explicitly (no duplicate history entries left behind).
 *  - Browser close / hard reload triggers the native `beforeunload` prompt
 *    (the only place a native browser prompt is acceptable per spec §7).
 *
 * Normal navigation is NOT interrupted when the guard is disabled.
 */
export function UnsavedChangesGuard({
  enabled,
  ar = true,
}: {
  enabled: boolean;
  ar?: boolean;
}) {
  const [, navigate] = useLocation();
  // The destination the user is trying to reach. `null` = dialog closed.
  // "__back__" is used only until we resolve the popstate target below.
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  // Live mirror of `enabled` that we can also flip synchronously (e.g. right
  // before a confirmed "leave") so async popstate/blocker callbacks see it.
  const enabledRef = useRef(enabled);
  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  // Register / unregister the central navigation blocker.
  useEffect(() => {
    if (!enabled) {
      setNavigationBlocker(null);
      return;
    }
    setNavigationBlocker((intendedPath: string) => {
      // Veto and remember where the user wanted to go.
      setPendingPath(intendedPath);
      return false;
    });
    return () => setNavigationBlocker(null);
  }, [enabled]);

  // Native prompt for browser close / hard reload / external navigation.
  useEffect(() => {
    if (!enabled) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled]);

  // Intercept browser Back/Forward (popstate) — robust "sentinel" pattern.
  //
  // While the guard is enabled we keep exactly ONE extra "sentinel" history
  // entry pinned on top of the real page entry (same URL, so the address bar
  // is unchanged). Any Back press pops the sentinel; on the resulting popstate
  // we IMMEDIATELY re-push the sentinel (re-arming the trap) and open the
  // dialog. This makes the trap fire on EVERY Back press — stay → Back → stay →
  // Back all keep prompting.
  //
  // When the user confirms "leave", the intended destination is the entry that
  // sits below the real page entry (PREV). From the sentinel that is two steps
  // back, so we disable the guard and `history.go(-2)`.
  //
  // Sentinel uses "__back__" as its pending marker (there is no meaningful URL
  // to show — the destination is resolved via history.go(-2)).
  const armedRef = useRef(false);
  const leavingRef = useRef(false);

  useEffect(() => {
    if (!enabled) { armedRef.current = false; return; }

    // Arm: push the single sentinel entry (same URL as the current page).
    window.history.pushState({ __unsavedGuardSentinel: true }, "");
    armedRef.current = true;

    const onPopState = () => {
      // The programmatic go(-2) during "leave" also fires popstate — ignore it.
      if (leavingRef.current) { leavingRef.current = false; return; }
      if (!enabledRef.current) return;
      // Re-arm immediately so the very next Back is caught too.
      window.history.pushState({ __unsavedGuardSentinel: true }, "");
      armedRef.current = true;
      setPendingPath("__back__");
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      // Disarm: if our sentinel is still the top entry, silently consume it so
      // we don't leave a dangling duplicate behind when the guard turns off.
      if (armedRef.current && window.history.state && window.history.state.__unsavedGuardSentinel) {
        leavingRef.current = true;
        window.history.back();
      }
      armedRef.current = false;
    };
  }, [enabled]);

  const handleLeave = useCallback(() => {
    const target = pendingPath;
    setPendingPath(null);
    // Disable the guard before navigating so the follow-up move isn't vetoed
    // or re-trapped by popstate.
    enabledRef.current = false;
    setNavigationBlocker(null);
    if (!target) return;

    if (target === "__back__") {
      // Stack is [..., PREV, PAGE, SENTINEL] with current = SENTINEL.
      // The user wanted PREV, which is two entries back.
      leavingRef.current = true;
      armedRef.current = false;
      window.history.go(-2);
      return;
    }

    // Link / programmatic navigation: go to the intended app-level path.
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
    const appPath = base && target.startsWith(base) ? target.slice(base.length) || "/" : target;
    navigateRef.current(appPath, { __bypassGuard: true } as never);
  }, [pendingPath]);

  const handleStay = useCallback(() => {
    // Sentinel is already re-armed by the popstate handler — just close.
    setPendingPath(null);
  }, []);

  return (
    <AlertDialog open={pendingPath !== null} onOpenChange={(o) => { if (!o) handleStay(); }}>
      <AlertDialogContent dir={ar ? "rtl" : "ltr"} className="max-w-md rounded-2xl">
        <AlertDialogHeader className="items-center text-center sm:text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-2">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <AlertDialogTitle className="text-[#0d2351] text-xl font-black">
            {ar ? "لديك بيانات غير محفوظة" : "You have unsaved data"}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-500">
            {ar
              ? "إذا غادرت الآن، قد تفقد البيانات التي أدخلتها."
              : "If you leave now, you may lose the information you entered."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:justify-center">
          <AlertDialogCancel onClick={handleStay} className="rounded-xl font-bold bg-[#0d2351] hover:bg-[#0d2351]/90 text-white border-0">
            {ar ? "البقاء وإكمال الطلب" : "Stay & continue"}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLeave}
            className="rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
          >
            {ar ? "مغادرة الصفحة" : "Leave page"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
