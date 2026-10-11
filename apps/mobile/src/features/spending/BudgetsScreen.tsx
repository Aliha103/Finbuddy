// apps/mobile/src/features/spending/BudgetsScreen.tsx
// Budgets: a monthly limit per category (or for all spending) in one currency, with its pace from the
// engine's budget_pace insight. Set or change one in an editor that takes the list's place while it
// is open (so it is never below the fold), with the amount parsed by the engine and errors in its
// words; remove one behind the Gate in its destructive intent. Spending in another currency is never
// counted towards a budget, and the screen says so.
import { DEFAULT_CATEGORIES, formatMoneyForInput, parseMoneyInput, type Budget, type BudgetId, type CategoryId, type CurrencyCode } from '@finbuddy/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { removeBudget, setBudget, useBudgets, useDeviceLocale, useInsights, useProfile, useSpending } from '@/data';
import { Button, Card, Chip, ChipRow, Field, Hairline, HoldToConfirm, Icon, ListSection, Row, SPACE, Text, gateUsesDialog, useHaptic, useTheme } from '@/design';
import { DataGate } from '@/features/common/DataGate';
import { categoryLabel, exampleAmount, paceSentence, parseErrorMessage, useFormat, type BudgetPace } from '@/features/common/format';
import { Screen } from '@/features/common/Screen';

import { findPace } from './budgetPace';
import { BudgetRow, budgetLabel } from './BudgetRow';
import { excludedNote } from './copy';

export interface BudgetsScreenProps {
  /** The currency to open on (the one Spending was showing). */
  initialCurrency?: CurrencyCode;
}

type Editing = { kind: 'new' } | { kind: 'edit'; id: BudgetId } | null;

export function BudgetsScreen(props: BudgetsScreenProps) {
  return (
    <DataGate>
      <Budgets {...props} />
    </DataGate>
  );
}

function Budgets({ initialCurrency }: BudgetsScreenProps) {
  const theme = useTheme();
  const c = theme.colors;
  const f = useFormat();
  const profile = useProfile();
  const budgets = useBudgets();
  const insights = useInsights();
  const summary = useSpending(6);
  const [pickedCurrency, setPickedCurrency] = useState<CurrencyCode | null>(initialCurrency ?? null);
  const [editing, setEditing] = useState<Editing>(null);

  // Every currency a budget could be in: yours first, then the ones with spending, then the ones with budgets.
  const currencies = [...new Set<CurrencyCode>([...(profile ? [profile.defaultCurrency] : []), ...(summary?.byCurrency.map((x) => x.currency) ?? []), ...budgets.map((b) => b.amount.currency)])];
  const currency = pickedCurrency && currencies.includes(pickedCurrency) ? pickedCurrency : (currencies[0] ?? 'USD');
  const currencyName = f.currencyName(currency);
  const mine = budgets.filter((b) => b.amount.currency === currency);
  const paces = mine.map((b) => ({ budget: b, pace: findPace(insights, b.id) }));
  const excluded = [...new Set(paces.flatMap((p) => p.pace?.excluded ?? []))].sort();
  const taken = new Set(mine.map((b) => b.categoryId ?? '*'));
  const editingBudget = editing?.kind === 'edit' ? (mine.find((b) => b.id === editing.id) ?? null) : null;
  const allTaken = taken.size >= DEFAULT_CATEGORIES.length + 1;

  const footer = [excludedNote(excluded), mine.length ? 'Pace compares what you have spent so far with an even spread of the budget over the month; the tick marks where that pace would be today.' : `No budgets in ${currencyName} yet. A budget counts your own share of spending in ${currency} only.`]
    .filter((s): s is string => !!s)
    .join('. ')
    .concat('.')
    .replace(/\.\./g, '.');

  if (editing && (editing.kind === 'new' || editingBudget)) {
    const pace = editingBudget ? (paces.find((p) => p.budget.id === editingBudget.id)?.pace ?? null) : null;
    return (
      <Screen flush={theme.platform !== 'ios'} testID="budgets">
        <View style={styles.gutter}>
          <BudgetEditor key={editing.kind === 'edit' ? editing.id : 'new'} currency={currency} budget={editingBudget} pace={pace} taken={taken} onDone={() => setEditing(null)} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen flush={theme.platform !== 'ios'} testID="budgets">
      {currencies.length > 1 ? (
        <View style={styles.gutter}>
          <ChipRow label="Currency">
            {currencies.map((code) => (
              <Chip key={code} label={code} selected={code === currency} accessibilityLabel={f.currencyName(code)} onPress={() => setPickedCurrency(code)} testID={`budgets-currency-${code}`} />
            ))}
          </ChipRow>
        </View>
      ) : null}

      <ListSection header={`Monthly budgets in ${currency}`} footer={footer}>
        {paces.map(({ budget, pace }) => (
          <BudgetRow
            key={budget.id}
            budget={budget}
            pace={pace}
            f={f}
            onPress={() => setEditing({ kind: 'edit', id: budget.id })}
            accessibilityHint="Opens this budget to change or remove it"
            testID={`budget-${budget.id}`}
          />
        ))}
        {allTaken ? null : (
          <Row
            title="Set a budget"
            subtitle={mine.length ? undefined : `A monthly limit for one category, or for everything, in ${currency}`}
            leading={<Icon name="add" size={22} color={c.tint} />}
            onPress={() => setEditing({ kind: 'new' })}
            chevron={false}
            testID="budget-add"
          />
        )}
      </ListSection>
    </Screen>
  );
}

interface BudgetEditorProps {
  currency: CurrencyCode;
  /** The budget being changed, or null for a new one. */
  budget: Budget | null;
  /** Its pace this month, shown for context while it is changed. */
  pace: BudgetPace | null;
  /** Category keys already budgeted in this currency ('*' for all spending). */
  taken: ReadonlySet<string>;
  onDone: () => void;
}

function BudgetEditor({ currency, budget, pace, taken, onDone }: BudgetEditorProps) {
  const theme = useTheme();
  const f = useFormat();
  const locale = useDeviceLocale();
  const haptic = useHaptic();
  const options: (CategoryId | null)[] = [null, ...DEFAULT_CATEGORIES.map((cat) => cat.id)].filter((id) => (budget ? id === budget.categoryId : true) || !taken.has(id ?? '*'));
  const [categoryId, setCategoryId] = useState<CategoryId | null>(budget ? budget.categoryId : (options[0] ?? null));
  const [text, setText] = useState(budget ? formatMoneyForInput(budget.amount, locale) : '');
  const [error, setError] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState<'save' | 'remove' | null>(null);
  const label = budgetLabel({ categoryId });

  const save = () => {
    const parsed = parseMoneyInput(text, currency, { locale, allowZero: false });
    if (!parsed.ok) {
      setError(parseErrorMessage(f, parsed.error, currency, parsed.maxDecimals));
      return;
    }
    setError(null);
    setFailure(null);
    setBusy('save');
    setBudget({ ...(budget ? { id: budget.id } : {}), categoryId, amount: parsed.value })
      .then(() => {
        haptic('success');
        onDone();
      })
      .catch((e: unknown) => {
        setFailure(e instanceof Error ? e.message : String(e));
        setBusy(null);
      });
  };

  const remove = () => {
    if (!budget) return;
    setBusy('remove');
    removeBudget(budget.id)
      .then(() => onDone())
      .catch((e: unknown) => {
        setFailure(e instanceof Error ? e.message : String(e));
        setBusy(null);
      });
  };

  return (
    <Card testID="budget-editor">
      <View style={styles.editor}>
        <View style={styles.titleBlock}>
          <Text role="headline" accessibilityRole="header">
            {budget ? `Change the ${budgetLabel(budget).toLowerCase()} budget` : `Set a budget in ${currency}`}
          </Text>
          {budget ? (
            <Text role="subhead" color="labelSecondary" accessibilityLabel={pace ? paceSentence(f, pace).spoken : undefined} testID="budget-editor-pace">
              {pace ? `This month: ${paceSentence(f, pace).text}` : `${f.money(budget.amount)} a month. Pace shows once this month has spending`}
            </Text>
          ) : null}
        </View>
        <View style={styles.block}>
          <Text role="subhead" color="labelSecondary">
            Category
          </Text>
          <ChipRow label="Category">
            {options.map((id) => (
              <Chip key={id ?? '*'} label={id === null ? 'All spending' : categoryLabel(id)} selected={id === categoryId} onPress={() => setCategoryId(id)} testID={`budget-category-${id ?? 'all'}`} />
            ))}
          </ChipRow>
        </View>
        <Field
          label={`Monthly limit for ${label.toLowerCase()}`}
          value={text}
          onChangeText={(t) => {
            setText(t);
            if (error) setError(null);
          }}
          placeholder={exampleAmount(currency, locale)}
          inputMode="decimal"
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={save}
          autoFocus={!budget}
          error={error}
          hint={`In ${f.currencyName(currency)}. Your own share of ${label.toLowerCase()} counts towards it; spending in other currencies never does.`}
          trailing={
            <Text role="subhead" color="labelSecondary" importantForAccessibility="no">
              {currency}
            </Text>
          }
          testID="budget-amount"
        />
        <View style={styles.actions}>
          <Button label={budget ? 'Save changes' : 'Set budget'} onPress={save} loading={busy === 'save'} disabled={busy !== null} testID="budget-save" />
          <Button label="Cancel" variant="plain" onPress={onDone} disabled={busy !== null} testID="budget-cancel" />
        </View>
        {failure ? (
          <Text role="footnote" color="danger" accessibilityLiveRegion="polite" testID="budget-failure">
            {`The budget was not saved: ${failure}`}
          </Text>
        ) : null}
        {budget ? (
          <>
            <Hairline />
            <HoldToConfirm label="Remove budget" summary={`Removes the ${budgetLabel(budget).toLowerCase()} budget of ${f.money(budget.amount)} a month`} intent="destructive" disabled={busy !== null} onConfirm={remove} testID="budget-remove" />
            <Text role="footnote" style={{ color: theme.colors.labelTertiary }}>
              {gateUsesDialog(theme) ? 'Asks you to confirm first. Your expenses stay as they are.' : 'Hold until the ring closes. Your expenses stay as they are.'}
            </Text>
          </>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: SPACE.gutter, gap: SPACE.l },
  editor: { gap: SPACE.l },
  titleBlock: { gap: SPACE.xs },
  block: { gap: SPACE.s },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: SPACE.s },
});
