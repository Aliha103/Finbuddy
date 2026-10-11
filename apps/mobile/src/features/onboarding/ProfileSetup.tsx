// apps/mobile/src/features/onboarding/ProfileSetup.tsx
// Name and default currency, with a readout preview in the device locale so the person sees their
// decimal separator before they type an amount. Saving runs startFresh: a person record and a
// profile on an empty snapshot (which also replaces sample data when coming from the banner).
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { startFresh, useDeviceLocale, useProfile } from '@/data';
import { Button, Card, Field, Readout, SPACE, Text, useTheme } from '@/design';

import { CurrencyPicker } from '../common/CurrencyPicker';
import { currencyNames, exampleMoney, useRegionCurrency } from '../common/currency';
import { THIS_DEVICE } from '../common/device';
import { Screen } from '../common/Screen';

export function ProfileSetup() {
  const { colors } = useTheme();
  const locale = useDeviceLocale();
  const regionCurrency = useRegionCurrency();
  const existing = useProfile();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState(regionCurrency);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const nameOf = useMemo(() => currencyNames(locale), [locale]);
  const nameField = useRef<TextInput>(null);

  const trimmed = name.trim();
  const nameError = touched && !trimmed ? 'Enter the name your friends know you by.' : null;
  const replacing = !!existing;

  const save = () => {
    setTouched(true);
    if (!trimmed) {
      // The error sits under the name field, which may be above the fold: take the person to it.
      nameField.current?.focus();
      return;
    }
    setSaving(true);
    setFailure(null);
    void startFresh({ displayName: trimmed, defaultCurrency: currency, locale })
      .then(() => router.replace('/(tabs)/(home)'))
      .catch((error: unknown) => {
        setFailure(error instanceof Error ? error.message : 'Could not save your profile.');
        setSaving(false);
      });
  };

  return (
    <Screen testID="profile-setup">
      <View style={styles.intro}>
        <Text role="body" color="labelSecondary">
          Your name appears next to what you pay and owe. Your default currency is for personal expenses; every group has its own.
        </Text>
      </View>
      <Field
        label="Your name"
        placeholder="How your friends know you"
        value={name}
        onChangeText={setName}
        onBlur={() => setTouched(true)}
        error={nameError}
        autoCapitalize="words"
        autoComplete="name"
        returnKeyType="done"
        onSubmitEditing={save}
        ref={nameField}
        testID="name-field"
      />
      <Card tone="surface" testID="format-preview">
        <View style={styles.previewRow}>
          <Text role="subhead" color="labelSecondary">
            Amounts will look like this
          </Text>
          <Text role="footnote" color="labelTertiary">
            {`${nameOf(currency)} · follows your phone's language (${locale})`}
          </Text>
        </View>
        <Readout money={exampleMoney(currency)} locale={locale} role="readoutXL" live />
      </Card>
      <View style={styles.pickerHeader}>
        <Text role="headline">Default currency</Text>
      </View>
      {/* Suggestions and search only: the full list would push Start three screens down. */}
      <CurrencyPicker locale={locale} value={currency} onChange={setCurrency} suggested={[regionCurrency, 'EUR', 'USD', 'GBP']} limit={0} />
      {failure ? (
        <Text role="footnote" color="danger" accessibilityRole="alert">
          {failure}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button label={replacing ? 'Replace sample data and start' : 'Start'} fullWidth onPress={save} loading={saving} testID="save-profile" />
        {replacing ? (
          <Text role="footnote" color="labelSecondary" style={{ color: colors.labelSecondary }}>
            {`Starting replaces the sample data on ${THIS_DEVICE} with your own, empty ledger.`}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: SPACE.s },
  previewRow: { gap: 2, marginBottom: SPACE.m },
  pickerHeader: { marginBottom: -SPACE.s },
  actions: { gap: SPACE.s },
});
