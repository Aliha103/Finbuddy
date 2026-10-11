// apps/mobile/src/features/expense/components/InlineField.tsx
// A compact numeric field that sits at the trailing end of a person's row (an exact amount, a
// percentage, an adjustment, a payment): the fill surface, 10-point corners, the currency symbol or
// "%" beside the digits, tabular figures, a danger outline when the row has a problem. The row
// prints the problem in words; the outline is never the only signal.
import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View, type TextInputProps, type TextStyle } from 'react-native';

import { RADIUS, SPACE, TYPE, Text, useTheme } from '@/design';

export interface InlineFieldProps extends Omit<TextInputProps, 'style'> {
  accessibilityLabel: string;
  prefix?: string;
  suffix?: string;
  invalid?: boolean;
  width?: number;
}

export function InlineField({ prefix, suffix, invalid, width = 136, editable = true, onFocus, onBlur, ...input }: InlineFieldProps) {
  const theme = useTheme();
  const c = theme.colors;
  const [focused, setFocused] = useState(false);
  const borderColor = invalid ? c.danger : focused ? c.tint : 'transparent';
  return (
    <View style={[styles.box, { backgroundColor: c.fill, borderColor, minHeight: theme.minTouch, width, opacity: editable ? 1 : 0.45 }]}>
      {prefix ? (
        <Text role="body" color="labelSecondary" importantForAccessibility="no" accessibilityElementsHidden>
          {prefix}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={c.labelTertiary}
        selectionColor={c.tint}
        cursorColor={c.tint}
        keyboardType="decimal-pad"
        inputMode="decimal"
        autoCorrect={false}
        editable={editable}
        {...input}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        // The input fills the whole 44-point box, so a tap anywhere on it focuses the field.
        style={[styles.input, { color: c.label, fontSize: TYPE.body.size, fontVariant: ['tabular-nums'], minHeight: theme.minTouch - 3 }, Platform.OS === 'web' ? NO_OUTLINE : null]}
      />
      {suffix ? (
        <Text role="body" color="labelSecondary" importantForAccessibility="no" accessibilityElementsHidden>
          {suffix}
        </Text>
      ) : null}
    </View>
  );
}

/** The web preview's browser focus ring; the field's own tint border already marks focus. */
export const NO_OUTLINE: TextStyle = { outlineWidth: 0 };

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, borderRadius: RADIUS.input, borderWidth: 1.5, paddingHorizontal: SPACE.m },
  input: { flex: 1, minWidth: 0, alignSelf: 'stretch', paddingVertical: 0, textAlign: 'right' },
});
