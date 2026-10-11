// apps/mobile/src/features/spending/CategoryScreen.tsx
// One category in one currency: the selected month's total (this month by default) with its change
// against the month before, six months of bars to scrub, then your share of every expense in the
// category, newest first and grouped by month, each opening Expense detail. Sample records wear
// their chip. Reads: useCategoryRecords (spendingRecords) and spendingByMonth / monthOverMonth.
import { addMonths, monthOf, monthOverMonth, monthRange, spendingByMonth, zero, type CategoryId, type CurrencyCode, type MonthChange, type MonthKey, type SpendingRecord } from '@finbuddy/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useCategoryRecords, useDataStore, useDeviceLocale, useGroups, useProfile, useToday } from '@/data';
import { Card, ListSection, Readout, Row, SPACE, SampleChip, Text, useTheme } from '@/design';
import { DataGate } from '@/features/common/DataGate';
import { EmptyState } from '@/features/common/EmptyState';
import { categoryLabel, changeInWords, monthName, useFormat } from '@/features/common/format';
import { Screen } from '@/features/common/Screen';

import { expenseCount } from './copy';
import { MonthBars } from './MonthBars';

export interface CategoryScreenProps {
  categoryId: CategoryId;
  currency: CurrencyCode;
}

export function CategoryScreen(props: CategoryScreenProps) {
  return (
    <DataGate>
      <CategoryBody {...props} />
    </DataGate>
  );
}

function CategoryBody({ categoryId, currency }: CategoryScreenProps) {
  const theme = useTheme();
  const f = useFormat();
  const locale = useDeviceLocale();
  const profile = useProfile();
  const today = useToday();
  const expenses = useDataStore((s) => s.snapshot.expenses);
  const groups = useGroups();
  const records = useCategoryRecords(categoryId, currency);
  const [pickedMonth, setPickedMonth] = useState<MonthKey | null>(null);

  const label = categoryLabel(categoryId);
  const currencyName = f.currencyName(currency);
  const thisMonth = monthOf(today);
  const months = monthRange(addMonths(thisMonth, -5), thisMonth);

  if (!profile || records.length === 0) {
    return (
      <Screen flush={theme.platform !== 'ios'} testID="category">
        <View style={styles.gutter}>
          <EmptyState
            title={`Nothing in ${label} yet`}
            message={`Your share of every ${label} expense in ${currencyName} appears here, newest first.`}
            icon="receipt"
            action={{ label: 'Add expense', icon: 'add', onPress: () => router.push('/add') }}
            testID="category-empty"
          />
        </View>
      </Screen>
    );
  }

  const series: readonly MonthChange[] = monthOverMonth(spendingByMonth(expenses, { personId: profile.personId, categoryId, currency, fromMonth: months[0], toMonth: thisMonth }));
  const selectedMonth = pickedMonth && months.includes(pickedMonth) ? pickedMonth : thisMonth;
  const selected = series.find((m) => m.month === selectedMonth) ?? { month: selectedMonth, current: zero(currency), previous: null, change: null, changeRatio: null };
  const isCurrent = selectedMonth === thisMonth;
  const monthLabel = isCurrent ? `${monthName(locale, selectedMonth)} so far` : monthName(locale, selectedMonth);
  const inMonth = records.filter((r) => monthOf(r.expense.occurredOn) === selectedMonth).length;
  const change = selected.previous === null || selected.current.amountMinor === 0 ? null : changeInWords(f, selected);
  const sampleCount = records.filter((r) => r.expense.isSample).length;
  const sampleLabel = sampleCount === 0 ? null : sampleCount === records.length ? 'Sample' : 'Includes sample';
  const spokenSelected = `${monthLabel}, ${f.spokenMoney(selected.current)}`;

  // Newest first, grouped by month (the records already arrive newest first).
  const byMonth = new Map<MonthKey, SpendingRecord[]>();
  for (const r of records) {
    const key = monthOf(r.expense.occurredOn);
    const list = byMonth.get(key);
    if (list) list.push(r);
    else byMonth.set(key, [r]);
  }
  const groupNames = new Map(groups.map((g) => [g.group.id, g.group.name.replace(/ \(sample\)$/, '')]));

  return (
    <Screen flush={theme.platform !== 'ios'} testID="category">
      <View style={styles.gutter}>
        <Card testID="category-card">
          <View style={styles.cardBody}>
            <View style={styles.cardHead}>
              <Text role="subhead" color="labelSecondary" accessibilityRole="header" testID="category-month">
                {`${label} · ${monthLabel}`}
              </Text>
              {sampleLabel ? <SampleChip label={sampleLabel} /> : null}
            </View>
            <Readout money={selected.current} locale={locale} role="readoutL" live style={styles.readout} testID="category-readout" />
            <Text role="subhead" color="labelSecondary" testID="category-caption">
              {inMonth === 0 ? (isCurrent ? `Nothing in ${label} yet this month` : `Nothing in ${label} in ${monthName(locale, selectedMonth)}`) : expenseCount(inMonth)}
            </Text>
            {/* The change line keeps its slot while scrubbing, so the chart under the finger stays put. */}
            <Text
              role="subhead"
              color="labelSecondary"
              accessibilityLabel={change?.spoken}
              importantForAccessibility={change ? 'auto' : 'no'}
              style={{ minHeight: Math.round(20 * theme.fontScale) }}
              testID="category-change"
            >
              {change?.text ?? ''}
            </Text>
            <View style={styles.chart}>
              <MonthBars months={series} currentMonth={thisMonth} selected={selectedMonth} onSelect={setPickedMonth} locale={locale} spokenSelected={spokenSelected} height={72} testID="category-chart" />
            </View>
          </View>
        </Card>
      </View>

      {[...byMonth.entries()].map(([month, list]) => (
        <ListSection key={month} header={f.month(month)}>
          {list.map(({ expense, share }) => {
            const groupName = expense.groupId ? groupNames.get(expense.groupId) : null;
            const subtitle = [groupName ? `${f.date(expense.occurredOn)} · ${groupName}` : f.date(expense.occurredOn)];
            if (share.amountMinor !== expense.total.amountMinor || share.currency !== expense.total.currency) subtitle.push(`Your share of ${f.money(expense.total)}`);
            return (
              <Row
                key={expense.id}
                title={expense.description}
                subtitle={subtitle}
                detail={<Readout money={share} locale={locale} role="readoutS" inline />}
                sample={!!expense.isSample}
                onPress={() => router.push({ pathname: '/expense/[expenseId]', params: { expenseId: expense.id } })}
                accessibilityHint="Opens the expense"
                chevron
                testID={`category-expense-${expense.id}`}
              />
            );
          })}
        </ListSection>
      ))}

      <View style={styles.gutter}>
        <Text role="footnote" color="labelTertiary">
          {`Your share of each expense, in ${currencyName}. Spending in other currencies is shown separately, never added in.`}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: SPACE.gutter, gap: SPACE.l },
  cardBody: { gap: SPACE.xs },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.s },
  readout: { marginVertical: SPACE.xs },
  chart: { marginTop: SPACE.m },
});
