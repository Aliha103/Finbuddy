// apps/mobile/src/features/expense/AddExpenseScreen.tsx
// Add expense, the fastest and most frequent flow (DIRECTION.md section 4): the amount is focused
// with the decimal keypad up as the sheet opens, its currency a capsule beside it; then an optional
// description, who it is for (just you or a group), for a group who paid and how it is split, a
// category and the date. Save sits in the header (iOS) or the top app bar (Android). The engine
// decides everything: parseMoneyInput, validateSplit, validatePayers, resolveSplit, then addExpense
// (or updateExpense when editing). Once an amount exists, leaving asks before discarding it.
import { DEFAULT_CATEGORIES, formatMoneyForInput, type CategoryId, type CurrencyCode } from '@finbuddy/shared';
import { Stack, router, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { addExpense, updateExpense, useDataStatus, useProfile } from '@/data';
import { Chip, ChipRow, Field, Icon, ListSection, Row, SPACE, SampleChip, Skeleton, SkeletonText, Text, confirmDialog, useHaptic, useTheme } from '@/design';
import { EmptyState } from '@/features/common/EmptyState';
import { minorUnitsLabel } from '@/features/common/currency';
import { categoryLabel } from '@/features/common/format';
import { HeaderButton } from '@/features/common/HeaderButton';
import { Screen } from '@/features/common/Screen';

import { CategoryIcon } from './components/CategoryIcon';
import { DateField } from './components/DateField';
import { issueMessage, withGroup } from './form';
import { payerSummary, plainName, splitSummary, useExpenseModel, type ExpenseModel } from './model';
import { usePreventRemove } from './preventRemove';
import { useExpenseSession } from './session';

function announce(text: string): void {
  if (typeof AccessibilityInfo.announceForAccessibility === 'function') AccessibilityInfo.announceForAccessibility(text);
}

/** Leaves the add stack: back to wherever the sheet was opened from. */
export function closeAddSheet(): void {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function AddExpenseScreen() {
  const model = useExpenseModel();
  const { status } = useDataStatus();
  const profile = useProfile();
  if (!model) {
    if (status === 'ready' && !profile) {
      return (
        <Screen testID="add-expense">
          <EmptyState title="Set up your profile first" message="Expenses need someone to pay them. Add your name and currency, then come back." action={{ label: 'Set up profile', onPress: () => router.replace('/onboarding') }} />
        </Screen>
      );
    }
    return <AddSkeleton />;
  }
  if (model.missing) {
    return (
      <Screen testID="add-expense">
        <Stack.Screen options={{ title: 'Edit expense', headerRight: () => null }} />
        <EmptyState title="This expense no longer exists" message="It may have been deleted, or the data on this phone was reset." action={{ label: 'Close', onPress: closeAddSheet }} />
      </Screen>
    );
  }
  return <AddExpenseForm model={model} />;
}

function AddSkeleton() {
  return (
    <Screen testID="add-skeleton" accessibilityLabel="Loading">
      <View style={styles.skeleton}>
        <SkeletonText role="subhead" width="20%" />
        <Skeleton height={64} radius={10} />
        <SkeletonText role="subhead" width="30%" />
        <Skeleton height={44} radius={10} />
        <SkeletonText role="subhead" width="25%" />
        <Skeleton height={36} width="70%" radius={18} />
      </View>
    </Screen>
  );
}

function AddExpenseForm({ model }: { model: ExpenseModel }) {
  const theme = useTheme();
  const c = theme.colors;
  const haptic = useHaptic();
  const navigation = useNavigation();
  const { setForm, setShowAll } = useExpenseSession();
  const { f, form, initial, result, group, groups, members, me, today, showAll, editingId, defaultCurrency } = model;

  const [amountTouched, setAmountTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);

  // The discard guard: once an amount exists and something changed, a swipe down, Back or Close asks first.
  const dirty = form.amountText.trim() !== '' && JSON.stringify(form) !== JSON.stringify(initial);
  usePreventRemove(dirty && !saved, (action) => {
    void confirmDialog({
      title: editingId ? 'Discard your changes?' : 'Discard this expense?',
      message: editingId ? 'The expense stays as it was saved.' : 'The amount and details you entered will be lost.',
      confirmLabel: 'Discard',
      cancelLabel: 'Keep editing',
      destructive: true,
    }).then((ok) => {
      if (ok) navigation.dispatch(action);
    });
  });
  useEffect(() => {
    if (saved) closeAddSheet();
  }, [saved]);

  const currencyName = f.currencyName(form.currency);
  // An empty amount only complains on Save; a typed one that the engine rejects, once the field is left.
  const showAmountError = result.amountError !== null && (showAll || (amountTouched && !result.amountEmpty));
  const update = (patch: Partial<typeof form>) => setForm((s) => ({ ...s, ...patch }));

  async function save() {
    if (saving) return;
    setShowAll(true);
    setSaveErrors([]);
    const draft = result.draft;
    if (!draft) {
      const first = result.amountError ?? result.payerGeneral[0] ?? Object.values(result.payerErrors)[0] ?? result.splitGeneral[0] ?? Object.values(result.splitErrors)[0];
      haptic('warning');
      announce(`Not saved yet. ${first ?? 'Some fields need checking.'}`);
      return;
    }
    setSaving(true);
    try {
      const outcome = editingId ? await updateExpense(editingId, draft) : await addExpense(draft);
      if (outcome.ok) {
        haptic('success');
        announce(`Saved ${outcome.expense.description}, ${f.spokenMoney(outcome.expense.total)}`);
        setSaved(true);
        return;
      }
      const messages = [...outcome.issues.map((i) => issueMessage(f, i, form.currency)), ...outcome.problems];
      setSaveErrors(messages.length ? [...new Set(messages)] : ['The expense could not be saved. Try again.']);
      haptic('warning');
    } catch (error) {
      setSaveErrors([error instanceof Error ? error.message : String(error)]);
    } finally {
      setSaving(false);
    }
  }

  const splitProblem = group && (showAll || result.total) ? (result.splitGeneral[0] ?? Object.values(result.splitErrors)[0] ?? null) : null;
  const payerProblem = group && form.payerMode === 'multiple' && (showAll || result.total) ? (result.payerGeneral[0] ?? Object.values(result.payerErrors)[0] ?? null) : null;
  const payerIds = form.payerMode === 'multiple' ? members.filter((id) => (form.payerAmounts[id] ?? '').trim() !== '') : [form.payerId];
  const summary = group ? splitSummary(model) : null;
  const ios = theme.platform === 'ios';

  return (
    <Screen automaticallyAdjustKeyboardInsets testID="add-expense">
      <Stack.Screen
        options={{
          title: editingId ? 'Edit expense' : 'Add expense',
          headerLeft: () =>
            ios ? <HeaderButton label="Cancel" onPress={closeAddSheet} testID="add-cancel" /> : <HeaderButton label="Close" icon="close" onPress={closeAddSheet} testID="add-cancel" />,
          headerRight: () => <HeaderButton label={saving ? 'Saving' : 'Save'} emphasis disabled={saving} onPress={() => void save()} testID="add-save" />,
        }}
      />

      <Field
        label="Amount"
        size="amount"
        accessibilityLabel={`Amount in ${currencyName}`}
        value={form.amountText}
        onChangeText={(amountText) => update({ amountText })}
        onBlur={() => setAmountTouched(true)}
        placeholder={formatMoneyForInput({ amountMinor: 0, currency: form.currency }, f.locale)}
        keyboardType="decimal-pad"
        inputMode="decimal"
        autoFocus={!editingId}
        returnKeyType="done"
        error={showAmountError ? result.amountError : null}
        // The line under the amount always holds something (the currency and its minor units, or the
        // mismatch note), so an error replaces it instead of pushing the form down mid-tap.
        hint={model.currencyMismatch && group ? `Balances in ${plainName(group.group.name)} will show ${form.currency} separately from ${group.group.currency}.` : `${currencyName} · ${minorUnitsLabel(form.currency)}`}
        trailing={<CurrencyButton currency={form.currency} name={currencyName} />}
        testID="amount-field"
      />

      <Field
        label="Description"
        value={form.description}
        onChangeText={(description) => update({ description })}
        placeholder={categoryLabel(form.categoryId)}
        hint={`Optional. Left empty, it is saved as ${categoryLabel(form.categoryId)}.`}
        maxLength={120}
        returnKeyType="done"
        autoCapitalize="sentences"
        testID="description-field"
      />

      <View style={styles.block}>
        <View style={styles.labelLine}>
          <Text role="subhead" color="labelSecondary">
            Who is it for
          </Text>
          {group?.group.isSample ? <SampleChip /> : null}
        </View>
        <ChipRow label="Who is it for">
          <Chip label="Just me" icon="person" selected={form.groupId === null} onPress={() => setForm((s) => withGroup(s, null, defaultCurrency, me))} testID="who-personal" />
          {groups.map((g) => (
            <Chip
              key={g.group.id}
              label={plainName(g.group.name)}
              icon="groups"
              selected={form.groupId === g.group.id}
              accessibilityLabel={`${plainName(g.group.name)}${g.group.isSample ? ', sample group' : ''}`}
              onPress={() => setForm((s) => withGroup(s, g.group.id, g.group.currency, me))}
              testID={`who-${g.group.id}`}
            />
          ))}
        </ChipRow>
      </View>

      {group ? (
        <View style={styles.block}>
          <ListSection style={styles.flushList}>
            <Row
              title="Paid by"
              titleSpoken="Paid by"
              detail={
                <Text role="body" color="labelSecondary" numberOfLines={1}>
                  {payerSummary(f, payerIds)}
                </Text>
              }
              subtitle={form.payerMode === 'multiple' && result.payerProgress ? result.payerProgress.text : undefined}
              onPress={() => router.push('/add/payers')}
              chevron
              accessibilityHint="Choose who paid"
              testID="add-payers"
            />
            <Row title="Split" subtitle={summary?.text} onPress={() => router.push('/add/split')} chevron accessibilityHint="Opens the split editor" testID="add-split" />
          </ListSection>
          {payerProblem ? (
            <Text role="footnote" color="danger" accessibilityRole="alert" testID="payer-problem">
              {`Paid by: ${payerProblem}`}
            </Text>
          ) : null}
          {splitProblem ? (
            <Text role="footnote" color="danger" accessibilityRole="alert" testID="split-problem">
              {`Split: ${splitProblem}`}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text role="footnote" color="labelSecondary">
          A personal expense counts fully toward your own spending.
        </Text>
      )}

      <View style={styles.block}>
        <View style={styles.labelLine}>
          <Text role="subhead" color="labelSecondary" style={styles.flex}>
            Category
          </Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/add/category')} hitSlop={8} style={[styles.link, { minHeight: theme.minTouch }]} testID="add-category">
            <Text role="subhead" color="tint" style={styles.linkText}>
              All categories
            </Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chipStrip} accessibilityRole="radiogroup" accessibilityLabel="Category" testID="category-strip">
          {DEFAULT_CATEGORIES.map((cat) => (
            <CategoryChip key={cat.id} id={cat.id} label={cat.defaultLabel} selected={form.categoryId === cat.id} onPress={() => update({ categoryId: cat.id })} />
          ))}
        </ScrollView>
      </View>

      <DateField f={f} value={form.date} today={today} onChange={(date) => update({ date })} testID="date-field" />

      {(showAll && !result.draft) || saveErrors.length ? (
        <View style={[styles.problems, { backgroundColor: c.dangerWash }]} accessibilityRole="alert" testID="save-problems">
          <Icon name="error" size={20} color={c.danger} />
          <View style={styles.flex}>
            {saveErrors.length ? (
              saveErrors.map((m) => (
                <Text key={m} role="subhead" style={{ color: theme.scheme === 'dark' ? c.label : c.danger }}>
                  {m}
                </Text>
              ))
            ) : (
              <Text role="subhead" style={{ color: theme.scheme === 'dark' ? c.label : c.danger }}>
                Not saved yet. Each field above says what to fix.
              </Text>
            )}
          </View>
        </View>
      ) : null}
      {Platform.OS === 'web' ? <View style={styles.webSpacer} /> : null}
    </Screen>
  );
}

/** The currency as a capsule beside the amount; opens the currency list. */
function CurrencyButton({ currency, name }: { currency: CurrencyCode; name: string }) {
  const theme = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Currency, ${name}`}
      accessibilityHint="Choose another currency"
      onPress={() => router.push('/add/currency')}
      hitSlop={{ top: 4, bottom: 4 }}
      style={({ pressed }) => [styles.currency, { minHeight: theme.minTouch, backgroundColor: pressed ? c.pressed : c.surface, borderColor: c.separator }]}
      testID="currency-button"
    >
      <Text role="headline">{currency}</Text>
      <Icon name="chevronDown" size={16} color={c.labelSecondary} />
    </Pressable>
  );
}

function CategoryChip({ id, label, selected, onPress }: { id: CategoryId; label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  const c = theme.colors;
  const haptic = useHaptic();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected, checked: selected }}
      aria-checked={selected}
      onPress={() => {
        haptic('select');
        onPress();
      }}
      style={({ pressed }) => [styles.categoryChip, { minHeight: theme.minTouch, backgroundColor: selected ? c.tintWash : pressed ? c.pressed : c.surface, borderColor: selected ? 'transparent' : c.separator }]}
      testID={`category-${id}`}
    >
      {selected ? <Icon name="check" size={16} color={c.onTintWash} /> : null}
      <CategoryIcon categoryId={id} size={18} color={selected ? c.onTintWash : c.labelSecondary} />
      <Text role="subhead" style={{ color: selected ? c.onTintWash : c.label, fontWeight: selected ? '600' : '400' }} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  skeleton: { gap: SPACE.m },
  block: { gap: SPACE.s },
  labelLine: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s },
  flushList: { paddingHorizontal: 0 },
  link: { justifyContent: 'center', paddingHorizontal: SPACE.xs },
  linkText: { fontWeight: '600' },
  bleed: { marginHorizontal: -SPACE.gutter },
  chipStrip: { gap: SPACE.s, paddingHorizontal: SPACE.gutter },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs + 2, paddingHorizontal: SPACE.m + 2, borderRadius: 999, borderWidth: 1 },
  currency: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs, paddingHorizontal: SPACE.m, borderRadius: 999, borderWidth: 1 },
  problems: { flexDirection: 'row', gap: SPACE.s, padding: SPACE.m, borderRadius: 10 },
  webSpacer: { height: SPACE.xl },
});
