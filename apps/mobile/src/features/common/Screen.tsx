// apps/mobile/src/features/common/Screen.tsx
// The scrolling body of a screen: the ground colour, the 16-point gutter, safe-area bottom padding
// that also clears the iOS bottom accessory, and the native large-title collapse on iOS
// (contentInsetAdjustmentBehavior). On Material a screen with a FAB ends its scroll area above a
// strip of ground the FAB is docked in, so the FAB never covers content. Content stacks with the
// grid's 24-point section gap.
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SPACE, useTheme } from '@/design';

import { FAB_DOCK, useFloatingInset } from './Fab';

export interface ScreenProps extends Omit<ScrollViewProps, 'style' | 'contentContainerStyle'> {
  children: ReactNode;
  /** No horizontal gutter: for screens whose rows run edge to edge (Material lists). */
  flush?: boolean;
  /** The screen shows the Material FAB: the scroll area ends above the strip it is docked in. */
  fab?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, flush, fab = false, style, contentStyle, ...rest }: ScreenProps) {
  const { colors, platform } = useTheme();
  const insets = useSafeAreaInsets();
  const floating = useFloatingInset();
  const docked = fab && platform !== 'ios';
  const scroll = (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.ground }, docked ? null : style]}
      contentContainerStyle={[styles.content, flush ? null : styles.gutter, { paddingBottom: (docked ? 0 : insets.bottom) + floating + SPACE.xxl }, contentStyle]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      {...rest}
    >
      {children}
    </ScrollView>
  );
  if (!docked) return scroll;
  // The FAB (positioned by Fab at the same bottom offset) sits in this strip, never over the scroll area.
  return (
    <View style={[styles.flex, { backgroundColor: colors.ground }, style]}>
      {scroll}
      <View style={{ height: FAB_DOCK + insets.bottom }} />
    </View>
  );
}

/** A non-scrolling full-height screen (onboarding, error states). */
export function Fill({ children, style, ground }: { children: ReactNode; style?: StyleProp<ViewStyle>; ground?: string }) {
  const { colors } = useTheme();
  return <View style={[styles.flex, { backgroundColor: ground ?? colors.ground }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: SPACE.xl, paddingTop: SPACE.l },
  gutter: { paddingHorizontal: SPACE.gutter },
});
