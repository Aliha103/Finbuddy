import { addMonths, type CategorySpending, type CurrencyCode, type MonthChange } from '@finbuddy/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { useSpending } from '@/data';

import { useFormat, type Formatter, type Spoken } from '../format';
import { Bar, Chip, ChipRow, Note, Row, Screen, Section } from '../ui';

/** "Up 68% (£829.50) from September 2026" / "Down 18% ..." / "Same as ..." in words. */
function changeInWords(f: Formatter, change: MonthChange): Spoken {
  const previousMonth = f.month(addMonths(change.month, -1));
  if (!change.previous || !change.change) return f.say(`No figures for ${previousMonth} to compare with.`);
  if (change.change.amountMinor === 0) return f.say(`The same as ${previousMonth}.`);
  const up = change.change.amountMinor > 0;
  const amount = { amountMinor: Math.abs(change.change.amountMinor), currency: change.change.currency };
  if (change.changeRatio === null) return f.say(up ? 'Up ' : 'Down ', amount, ` from nothing in ${previousMonth}.`);
  // A change that rounds to 0% is "about the same", not "up 0%".
  if (Math.round(Math.abs(change.changeRatio) * 100) === 0) return f.say(`About the same as ${previousMonth} (`, up ? 'up ' : 'down ', amount, ').');
  return f.say(up ? 'Up ' : 'Down ', f.percent(Math.abs(change.changeRatio)), ' (', amount, `) from ${previousMonth}.`);
}

/** One row per category with a plain bar scaled to the largest category. Returns rows for a Section. */
function categoryBars(f: Formatter, rows: readonly CategorySpending[]) {
  const max = Math.max(0, ...rows.map((r) => r.total.amountMinor));
  return rows.map((r) => (
    <Row key={r.categoryId} title={f.category(r.categoryId)} detail={f.say(r.total)} subtitle={`${r.count} ${r.count === 1 ? 'expense' : 'expenses'}`}>
      <Bar fraction={max > 0 ? r.total.amountMinor / max : 0} />
    </Row>
  ));
}

export function SpendingScreen() {
  const f = useFormat();
  const summary = useSpending(6);
  const [picked, setPicked] = useState<CurrencyCode | null>(null);

  if (!summary || summary.byCurrency.length === 0) {
    return (
      <Screen title="Spending">
        <Section>
          <Note>No spending in the last six months.</Note>
        </Section>
      </Screen>
    );
  }
  const current = summary.byCurrency.find((c) => c.currency === picked) ?? summary.byCurrency[0]!;
  const thisMonthTotal = { amountMinor: current.thisMonth.reduce((acc, c) => acc + c.total.amountMinor, 0), currency: current.currency };
  const lastMonthTotal = { amountMinor: current.lastMonth.reduce((acc, c) => acc + c.total.amountMinor, 0), currency: current.currency };
  const monthMax = Math.max(0, ...current.monthly.map((m) => m.current.amountMinor));
  const thisMonthChange = current.monthly.find((m) => m.month === summary.thisMonth);

  return (
    <Screen
      title="Spending"
      intro={
        summary.byCurrency.length > 1 ? (
          <View style={{ gap: 8 }}>
            <ChipRow label="Currency">
              {summary.byCurrency.map((c) => (
                <Chip key={c.currency} label={c.currency} selected={c.currency === current.currency} onPress={() => setPicked(c.currency)} accessibilityLabel={f.currencyName(c.currency)} />
              ))}
            </ChipRow>
          </View>
        ) : null
      }
    >
      <Section
        title={`This month so far · ${f.month(summary.thisMonth)}`}
        footer="Your own share of each expense, personal or group. Paying for other people is not counted as your spending."
      >
        <Row title={f.say("You've spent ", thisMonthTotal, ' so far')} titleWeight="600" subtitle={thisMonthChange ? changeInWords(f, thisMonthChange) : undefined} />
        {current.thisMonth.length ? categoryBars(f, current.thisMonth) : <Note>{`No spending in ${current.currency} this month yet.`}</Note>}
      </Section>

      <Section title={`Last month · ${f.month(summary.lastMonth)}`}>
        <Row title={f.say('You spent ', lastMonthTotal)} titleWeight="600" />
        {current.lastMonth.length ? categoryBars(f, current.lastMonth) : <Note>{`No spending in ${current.currency} last month.`}</Note>}
      </Section>

      <Section title="By month" footer={`Totals in ${f.currencyName(current.currency)} only. Other currencies are shown separately, never added in.`}>
        {[...current.monthly].reverse().map((m) => (
          <Row key={m.month} title={`${f.month(m.month)}${m.month === summary.thisMonth ? ' (so far)' : ''}`} detail={f.say(m.current)} subtitle={changeInWords(f, m)}>
            <Bar fraction={monthMax > 0 ? m.current.amountMinor / monthMax : 0} />
          </Row>
        ))}
      </Section>
    </Screen>
  );
}
