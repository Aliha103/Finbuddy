// apps/mobile/src/design/Icon.tsx
// One icon component, each OS its native set: SF Symbols on iOS, Material Symbols on Android (the
// font ships inside expo-symbols' dependency, no network). The web preview draws the Material glyph
// from the same bundled font; `fallback` covers a platform with neither. CategoryIcon draws the
// drawn icon for each of the engine's default categories from the same pairs.
import { FALLBACK_CATEGORY_ID, type CategoryId } from '@finbuddy/shared';
import { SymbolView, type SymbolViewProps, type SymbolWeight } from 'expo-symbols';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from './theme';

type Names = Extract<SymbolViewProps['name'], object>;
type SF = NonNullable<Names['ios']>;
type MD = NonNullable<Names['android']>;
type SymbolPair = { readonly ios: SF; readonly android: MD };

/** Verified pairs (typed against sf-symbols-typescript and expo-symbols' Android catalogue). */
export const ICONS = {
  home: { ios: 'house', android: 'home' },
  homeFill: { ios: 'house.fill', android: 'home' },
  groups: { ios: 'person.2', android: 'group' },
  groupsFill: { ios: 'person.2.fill', android: 'group' },
  spending: { ios: 'chart.bar', android: 'bar_chart' },
  spendingFill: { ios: 'chart.bar.fill', android: 'bar_chart' },
  activity: { ios: 'clock', android: 'history' },
  activityFill: { ios: 'clock.fill', android: 'history' },
  add: { ios: 'plus', android: 'add' },
  minus: { ios: 'minus', android: 'remove' },
  check: { ios: 'checkmark', android: 'check' },
  close: { ios: 'xmark', android: 'close' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more' },
  back: { ios: 'chevron.left', android: 'arrow_back' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning' },
  info: { ios: 'info.circle', android: 'info' },
  error: { ios: 'exclamationmark.circle', android: 'error' },
  settle: { ios: 'arrow.left.arrow.right', android: 'swap_horiz' },
  payment: { ios: 'creditcard', android: 'payments' },
  receipt: { ios: 'receipt', android: 'receipt_long' },
  person: { ios: 'person', android: 'person' },
  settings: { ios: 'gearshape', android: 'settings' },
  more: { ios: 'ellipsis', android: 'more_horiz' },
  edit: { ios: 'pencil', android: 'edit' },
  delete: { ios: 'trash', android: 'delete' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  calendar: { ios: 'calendar', android: 'calendar_today' },
  search: { ios: 'magnifyingglass', android: 'search' },
  why: { ios: 'questionmark.circle', android: 'help' },
  owe: { ios: 'arrow.up.right', android: 'north_east' },
  owed: { ios: 'arrow.down.left', android: 'south_west' },
  pending: { ios: 'hourglass', android: 'hourglass_empty' },
  sample: { ios: 'tag', android: 'label' },
  appearance: { ios: 'circle.lefthalf.filled', android: 'contrast' },
  motion: { ios: 'figure.walk.motion', android: 'animation' },
  lock: { ios: 'lock', android: 'lock' },
} as const satisfies Record<string, SymbolPair>;

export type IconName = keyof typeof ICONS;

/** One drawn icon per default category (the engine's DEFAULT_CATEGORIES ids), verified like ICONS. */
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
} as const satisfies Record<string, SymbolPair>;

/** The pair for a category id; a custom or unknown category draws the fallback category's icon. */
export function categoryIconFor(categoryId: CategoryId): SymbolPair {
  return (CATEGORY_ICONS as Record<string, SymbolPair>)[categoryId] ?? CATEGORY_ICONS[FALLBACK_CATEGORY_ID as keyof typeof CATEGORY_ICONS];
}

export interface IconProps {
  name: IconName;
  size?: number;
  /** Explicit colour; defaults to the label colour. */
  color?: string;
  /** iOS symbol weight; Android and the web draw the regular Material weight. */
  weight?: SymbolWeight;
  fallback?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Icon({ name, ...rest }: IconProps) {
  return <Glyph pair={ICONS[name]} {...rest} />;
}

export interface CategoryIconProps extends Omit<IconProps, 'name'> {
  categoryId: CategoryId;
}

/** A category's drawn icon. Decorative unless given an accessibilityLabel: the row names the category. */
export function CategoryIcon({ categoryId, size = 22, ...rest }: CategoryIconProps) {
  return <Glyph pair={categoryIconFor(categoryId)} size={size} {...rest} />;
}

function Glyph({ pair, size = 24, color, weight = 'medium', fallback, style, accessibilityLabel }: Omit<IconProps, 'name'> & { pair: SymbolPair }) {
  const { colors } = useTheme();
  const tint = color ?? colors.label;
  return (
    <View
      style={[styles.box, { width: size, height: size }, style]}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
    >
      <SymbolView
        name={{ ios: pair.ios, android: pair.android, web: pair.android }}
        size={size}
        tintColor={tint}
        weight={weight}
        resizeMode="scaleAspectFit"
        fallback={fallback ?? <View style={[styles.dot, { width: size * 0.3, height: size * 0.3, borderRadius: size * 0.15, backgroundColor: tint }]} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', justifyContent: 'center' },
  dot: {},
});
