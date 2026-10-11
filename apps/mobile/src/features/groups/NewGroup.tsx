// apps/mobile/src/features/groups/NewGroup.tsx
// New group: a name, the group's currency, who is in it (people this device knows, or new names)
// and the card's line colour. Create runs createGroup (the factory plus addPerson for each new
// name); the colour choice is app-local. Create sits in the navigation bar on iOS and at the end
// of the form on Android and the web.
import { Stack, router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { createGroup, useDeviceLocale, useGroups, usePeople, useProfile } from '@/data';
import { Button, Card, Field, LINE_COLORS, SPACE, Text, lineColorFor, useTheme, type LineColorId } from '@/design';

import { CurrencyPicker } from '../common/CurrencyPicker';
import { currencyNames, minorUnitsLabel } from '../common/currency';
import { DataGate } from '../common/DataGate';
import { HeaderButton } from '../common/HeaderButton';
import { Screen } from '../common/Screen';
import { LineColorPicker } from './LineColorPicker';
import { MemberEditor } from './MemberEditor';
import { setGroupLineColor, useLineColorOverrides } from './lineColors';

export function NewGroup() {
  return (
    <DataGate>
      <NewGroupForm />
    </DataGate>
  );
}

function NewGroupForm() {
  const theme = useTheme();
  const locale = useDeviceLocale();
  const profile = useProfile();
  const people = usePeople();
  const groups = useGroups();
  const overrides = useLineColorOverrides();
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);
  const [currency, setCurrency] = useState(profile?.defaultCurrency ?? 'USD');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [newNames, setNewNames] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const nameOf = useMemo(() => currencyNames(locale), [locale]);
  const nameField = useRef<TextInput>(null);

  // The first line colour no existing group wears, so new cards stay telling-apart-able.
  const suggested = useMemo<LineColorId>(() => {
    const used = new Set(groups.map((g) => lineColorFor(g.group.id, overrides).id));
    return (LINE_COLORS.find((l) => !used.has(l.id)) ?? LINE_COLORS[0]).id;
  }, [groups, overrides]);
  const [colour, setColour] = useState<LineColorId | null>(null);
  const chosen = colour ?? suggested;

  const candidates = useMemo(() => [...people.values()].filter((p) => p.id !== profile?.personId).sort((a, b) => a.displayName.localeCompare(b.displayName)), [people, profile]);
  const trimmed = name.trim();
  const nameError = touched && !trimmed ? 'Give the group a name.' : null;
  const memberCount = 1 + memberIds.length + newNames.length;

  const create = () => {
    setTouched(true);
    if (!trimmed) {
      // The error sits under the name field at the top of a long form: take the person to it.
      nameField.current?.focus();
      return;
    }
    if (saving) return;
    setSaving(true);
    setFailure(null);
    void createGroup({ name: trimmed, currency, memberIds, newMemberNames: newNames })
      .then((group) => {
        setGroupLineColor(group.id, chosen);
        router.replace({ pathname: '/(tabs)/(groups)/group/[groupId]', params: { groupId: group.id } });
      })
      .catch((error: unknown) => {
        setFailure(error instanceof Error ? error.message : 'Could not create the group.');
        setSaving(false);
      });
  };

  const ios = theme.platform === 'ios';
  return (
    <>
      <Stack.Screen options={{ headerRight: ios ? () => <HeaderButton label="Create" emphasis disabled={saving} onPress={create} testID="create-group" /> : undefined }} />
      <Screen testID="new-group">
        <Field
          label="Name"
          placeholder="Trip, flat, dinner club"
          value={name}
          onChangeText={setName}
          onBlur={() => setTouched(true)}
          error={nameError}
          autoCapitalize="sentences"
          autoFocus
          returnKeyType="done"
          ref={nameField}
          testID="group-name"
        />

        <View style={styles.section}>
          <Text role="headline" accessibilityRole="header">
            Members
          </Text>
          <Text role="footnote" color="labelSecondary">
            {`${memberCount === 1 ? 'Just you so far' : `You and ${memberCount - 1} ${memberCount - 1 === 1 ? 'other' : 'others'}`}. People without the app can be added by name.`}
          </Text>
          <MemberEditor
            candidates={candidates}
            selectedIds={memberIds}
            onToggle={(id) => setMemberIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))}
            newNames={newNames}
            onAddName={(n) => setNewNames((ns) => [...ns, n])}
            onRemoveName={(i) => setNewNames((ns) => ns.filter((_, j) => j !== i))}
          />
        </View>

        <View style={styles.section}>
          <Text role="headline" accessibilityRole="header">
            Line colour
          </Text>
          <LineColorPicker value={chosen} onChange={setColour} />
        </View>

        <View style={styles.section}>
          <Text role="headline" accessibilityRole="header">
            Currency
          </Text>
          <Card tone="surfaceAlt" padding={SPACE.m}>
            <Text role="body">{`${currency} · ${nameOf(currency)}`}</Text>
            <Text role="footnote" color="labelSecondary">
              {`${minorUnitsLabel(currency)}. New expenses default to it; balances are kept per currency and never converted.`}
            </Text>
          </Card>
          <CurrencyPicker locale={locale} value={currency} onChange={setCurrency} suggested={[profile?.defaultCurrency ?? 'USD', 'EUR', 'USD', 'GBP', 'JPY']} limit={0} />
        </View>

        {failure ? (
          <Text role="footnote" color="danger" accessibilityRole="alert">
            {failure}
          </Text>
        ) : null}
        {ios ? null : <Button label="Create group" fullWidth onPress={create} loading={saving} testID="create-group" />}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  section: { gap: SPACE.m },
});
