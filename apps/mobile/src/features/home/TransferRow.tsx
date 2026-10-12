// apps/mobile/src/features/home/TransferRow.tsx
// The two-line row Home uses for money moving between two people ("Needs settling", "Pending
// payments"): the words and the amount on the first line; under them the group, marked in its line
// colour, the Sample chip and an optional state ("Due in 2 days", "Overdue by 3 days") under the
// amount; one compact control (a 36-point capsule in a full-size target) beside both lines, so
// every row is one two-line row high. Every row's control keeps room for the widest of the row
// controls' labels (ROW_CONTROL_LABELS), so Settle up and Confirm are one width and the amounts of
// both sections line up. At large text sizes the amount and the control move under the words.
import type { Money } from '@finbuddy/shared';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Readout, SPACE, SampleChip, Text, lineSwatch, useTheme, type ColorRole, type LineColor } from '@/design';
import type { Spoken } from '@/features/common/format';

/** The labels of every compact control a TransferRow carries; each control reserves the widest. */
export const ROW_CONTROL_LABELS: readonly string[] = ['Settle up', 'Confirm'];

export interface TransferRowProps {
  /** The sentence without its amount: "You owe Blake", "Devon is paying you". */
  words: Spoken;
  amount: Money;
  locale: string;
  /** The amount's colour: credit when the money comes to you, else ink. */
  amountColor?: ColorRole;
  /** The group's name (or "Outside a group"); null shows no place. */
  place: string | null;
  /** The group's line colour, drawn as the mark before its name; null for none. */
  line: LineColor | null;
  sample: boolean;
  /** A short state set under the amount, in its own colour role. */
  note?: { text: string; tone: ColorRole } | null;
  /** The compact control beside the two lines (a small Button with reserveLabels={ROW_CONTROL_LABELS}). */
  control: ReactNode;
  testID?: string;
}

export function TransferRow({ words, amount, locale, amountColor, place, line, sample, note, control, testID }: TransferRowProps) {
  const theme = useTheme();
  const stacked = theme.largeText;
  const readout = <Readout money={amount} locale={locale} role="readoutS" color={amountColor} inline />;
  const state = note ? (
    <Text role="caption" color={note.tone} style={styles.note}>
      {note.text}
    </Text>
  ) : null;
  return (
    <View style={[styles.base, { minHeight: theme.minTouch }]} testID={testID}>
      <View style={styles.row}>
        <View style={styles.text}>
          <View style={styles.firstLine}>
            <Text role="body" color="label" accessibilityLabel={words.spoken} style={styles.words}>
              {words.text}
            </Text>
            {stacked ? null : readout}
          </View>
          {place || sample || state ? (
            <View style={styles.secondLine}>
              <View style={styles.groupLine}>
                {place && line ? <View style={[styles.mark, { backgroundColor: lineSwatch(line, theme.scheme).fill }]} importantForAccessibility="no" accessibilityElementsHidden /> : null}
                {place ? (
                  <Text role="subhead" color="labelSecondary" style={styles.place}>
                    {place}
                  </Text>
                ) : null}
                {sample ? <SampleChip /> : null}
              </View>
              {state}
            </View>
          ) : null}
          {stacked ? (
            <View style={styles.stackedActions}>
              {readout}
              {control}
            </View>
          ) : null}
        </View>
        {stacked ? null : control}
      </View>
    </View>
  );
}

/** The group's line-colour mark: a small swatch with the card's corner. */
const MARK = 10;

const styles = StyleSheet.create({
  base: { paddingHorizontal: SPACE.l, paddingVertical: SPACE.m, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m },
  text: { flex: 1, gap: 2 },
  firstLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.s },
  words: { flexShrink: 1 },
  secondLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: SPACE.s, rowGap: 2 },
  groupLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', flexShrink: 1, columnGap: SPACE.s - 2, rowGap: 2 },
  mark: { width: MARK, height: MARK, borderRadius: 3 },
  place: { flexShrink: 1 },
  // Pushed to the end, so when it wraps under the group's name it still sits under the amount.
  note: { fontWeight: '600', marginLeft: 'auto' },
  stackedActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: SPACE.s, marginTop: SPACE.xs },
});
