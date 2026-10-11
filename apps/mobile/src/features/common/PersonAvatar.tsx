// apps/mobile/src/features/common/PersonAvatar.tsx
// A person's initials on a disc. In a split it wears the person's share colour; elsewhere
// the tint wash. Decorative: the row beside it carries the name.
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text, useTheme } from '@/design';

export function initialsOf(name: string): string {
  const words = name
    .replace(/\(.*?\)/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const first = words[0]?.charAt(0) ?? '';
  const second = words.length > 1 ? (words[words.length - 1]?.charAt(0) ?? '') : '';
  return (first + second).toUpperCase() || '?';
}

export interface PersonAvatarProps {
  name: string;
  size?: number;
  fill?: string;
  on?: string;
  style?: StyleProp<ViewStyle>;
}

export function PersonAvatar({ name, size = 28, fill, on, style }: PersonAvatarProps) {
  const { colors } = useTheme();
  const background = fill ?? colors.tintWash;
  const color = on ?? colors.onTintWash;
  const initials = initialsOf(name);
  return (
    <View style={[styles.disc, { width: size, height: size, borderRadius: size / 2, backgroundColor: background }, style]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Text role="caption" style={{ color, fontWeight: '700', fontSize: Math.max(10, Math.round(size * (initials.length > 1 ? 0.38 : 0.46))), lineHeight: size }} allowFontScaling={false}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
