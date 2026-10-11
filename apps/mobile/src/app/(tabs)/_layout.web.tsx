// apps/mobile/src/app/(tabs)/_layout.web.tsx
// The web preview's tabs: expo-router's JS Tabs with the same four sections (see WebTabs). Each
// screen shows its own skeleton while the store loads; only a failed load replaces the tabs.
import { DataErrorGate } from '@/features/common/DataGate';
import { WebTabs } from '@/features/common/WebTabs';

export default function TabsLayout() {
  return (
    <DataErrorGate>
      <WebTabs />
    </DataErrorGate>
  );
}
