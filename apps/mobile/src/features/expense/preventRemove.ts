// apps/mobile/src/features/expense/preventRemove.ts
// The discard guard's hook. expo-router 57 vendors React Navigation and does not re-export
// usePreventRemove, so this is the one place that knows the path. With it the native stack sets
// preventNativeDismiss on the sheet, so a swipe down (iOS) or Back (Android) asks first instead of
// dismissing and re-presenting the screen. Belongs in features/common once another sheet needs it.
import { usePreventRemove as vendored } from 'expo-router/build/react-navigation/core/usePreventRemove';

export type LeaveAction = Parameters<Parameters<typeof vendored>[1]>[0]['data']['action'];

/**
 * While `prevent` is true, leaving the screen (gesture, Back, Close, router.back) calls `onAttempt`
 * instead. Dispatching the handed-back action lets that one attempt through.
 */
export function usePreventRemove(prevent: boolean, onAttempt: (action: LeaveAction) => void): void {
  vendored(prevent, ({ data }) => onAttempt(data.action));
}
