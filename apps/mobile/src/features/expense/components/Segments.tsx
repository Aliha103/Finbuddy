// apps/mobile/src/features/expense/components/Segments.tsx
// A single choice among a few options, native on each OS: the system segmented control
// (UISegmentedControl) on iOS, Material 3 segmented buttons on Android and the web preview. On
// Material the selected button carries a check mark as well as the container colour, so selection
// is never shown by colour alone. Used for the split method and for one payer or several.
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, SPACE, Text, useHaptic, useTheme } from '@/design';

export interface SegmentOption<T extends string> {
  readonly id: T;
  readonly label: string;
  /** Read to screen readers as the hint. */
  readonly description?: string;
}

export interface SegmentsProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** What the group of options chooses, e.g. "Split method". */
  label: string;
  testID?: string;
}

export function Segments<T extends string>({ options, value, onChange, label, testID }: SegmentsProps<T>) {
  const theme = useTheme();
  const c = theme.colors;
  const haptic = useHaptic();
  const index = Math.max(
    0,
    options.findIndex((o) => o.id === value),
  );

  if (theme.platform === 'ios') {
    return (
      <SegmentedControl
        values={options.map((o) => o.label)}
        selectedIndex={index}
        appearance={theme.scheme}
        fontStyle={{ color: c.label }}
        activeFontStyle={{ color: c.label, fontWeight: '600' }}
        onChange={(e) => {
          const next = options[e.nativeEvent.selectedSegmentIndex];
          if (next && next.id !== value) {
            haptic('select');
            onChange(next.id);
          }
        }}
        accessibilityLabel={label}
        testID={testID}
      />
    );
  }

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.group, { borderColor: c.separator }]} testID={testID}>
      {options.map((o, i) => {
        const selected = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityLabel={o.label}
            accessibilityHint={o.description}
            accessibilityState={{ selected, checked: selected }}
            aria-checked={selected}
            onPress={() => {
              if (selected) return;
              haptic('select');
              onChange(o.id);
            }}
            testID={`${testID ?? 'segment'}-${o.id}`}
            style={({ pressed }) => [
              styles.segment,
              { minHeight: theme.minTouch, backgroundColor: selected ? c.tintWash : pressed ? c.pressed : 'transparent' },
              i > 0 ? { borderLeftWidth: 1, borderLeftColor: c.separator } : null,
            ]}
          >
            {selected ? <Icon name="check" size={16} color={c.onTintWash} /> : null}
            <Text role="footnote" align="center" style={{ color: selected ? c.onTintWash : c.label, fontWeight: selected ? '600' : '400' }} numberOfLines={2}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, overflow: 'hidden', alignSelf: 'stretch' },
  // Each segment takes its label's width plus an equal share of the rest, so the selected one has room for its check mark.
  segment: { flexGrow: 1, flexShrink: 1, flexBasis: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.xs, paddingHorizontal: SPACE.s, paddingVertical: SPACE.xs },
});
