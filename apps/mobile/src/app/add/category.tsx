import { router } from 'expo-router';

import { RoutePlaceholder } from '@/features/common/Placeholders';

export default function CategoryPickerRoute() {
  return <RoutePlaceholder title="Category" message="The 15 default categories with their drawn icons; the category name stands in for an empty description." icon="receipt" action={{ label: 'Back', onPress: () => router.back() }} testID="add-category-screen" />;
}
