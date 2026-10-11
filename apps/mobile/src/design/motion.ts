// apps/mobile/src/design/motion.ts
// The layout transition lists, cards and readouts share. On iOS and Android a LinearTransition
// moves the frame and its children re-lay out. The web preview's Reanimated implements it with a
// scale transform measured from the frame's previous box: it stretches text mid-flight, and a
// screen hidden by its navigator reports a 0x0 box, so returning to it grew every readout from
// nothing. The web (and Reduce Motion) therefore get no layout travel; content still crossfades
// through entering/exiting.
import { Platform } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';

import { useTheme } from './theme';
import { DURATION } from './tokens';

export function useLayoutTransition(enabled = true) {
  const { reduceMotion } = useTheme();
  if (!enabled || reduceMotion || Platform.OS === 'web') return undefined;
  return LinearTransition.duration(DURATION.standard);
}
