import { useLocalSearchParams } from 'expo-router';

import { GroupDetail } from '@/features/groups/GroupDetail';

export default function GroupDetailRoute() {
  const { groupId = '' } = useLocalSearchParams<{ groupId: string }>();
  return <GroupDetail groupId={groupId} />;
}
