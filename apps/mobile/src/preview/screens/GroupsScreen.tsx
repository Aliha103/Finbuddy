import { useGroups, type GroupSummary } from '@/data';

import { myNetSentence, useFormat, type Formatter, type Spoken } from '@/features/common/format';
import { useNavigation } from '../navigation';
import { Note, Row, Screen, Section } from '../ui';

/** "You owe £57.55" or "You're owed $185.92; you owe €3.00" or "You're settled up". */
export function groupPosition(f: Formatter, summary: GroupSummary): Spoken {
  if (summary.myNet.length === 0) return f.say("You're settled up in this group");
  const parts = summary.myNet.flatMap((net, i) => (i === 0 ? [myNetSentence(f, net)] : ['; ', myNetSentence(f, net)]));
  return f.say(...parts);
}

export function GroupsScreen() {
  const f = useFormat();
  const nav = useNavigation();
  const groups = useGroups();
  return (
    <Screen title="Groups">
      <Section title="Your groups" footer="Each group keeps its own balances, per currency.">
        {groups.length ? (
          groups.map((g) => (
            <Row
              key={g.group.id}
              title={g.group.name}
              titleWeight="600"
              subtitle={[groupPosition(f, g), `Group currency: ${f.currencyName(g.group.currency)} · ${g.group.memberIds.length} members${g.group.archived ? ' · archived' : ''}`]}
              sample={g.group.isSample === true}
              onPress={() => nav.push({ name: 'group', groupId: g.group.id })}
              hint="Shows members, balances, the settle-up plan and expenses"
            />
          ))
        ) : (
          <Note>No groups yet.</Note>
        )}
      </Section>
    </Screen>
  );
}
