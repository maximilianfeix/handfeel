import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import { useStore } from './store';

// Haptics only on the moments that carry meaning: a value picked, a task done.
// They never replace the visual pressed state (Low Power Mode turns them off on iOS).
export function useHaptics() {
  const enabled = useStore().settings.haptics;
  return useMemo(
    () => ({
      selection: () => {
        if (enabled) Haptics.selectionAsync().catch(() => {});
      },
      success: () => {
        if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      },
      warning: () => {
        if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      },
    }),
    [enabled],
  );
}
