// apps/mobile/src/features/groups/LineColorPicker.tsx
// The eight line colours as named swatches. Selection is shown by a check in the swatch's own
// label colour and the bold name, never by colour alone.
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, LINE_COLORS, RADIUS, SPACE, Text, useHaptic, useTheme, type LineColorId } from '@/design';

export interface LineColorPickerProps {
  value: LineColorId | null;
  onChange: (id: LineColorId) => void;
  testID?: string;
}

export function LineColorPicker({ value, onChange, testID }: LineColorPickerProps) {
  const { colors: c } = useTheme();
  const haptic = useHaptic();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Line colour" style={styles.grid} testID={testID}>
      {LINE_COLORS.map((line) => {
        const selected = line.id === value;
        return (
          <Pressable
            key={line.id}
            accessibilityRole="radio"
            accessibilityLabel={line.name}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => {
              haptic('select');
              onChange(line.id);
            }}
            testID={`line-${line.id}`}
            style={({ pressed }) => [styles.item, { opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={[styles.swatch, { backgroundColor: line.fill, borderColor: selected ? c.label : 'transparent' }]}>{selected ? <Icon name="check" size={20} color={line.on} /> : null}</View>
            <Text role="caption" color={selected ? 'label' : 'labelSecondary'} style={selected ? styles.bold : null} numberOfLines={1}>
              {line.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s },
  item: { width: 72, alignItems: 'center', gap: SPACE.xs },
  swatch: { width: 48, height: 48, borderRadius: RADIUS.card, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  bold: { fontWeight: '600' },
});
