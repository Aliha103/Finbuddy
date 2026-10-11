// apps/mobile/src/features/settings/AppearanceSettings.tsx
// System, Light or Dark; "Reduce motion in FinBuddy" on top of the OS setting; the motor-accessibility
// escape hatch for the Gate; haptics. All app-local, through the theme.
import { StyleSheet, View } from 'react-native';

import { Chip, ChipRow, ListSection, Row, SPACE, Text, Toggle, useTheme, type Appearance } from '@/design';

import { Screen } from '../common/Screen';

const APPEARANCES: { id: Appearance; label: string }[] = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export function AppearanceSettings() {
  const theme = useTheme();
  return (
    <Screen flush={theme.platform !== 'ios'} testID="appearance">
      <View style={styles.gutter}>
        <Text role="headline" accessibilityRole="header">
          Appearance
        </Text>
        <ChipRow label="Appearance">
          {APPEARANCES.map((a) => (
            <Chip key={a.id} label={a.label} selected={theme.appearance === a.id} onPress={() => theme.setAppearance(a.id)} testID={`appearance-${a.id}`} />
          ))}
        </ChipRow>
        <Text role="footnote" color="labelSecondary">
          {theme.appearance === 'system' ? `Following the system: ${theme.scheme} right now.` : `Always ${theme.scheme}, whatever the system uses.`}
        </Text>
      </View>

      <ListSection
        header="Motion and confirmation"
        footer={
          theme.reduceMotion
            ? 'Readouts crossfade instead of rolling and money actions open a confirmation dialog instead of a hold.'
            : 'Money actions are confirmed by holding for a moment while a ring closes. Choose a dialog if holding is hard for you.'
        }
      >
        <Row
          title="Reduce motion in FinBuddy"
          subtitle="On top of the system setting"
          trailing={<Toggle value={theme.reduceMotionOverride} onValueChange={theme.setReduceMotionOverride} accessibilityLabel="Reduce motion in FinBuddy" testID="switch-motion" />}
        />
        <Row
          title="Confirm with a dialog instead of holding"
          trailing={<Toggle value={theme.confirmWithDialog} onValueChange={theme.setConfirmWithDialog} accessibilityLabel="Confirm with a dialog instead of holding" testID="switch-dialog" />}
        />
        <Row title="Haptics" subtitle="A tick on selection, a tap at the start of a hold, success at the gate" trailing={<Toggle value={theme.haptics} onValueChange={theme.setHaptics} accessibilityLabel="Haptics" testID="switch-haptics" />} />
      </ListSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  gutter: { paddingHorizontal: SPACE.gutter, gap: SPACE.m },
});
