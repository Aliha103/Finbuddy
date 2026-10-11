// apps/mobile/src/features/expense/components/CategoryIcon.tsx
// One drawn icon per default category, native on each OS: SF Symbols on iOS, Material Symbols on
// Android and the web preview (both verified against expo-symbols' typings and catalogue). Mirrors
// the design system's Icon; the pairs belong in design/Icon.tsx once the design system takes them.
import { FALLBACK_CATEGORY_ID, type CategoryId } from '@finbuddy/shared';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/design';

type Names = Extract<SymbolViewProps['name'], object>;
type SF = NonNullable<Names['ios']>;
type MD = NonNullable<Names['android']>;

export const CATEGORY_ICONS = {
  food: { ios: 'fork.knife', android: 'restaurant' },
  groceries: { ios: 'cart', android: 'shopping_cart' },
  transport: { ios: 'bus', android: 'directions_bus' },
  housing: { ios: 'house', android: 'home' },
  utilities: { ios: 'bolt', android: 'bolt' },
  entertainment: { ios: 'ticket', android: 'confirmation_number' },
  shopping: { ios: 'bag', android: 'shopping_bag' },
  travel: { ios: 'airplane', android: 'flight' },
  healthcare: { ios: 'cross.case', android: 'medical_services' },
  education: { ios: 'book', android: 'school' },
  personal_care: { ios: 'scissors', android: 'content_cut' },
  subscriptions: { ios: 'arrow.triangle.2.circlepath', android: 'autorenew' },
  gifts: { ios: 'gift', android: 'redeem' },
  fees: { ios: 'percent', android: 'percent' },
  other: { ios: 'ellipsis.circle', android: 'more_horiz' },
} as const satisfies Record<string, { ios: SF; android: MD }>;

function pairFor(categoryId: CategoryId): { ios: SF; android: MD } {
  return (CATEGORY_ICONS as Record<string, { ios: SF; android: MD }>)[categoryId] ?? CATEGORY_ICONS[FALLBACK_CATEGORY_ID as keyof typeof CATEGORY_ICONS];
}

export interface CategoryIconProps {
  categoryId: CategoryId;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function CategoryIcon({ categoryId, size = 22, color, style }: CategoryIconProps) {
  const { colors } = useTheme();
  const pair = pairFor(categoryId);
  const tint = color ?? colors.label;
  return (
    <View style={[styles.box, { width: size, height: size }, style]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <SymbolView
        name={{ ios: pair.ios, android: pair.android, web: pair.android }}
        size={size}
        tintColor={tint}
        weight="medium"
        resizeMode="scaleAspectFit"
        fallback={<View style={{ width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15, backgroundColor: tint }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
});
