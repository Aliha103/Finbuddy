import { router } from 'expo-router';

import { RoutePlaceholder } from '@/features/common/Placeholders';
import { SPLIT_METHODS } from '@/features/expense/form';

export default function SplitRoute() {
  return (
    <RoutePlaceholder
      title="Split"
      message={`${SPLIT_METHODS.map((m) => m.label).join(', ')}: one bar in the group's colour divided into each person's share, draggable in Exact mode, with the running total from the engine.`}
      icon="settle"
      action={{ label: 'Back', onPress: () => router.back() }}
      testID="split"
    />
  );
}
