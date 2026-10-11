// apps/mobile/src/features/insights/InsightRow.tsx
// One insight as a list row: the severity in words (then its icon and colour), the title, the
// filled sentence, any context line, and, where the list allows it, a "Why" disclosure that expands
// the basis rows inline. The row itself opens the detail screen.
import type { Insight } from '@finbuddy/shared';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button, Icon, SPACE, Text, useTheme } from '@/design';
import type { Formatter } from '@/features/common/format';

import { BasisRows, useBasisMotion } from './Basis';
import { insightCopy, severityLabel } from './copy';
import { severityStyle } from './severity';

export interface InsightRowProps {
  insight: Insight;
  f: Formatter;
  onPress?: () => void;
  /** Shows the inline "Why am I seeing this" disclosure. */
  expandable?: boolean;
  /** A trailing control (Restore on a dismissed row). */
  trailing?: React.ReactNode;
  testID?: string;
}

export function InsightRow({ insight, f, onPress, expandable, trailing, testID }: InsightRowProps) {
  const theme = useTheme();
  const c = theme.colors;
  const copy = insightCopy(f, insight);
  const sev = severityStyle(insight.severity, c);
  const [open, setOpen] = useState(false);
  const { layout } = useBasisMotion();
  const chevron = !!onPress && theme.platform === 'ios';

  const content = (
    <View style={[styles.row, { minHeight: theme.minTouch }]}>
      <View style={styles.leading}>
        <Icon name={sev.icon} size={22} color={sev.color} />
      </View>
      <View style={styles.text}>
        <Text role="caption" style={[styles.severity, { color: sev.color }]}>
          {severityLabel(insight.severity)}
        </Text>
        <Text role="headline" color="label">
          {copy.title}
        </Text>
        <Text role="subhead" color="labelSecondary" accessibilityLabel={copy.body.spoken}>
          {copy.body.text}
        </Text>
        {copy.context.map((line, i) => (
          <Text key={i} role="footnote" color="labelTertiary" accessibilityLabel={line.spoken}>
            {line.text}
          </Text>
        ))}
        {expandable ? (
          <View style={styles.why}>
            <Button
              label={open ? 'Hide why' : 'Why am I seeing this'}
              icon={open ? 'chevronDown' : 'why'}
              variant="plain"
              onPress={() => setOpen((o) => !o)}
              accessibilityHint={open ? 'Hides the numbers behind this insight' : 'Shows the numbers behind this insight'}
              testID={testID ? `${testID}-why` : undefined}
            />
          </View>
        ) : null}
      </View>
      {trailing}
      {chevron ? <Icon name="chevronRight" size={16} color={c.labelTertiary} /> : null}
    </View>
  );

  return (
    <Animated.View layout={layout} testID={testID}>
      {onPress ? (
        <Pressable accessibilityRole="button" accessibilityHint="Opens the insight" onPress={onPress} style={({ pressed }) => [styles.base, pressed && { backgroundColor: c.pressed }]}>
          {content}
        </Pressable>
      ) : (
        <View style={styles.base}>{content}</View>
      )}
      {expandable && open ? (
        <Animated.View layout={layout} style={[styles.basis, { backgroundColor: c.surfaceAlt }]}>
          <BasisRows insight={insight} f={f} testID={testID ? `${testID}-basis` : undefined} />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: SPACE.l, paddingVertical: SPACE.m },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACE.m },
  leading: { minWidth: 28, alignItems: 'center', paddingTop: 2 },
  text: { flex: 1, gap: 2 },
  severity: { fontWeight: '600', letterSpacing: 0.2 },
  why: { marginLeft: -SPACE.xl, alignSelf: 'flex-start' },
  basis: { marginHorizontal: SPACE.l, marginBottom: SPACE.m, borderRadius: 10, overflow: 'hidden' },
});
