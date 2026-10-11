// apps/mobile/src/features/common/Screen.tsx
// The scrolling body of a screen: the ground colour, the 16-point gutter, safe-area bottom padding,
// and the native large-title collapse on iOS (contentInsetAdjustmentBehavior). Content stacks
// with the grid's 24-point section gap.
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SPACE, useTheme } from '@/design';

export interface ScreenProps extends Omit<ScrollViewProps, 'style' | 'contentContainerStyle'> {
  children: ReactNode;
  /** No horizontal gutter: for screens whose rows run edge to edge (Material lists). */
  flush?: boolean;
  /** Extra space at the bottom (a FAB, a floating accessory). */
  bottomSpace?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export function Screen({ children, flush, bottomSpace = 0, style, contentStyle, ...rest }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.ground }, style]}
      contentContainerStyle={[styles.content, flush ? null : styles.gutter, { paddingBottom: insets.bottom + SPACE.xxl + bottomSpace }, contentStyle]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      {...rest}
    >
      {children}
    </ScrollView>
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
