// apps/mobile/src/features/expense/PayersScreen.tsx
// Who paid: one person (the default is you), or several people with what each of them paid and a
// running line ("£70.00 of £120.00 assigned: £50.00 left") from evaluate(), whose checks are the
// engine's validatePayers. Choosing a single payer returns to the sheet at once.
import { formatMoneyForInput, type PersonId } from '@finbuddy/shared';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, ListSection, SPACE, Segmented, Text, bestOn, useTheme } from '@/design';
import { EmptyState } from '@/features/common/EmptyState';
import { PersonRow } from '@/features/common/PersonRow';
import { Screen } from '@/features/common/Screen';
import { useGroupLineColor } from '@/features/groups/lineColors';

import { InlineField } from './components/InlineField';
import { withPayerMode } from './form';
import { possessive, useExpenseModel, type ExpenseModel } from './model';
import { useExpenseSession } from './session';
import { moneyFormatSpec, shareColour } from './splitMath';

const INK = '#1A1420';
const MODES = [
  { id: 'single', label: 'One person', description: 'One person paid the whole amount' },
  { id: 'multiple', label: 'Several people', description: 'Type what each person paid' },
] as const;

export function PayersScreen() {
  const model = useExpenseModel();
  if (!model) return <Screen testID="payers">{null}</Screen>;
  if (!model.group) {
    return (
      <Screen testID="payers">
        <EmptyState title="You paid this one" message="A personal expense is always paid by you. Choose a group under Who is it for to record someone else paying." action={{ label: 'Back', onPress: () => router.back() }} />
      </Screen>
    );
  }
  return <Payers model={model} groupId={model.group.group.id} />;
}

function Payers({ model, groupId }: { model: ExpenseModel; groupId: string }) {
  const theme = useTheme();
  const c = theme.colors;
  const { setForm } = useExpenseSession();
  const line = useGroupLineColor(groupId);
  const { f, form, result, members } = model;
  const spec = useMemo(() => moneyFormatSpec(form.currency, f.locale), [form.currency, f.locale]);
  const colour = (i: number) => shareColour(line.fill, i, theme.scheme);
  const currencyWord = f.currencyName(form.currency);

  return (
    <Screen automaticallyAdjustKeyboardInsets testID="payers">
      <Segmented label="How many people paid" options={MODES} value={form.payerMode} onChange={(mode) => setForm((s) => withPayerMode(s, mode, members, result.total, f.locale))} testID="payer-mode" />

      {form.payerMode === 'single' ? (
        <ListSection header="Who paid" style={styles.flushList}>
          {members.map((id, i) => {
            const selected = form.payerId === id;
            return (
              <PersonRow
                key={id}
                name={f.name(id)}
                avatarFill={colour(i)}
                avatarOn={bestOn(colour(i), ['#FFFFFF', INK])}
                control={selected ? <Icon name="check" size={22} color={c.tint} /> : <View style={styles.checkSpace} />}
                onPress={() => {
                  setForm((s) => ({ ...s, payerId: id }));
                  router.back();
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected, checked: selected }}
                accessibilityLabel={`${f.name(id)} paid`}
                testID={`payer-${id}`}
              />
            );
          })}
        </ListSection>
      ) : (
        <>
          <ListSection header="What each person paid" footer="Leave a field empty for someone who did not pay." style={styles.flushList}>
            {members.map((id: PersonId, i) => (
              <PersonRow
                key={id}
                name={f.name(id)}
                avatarFill={colour(i)}
                avatarOn={bestOn(colour(i), ['#FFFFFF', INK])}
                error={result.payerErrors[id] ?? null}
                control={
                  <InlineField
                    accessibilityLabel={`${possessive(f, id)} payment, in ${currencyWord}`}
                    prefix={spec.prefix.trim() || undefined}
                    suffix={spec.suffix.trim() || undefined}
                    value={form.payerAmounts[id] ?? ''}
                    onChangeText={(v) => setForm((s) => ({ ...s, payerAmounts: { ...s.payerAmounts, [id]: v } }))}
                    placeholder={formatMoneyForInput({ amountMinor: 0, currency: form.currency }, f.locale)}
                    invalid={!!result.payerErrors[id]}
                    testID={`payer-input-${id}`}
                  />
                }
                testID={`payer-row-${id}`}
              />
            ))}
          </ListSection>
          <View style={styles.status}>
            {result.payerProgress ? (
              <Text role="subhead" accessibilityLabel={result.payerProgress.spoken} accessibilityLiveRegion="polite" testID="payer-progress">
                {result.payerProgress.text}
              </Text>
            ) : (
              <Text role="subhead" color="labelSecondary">
                Enter the amount first to see what is left to assign.
              </Text>
            )}
            {result.total
              ? result.payerGeneral
                  .filter((m) => m !== result.payerSumMessage)
                  .map((m) => (
                    <Text key={m} role="footnote" color="danger" accessibilityRole="alert">
                      {m}
                    </Text>
                  ))
              : null}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flushList: { paddingHorizontal: 0 },
  checkSpace: { width: 22 },
  status: { gap: SPACE.xs },
});
