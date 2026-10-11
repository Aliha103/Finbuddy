// apps/mobile/src/features/home/motion.ts
// Layout transitions for this area's lists and cards. On iOS and Android a LinearTransition moves
// the frame and its children re-lay out; the web preview's Reanimated implements it with a scale
// transform that stretches text mid-flight, which would misrepresent the native motion in review,
// so the web (and Reduce Motion) get no layout travel: content crossfades through entering/exiting.
import { Platform } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';

import { DURATION, useTheme } from '@/design';

export function useLayoutTransition(enabled = true) {
  const { reduceMotion } = useTheme();
  if (!enabled || reduceMotion || Platform.OS === 'web') return undefined;
  return LinearTransition.duration(DURATION.standard);
}
