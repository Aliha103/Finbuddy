// apps/mobile/src/features/expense/components/DateField.web.tsx
// The web preview's date: Today, Yesterday, or the browser's own date input (a plain input, as the
// direction asks; there is no system picker to call). Values are calendar dates (YYYY-MM-DD), the
// same shape the input speaks, so nothing is shifted by time zones.
import { addDays, isLocalDate, type LocalDate } from '@finbuddy/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip, ChipRow, FOCUS, RADIUS, SPACE, TYPE, Text, useTheme } from '@/design';
import type { Formatter } from '@/features/common/format';

export interface DateFieldProps {
  f: Formatter;
  value: LocalDate;
  today: LocalDate;
  onChange: (date: LocalDate) => void;
  testID?: string;
}

export function dateLabel(f: Formatter, date: LocalDate, today: LocalDate): string {
  if (date === today) return `Today, ${f.date(date)}`;
  if (date === addDays(today, -1)) return `Yesterday, ${f.date(date)}`;
  return f.date(date);
}

export function DateField({ f, value, today, onChange, testID }: DateFieldProps) {
  const { colors: c, minTouch } = useTheme();
  const yesterday = addDays(today, -1);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.box} testID={testID}>
      <Text role="subhead" color="labelSecondary">
        Date
      </Text>
      <View style={styles.row}>
        <ChipRow label="Date">
          <Chip label="Today" selected={value === today} onPress={() => onChange(today)} testID="date-today" />
          <Chip label="Yesterday" selected={value === yesterday} onPress={() => onChange(yesterday)} testID="date-yesterday" />
        </ChipRow>
        <input
          type="date"
          aria-label="Choose another day"
          value={value}
          max={today}
          data-testid="date-pick"
          onChange={(e) => {
            const next = e.currentTarget.value;
            if (isLocalDate(next) && next <= today) onChange(next);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            minHeight: minTouch,
            paddingLeft: SPACE.m,
            paddingRight: SPACE.m,
            borderRadius: RADIUS.input,
            border: `1.5px solid ${focused ? c.tint : 'transparent'}`,
            // The design system's focus ring (Field's), in place of the browser's own outline.
            outline: focused ? `${FOCUS.width}px solid ${c.tint}` : 'none',
            outlineOffset: FOCUS.offset,
            backgroundColor: c.fill,
            color: c.label,
            fontSize: TYPE.body.size,
            // A raw input does not inherit react-native-web's text face: name the same system stack.
            fontFamily: SYSTEM_FONT,
            colorScheme: 'inherit',
          }}
        />
      </View>
      <Text role="footnote" color="labelSecondary" accessibilityLiveRegion="polite">
        {dateLabel(f, value, today)}
      </Text>
    </View>
  );
}

const SYSTEM_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const styles = StyleSheet.create({
  box: { gap: SPACE.s },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.s, flexWrap: 'wrap' },
});
