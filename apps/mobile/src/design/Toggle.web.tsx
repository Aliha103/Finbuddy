// apps/mobile/src/design/Toggle.web.tsx
// The web preview's switch, drawn as a Material 3 switch: react-native-web's own is a 40 x 20 target
// whose white off-thumb disappears against a white row. A 52 x 32 track inside a full-size target;
// off is an outlined track with a small dark thumb, on is the tint with a larger onTint thumb.
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from './theme';
import type { ToggleProps } from './Toggle';

export type { ToggleProps };

const TRACK_W = 52;
const TRACK_H = 32;

export function Toggle({ value, onValueChange, accessibilityLabel, disabled, testID }: ToggleProps) {
  const { colors: c, minTouch } = useTheme();
  const on = !!value;
  const thumb = on ? 24 : 16;
  return (
    <Pressable
      role="switch"
      aria-checked={on}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: on, disabled: !!disabled }}
      disabled={disabled}
      onPress={() => onValueChange?.(!on)}
      testID={testID}
      style={[styles.target, { minHeight: minTouch, minWidth: Math.max(minTouch, TRACK_W), opacity: disabled ? 0.4 : 1 }]}
    >
      <View style={[styles.track, on ? { backgroundColor: c.tint, borderColor: c.tint } : { backgroundColor: c.fill, borderColor: c.labelTertiary }]}>
        <View style={[styles.thumb, { width: thumb, height: thumb, borderRadius: thumb / 2, backgroundColor: on ? c.onTint : c.labelSecondary, alignSelf: on ? 'flex-end' : 'flex-start' }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: { alignItems: 'center', justifyContent: 'center' },
  track: { width: TRACK_W, height: TRACK_H, borderRadius: TRACK_H / 2, borderWidth: 2, justifyContent: 'center', paddingHorizontal: 4 },
  thumb: {},
});
