/**
 * Unified haptic vocabulary for the whole app.
 *
 * - tab:     selection tick when switching tabs / segmented controls
 * - light:   soft tap for ordinary buttons and rows
 * - medium:  stronger tap for primary actions (submit, confirm)
 * - success: notification pulse after a successful operation
 * - warning: notification pulse before destructive confirmation
 * - error:   notification pulse after a failed operation
 *
 * All helpers are fire-and-forget and never throw (expo-haptics is a no-op
 * polyfill on web).
 */
import * as Haptics from 'expo-haptics';

const safe = (p: Promise<void>) => {
  p.catch(() => {});
};

export const haptics = {
  tab: () => safe(Haptics.selectionAsync()),
  light: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
