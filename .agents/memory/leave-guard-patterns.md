---
name: Leave/exit guard patterns
description: Working patterns for unsaved-changes and exit confirmations on web (wouter) and Expo
---
- Web (wouter v3): block navigation at the router level — custom BaseLocationHook wrapping useBrowserLocation with a single-blocker registry; this catches both <Link> and programmatic navigate. For browser Back, use the sentinel pattern: push one same-URL history entry when the guard arms, and on every popstate re-push the sentinel and show the dialog; confirmed-leave = disable guard + history.go(-2).
  **Why:** anchor-click + one-shot popstate interception missed programmatic navs and only prompted on the first Back.
- Expo wizard screens: intercept the wizard's OWN header back control (and hardware back) explicitly; never dispatch a raw GO_BACK — use `router.canGoBack() ? back() : replace('/(tabs)')` since deep-loaded routes on web have no back stack. beforeRemove is only a safety net (re-dispatch the navigator-produced action). In-wizard step-back never prompts.
- Don't use I18nManager.forceRTL or forced reloads for language switching in Expo web; per-language writingDirection on text is the safe approach.
