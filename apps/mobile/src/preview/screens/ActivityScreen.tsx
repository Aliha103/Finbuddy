import { monthOf, type MonthKey } from '@finbuddy/shared';

import { useActivity, type ActivityItem } from '@/data';

import { useFormat } from '../format';
import { ActivityRow } from '../rows';
import { Note, Screen, Section } from '../ui';

export function ActivityScreen() {
  const f = useFormat();
  const activity = useActivity();
  const months: { month: MonthKey; items: ActivityItem[] }[] = [];
  for (const item of activity) {
    const month = monthOf(item.date);
    const last = months[months.length - 1];
    if (last && last.month === month) last.items.push(item);
    else months.push({ month, items: [item] });
  }
  return (
    <Screen title="Activity">
      {months.length ? (
        months.map(({ month, items }) => (
          <Section key={month} title={f.month(month)}>
            {items.map((item) => (
              <ActivityRow key={item.id} f={f} item={item} />
            ))}
          </Section>
        ))
      ) : (
        <Section>
          <Note>No activity yet.</Note>
        </Section>
      )}
    </Screen>
  );
}
