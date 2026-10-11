// apps/mobile/src/features/spending/SpendingScreen.tsx
// Spending (DIRECTION.md section 4): your own share of every expense, personal or group, one
// currency at a time and never summed. One card carries one readout: the selected month (this month
// by default) with its change against the month before in words, and six months of bars to scrub.
// Under it, that month by category (proportional bars, each opening the category), then budgets with
// their pace, then Insights. Every figure comes from the engine: spendingByMonth, monthOverMonth,
// spendingByCategory and the budget_pace insight.
import { firstDayOfMonth, lastDayOfMonth, spendingByCategory, spendingRecords, type CategorySpending, type CurrencyCode, type MonthChange, type MonthKey } from '@finbuddy/shared';
import { router } from 'expo-router';
import { Fragment, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useBudgets, useDataStore, useDeviceLocale, useInsights, useProfile, useSpending } from '@/data';
import { Card, Chip, ChipRow, Icon, ListSection, Readout, Row, SPACE, SampleChip, Text, useHaptic, useTheme } from '@/design';
import { EmptyState } from '@/features/common/EmptyState';
import { categoryLabel, useFormat, type Formatter, type Spoken } from '@/features/common/format';
import { Screen } from '@/features/common/Screen';

import { findPace } from './budgetPace';
import { BudgetRow } from './BudgetRow';
import { CategoryRow } from './CategoryRow';
import { changeInWords, excludedNote, monthName } from './copy';
import { MonthBars } from './MonthBars';

export function SpendingScreen() {
  const theme = useTheme();
  const f = useFormat();
  const locale = useDeviceLocale();
  const profile = useProfile();
  const summary = useSpending(6);
  const budgets = useBudgets();
  const insights = useInsights();
  const expenses = useDataStore((s) => s.snapshot.expenses);
  const [pickedCurrency, setPickedCurrency] = useState<CurrencyCode | null>(null);
  const [pickedMonth, setPickedMonth] = useState<MonthKey | null>(null);
  const [asList, setAsList] = useState(false);

  if (!profile || !summary || summary.byCurrency.length === 0) return <SpendingEmpty />;

  const current = summary.byCurrency.find((x) => x.currency === pickedCurrency) ?? summary.byCurrency[0]!;
  const { currency } = current;
  const currencyName = f.currencyName(currency);
  const selectedMonth = pickedMonth && summary.months.includes(pickedMonth) ? pickedMonth : summary.thisMonth;
  const selected = current.monthly.find((m) => m.month === selectedMonth) ?? current.monthly[current.monthly.length - 1];
  if (!selected) return <SpendingEmpty />;
  const isCurrent = selected.month === summary.thisMonth;
  const monthLabel = isCurrent ? `${monthName(locale, selected.month)} so far` : monthName(locale, selected.month);
  const caption = captionFor(f, selected, isCurrent, currency, monthsWithSpending(current.monthly));

  // The selected month by category: the engine's own buckets (this and last month are precomputed by the hook).
  const categories: readonly CategorySpending[] = isCurrent
    ? current.thisMonth
    : selected.month === summary.lastMonth
      ? current.lastMonth
      : spendingByCategory(expenses, { personId: profile.personId, currency, from: firstDayOfMonth(selected.month), to: lastDayOfMonth(selected.month) });
  const largest = categories[0]?.total.amountMinor ?? 0;

  // Sample data is labelled wherever it shows: on the card when the window's records are sample.
  const windowRecords = spendingRecords(expenses, { personId: profile.personId, currency, from: firstDayOfMonth(summary.months[0] ?? summary.thisMonth), to: summary.today });
  const sampleCount = windowRecords.filter((r) => r.expense.isSample).length;
  const sampleLabel = sampleCount === 0 ? null : sampleCount === windowRecords.length ? 'Sample' : 'Includes sample';

  const myBudgets = budgets.filter((b) => b.amount.currency === currency);
  const paces = myBudgets.map((b) => ({ budget: b, pace: findPace(insights, b.id) }));
  const excluded = [...new Set(paces.flatMap((p) => p.pace?.excluded ?? []))].sort();
  const showList = asList || theme.screenReader;
  const spokenSelected = `${monthLabel}, ${f.spokenMoney(selected.current)}`;
  const openBudgets = () => router.push({ pathname: '/(tabs)/(spending)/budgets', params: { currency } });
  const openCategory = (categoryId: string) => router.push({ pathname: '/(tabs)/(spending)/category/[categoryId]', params: { categoryId, currency } });

  return (
    <Screen flush={theme.platform !== 'ios'} testID="spending">
      <View style={styles.gutter}>
        {summary.byCurrency.length > 1 ? (
          <ChipRow label="Currency">
            {summary.byCurrency.map((x) => (
              <Chip key={x.currency} label={x.currency} selected={x.currency === currency} accessibilityLabel={f.currencyName(x.currency)} onPress={() => setPickedCurrency(x.currency)} testID={`spending-currency-${x.currency}`} />
            ))}
          </ChipRow>
        ) : null}

        <Card testID="spending-card">
          <View style={styles.cardBody}>
            <View style={styles.cardHead}>
              <Text role="subhead" color="labelSecondary" accessibilityRole="header" testID="spending-month">
                {monthLabel}
              </Text>
              {sampleLabel ? <SampleChip label={sampleLabel} /> : null}
            </View>
            <Readout money={selected.current} locale={locale} role="readoutXL" live testID="spending-readout" />
            {/* Always present (at least one line), so scrubbing past a month with no change line does not move the chart; never truncated, it carries an amount. */}
            <Text
              role="subhead"
              color="labelSecondary"
              accessibilityLabel={caption?.spoken}
              importantForAccessibility={caption ? 'auto' : 'no'}
              style={{ minHeight: Math.round(20 * theme.fontScale) }}
              testID="spending-change"
            >
              {caption?.text ?? ''}
            </Text>
            <View style={styles.chart}>
              {showList ? (
                <MonthList months={current.monthly} currentMonth={summary.thisMonth} selected={selected.month} onSelect={setPickedMonth} locale={locale} f={f} />
              ) : (
                <MonthBars months={current.monthly} currentMonth={summary.thisMonth} selected={selected.month} onSelect={setPickedMonth} locale={locale} spokenSelected={spokenSelected} testID="spending-chart" />
              )}
            </View>
            <View style={styles.cardFoot}>
              <Text role="footnote" color="labelTertiary" style={styles.grow}>
                {`Your own share, personal and group, in ${currencyName}.`}
              </Text>
              {theme.screenReader ? null : (
                <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setAsList(!asList)} testID="spending-months-toggle">
                  <Text role="footnote" color="tint" style={styles.link}>
                    {asList ? 'Show the chart' : 'Months as a list'}
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </Card>
      </View>

      <ListSection header={`By category · ${monthLabel}`} footer={categories.length ? 'Largest first. Paying for other people is not counted as your spending.' : undefined}>
        {categories.length ? (
          categories.map((cat) => (
            <CategoryRow
              key={cat.categoryId}
              label={categoryLabel(cat.categoryId)}
              count={cat.count}
              total={cat.total}
              spokenTotal={f.spokenMoney(cat.total)}
              fraction={largest > 0 ? cat.total.amountMinor / largest : 0}
              locale={locale}
              onPress={() => openCategory(cat.categoryId)}
              testID={`category-row-${cat.categoryId}`}
            />
          ))
        ) : (
          <Row title={`Nothing in ${currency} ${isCurrent ? 'yet this month' : `in ${monthName(locale, selected.month)}`}`} titleSpoken={`Nothing in ${currencyName} ${isCurrent ? 'yet this month' : `in ${monthName(locale, selected.month)}`}`} />
        )}
      </ListSection>

      <ListSection header="Budgets" footer={excludedNote(excluded) ?? (myBudgets.length ? 'The tick marks where an even pace through the month would be today.' : undefined)}>
        {paces.map(({ budget, pace }) => (
          <BudgetRow key={budget.id} budget={budget} pace={pace} f={f} onPress={openBudgets} accessibilityHint="Opens Budgets" testID={`spending-budget-${budget.id}`} />
        ))}
        <Row
          title={myBudgets.length ? 'Manage budgets' : 'Set a budget'}
          subtitle={myBudgets.length ? undefined : `A monthly limit for one category, or for everything, in ${currency}`}
          leading={<Icon name={myBudgets.length ? 'edit' : 'add'} size={22} color={theme.colors.tint} />}
          onPress={openBudgets}
          chevron
          testID="spending-budgets"
        />
      </ListSection>

      <ListSection>
        <Row title="Insights" subtitle="Spikes, unusual expenses and budget pace, with the numbers behind them" onPress={() => router.push('/(tabs)/(home)/insights')} chevron testID="spending-insights" />
      </ListSection>
    </Screen>
  );
}

/** The line under the readout: the change against the month before, or why there is nothing to compare. */
function captionFor(f: Formatter, selected: MonthChange, isCurrent: boolean, currency: CurrencyCode, monthsWithSpending: number): Spoken | null {
  if (selected.current.amountMinor === 0) {
    const when = isCurrent ? 'yet this month' : `in ${monthName(f.locale, selected.month)}`;
    // The code keeps the line short on screen; the spoken form names the currency.
    return { text: `Nothing in ${currency} ${when}`, spoken: `Nothing in ${f.currencyName(currency)} ${when}` };
  }
  // A currency with spending in only one month has no change worth stating; neither has the first
  // month shown, whose month before is outside the window.
  if (monthsWithSpending < 2 || selected.previous === null) return null;
  return changeInWords(f, selected);
}

function monthsWithSpending(months: readonly MonthChange[]): number {
  return months.filter((m) => m.current.amountMinor !== 0).length;
}

/** The accessible alternative to the chart: the same months as rows, newest first, each selectable. */
function MonthList({ months, currentMonth, selected, onSelect, locale, f }: { months: readonly MonthChange[]; currentMonth: MonthKey; selected: MonthKey; onSelect: (m: MonthKey) => void; locale: string; f: Formatter }) {
  const { colors } = useTheme();
  const haptic = useHaptic();
  const rows = [...months].reverse();
  return (
    <View style={styles.list} accessibilityRole="radiogroup" accessibilityLabel="Spending by month" testID="spending-month-list">
      {rows.map((m, i) => {
        const isCurrent = m.month === currentMonth;
        const isSelected = m.month === selected;
        const title = isCurrent ? `${monthName(locale, m.month)} so far` : monthName(locale, m.month);
        const change = m.previous === null ? null : changeInWords(f, m);
        return (
          <Fragment key={m.month}>
            {i > 0 ? <View style={[styles.separator, { backgroundColor: colors.separator }]} /> : null}
            <Row
              title={title}
              subtitle={m.current.amountMinor === 0 ? undefined : change?.text}
              detail={<Readout money={m.current} locale={locale} role="readoutS" inline />}
              trailing={isSelected ? <Icon name="check" size={18} color={colors.tint} accessibilityLabel="Selected" /> : <View style={styles.checkSpace} />}
              chevron={false}
              onPress={() => {
                if (isSelected) return;
                haptic('select');
                onSelect(m.month);
              }}
              accessibilityHint={isSelected ? 'Selected' : 'Shows this month'}
              style={styles.listRow}
              testID={`spending-month-${m.month}`}
            />
          </Fragment>
        );
      })}
    </View>
  );
}

function SpendingEmpty() {
  const theme = useTheme();
  return (
    <Screen flush={theme.platform !== 'ios'} testID="spending">
      <View style={styles.gutter}>
        <EmptyState
          title="Nothing logged yet this month"
          message="Your own share of every expense, personal or group, lands here by month and by category, each currency on its own."
          icon="spending"
          action={{ label: 'Add expense', icon: 'add', onPress: () => router.push('/add') }}
          testID="spending-empty"
        />
      </View>
      <ListSection header="Also here">
        <Row title="Budgets" subtitle="Monthly limits per category, with pace against the days left" onPress={() => router.push('/(tabs)/(spending)/budgets')} chevron testID="spending-budgets" />
        <Row title="Insights" onPress={() => router.push('/(tabs)/(home)/insights')} chevron testID="spending-insights" />
      </ListSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: SPACE.gutter, gap: SPACE.l },
  cardBody: { gap: SPACE.s },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.s },
  chart: { marginTop: SPACE.m },
  cardFoot: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: SPACE.m, marginTop: SPACE.xs },
  grow: { flex: 1 },
  link: { fontWeight: '600' },
  list: { marginHorizontal: -SPACE.l },
  listRow: { paddingVertical: SPACE.s + 2 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: SPACE.l },
  checkSpace: { width: 18 },
});
