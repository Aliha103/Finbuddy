import { useLocalSearchParams } from 'expo-router';

import { InsightDetailScreen } from '@/features/insights/InsightDetailScreen';

export default function InsightDetailRoute() {
  const { insightId = '' } = useLocalSearchParams<{ insightId: string }>();
  return <InsightDetailScreen insightId={insightId} />;
}
