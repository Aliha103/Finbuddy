// apps/mobile/src/design/Chip.tsx
// Capsule chips: selectable (currency, group, split method, filter) with the selection shown as a
// check mark and the tint wash, never colour alone; or a static label chip. The capsule is 36 points
// tall; the pressable around it is the full 44 (iOS) / 48 (Material) target, because hitSlop does
// nothing on the web. A ChipRow closes the row gap by the same amount, so wrapped rows keep their
// 8-point visual gap where the targets allow it.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useHaptic } from './haptics';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';
import { useTheme } from './theme';
import { SPACE } from './tokens';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** 'radio' inside a single-choice row, 'checkbox' for toggles, 'tab' for filters. */
  role?: 'radio' | 'checkbox' | 'tab' | 'button';
  icon?: IconName;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Chip({ label, selected = false, onPress, role = 'radio', icon, accessibilityLabel, disabled, style, testID }: ChipProps) {
  const { colors: c, minTouch } = useTheme();
  const haptic = useHaptic();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={role === 'checkbox' ? { checked: selected, disabled: !!disabled } : { selected, disabled: !!disabled }}
      disabled={disabled || !onPress}
      onPress={() => {
        haptic('select');
        onPress?.();
      }}
      testID={testID}
      style={[styles.target, { minHeight: minTouch, minWidth: minTouch }]}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.chip,
            {
              backgroundColor: selected ? c.tintWash : pressed ? c.pressed : c.surface,
              borderColor: selected ? 'transparent' : c.separator,
              opacity: disabled ? 0.45 : 1,
            },
            style,
          ]}
        >
          {selected ? <Icon name="check" size={16} color={c.onTintWash} /> : icon ? <Icon name={icon} size={16} color={c.labelSecondary} /> : null}
          <Text role="subhead" style={{ color: selected ? c.onTintWash : c.label, fontWeight: selected ? '600' : '400' }} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** A horizontal row of chips with the right accessibility role, wrapping onto more lines if it must. */
export function ChipRow({ children, label, role = 'radiogroup', style }: { children: ReactNode; label?: string; role?: 'radiogroup' | 'tablist' | 'list'; style?: StyleProp<ViewStyle> }) {
  const { minTouch } = useTheme();
  // Each chip's target already adds (minTouch - 36) around its capsule; the row gap makes up the rest of 8.
  const rowGap = Math.max(0, SPACE.s - (minTouch - HEIGHT));
  return (
    <View accessibilityRole={role} accessibilityLabel={label} style={[styles.row, { rowGap }, style]}>
      {children}
    </View>
  );
}

const HEIGHT = 36;

const styles = StyleSheet.create({
  target: { justifyContent: 'center', alignItems: 'stretch' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE.xs + 2,
    height: HEIGHT,
    paddingHorizontal: SPACE.m + 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: SPACE.s },
});
