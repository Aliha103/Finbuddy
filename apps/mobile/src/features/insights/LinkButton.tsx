// apps/mobile/src/features/insights/LinkButton.tsx
// A quiet text link with an icon ("Why am I seeing this", "Hide why"): subhead weight in the tint,
// a full 44/48-point target, and the expanded state for disclosures. Lighter than a plain Button,
// whose headline-sized label would outweigh the row it sits in.
import { Pressable, StyleSheet } from 'react-native';

import { Icon, SPACE, Text, useHaptic, useTheme, type IconName } from '@/design';

export interface LinkButtonProps {
  label: string;
  icon?: IconName;
  onPress: () => void;
  /** Set for a disclosure: announced as expanded or collapsed. */
  expanded?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

export function LinkButton({ label, icon, onPress, expanded, accessibilityHint, testID }: LinkButtonProps) {
  const { colors, minTouch } = useTheme();
  const haptic = useHaptic();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      accessibilityHint={accessibilityHint}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      hitSlop={{ left: SPACE.s, right: SPACE.s }}
      style={({ pressed }) => [styles.link, { minHeight: minTouch, opacity: pressed ? 0.6 : 1 }]}
      testID={testID}
    >
      {icon ? <Icon name={icon} size={18} color={colors.tint} /> : null}
      <Text role="subhead" color="tint" style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs + 2, alignSelf: 'flex-start' },
  label: { fontWeight: '600' },
});
