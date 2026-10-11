// apps/mobile/src/design/Skeleton.tsx
// Loading bones in the final layout (no spinners). They breathe gently while the store loads and
// stay still under Reduce Motion; content crossfades in over them.
import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { useTheme } from './theme';
import { DURATION, RADIUS, TYPE, type TypeRole } from './tokens';

export interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width = '100%', height = 16, radius = RADIUS.tile, style }: SkeletonProps) {
  const { colors, reduceMotion } = useTheme();
  const opacity = useSharedValue(reduceMotion ? 0.7 : 1);
  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 0.7;
      return;
    }
    opacity.value = withRepeat(
      withSequence(withTiming(0.45, { duration: DURATION.focal, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: DURATION.focal, easing: Easing.inOut(Easing.quad) })),
      -1,
      false,
    );
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ width, height, borderRadius: radius, backgroundColor: colors.bone }, animated, style]} />;
}

/** A bone the height of a type role's line, so the skeleton matches the final layout. */
export function SkeletonText({ role = 'body', width = '60%', style }: { role?: TypeRole; width?: number | `${number}%`; style?: StyleProp<ViewStyle> }) {
  const { readoutScale, fontScale } = useTheme();
  const scale = role.startsWith('readout') ? readoutScale : fontScale;
  const line = TYPE[role].lineHeight * scale;
  return <Skeleton width={width} height={Math.round(TYPE[role].size * scale)} radius={6} style={[{ marginVertical: (line - TYPE[role].size * scale) / 2 }, style]} />;
}

/** Content that fades in once loading is over (the bones crossfade into it). */
export function Reveal({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { reduceMotion } = useTheme();
  return (
    <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(DURATION.standard)} style={style}>
      {children}
    </Animated.View>
  );
}

