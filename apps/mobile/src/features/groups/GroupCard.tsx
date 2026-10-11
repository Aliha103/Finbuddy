// apps/mobile/src/features/groups/GroupCard.tsx
// The group's fare card: the design system's Card on the surface colour, with the group's line
// colour as its leading-edge band (LINE_BAND) and in the name chip (LineChip). The same card is the
// list item and the header of Group detail, at the same size, so the eye tracks one object between
// the screens. Your position is words first ("You owe", "You're owed", "Settled up"), then a
// readout per currency under the words for its direction (a group can owe you in one currency while
// you owe in another). The list card shows two readouts and "+n more"; the detail header shows every
// currency, since it is the one place Group detail states your own position.
import type { Money } from '@finbuddy/shared';
import { StyleSheet, View } from 'react-native';

import type { GroupSummary } from '@/data';
import { Card, LineChip, Readout, SPACE, SampleChip, StatusChip, Text, useAppWidth, useTheme, type LineColor } from '@/design';

import { cleanName, initialOf, type Formatter } from '../common/format';
import { peopleCount } from './format';

export interface GroupCardProps {
  summary: GroupSummary;
  line: LineColor;
  /** Member names in the group's order (for the initials). */
  memberNames: readonly string[];
  f: Formatter;
  onPress?: () => void;
  /** The detail header keeps the list card's size and colour but carries no press. */
  variant?: 'list' | 'header';
  testID?: string;
}

/** How many net currencies a card shows before "+n more". */
const SHOWN = 2;
/** Initials shown before "+n". */
const INITIALS = 5;

export function GroupCard({ summary, line, memberNames, f, onPress, variant = 'list', testID }: GroupCardProps) {
  const theme = useTheme();
  const c = theme.colors;
  const width = useAppWidth();
  const { group, myNet } = summary;
  const name = cleanName(group.name);
  const aspect = width >= 600 ? 1.586 : 16 / 9;
  // The card's shape is a minimum, not a fixed size: at large text sizes or on narrow phones its
  // content grows past 16:9, and a fixed ratio would clip the readout off the bottom of the card.
  const minHeight = Math.round((width - 2 * SPACE.gutter) / aspect);
  const shown = variant === 'header' ? myNet : myNet.slice(0, SHOWN);
  const more = myNet.length - shown.length;
  const position = positionLines(myNet, shown, f);
  const initials = memberNames.slice(0, INITIALS).map(initialOf);
  const extra = memberNames.length - initials.length;
  const label = `${name}${group.isSample ? ', sample' : ''}${group.archived ? ', archived' : ''}. ${peopleCount(group.memberIds.length)}, ${f.currencyName(group.currency)}. ${position.spoken}`;

  return (
    <Card
      line={line}
      onPress={onPress}
      accessibilityLabel={onPress ? label : undefined}
      accessibilityHint={onPress ? 'Opens balances, the settle-up plan and expenses' : undefined}
      style={[{ minHeight }, group.archived ? styles.archived : null]}
      testID={testID}
    >
      <View style={styles.content} accessible={!onPress} accessibilityLabel={onPress ? undefined : label}>
        <View style={styles.top}>
          <View style={styles.name}>
            <LineChip line={line} label={name} />
          </View>
          {group.isSample ? <SampleChip /> : null}
          {group.archived ? <StatusChip label="Archived" tone="outlined" /> : null}
          <View style={styles.spacer} />
          <Text role="subhead" color="labelSecondary" tabular>
            {group.currency}
          </Text>
        </View>

        <View style={styles.members}>
          <View style={styles.initials}>
            {initials.map((ch, i) => (
              <View key={i} style={[styles.initial, { backgroundColor: c.fill, borderColor: c.surface, marginLeft: i === 0 ? 0 : -6 }]}>
                <Text role="caption" color="labelSecondary" style={styles.bold}>
                  {ch}
                </Text>
              </View>
            ))}
            {extra > 0 ? (
              <View style={[styles.initial, { backgroundColor: c.fill, borderColor: c.surface, marginLeft: -6 }]}>
                <Text role="caption" color="labelSecondary" style={styles.bold}>
                  {`+${extra}`}
                </Text>
              </View>
            ) : null}
          </View>
          <Text role="subhead" color="labelSecondary" numberOfLines={1}>
            {peopleCount(group.memberIds.length)}
          </Text>
        </View>

        <View style={styles.position}>
          {position.lines.length === 0 ? (
            <Text role="subhead" color="labelSecondary" style={styles.bold}>
              Settled up
            </Text>
          ) : (
            position.lines.map((line, li) => (
              <View key={line.word} style={styles.line}>
                <Text role="subhead" color={line.owed ? 'credit' : 'label'} style={styles.bold}>
                  {line.word}
                </Text>
                <View style={styles.readouts}>
                  {line.nets.map((net, i) => (
                    <Readout
                      key={net.currency}
                      money={abs(net)}
                      locale={f.locale}
                      role={li === 0 && i === 0 && variant === 'header' ? 'readoutL' : 'readoutM'}
                      color={line.owed ? 'credit' : 'label'}
                      inline
                      testID={testID ? `${testID}-net-${net.currency}` : undefined}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
          {more > 0 ? (
            <Text role="footnote" color="labelSecondary">
              {`+${more} more`}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const abs = (m: Money): Money => (m.amountMinor < 0 ? { amountMinor: -m.amountMinor, currency: m.currency } : m);

interface PositionLine {
  readonly word: string;
  readonly owed: boolean;
  readonly nets: readonly Money[];
}

/**
 * Your position as lines of one direction each, the direction of your first currency first:
 * "You're owed" over the currencies you are owed, "You owe" over the ones you owe. `shown` is the
 * part of `all` the card has room for; the spoken form always covers every currency.
 */
function positionLines(all: readonly Money[], shown: readonly Money[], f: Formatter): { lines: PositionLine[]; spoken: string } {
  if (all.length === 0) return { lines: [], spoken: "You're settled up in this group" };
  const say = (word: string, nets: readonly Money[]) => `${word} ${nets.map((m) => f.spokenMoney(abs(m))).join(' and ')}`;
  const owedAll = all.filter((m) => m.amountMinor > 0);
  const oweAll = all.filter((m) => m.amountMinor < 0);
  const owed: PositionLine = { word: "You're owed", owed: true, nets: shown.filter((m) => m.amountMinor > 0) };
  const owe: PositionLine = { word: 'You owe', owed: false, nets: shown.filter((m) => m.amountMinor < 0) };
  const owedFirst = all[0]!.amountMinor > 0;
  const lines = (owedFirst ? [owed, owe] : [owe, owed]).filter((l) => l.nets.length > 0);
  const spoken = (owedFirst ? [[owed.word, owedAll], [owe.word, oweAll]] : [[owe.word, oweAll], [owed.word, owedAll]]) as [string, Money[]][];
  return { lines, spoken: spoken.filter(([, nets]) => nets.length > 0).map(([word, nets]) => say(word, nets)).join('. ') };
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between', gap: SPACE.s },
  top: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s, flexWrap: 'wrap' },
  name: { flexShrink: 1, maxWidth: '75%' },
  spacer: { flex: 1 },
  members: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s },
  initials: { flexDirection: 'row', alignItems: 'center' },
  initial: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  position: { gap: SPACE.xs },
  line: { gap: 2 },
  readouts: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: SPACE.m, rowGap: 2 },
  bold: { fontWeight: '600' },
  archived: { opacity: 0.7 },
});
