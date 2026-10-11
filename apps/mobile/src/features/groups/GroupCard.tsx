// apps/mobile/src/features/groups/GroupCard.tsx
// The group's fare card: the design system's Card on the surface colour, with the group's line
// colour as its leading-edge band (LINE_BAND) and in the name chip (LineChip). The same card is the
// list item and the header of Group detail, at the same size, so the eye tracks one object between
// the screens. Your position is words first ("You owe", "You're owed", "Settled up"), then a
// readout per currency (two shown, "+n more" beyond).
import type { Money } from '@finbuddy/shared';
import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import type { GroupSummary } from '@/data';
import { Card, LineChip, Readout, SPACE, SampleChip, Text, useTheme, type LineColor } from '@/design';

import type { Formatter } from '../common/format';
import { cleanName, initialOf, peopleCount } from './format';

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
  const { width } = useWindowDimensions();
  const { group, myNet } = summary;
  const name = cleanName(group.name);
  const aspect = width >= 600 ? 1.586 : 16 / 9;
  const shown = myNet.slice(0, SHOWN);
  const more = myNet.length - shown.length;
  const position = useMemo(() => {
    if (myNet.length === 0) return { word: 'Settled up', spoken: "You're settled up in this group" };
    return myNet[0]!.amountMinor > 0 ? { word: "You're owed", spoken: `You're owed ${myNet.map((m) => f.spokenMoney(abs(m))).join(' and ')}` } : { word: 'You owe', spoken: `You owe ${myNet.map((m) => f.spokenMoney(abs(m))).join(' and ')}` };
  }, [myNet, f]);
  const initials = memberNames.slice(0, INITIALS).map(initialOf);
  const extra = memberNames.length - initials.length;
  const label = `${name}${group.isSample ? ', sample' : ''}${group.archived ? ', archived' : ''}. ${peopleCount(group.memberIds.length)}, ${f.currencyName(group.currency)}. ${position.spoken}`;

  return (
    <Card
      line={line}
      onPress={onPress}
      aspect={aspect}
      accessibilityLabel={onPress ? label : undefined}
      accessibilityHint={onPress ? 'Opens balances, the settle-up plan and expenses' : undefined}
      style={group.archived ? styles.archived : null}
      testID={testID}
    >
      <View style={styles.content} accessible={!onPress} accessibilityLabel={onPress ? undefined : label}>
        <View style={styles.top}>
          <View style={styles.name}>
            <LineChip line={line} label={name} />
          </View>
          {group.isSample ? <SampleChip /> : null}
          {group.archived ? (
            <View style={[styles.archivedChip, { borderColor: c.labelSecondary }]}>
              <Text role="caption" color="labelSecondary" style={styles.bold}>
                Archived
              </Text>
            </View>
          ) : null}
          <View style={styles.spacer} />
          <Text role="subhead" color="labelSecondary" tabular>
            {group.currency}
          </Text>
        </View>

        <View style={styles.members}>
          <View style={styles.initials}>
            {initials.map((ch, i) => (
              <View key={i} style={[styles.initial, { backgroundColor: c.surfaceAlt, borderColor: c.surface, marginLeft: i === 0 ? 0 : -6 }]}>
                <Text role="caption" color="labelSecondary" style={styles.bold}>
                  {ch}
                </Text>
              </View>
            ))}
            {extra > 0 ? (
              <View style={[styles.initial, { backgroundColor: c.surfaceAlt, borderColor: c.surface, marginLeft: -6 }]}>
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
          <Text role="subhead" color={myNet.length === 0 ? 'labelSecondary' : myNet[0]!.amountMinor > 0 ? 'credit' : 'label'} style={styles.bold}>
            {position.word}
          </Text>
          {shown.length ? (
            <View style={styles.readouts}>
              {shown.map((net, i) => (
                <Readout
                  key={net.currency}
                  money={abs(net)}
                  locale={f.locale}
                  role={i === 0 && variant === 'header' ? 'readoutL' : 'readoutM'}
                  color={net.amountMinor > 0 ? 'credit' : 'label'}
                  inline
                  testID={testID ? `${testID}-net-${net.currency}` : undefined}
                />
              ))}
              {more > 0 ? (
                <Text role="footnote" color="labelSecondary">
                  {`+${more} more`}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

const abs = (m: Money): Money => (m.amountMinor < 0 ? { amountMinor: -m.amountMinor, currency: m.currency } : m);

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'space-between', gap: SPACE.s },
  top: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s, flexWrap: 'wrap' },
  name: { flexShrink: 1, maxWidth: '75%' },
  archivedChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: SPACE.s, paddingVertical: 1 },
  spacer: { flex: 1 },
  members: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s },
  initials: { flexDirection: 'row', alignItems: 'center' },
  initial: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  position: { gap: 2 },
  readouts: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: SPACE.m, rowGap: 2 },
  bold: { fontWeight: '600' },
  archived: { opacity: 0.7 },
});
