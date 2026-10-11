// apps/mobile/src/features/common/EmptyState.tsx
// A titled empty state: what this screen holds and the one action that fills it. Used by every
// screen's empty case, and by the routes that are not built yet so navigation works end to end.
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Icon, SPACE, Text, useTheme, type IconName } from '@/design';

export interface EmptyStateProps {
  title: string;
  message: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void; icon?: IconName };
  secondary?: { label: string; onPress: () => void };
  /** A footnote under the actions (a fact about the data, never a disclaimer for its own sake). */
  footnote?: string;
  children?: ReactNode;
  testID?: string;
}

export function EmptyState({ title, message, icon, action, secondary, footnote, children, testID }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.box} testID={testID} accessibilityRole="summary">
      {icon ? (
        <View style={[styles.tile, { backgroundColor: colors.tintWash }]}>
          <Icon name={icon} size={28} color={colors.onTintWash} />
        </View>
      ) : null}
      <Text role="title" accessibilityRole="header">
        {title}
      </Text>
      <Text role="body" color="labelSecondary" style={styles.measure}>
        {message}
      </Text>
      {children}
      {action || secondary ? (
        <View style={styles.actions}>
          {action ? <Button label={action.label} icon={action.icon} onPress={action.onPress} /> : null}
          {secondary ? <Button label={secondary.label} variant="tonal" onPress={secondary.onPress} /> : null}
        </View>
      ) : null}
      {footnote ? (
        <Text role="footnote" color="labelTertiary" style={styles.measure}>
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: SPACE.m, paddingVertical: SPACE.xl },
  tile: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.xs },
  measure: { maxWidth: 520 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.s, marginTop: SPACE.xs },
});
