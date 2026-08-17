/**
 * Push notification registration for ABSHER TRAVEL.
 *
 * IMPORTANT: Everything here is wrapped in try/catch and MUST fail silently.
 * Expo Go on SDK 53+ does not support remote push notifications on Android —
 * the expo-notifications module is loaded lazily via getNotifications() so it
 * is never even evaluated there (importing it logs a hard ERROR in Expo Go).
 *
 * - registerForPush(): native-only. Requests permission, gets the Expo push
 *   token, and POSTs it to /push-tokens via the generated client.
 * - unregisterPush(): DELETE /push-tokens with the stored token. Call this
 *   BEFORE clearing auth tokens on logout.
 */
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getNotifications } from './notificationsModule';
import {
  registerPushToken,
  deletePushToken,
  type PushTokenRegisterPlatform,
} from '@workspace/api-client-react';

const STORED_TOKEN_KEY = '@absher_push_token';

// Module-state cache so unregisterPush works even if AsyncStorage is empty.
let cachedToken: string | null = null;

/**
 * Ensure the Android "default" notification channel exists with MAX importance,
 * sound and vibration — required for heads-up banners, lock-screen display and
 * sound on Android 8+. Safe to call repeatedly; no-op on iOS/web/Expo Go.
 */
export async function ensureAndroidChannel(): Promise<void> {
  try {
    if (Platform.OS !== 'android') return;
    const Notifications = getNotifications();
    if (!Notifications) return;
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0A2342',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  } catch {
    // Fail silently — unsupported runtimes.
  }
}

/**
 * Set the app-icon badge number. No-op on web/Expo Go. Fails silently.
 */
export async function setAppBadgeCount(count: number): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    const Notifications = getNotifications();
    if (!Notifications) return;
    await Notifications.setBadgeCountAsync(Math.max(0, count));
  } catch {
    // Fail silently.
  }
}

/**
 * Resolve the EAS/Expo projectId used by getExpoPushTokenAsync.
 *
 * Resolution order (first non-empty value wins):
 *  1. EXPO_PUBLIC_EAS_PROJECT_ID environment variable — set this in Replit
 *     Secrets to enable push in production builds without touching app.json.
 *  2. Constants.expoConfig.extra.eas.projectId — present when app.json has
 *     the extra.eas block (optional; kept for forward-compat).
 *  3. Constants.easConfig.projectId — older SDK path.
 *
 * Returns undefined when none is set; getExpoPushTokenAsync will still attempt
 * token registration (works in development builds, may fail in production).
 */
function resolveProjectId(): string | undefined {
  try {
    // Env-var approach: set EXPO_PUBLIC_EAS_PROJECT_ID in Replit Secrets.
    const envProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    if (envProjectId && envProjectId.trim().length > 0) return envProjectId.trim();

    // Fallback: read from app.json extra.eas block at runtime.
    const easProjectId =
      (Constants as { expoConfig?: { extra?: { eas?: { projectId?: string } } } }).expoConfig?.extra?.eas
        ?.projectId;
    const easConfigProjectId =
      (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
    return easProjectId ?? easConfigProjectId ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Register this device for push notifications and persist the token server-side.
 * Native-only; no-op on web and in Expo Go on Android. Fails silently on any error.
 */
export async function registerForPush(): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    if (!Device.isDevice) return; // Simulators/emulators cannot get a real token.

    const Notifications = getNotifications();
    if (!Notifications) return; // Unsupported runtime (e.g. Expo Go on Android).

    // Android 8+: channel must exist BEFORE any notification arrives for
    // sound/vibration/heads-up to work.
    await ensureAndroidChannel();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId = resolveProjectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse?.data;
    if (!token) return;

    cachedToken = token;
    try {
      await AsyncStorage.setItem(STORED_TOKEN_KEY, token);
    } catch {
      // ignore storage failures — module state still holds the token
    }

    const platform: PushTokenRegisterPlatform =
      Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

    await registerPushToken({
      token,
      platform,
      deviceName: Device.deviceName ?? undefined,
    });
  } catch (err) {
    // Never crash the app on registration failure — remote push is unsupported
    // in some environments (Expo Go on Android SDK 53+, missing EAS projectId).
    // But surface the failure loudly in development so a broken push
    // configuration cannot silently ship.
    if (__DEV__) {
      console.warn(
        '[push] registration failed — push notifications will NOT be delivered to this device. ' +
          'A development/production build with a linked EAS projectId and FCM/APNs credentials is required. ' +
          'Cause:',
        err,
      );
    }
  }
}

/**
 * Remove this device's push token from the server. Call BEFORE clearing auth
 * tokens on logout (needs a valid bearer token). Fails silently.
 */
export async function unregisterPush(): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    let token = cachedToken;
    if (!token) {
      try {
        token = await AsyncStorage.getItem(STORED_TOKEN_KEY);
      } catch {
        token = null;
      }
    }
    if (!token) return;

    await deletePushToken({ token });
    cachedToken = null;
    try {
      await AsyncStorage.removeItem(STORED_TOKEN_KEY);
    } catch {
      // ignore
    }
  } catch {
    // Fail silently.
  }
}
