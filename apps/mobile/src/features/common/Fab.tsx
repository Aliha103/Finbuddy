// apps/mobile/src/features/common/Fab.tsx
// The one Material floating action button a screen may carry (Android and the web preview):
// an extended FAB, bottom-trailing, with the only shadow in the app. iOS never renders it; its
// primary action lives in the navigation bar (or the iOS 26 bottom accessory).
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, SHADOW, SPACE, SPRING, Text, useHaptic, useTheme, type IconName } from '@/design';

export interface FabProps {
  label: string;
  icon?: IconName;
  onPress: () => void;
  /** Lifts the FAB above a tab bar the layout does not already inset for. */
  bottomOffset?: number;
  testID?: string;
}

/** Height of the extended FAB plus its margin: screens add this to their bottom padding. */
export const FAB_SPACE = 56 + SPACE.l * 2;

export function Fab({ label, icon = 'add', onPress, bottomOffset = 0, testID }: FabProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const haptic = useHaptic();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  if (theme.platform === 'ios') return null;
  return (
    <View pointerEvents="box-none" style={[styles.anchor, { bottom: insets.bottom + SPACE.l + bottomOffset }]}>
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
  anchor: { position: 'absolute', right: SPACE.l },
  fab: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m, height: 56, paddingLeft: SPACE.l, paddingRight: SPACE.xl, borderRadius: 16 },
});
