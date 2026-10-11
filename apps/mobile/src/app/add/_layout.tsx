// apps/mobile/src/app/add/_layout.tsx
// Add expense: a stack inside the sheet (iOS) or the full-screen dialog (Android). Close on the
// leading side, Save on the trailing side; the split editor, payers, currency and category push.
import { Stack, router } from 'expo-router';
import { Platform } from 'react-native';

import { HeaderButton } from '@/features/common/HeaderButton';
import { useStackOptions } from '@/features/common/navigation';

export default function AddLayout() {
  const options = useStackOptions();
  const ios = Platform.OS === 'ios';
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <Stack screenOptions={{ ...options, headerStyle: undefined, headerLargeStyle: undefined }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Add expense',
          headerLeft: () => (ios ? <HeaderButton label="Cancel" onPress={close} testID="add-cancel" /> : <HeaderButton label="Close" icon="close" onPress={close} testID="add-cancel" />),
          headerRight: () => <HeaderButton label="Save" emphasis disabled onPress={() => {}} testID="add-save" />,
        }}
      />
      <Stack.Screen name="split" options={{ title: 'Split' }} />
      <Stack.Screen name="payers" options={{ title: 'Paid by' }} />
      <Stack.Screen name="currency" options={{ title: 'Currency' }} />
      <Stack.Screen name="category" options={{ title: 'Category' }} />
    </Stack>
  );
}
