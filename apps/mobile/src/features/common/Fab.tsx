// apps/mobile/src/features/common/Fab.tsx
// The one Material floating action button a screen may carry (Android and the web preview):
// an extended FAB, bottom-trailing, with the only shadow in the app. It is docked: the screen keeps
// a strip of ground under its scroll area for it (Screen, FAB_DOCK), so it never covers a row or a
// Settle up button at rest or mid-scroll, at any width. iOS never renders it; its primary action
// lives in the navigation bar or the iOS 26 bottom accessory ("Add expense" above the tab bar),
// which the content inset clears (useFloatingInset).
import { createContext, use } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, SHADOW, SPACE, SPRING, Text, TOUCH, useHaptic, useTheme, type IconName } from '@/design';

export interface FabProps {
  label: string;
  icon?: IconName;
  onPress: () => void;
  testID?: string;
}

/** The extended FAB's height (Material 3). */
export const FAB_HEIGHT = 56;
/** Its distance from the screen's bottom edge (above the safe area) and from the trailing edge. */
export const FAB_MARGIN = SPACE.l;
/** The iOS 26 bottom accessory: a 44-point capsule with the system's spacing above the tab bar. */
const ACCESSORY_HEIGHT = TOUCH.min + SPACE.s;

/** True inside the tabs while the iOS bottom accessory floats above the tab bar (set by the tabs layout). */
export const BottomAccessoryContext = createContext(false);

/** The strip under a Material screen's scroll area that the FAB sits in: margin, FAB, margin. */
export const FAB_DOCK = FAB_MARGIN + FAB_HEIGHT + FAB_MARGIN;

/**
 * The bottom space, above the safe area, that keeps a screen's last content clear of what floats
 * over its bottom edge: the bottom accessory on iOS 26 on every tab screen. The Material FAB floats
 * over nothing (it is docked under the scroll area), so it needs no inset. Screens add their own
 * breathing room on top.
 */
export function useFloatingInset(): number {
  const { platform } = useTheme();
  const accessory = use(BottomAccessoryContext);
  return platform === 'ios' && accessory ? ACCESSORY_HEIGHT : 0;
}

export function Fab({ label, icon = 'add', onPress, testID }: FabProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  if (theme.platform === 'ios') return null;
  return (
    <View pointerEvents="box-none" style={[styles.anchor, { bottom: insets.bottom + FAB_MARGIN }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        onPressIn={() => {
          scale.set(theme.reduceMotion ? 1 : withSpring(0.96, SPRING.press));
          haptic('select');
        }}
        onPressOut={() => scale.set(withSpring(1, SPRING.press))}
        testID={testID}
      >
        {({ pressed }) => (
          <Animated.View style={[styles.fab, SHADOW.fab, animated, { backgroundColor: theme.colors.tint, opacity: pressed ? 0.9 : 1 }]}>
            <Icon name={icon} size={24} color={theme.colors.onTint} />
            <Text role="headline" style={{ color: theme.colors.onTint }} numberOfLines={1}>
              {label}
            </Text>
          </Animated.View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute', right: FAB_MARGIN },
  fab: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m, height: FAB_HEIGHT, paddingLeft: SPACE.l, paddingRight: SPACE.xl, borderRadius: 16 },
});
