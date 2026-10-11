// apps/mobile/src/features/expense/components/MethodSegments.tsx
// The split method picker, native on each OS: the system segmented control (UISegmentedControl)
// on iOS, Material 3 segmented buttons on Android and the web preview. Selection is shown by the
// control's own state plus a check mark on Material, never by colour alone.
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, SPACE, Text, useHaptic, useTheme } from '@/design';

import { SPLIT_METHODS, type SplitMethod } from '../form';

export interface MethodSegmentsProps {
  value: SplitMethod;
  onChange: (method: SplitMethod) => void;
  testID?: string;
}

export function MethodSegments({ value, onChange, testID }: MethodSegmentsProps) {
  const theme = useTheme();
  const c = theme.colors;
  const haptic = useHaptic();
  const index = Math.max(
    0,
    SPLIT_METHODS.findIndex((m) => m.id === value),
  );

  if (theme.platform === 'ios') {
    return (
      <SegmentedControl
        values={SPLIT_METHODS.map((m) => m.label)}
        selectedIndex={index}
        appearance={theme.scheme}
        fontStyle={{ color: c.label }}
        activeFontStyle={{ color: c.label, fontWeight: '600' }}
        onChange={(e) => {
          const next = SPLIT_METHODS[e.nativeEvent.selectedSegmentIndex];
          if (next) {
            haptic('select');
            onChange(next.id);
          }
        }}
        accessibilityLabel="Split method"
        testID={testID}
      />
    );
  }

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Split method" style={[styles.group, { borderColor: c.separator, minHeight: theme.minTouch }]} testID={testID}>
      {SPLIT_METHODS.map((m, i) => {
        const selected = m.id === value;
        return (
          <Pressable
            key={m.id}
            accessibilityRole="radio"
            accessibilityLabel={m.label}
            accessibilityHint={m.description}
            accessibilityState={{ selected, checked: selected }}
            onPress={() => {
              if (selected) return;
              haptic('select');
              onChange(m.id);
            }}
            testID={`${testID ?? 'method'}-${m.id}`}
            style={({ pressed }) => [
              styles.segment,
              { minHeight: theme.minTouch, backgroundColor: selected ? c.tintWash : pressed ? c.pressed : 'transparent' },
              i > 0 ? { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.separator } : null,
            ]}
          >
            {selected ? <Icon name="check" size={16} color={c.onTintWash} /> : null}
            <Text role="footnote" style={{ color: selected ? c.onTintWash : c.label, fontWeight: selected ? '600' : '500' }} numberOfLines={1}>
              {m.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, overflow: 'hidden' },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACE.xs, paddingHorizontal: SPACE.xs + 2 },
});
