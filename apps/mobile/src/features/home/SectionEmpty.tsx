// apps/mobile/src/features/home/SectionEmpty.tsx
// A section's empty state on Home: a surface card with the fact in a headline, one sentence, and
// at most one quiet action. Smaller than the screen-level EmptyState, so Home keeps its rhythm.
import { StyleSheet, View } from 'react-native';

import { Button, Card, SPACE, Text, type IconName } from '@/design';

export interface SectionEmptyProps {
  title: string;
  message: string;
  action?: { label: string; onPress: () => void; icon?: IconName };
  testID?: string;
}

export function SectionEmpty({ title, message, action, testID }: SectionEmptyProps) {
  return (
    <Card testID={testID}>
      <View style={styles.body} accessibilityRole="summary">
        <Text role="headline">{title}</Text>
        <Text role="subhead" color="labelSecondary">
          {message}
        </Text>
        {action ? <Button label={action.label} icon={action.icon} variant="tonal" onPress={action.onPress} style={styles.action} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  body: { gap: SPACE.xs },
  action: { marginTop: SPACE.s },
});
