// apps/mobile/src/design/StatusChip.tsx
// A one-word state on a row or card ("Pending", "Confirmed", "Archived"): a small capsule whose
// word carries the state and whose colour only supports it. Amber is attention (pending, due soon);
// red never appears here, it is kept for overdue and destructive actions.
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { useTheme } from './theme';
import { SPACE } from './tokens';

export interface StatusChipProps {
  label: string;
  /** The spoken form when it says more than the word ("Pending, not counted in balances yet"). */
  accessibilityLabel?: string;
  /** 'attention' on the amber wash, 'neutral' on the alternate surface, 'outlined' a hairline ring. */
  tone?: 'attention' | 'neutral' | 'outlined';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function StatusChip({ label, accessibilityLabel, tone = 'neutral', style, testID }: StatusChipProps) {
  const { colors } = useTheme();
  const color = tone === 'attention' ? colors.attention : colors.labelSecondary;
  const box: ViewStyle =
    tone === 'outlined' ? { ...styles.outlined, borderColor: colors.labelSecondary } : { ...styles.filled, backgroundColor: tone === 'attention' ? colors.attentionWash : colors.surfaceAlt };
  return (
    <View style={[styles.chip, box, style]} accessible accessibilityLabel={accessibilityLabel ?? label} testID={testID}>
      <Text role="caption" style={{ color, fontWeight: '600' }} importantForAccessibility="no">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: 999, alignSelf: 'flex-start' },
  filled: { paddingHorizontal: SPACE.s + 2, paddingVertical: 3 },
  outlined: { borderWidth: 1, paddingHorizontal: SPACE.s, paddingVertical: 1 },
});
