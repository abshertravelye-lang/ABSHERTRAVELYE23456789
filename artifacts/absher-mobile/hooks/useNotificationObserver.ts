/**
 * useNotificationObserver — wires notification tap handling for ABSHER TRAVEL.
 *
 * - Foreground handler shows an alert + plays a sound (set once at module load).
 * - On tap (addNotificationResponseReceivedListener) OR cold-start from a
 *   notification (getLastNotificationResponseAsync), we read the payload
 *   `data` and deep-link to the relevant screen:
 *     relatedEntityType 'visa_application'  → /visa-tracking/<id>
 *     relatedEntityType 'umrah_application' → /umrah-tracking/<id>
 *     relatedEntityType 'support_conversation' → /support-chat
 *     url                                    → router.push(url)
 *
 * Everything is guarded so it never crashes on web / Expo Go.
 */
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

// Foreground display: show a banner/alert with sound. Set once.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch {
  // ignore — unsupported in some environments
}

type NotificationData = {
  relatedEntityType?: string;
  relatedEntityId?: string | number;
  url?: string;
};

function routeFromData(data: NotificationData | null | undefined) {
  if (!data) return;
  try {
    const { relatedEntityType, relatedEntityId, url } = data;
    if (relatedEntityType === 'visa_application' && relatedEntityId != null) {
      router.push(`/visa-tracking/${relatedEntityId}` as never);
      return;
    }
    if (relatedEntityType === 'umrah_application' && relatedEntityId != null) {
      router.push(`/umrah-tracking/${relatedEntityId}` as never);
      return;
    }
    if (relatedEntityType === 'support_conversation') {
      router.push('/support-chat' as never);
      return;
    }
    if (url) {
      router.push(url as never);
    }
  } catch {
    // ignore navigation errors
  }
}

export function useNotificationObserver() {
  const handledColdStart = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let subscription: Notifications.EventSubscription | undefined;

    // Cold-start: opened from a notification while the app was killed.
    (async () => {
      try {
        if (handledColdStart.current) return;
        handledColdStart.current = true;
        const last = await Notifications.getLastNotificationResponseAsync();
        const data = last?.notification?.request?.content?.data as NotificationData | undefined;
        if (data) routeFromData(data);
      } catch {
        // ignore
      }
    })();

    // Warm tap: app in background/foreground.
    try {
      subscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response?.notification?.request?.content?.data as NotificationData | undefined;
        routeFromData(data);
      });
    } catch {
      // ignore
    }

    return () => {
      try {
        subscription?.remove();
      } catch {
        // ignore
      }
    };
  }, []);
}
