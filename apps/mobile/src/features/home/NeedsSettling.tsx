// apps/mobile/src/features/home/NeedsSettling.tsx
// "Needs settling": one row per step of a settle-up plan that involves you, across every group.
// The words carry the direction ("You owe Blake", "Avery owes you"); the amount is a readout on the
// same line, in credit green when it comes to you and in ink when you pay; under them the group,
// marked in its line colour (the colour of its card's band). A compact Settle up control beside
// the two lines opens the settle sheet, so a row is one two-line row high (TransferRow, shared with
// Pending payments). At large text sizes the readout and the control move under the words.
import type { Transfer } from '@finbuddy/shared';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { useGroups, useMySettleUps, type SettleUpItem } from '@/data';
import { Button, DURATION, ListSection, Row, SPACE, lineColorFor, useLayoutTransition, useTheme, type LineColor } from '@/design';
import { cleanName, transferSentence, type Formatter, type Spoken } from '@/features/common/format';
import { SectionEmpty } from '@/features/common/SectionEmpty';
import { useLineColorOverrides } from '@/features/groups/lineColors';

import { TransferRow } from './TransferRow';

/** Rows beyond this many hand over to Groups, which lists every plan in full. */
const MAX_ROWS = 5;

/** The transfer without its amount: "You owe Blake", "Avery owes you", "Devon owes Casey". */
export function transferWords(f: Formatter, t: Transfer): Spoken {
  if (f.isMe(t.from)) return f.say('You owe ', f.name(t.to));
  if (f.isMe(t.to)) return f.say(f.name(t.from), ' owes you');
  return f.say(f.name(t.from), ' owes ', f.name(t.to));
}

export function openSettle(item: SettleUpItem): void {
  router.push({ pathname: '/settle', params: { groupId: item.groupId, from: item.transfer.from, to: item.transfer.to, currency: item.transfer.amount.currency } });
}

export function settleKey(item: SettleUpItem): string {
  return `${item.groupId}:${item.transfer.from}:${item.transfer.to}:${item.transfer.amount.currency}`;
}

export function NeedsSettling({ f }: { f: Formatter }) {
  const theme = useTheme();
  const groups = useGroups();
  const settleUps = useMySettleUps();
  const overrides = useLineColorOverrides();
  const layout = useLayoutTransition();

  if (groups.length === 0) {
    return (
      <View style={styles.gutter}>
        <SectionEmpty
          title="No groups yet"
          message="Make a group for a trip, a flat or a dinner, and whatever needs settling shows up here with a Settle up control."
          action={{ label: 'New group', icon: 'add', onPress: () => router.push('/(tabs)/(groups)/new') }}
          testID="settle-empty-groups"
        />
      </View>
    );
  }
  if (settleUps.length === 0) {
    return (
      <View style={styles.gutter}>
        <SectionEmpty title="Nothing to settle" message="Everyone is square. Shared costs you add show up here with a Settle up control." testID="settle-empty" />
      </View>
    );
  }

  const shown = settleUps.slice(0, MAX_ROWS);
  const more = settleUps.length - shown.length;
  return (
    <Animated.View layout={layout}>
      <ListSection header="Needs settling" footer="Settle up records a payment for the exact amount; once confirmed, the balance rolls to zero.">
        {shown.map((item) => {
          const group = groups.find((g) => g.group.id === item.groupId);
          return (
            <Animated.View key={settleKey(item)} layout={layout} exiting={theme.reduceMotion ? undefined : FadeOut.duration(DURATION.quick)}>
              <SettleRow item={item} f={f} groupName={group ? cleanName(group.group.name) : null} line={lineColorFor(item.groupId, overrides)} sample={group?.group.isSample === true} />
            </Animated.View>
          );
        })}
        {more > 0 ? (
          <Row title="See all in Groups" subtitle={`${more} more transfer${more === 1 ? '' : 's'} involve you`} onPress={() => router.navigate('/(tabs)/(groups)')} chevron testID="settle-see-all" />
        ) : null}
      </ListSection>
    </Animated.View>
  );
}

interface SettleRowProps {
  item: SettleUpItem;
  f: Formatter;
  groupName: string | null;
  line: LineColor;
  sample: boolean;
}

/** One transfer: the words and the readout on one line, the group under them, Settle up beside both. */
function SettleRow({ item, f, groupName, line, sample }: SettleRowProps) {
  const sentence = transferSentence(f, item.transfer);
  const key = settleKey(item);
  return (
    <TransferRow
      words={transferWords(f, item.transfer)}
      amount={item.transfer.amount}
      locale={f.locale}
      amountColor={directionColor(f.isMe(item.transfer.to))}
      place={groupName}
      line={line}
      sample={sample}
      control={
        <Button
          label="Settle up"
          size="small"
          variant="tonal"
          onPress={() => openSettle(item)}
          accessibilityLabel={`Settle up. ${sentence.spoken}`}
          accessibilityHint="Opens Settle up for this exact amount"
          testID={`settle-${key}`}
        />
      }
      testID={`needs-settling-${key}`}
    />
  );
}

/** Two words a sentence can use elsewhere: the credit role when the money comes to you. */
export function directionColor(toMe: boolean): 'credit' | 'debit' {
  return toMe ? 'credit' : 'debit';
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: SPACE.gutter },
});
