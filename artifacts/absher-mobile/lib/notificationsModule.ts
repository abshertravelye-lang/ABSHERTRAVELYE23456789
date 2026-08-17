/**
 * Expo-Go-safe loader for expo-notifications.
 *
 * Since SDK 53, merely importing expo-notifications inside Expo Go on Android
 * logs a hard ERROR (remote push support was removed from Expo Go) and can
 * break the JS bundle evaluation. We therefore load the module lazily and ONLY
 * outside Expo Go on Android. iOS Expo Go and dev/production builds load it
 * normally.
 *
 * All consumers must handle a `null` return (no-op behavior).
 */
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** True when remote push notifications can work in this runtime. */
export const isPushSupported = Platform.OS !== 'web' && !(isExpoGo && Platform.OS === 'android');

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;

/**
 * Returns the expo-notifications module, or null when unsupported
 * (web, or Expo Go on Android where the import itself errors).
 */
export function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (!isPushSupported) {
    cached = null;
    return cached;
  }
  try {
    // Lazy require so the module is never evaluated in unsupported runtimes.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cached = require('expo-notifications') as NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}
