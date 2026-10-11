// apps/mobile/src/features/common/HeaderButton.tsx
// Navigation-bar items: an icon button (the avatar, "+") or a text button ("Done", "Save"),
// each a 44-point target in the tint colour.
import { Pressable, StyleSheet } from 'react-native';

import { Icon, SPACE, Text, useHaptic, useTheme, type IconName } from '@/design';

export interface HeaderButtonProps {
  label: string;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
  /** Bold text (the primary action, "Save"). */
  emphasis?: boolean;
  testID?: string;
}

export function HeaderButton({ label, icon, onPress, disabled, emphasis, testID }: HeaderButtonProps) {
  const { colors, minTouch } = useTheme();
  const haptic = useHaptic();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      hitSlop={6}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      testID={testID}
      style={({ pressed }) => [styles.button, { minHeight: minTouch, minWidth: icon ? minTouch : undefined, opacity: disabled ? 0.4 : pressed ? 0.6 : 1 }]}
    >
      {icon ? (
        <Icon name={icon} size={24} color={colors.tint} />
      ) : (
        <Text role="body" color="tint" style={emphasis ? styles.bold : null} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACE.s },
  bold: { fontWeight: '600' },
});
