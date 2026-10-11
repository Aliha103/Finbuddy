// apps/mobile/src/features/expense/preventRemove.ts
// The discard guard's hook, on expo-router's public React Navigation entry
// ('expo-router/react-navigation', which re-exports the vendored core's usePreventRemove). With it
// the native stack sets preventNativeDismiss on the sheet, so a swipe down (iOS) or Back (Android)
// asks first instead of dismissing and re-presenting the screen. Belongs in features/common once
// another sheet needs it.
import { usePreventRemove as usePreventRemoveNavigation } from 'expo-router/react-navigation';

export type LeaveAction = Parameters<Parameters<typeof usePreventRemoveNavigation>[1]>[0]['data']['action'];

/**
 * While `prevent` is true, leaving the screen (gesture, Back, Close, router.back) calls `onAttempt`
 * instead. Dispatching the handed-back action lets that one attempt through.
 */
export function usePreventRemove(prevent: boolean, onAttempt: (action: LeaveAction) => void): void {
  usePreventRemoveNavigation(prevent, ({ data }) => onAttempt(data.action));
}
