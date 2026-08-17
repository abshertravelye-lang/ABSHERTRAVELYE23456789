---
name: Expo Go compatibility guards
description: Which modules break the absher-mobile app inside Expo Go and the lazy-load guard pattern used
---

# Expo Go compatibility guards

**Rule:** Never statically import `expo-notifications` or use `expo-symbols` (SymbolView) in code paths that run in Expo Go.

**Why:** Since SDK 53, merely *importing* expo-notifications in Expo Go on Android logs a hard ERROR at bundle evaluation and can break app startup — try/catch around later calls does not help because the error happens at import time. SymbolView renders nothing in Expo Go (native-build only), which made tab icons invisible on real devices.

**How to apply:**
- Use `lib/notificationsModule.ts` (`getNotifications()`) — it detects Expo Go via `Constants.executionEnvironment === ExecutionEnvironment.StoreClient` and lazy-`require`s the module only when supported; returns `null` otherwise. All consumers must no-op on `null`.
- Use Ionicons everywhere for icons; no SymbolView.
- `app.json` must not reference `googleServicesFile` unless the file actually exists — a dangling reference makes `expo config` unparsable ("Could not parse Expo config").
- Alert.alert is a NO-OP on react-native-web: any alert that must be visible in the Expo web preview needs a Platform.OS === 'web' branch using window.alert (or an in-app dialog). Native keeps Alert.alert.
