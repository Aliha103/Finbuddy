// apps/mobile/src/features/expense/components/DateField.web.tsx
// The web preview's date: Today, Yesterday, or another day from the browser's own date picker. A
// date input draws the date in the browser's format (10/11/2026 in a US-English browser), so the
// field shows it the app's way instead (f.date, as the caption and every other screen do) and the
// real input lies over it, transparent: a click or Enter/Space opens the browser's picker, arrow
// keys and typing still edit the date, and the whole 48-point box is the target. Values are
// calendar dates (YYYY-MM-DD), the same shape the input speaks, so nothing is shifted by time zones.
import { addDays, isLocalDate, type LocalDate } from '@finbuddy/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip, ChipRow, Icon, RADIUS, SPACE, TYPE, Text, focusRing, useTheme } from '@/design';
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

/** Opens the browser's picker. Where it cannot (no showPicker, or the browser refuses), the input keeps focus and edits from the keyboard. */
function openPicker(input: HTMLInputElement): void {
  try {
    input.showPicker();
  } catch {
    input.focus();
  }
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
        <View style={[styles.field, { minHeight: minTouch, backgroundColor: c.fill, borderColor: focused ? c.tint : 'transparent' }, focused ? focusRing(c.tint) : null]}>
          {/* What the field shows; the input over it is what a screen reader and the keyboard reach. */}
          <View style={styles.shown} aria-hidden>
            <Text role="body" color="label" numberOfLines={1} testID="date-shown">
              {f.date(value)}
            </Text>
            <Icon name="calendar" size={20} color={c.labelSecondary} />
          </View>
          <input
            type="date"
            aria-label={`${f.date(value)}. Choose another day`}
            value={value}
            max={today}
            data-testid="date-pick"
            onChange={(e) => {
              const next = e.currentTarget.value;
              if (isLocalDate(next) && next <= today) onChange(next);
            }}
            onClick={(e) => openPicker(e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return;
              e.preventDefault();
              openPicker(e.currentTarget);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            style={{
              // Over the whole box, its border included, so every point of the 48-point target opens it.
              position: 'absolute',
              top: -BORDER,
              left: -BORDER,
              width: `calc(100% + ${2 * BORDER}px)`,
              height: `calc(100% + ${2 * BORDER}px)`,
              margin: 0,
              padding: 0,
              border: 0,
              opacity: 0,
              cursor: 'pointer',
              // 16 or more, so Safari on iPhone does not zoom the page when the input takes focus.
              fontSize: TYPE.body.size,
              colorScheme: 'inherit',
            }}
          />
        </View>
      </View>
      <Text role="footnote" color="labelSecondary" accessibilityLiveRegion="polite">
        {dateLabel(f, value, today)}
      </Text>
    </View>
  );
}

/** The field's border: transparent at rest, the tint when focused (as Field draws it). */
const BORDER = 1.5;

const styles = StyleSheet.create({
  box: { gap: SPACE.s },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.s, flexWrap: 'wrap' },
  field: { justifyContent: 'center', borderRadius: RADIUS.input, borderWidth: BORDER, paddingHorizontal: SPACE.m },
  shown: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m },
});
