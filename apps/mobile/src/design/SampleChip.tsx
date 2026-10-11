// apps/mobile/src/design/SampleChip.tsx
// The label every sample record wears. Quiet (labelSecondary, hairline outline) but always present:
// demonstration data is never shown as if it were the person's own.
import { StyleSheet, View } from 'react-native';

import { useCardColors } from './Card';
import { Text } from './Text';
import { useTheme } from './theme';
import { SPACE } from './tokens';

export function SampleChip({ label = 'Sample' }: { label?: string }) {
  const { colors } = useTheme();
  const card = useCardColors();
  const color = card ? card.onMuted : colors.labelSecondary;
  return (
    <View style={[styles.chip, { borderColor: color }]} accessible accessibilityLabel="Sample data">
      <Text role="caption" style={{ color, fontWeight: '600' }} importantForAccessibility="no">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: SPACE.s, paddingVertical: 1, alignSelf: 'flex-start' },
});
