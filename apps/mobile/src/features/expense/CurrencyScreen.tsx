// apps/mobile/src/features/expense/CurrencyScreen.tsx
// The expense's currency: search by code or name; suggested first (the group's, yours, then the
// ones you used most recently), then every code the engine knows, each with its minor units ("no
// decimals", "3 decimals") so JPY and KWD are not surprises. Choosing returns to the sheet.
import { type CurrencyCode } from '@finbuddy/shared';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useActivity } from '@/data';
import { SPACE, Text } from '@/design';
import { CurrencyPicker } from '@/features/common/CurrencyPicker';
import { cleanName } from '@/features/common/format';
import { Screen } from '@/features/common/Screen';

import { useExpenseModel } from './model';
import { useExpenseSession } from './session';

export function CurrencyScreen() {
  const model = useExpenseModel();
  const { setForm } = useExpenseSession();
  const activity = useActivity();
  const recent = useMemo(() => {
    const seen: CurrencyCode[] = [];
    for (const item of activity) {
      const code = item.kind === 'expense' ? item.expense.total.currency : item.settlement.amount.currency;
      if (!seen.includes(code)) seen.push(code);
      if (seen.length >= 3) break;
    }
    return seen;
  }, [activity]);
  if (!model) return <Screen testID="add-currency-screen">{null}</Screen>;
  const { f, form, group, defaultCurrency } = model;
  const suggested = [...(group ? [group.group.currency] : []), defaultCurrency, ...recent];
  return (
    <Screen automaticallyAdjustKeyboardInsets testID="add-currency-screen">
      <View style={styles.note}>
        <Text role="subhead" color="labelSecondary">
          {group
            ? `${cleanName(group.group.name)} uses ${f.currencyName(group.group.currency)}. Another currency is kept separate in the group's balances, never converted.`
            : `Your personal expenses default to ${f.currencyName(defaultCurrency)}. Amounts are never converted between currencies.`}
        </Text>
      </View>
      <CurrencyPicker
        locale={f.locale}
        value={form.currency}
        suggested={suggested}
        onChange={(code) => {
          setForm((s) => ({ ...s, currency: code }));
          router.back();
        }}
        testID="currency-picker"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { gap: SPACE.xs },
});
