// apps/mobile/src/design/Row.tsx
// List rows and their groups. iOS: inset grouped lists with hairline separators and uppercase
// headers. Material: full-width items on surface with titleSmall group titles. A row whose detail
// is a readout stacks the detail under the title at large text sizes.
import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon } from './Icon';
import { SampleChip } from './SampleChip';
import { Text } from './Text';
import { useTheme } from './theme';
import { RADIUS, SPACE } from './tokens';

export interface RowProps {
  title: string;
  /** Spoken form when the title carries amounts (currency names). */
  titleSpoken?: string;
  subtitle?: string | readonly string[];
  /** The trailing value: a string (set in readoutS) or any element (a Readout, a Chip, a switch). */
  detail?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityHint?: string;
  /** Shows a chevron (iOS convention for navigation rows). Default: when onPress is set, on iOS only. */
  chevron?: boolean;
  sample?: boolean;
  /**
   * Caps the subtitle at this many lines. Default: no cap. Titles and subtitles carry amounts
   * ("You paid US$198.50 · your share US$49.63"), and an amount is never truncated, at any text size.
   */
  lines?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Row({ title, titleSpoken, subtitle, detail, leading, trailing, onPress, accessibilityHint, chevron, sample, lines, style, testID }: RowProps) {
  const theme = useTheme();
  const c = theme.colors;
  const showChevron = chevron ?? (!!onPress && theme.platform === 'ios');
  const stacked = theme.largeText && detail !== undefined;
  const subtitles = subtitle === undefined ? [] : typeof subtitle === 'string' ? [subtitle] : subtitle;
  const detailNode = typeof detail === 'string' ? (
    <Text role="readoutS" color="label" align={stacked ? 'left' : 'right'} numberOfLines={1}>
      {detail}
    </Text>
  ) : (
    detail
  );

  const content = (
    <View style={[styles.row, { minHeight: theme.minTouch }, stacked && styles.stacked]}>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.text}>
        <View style={styles.titleLine}>
          <Text role="body" color="label" accessibilityLabel={titleSpoken} style={styles.title}>
            {title}
          </Text>
          {sample ? <SampleChip /> : null}
        </View>
        {subtitles.map((s, i) => (
          <Text key={i} role="subhead" color="labelSecondary" numberOfLines={lines}>
            {s}
          </Text>
        ))}
        {stacked && detailNode ? <View style={styles.stackedDetail}>{detailNode}</View> : null}
      </View>
      {!stacked && detailNode ? <View style={styles.detail}>{detailNode}</View> : null}
      {trailing}
      {showChevron ? <Icon name="chevronRight" size={16} color={c.labelTertiary} /> : null}
    </View>
  );

  if (!onPress) {
    return (
      <View style={[styles.base, style]} testID={testID}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.base, pressed && { backgroundColor: c.pressed }, style]}
    >
      {content}
    </Pressable>
  );
}

export interface ListSectionProps {
  header?: string;
  footer?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** A group of rows with hairline separators: inset grouped on iOS, full-width on Material. */
export function ListSection({ header, footer, children, style }: ListSectionProps) {
  const theme = useTheme();
  const c = theme.colors;
  const ios = theme.platform === 'ios';
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View style={[styles.section, ios ? styles.sectionInset : null, style]}>
      {header ? (
        <Text role={ios ? 'footnote' : 'subhead'} color="labelSecondary" style={[styles.header, ios ? styles.headerUpper : null]} accessibilityRole="header">
          {ios ? header.toUpperCase() : header}
        </Text>
      ) : null}
      <View style={[styles.group, { backgroundColor: c.surface }, ios ? styles.groupInset : null]}>
        {rows.map((row, i) => (
          <Fragment key={row.key ?? i}>
            {i > 0 ? <View style={[styles.separator, { backgroundColor: c.separator }]} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <Text role="footnote" color="labelSecondary" style={styles.footer}>
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: SPACE.l, paddingVertical: SPACE.m },
  row: { flexDirection: 'row', alignItems: 'center', gap: SPACE.m },
  stacked: { alignItems: 'flex-start' },
  leading: { alignItems: 'center', justifyContent: 'center', minWidth: 28 },
  text: { flex: 1, gap: 2 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s, flexWrap: 'wrap' },
  title: { flexShrink: 1 },
  detail: { maxWidth: '55%', alignItems: 'flex-end' },
  stackedDetail: { marginTop: SPACE.xs, alignSelf: 'stretch' },
  section: { gap: SPACE.s },
  sectionInset: { paddingHorizontal: SPACE.gutter },
  header: { paddingHorizontal: SPACE.l },
  headerUpper: { letterSpacing: 0.4 },
  group: { overflow: 'hidden' },
  groupInset: { borderRadius: RADIUS.row },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: SPACE.l },
  footer: { paddingHorizontal: SPACE.l },
});
