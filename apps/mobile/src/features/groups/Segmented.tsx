// apps/mobile/src/features/groups/Segmented.tsx
// A single-choice segment row: the system segmented control on iOS, Material 3 segmented buttons
// (connected outlined buttons, the chosen one on the tint wash with a check) on Android and the web.
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, SPACE, Text, useHaptic, useTheme } from '@/design';

export interface SegmentedProps {
  values: readonly string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  /** Spoken name of the whole control. */
  label: string;
  testID?: string;
}

export function Segmented({ values, selectedIndex, onChange, label, testID }: SegmentedProps) {
  const theme = useTheme();
  const c = theme.colors;
  const haptic = useHaptic();
  if (theme.platform === 'ios') {
    return (
      <SegmentedControl
        values={[...values]}
        selectedIndex={selectedIndex}
        onChange={(e) => onChange(e.nativeEvent.selectedSegmentIndex)}
        accessibilityLabel={label}
        fontStyle={{ color: c.label }}
        activeFontStyle={{ color: c.label, fontWeight: '600' }}
        testID={testID}
      />
    );
  }
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.group, { borderColor: c.separator }]} testID={testID}>
      {values.map((value, i) => {
        const selected = i === selectedIndex;
        return (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={value}
            onPress={() => {
              if (selected) return;
              haptic('select');
              onChange(i);
            }}
            testID={testID ? `${testID}-${i}` : undefined}
            style={({ pressed }) => [
              styles.segment,
              { minHeight: theme.minTouch - 8, backgroundColor: selected ? c.tintWash : pressed ? c.pressed : 'transparent' },
              i > 0 ? { borderLeftWidth: 1, borderLeftColor: c.separator } : null,
            ]}
          >
            {selected ? <Icon name="check" size={16} color={c.onTintWash} /> : null}
            <Text role="subhead" align="center" style={[styles.label, { color: selected ? c.onTintWash : c.label, fontWeight: selected ? '600' : '400' }]} numberOfLines={2}>
              {value}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, overflow: 'hidden', alignSelf: 'stretch' },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.xs, paddingHorizontal: SPACE.xs, paddingVertical: SPACE.xs },
  label: { flexShrink: 1 },
});
