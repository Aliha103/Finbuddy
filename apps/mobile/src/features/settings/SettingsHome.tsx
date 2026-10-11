// apps/mobile/src/features/settings/SettingsHome.tsx
// Profile and settings as a grouped list (DIRECTION.md section 4). Reads useProfile and
// useDataStatus; name edits save on blur through updateProfile.
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { updateProfile, useDeviceLocale, useProfile } from '@/data';
import { Field, ListSection, Row, SPACE, SampleChip, Text, useTheme } from '@/design';

import { StorageBar } from '../common/Banners';
import { currencyNames, exampleMoney } from '../common/currency';
import { Screen } from '../common/Screen';
import { cleanName, useFormat } from '../common/format';

export const REPOSITORY_URL = 'https://github.com/Aliha103/Finbuddy';

export function SettingsHome() {
  const theme = useTheme();
  const profile = useProfile();
  const locale = useDeviceLocale();
  const f = useFormat();
  const nameOf = useMemo(() => currencyNames(locale), [locale]);
  // `draft` is null while the field is untouched, so the profile's own name shows without an effect.
  const [draft, setDraft] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  // Shown the way every other screen shows it (the " (sample)" marker is the Sample chip's job).
  const name = draft ?? cleanName(profile?.displayName ?? '');

  const saveName = () => {
    if (!profile || draft === null) return;
    const trimmed = draft.trim();
    if (!trimmed) {
      setNameError("Your name can't be empty.");
      setDraft(null);
      return;
    }
    setNameError(null);
    setDraft(null);
    if (trimmed !== profile.displayName) void updateProfile({ displayName: trimmed }).catch(() => {});
  };

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const currency = profile?.defaultCurrency ?? 'USD';
  const formatPreview = `${f.money(exampleMoney(currency))} · ${f.date(useTodayIso())}`;

  return (
    <Screen flush={theme.platform !== 'ios'} testID="settings">
      <View style={styles.gutter}>
        <StorageBar />
      </View>
      <ListSection header="Profile" footer="Your name appears beside what you pay and owe.">
        <View style={styles.fieldRow}>
          <Field label="Name" value={name} onChangeText={setDraft} onBlur={saveName} onSubmitEditing={saveName} error={nameError} autoCapitalize="words" returnKeyType="done" testID="settings-name" />
          {profile?.isSample ? <SampleChip /> : null}
        </View>
        <Row title="Default currency" detail={<Text role="body" color="labelSecondary">{`${currency} · ${nameOf(currency)}`}</Text>} onPress={() => router.push('/settings/currency')} chevron testID="settings-currency" />
        <Row title="Number and date format" subtitle={[formatPreview, 'Follows the system language']} />
      </ListSection>

      <ListSection header="App">
        <Row title="Appearance" subtitle={appearanceSummary(theme.appearance, theme.reduceMotionOverride, theme.confirmWithDialog)} onPress={() => router.push('/settings/appearance')} chevron testID="settings-appearance" />
        <Row title="Privacy" subtitle="Your data stays on this phone" onPress={() => router.push('/settings/privacy')} chevron testID="settings-privacy" />
        <Row title="Your data" subtitle="Export, sample data, delete everything" onPress={() => router.push('/settings/data')} chevron testID="settings-data" />
      </ListSection>

      <ListSection header="Account" footer="There is no account to sign in to yet; this screen explains what that means.">
        <Row title="Sign in" subtitle="Accounts and sync arrive with the online service" onPress={() => router.push('/settings/signin')} chevron testID="settings-signin" />
      </ListSection>

      <ListSection header="About">
        <Row title="Version" detail={<Text role="body" color="labelSecondary" tabular>{version}</Text>} />
        <Row title="Open source on GitHub" subtitle={REPOSITORY_URL.replace('https://', '')} onPress={() => void Linking.openURL(REPOSITORY_URL)} chevron accessibilityHint="Opens in the browser" />
        <Row title="Licences" subtitle="MIT. Mona Sans by GitHub under the SIL Open Font Licence." />
      </ListSection>
    </Screen>
  );
}

function appearanceSummary(appearance: string, reduceMotion: boolean, dialog: boolean): string {
  const parts = [appearance === 'system' ? 'Follows the system' : appearance === 'dark' ? 'Dark' : 'Light'];
  if (reduceMotion) parts.push('reduced motion');
  if (dialog) parts.push('confirm with a dialog');
  return parts.join(' · ');
}

function useTodayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: SPACE.gutter },
  fieldRow: { paddingHorizontal: SPACE.l, paddingVertical: SPACE.m, gap: SPACE.s },
});
