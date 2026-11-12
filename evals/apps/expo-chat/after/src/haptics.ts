import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Haptics only on moments that carry meaning: a selection changes, a message
// goes out, a task succeeds. Never as the only feedback (iOS skips haptics in
// Low Power Mode), and never on web, where there is no Taptic engine.
const run = (effect: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  effect().catch(() => undefined);
};

export const haptics = {
  selection: () => run(() => Haptics.selectionAsync()),
  send: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
