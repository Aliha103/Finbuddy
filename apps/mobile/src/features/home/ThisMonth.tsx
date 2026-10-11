// apps/mobile/src/features/home/ThisMonth.tsx
// "This month": your own share of spending, one readout per currency (never summed), each with the
// change against last month in words and a six-bar sketch of the last six months. Rows open Spending.
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSpending, type CurrencySpending } from '@/data';
import { ListSection, Readout, Row, SPACE, useTheme } from '@/design';
import { currencyNames } from '@/features/common/currency';
import type { Formatter } from '@/features/common/format';

import { SectionEmpty } from './SectionEmpty';

/** "up 68% on last month, £829.50 more" / "down 12% on last month, £40.00 less" / null when there is nothing to compare. */
export function changeWords(f: Formatter, spending: CurrencySpending): string | null {
  const last = spending.monthly[spending.monthly.length - 1];
  if (!last || last.previous === null || last.change === null) return null;
  if (last.previous.amountMinor === 0) return 'Nothing logged last month';
  if (last.change.amountMinor === 0) return 'Same as last month';
  const up = last.change.amountMinor > 0;
  const ratio = last.changeRatio === null ? null : f.percent(Math.abs(last.changeRatio));
  const diff = f.money({ amountMinor: Math.abs(last.change.amountMinor), currency: last.change.currency });
  return `${up ? 'Up' : 'Down'}${ratio ? ` ${ratio}` : ''} on last month, ${diff} ${up ? 'more' : 'less'}`;
}

/** Six flat bars, one per month, the current month in the tint: a sketch, not a chart (Spending has the chart). */
function MonthBars({ spending }: { spending: CurrencySpending }) {
  const { colors } = useTheme();
  const months = spending.monthly.slice(-6);
  const max = Math.max(1, ...months.map((m) => m.current.amountMinor));
  return (
    <View style={styles.bars} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {months.map((m, i) => {
        const h = Math.max(2, Math.round((m.current.amountMinor / max) * BAR_HEIGHT));
        const current = i === months.length - 1;
        return <View key={m.month} style={[styles.bar, { height: h, backgroundColor: current ? colors.tint : colors.labelTertiary, opacity: current ? 1 : 0.4 }]} />;
      })}
    </View>
  );
}

const BAR_HEIGHT = 24;

export function ThisMonth({ f }: { f: Formatter }) {
  const spending = useSpending(6);
  const nameOf = useMemo(() => currencyNames(f.locale), [f.locale]);
  const rows = (spending?.byCurrency ?? []).filter((s) => (s.monthly[s.monthly.length - 1]?.current.amountMinor ?? 0) > 0);
  if (rows.length === 0) {
    return (
      <View style={styles.gutter}>
        <SectionEmpty title="No expenses this month" message="Your own share of what you log this month shows here, one readout per currency." testID="month-empty" />
      </View>
    );
  }
  return (
    <ListSection header="This month" footer="Your own share, including your part of shared costs. Each currency on its own.">
      {rows.map((s) => {
        const total = s.monthly[s.monthly.length - 1]!.current;
        const change = changeWords(f, s);
        return (
          <Row
            key={s.currency}
            title={nameOf(s.currency)}
            titleSpoken={`${nameOf(s.currency)}, your share this month`}
            subtitle={change ?? undefined}
            leading={<MonthBars spending={s} />}
            detail={<Readout money={total} locale={f.locale} role="readoutM" inline testID={`month-${s.currency}`} />}
            onPress={() => router.navigate('/(tabs)/(spending)')}
            accessibilityHint="Opens Spending"
            chevron
            testID={`this-month-${s.currency}`}
          />
        );
      })}
    </ListSection>
  );
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: SPACE.gutter },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: BAR_HEIGHT, width: 6 * 5 + 5 * 3 },
  bar: { width: 5, borderRadius: 1.5 },
});
