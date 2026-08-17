/**
 * useUnreadNotifications — server-synced unread notification count.
 *
 * - Polls /notifications/unread-count while authenticated (60s + on app
 *   foreground) so the tab badge and the app-icon badge stay in sync with the
 *   server even when pushes were missed (e.g. permission denied, Expo Go).
 * - Mirrors the count onto the native app-icon badge via setAppBadgeCount.
 *
 * Consumers that mutate read state (mark read / read-all / delete) should
 * invalidate the query key via `getGetUnreadNotificationCountQueryKey()`.
 */
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetUnreadNotificationCount,
  getGetUnreadNotificationCountQueryKey,
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { setAppBadgeCount } from '@/lib/pushNotifications';

export function useUnreadNotifications(): number {
  const { accessToken } = useAuth();
  const isAuthenticated = !!accessToken;
  const queryClient = useQueryClient();

  const { data } = useGetUnreadNotificationCount({
    query: {
      queryKey: getGetUnreadNotificationCountQueryKey(),
      enabled: isAuthenticated,
      refetchInterval: 60_000,
      staleTime: 30_000,
    },
  });

  const unread = isAuthenticated ? (data?.unread ?? 0) : 0;

  // Keep the native app-icon badge in sync with the server count.
  useEffect(() => {
    void setAppBadgeCount(unread);
  }, [unread]);

  // Refresh when the app returns to the foreground.
  useEffect(() => {
    if (!isAuthenticated) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void queryClient.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
      }
    });
    return () => sub.remove();
  }, [isAuthenticated, queryClient]);

  return unread;
}
