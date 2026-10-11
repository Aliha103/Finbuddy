// apps/mobile/src/app/(tabs)/_layout.web.tsx
// The web preview's tabs: expo-router's JS Tabs with the same four sections (see WebTabs).
import { DataGate } from '@/features/common/DataGate';
import { WebTabs } from '@/features/common/WebTabs';

export default function TabsLayout() {
  return (
    <DataGate>
      <WebTabs />
    </DataGate>
  );
}
