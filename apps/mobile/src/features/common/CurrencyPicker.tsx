// apps/mobile/src/features/common/CurrencyPicker.tsx
// A searchable currency list: suggested codes first, then every code the engine knows, each with
// its name and its minor units. Used by onboarding, Settings and (later) the add-expense sheet.
import type { CurrencyCode } from '@finbuddy/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Field, Icon, ListSection, Row, SPACE, Text, useTheme } from '@/design';

import { useCurrencyOptions, type CurrencyOption } from './currency';

export interface CurrencyPickerProps {
  locale: string;
  value: CurrencyCode;
  onChange: (code: CurrencyCode) => void;
  suggested?: readonly CurrencyCode[];
  /** How many of the full list to show before a search narrows it (keeps the screen light). */
  limit?: number;
  testID?: string;
}

export function CurrencyPicker({ locale, value, onChange, suggested = [], limit = 12, testID }: CurrencyPickerProps) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const options = useCurrencyOptions(locale, [value, ...suggested], query);
  const searching = query.trim().length > 0;
  const rest = searching ? options.rest : options.rest.slice(0, limit);
  const hidden = options.rest.length - rest.length;

  const row = (o: CurrencyOption) => (
    <Row
      key={o.code}
      title={`${o.code} · ${o.name}`}
      subtitle={o.decimals}
      onPress={() => onChange(o.code)}
      chevron={false}
      trailing={o.code === value ? <Icon name="check" size={20} color={colors.tint} accessibilityLabel="Selected" /> : <View style={styles.spacer} />}
      accessibilityHint={o.code === value ? 'Selected' : `Use ${o.name}`}
      testID={`currency-${o.code}`}
    />
  );

  return (
    <View style={styles.box} testID={testID}>
      <Field label="Search currencies" placeholder="Code or name, like JPY or yen" value={query} onChangeText={setQuery} autoCapitalize="characters" autoCorrect={false} returnKeyType="search" />
      {options.suggested.length ? <ListSection header="Suggested">{options.suggested.map(row)}</ListSection> : null}
      {rest.length ? <ListSection header={searching ? 'Matches' : 'All currencies'}>{rest.map(row)}</ListSection> : null}
      {!options.suggested.length && !rest.length ? (
        <Text role="subhead" color="labelSecondary">
          {`No currency matches "${query.trim()}".`}
        </Text>
      ) : null}
      {hidden > 0 ? (
        <Text role="footnote" color="labelTertiary">
          {hidden} more. Search by code or name to find one.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: SPACE.l },
  spacer: { width: 20 },
});
