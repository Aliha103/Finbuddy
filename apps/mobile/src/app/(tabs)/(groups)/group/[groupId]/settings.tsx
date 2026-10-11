import { useLocalSearchParams } from 'expo-router';

import { GroupSettings } from '@/features/groups/GroupSettings';

export default function GroupSettingsRoute() {
  const { groupId = '' } = useLocalSearchParams<{ groupId: string }>();
  return <GroupSettings groupId={groupId} />;
}
