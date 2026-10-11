import { router, useLocalSearchParams } from 'expo-router';

import { useGroup } from '@/data';
import { RoutePlaceholder } from '@/features/common/Placeholders';
import { ListSection, Row } from '@/design';

export default function AddExpenseRoute() {
  const { groupId } = useLocalSearchParams<{ groupId?: string }>();
  const group = useGroup(groupId ?? '');
  return (
    <RoutePlaceholder
      title="Add expense"
      message={`${group ? `For ${group.group.name.replace(/ \(sample\)$/, '')}: ` : ''}the amount with its currency, who paid, how it is split, a category and the date. The keypad is up as the sheet opens.`}
      icon="add"
      testID="add-expense"
    >
      <ListSection header="In this sheet">
        <Row title="Split" subtitle="Equally, Exact, Percent, Shares, Adjust" onPress={() => router.push('/add/split')} chevron testID="add-split" />
        <Row title="Paid by" subtitle="You, someone else, or several people" onPress={() => router.push('/add/payers')} chevron testID="add-payers" />
        <Row title="Currency" subtitle="Search by code or name; minor units shown" onPress={() => router.push('/add/currency')} chevron testID="add-currency" />
        <Row title="Category" subtitle="15 defaults with drawn icons" onPress={() => router.push('/add/category')} chevron testID="add-category" />
      </ListSection>
    </RoutePlaceholder>
  );
}
