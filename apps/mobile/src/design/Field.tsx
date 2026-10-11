// apps/mobile/src/design/Field.tsx
// A labelled text field on the fill surface with 10-point corners. Errors name the problem under
// the field, in the danger role, and are announced; hints sit under the field in labelSecondary.
import { useState } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { Text } from './Text';
import { useTheme } from './theme';
import { FONT, RADIUS, SPACE, TYPE } from './tokens';

export interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string | null;
  hint?: string;
  /** A trailing element inside the field (a currency chip, a clear button). */
  trailing?: React.ReactNode;
  /** Sets the amount role: a large readout-sized input for money entry. */
  size?: 'regular' | 'amount';
  containerStyle?: StyleProp<ViewStyle>;
}

export function Field({ label, error, hint, trailing, size = 'regular', containerStyle, onFocus, onBlur, ...input }: FieldProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [focused, setFocused] = useState(false);
  const amount = size === 'amount';
  const borderColor = error ? c.danger : focused ? c.tint : 'transparent';
  return (
    <View style={[styles.field, containerStyle]}>
      <Text role="subhead" color="labelSecondary" nativeID={`${label}-label`}>
        {label}
      </Text>
      <View style={[styles.box, { backgroundColor: c.fill, borderColor, minHeight: amount ? 64 : theme.minTouch }]}>
        <TextInput
          accessibilityLabel={label}
          accessibilityLabelledBy={`${label}-label`}
          placeholderTextColor={c.labelTertiary}
          selectionColor={c.tint}
          cursorColor={c.tint}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...input}
          style={[
            styles.input,
            amount
              ? { fontSize: TYPE.readoutXL.size * theme.readoutScale, lineHeight: TYPE.readoutXL.lineHeight * theme.readoutScale, fontFamily: FONT.readout, fontVariant: ['tabular-nums'] }
              : { fontSize: TYPE.body.size, lineHeight: TYPE.body.lineHeight },
            { color: c.label },
          ]}
          allowFontScaling={!amount}
          maxFontSizeMultiplier={amount ? 1 : undefined}
        />
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      {error ? (
        <Text role="footnote" color="danger" accessibilityLiveRegion="polite" accessibilityRole="alert">
          {error}
        </Text>
      ) : hint ? (
        <Text role="footnote" color="labelSecondary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: SPACE.xs + 2 },
  box: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.input, borderWidth: 1.5, paddingHorizontal: SPACE.m },
  // minWidth 0: a flex item otherwise keeps the input's intrinsic width (20 characters on the web),
  // which at the amount size is wider than the row and pushes the trailing chip off screen.
  input: { flex: 1, minWidth: 0, paddingVertical: SPACE.s + 2 },
  trailing: { marginLeft: SPACE.s },
});
