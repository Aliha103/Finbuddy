// apps/mobile/src/design/haptics.ts
// Haptics behind the Settings switch. Three events only: a selection tick, a light impact at the
// start of a hold, success at the gate. Silent on the web and when the person turned them off.
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { useTheme } from './theme';

export type HapticKind = 'select' | 'start' | 'success' | 'warning';

export function fireHaptic(kind: HapticKind, enabled = true): void {
  if (!enabled || Platform.OS === 'web') return;
  const run =
    kind === 'success'
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : kind === 'warning'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        : kind === 'start'
          ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          : Haptics.selectionAsync();
  run.catch(() => {
    // No haptic engine (simulator, some Android devices): nothing to do.
  });
}

/** A haptic function that already knows the Settings preference. */
export function useHaptic(): (kind: HapticKind) => void {
  const { haptics } = useTheme();
  return (kind) => fireHaptic(kind, haptics);
}
