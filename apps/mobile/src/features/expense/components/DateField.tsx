// apps/mobile/src/features/expense/components/DateField.tsx (native)
// The expense date: Today, Yesterday, or the system picker. iOS shows the compact system date
// picker inline (it opens Apple's calendar popover); Android opens the Material date picker from a
// button. Dates stay calendar dates (LocalDate), never shifted by time zones. The web preview has
// its own file with a plain date input.
import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { addDays, localDateFromDate, parseLocalDate, type LocalDate } from '@finbuddy/shared';
import { Platform, StyleSheet, View } from 'react-native';

import { Chip, ChipRow, SPACE, Text, useTheme } from '@/design';
import type { Formatter } from '@/features/common/format';

export interface DateFieldProps {
  f: Formatter;
  value: LocalDate;
  today: LocalDate;
  onChange: (date: LocalDate) => void;
  testID?: string;
}

function toDate(d: LocalDate): Date {
  const { year, month, day } = parseLocalDate(d);
  return new Date(year, month - 1, day, 12);
}

/** "Today, 11 Oct 2026", "Yesterday, 10 Oct 2026" or the date alone. */
export function dateLabel(f: Formatter, date: LocalDate, today: LocalDate): string {
  if (date === today) return `Today, ${f.date(date)}`;
  if (date === addDays(today, -1)) return `Yesterday, ${f.date(date)}`;
  return f.date(date);
}

export function DateField({ f, value, today, onChange, testID }: DateFieldProps) {
  const theme = useTheme();
  const yesterday = addDays(today, -1);
  const custom = value !== today && value !== yesterday;

  const onPicked = (event: DateTimePickerEvent, picked?: Date) => {
    if (event.type !== 'set' || !picked) return;
    onChange(localDateFromDate(picked));
  };

  const openAndroid = () => {
    DateTimePickerAndroid.open({ value: toDate(value), mode: 'date', maximumDate: toDate(today), onChange: onPicked });
  };

  return (
    <View style={styles.box} testID={testID}>
      <Text role="subhead" color="labelSecondary" nativeID="date-label">
        Date
      </Text>
      <View style={styles.row}>
        <ChipRow label="Date">
          <Chip label="Today" selected={value === today} onPress={() => onChange(today)} testID="date-today" />
          <Chip label="Yesterday" selected={value === yesterday} onPress={() => onChange(yesterday)} testID="date-yesterday" />
          {Platform.OS === 'android' ? <Chip label={custom ? f.date(value) : 'Another day'} icon={custom ? undefined : 'calendar'} selected={custom} onPress={openAndroid} accessibilityLabel={custom ? `${f.date(value)}. Change the date` : 'Choose another day'} testID="date-pick" /> : null}
        </ChipRow>
        {Platform.OS === 'ios' ? (
          <DateTimePicker value={toDate(value)} mode="date" display="compact" maximumDate={toDate(today)} onChange={onPicked} accentColor={theme.colors.tint} themeVariant={theme.scheme} accessibilityLabel="Choose another day" testID="date-pick" />
        ) : null}
      </View>
      <Text role="footnote" color="labelSecondary" accessibilityLiveRegion="polite">
        {dateLabel(f, value, today)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: SPACE.s },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.s, flexWrap: 'wrap' },
});
