import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type AccessibilityRole,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import type { Spoken } from '@/features/common/format';
import { MIN_TOUCH, list, space, textSize, useLargeText, usePalette } from './theme';

/**
 * PREVIEW COMPONENTS. Deliberately plain, platform-like building blocks for the engine preview.
 * They carry no brand decisions and will be replaced by the designed components.
 */

type Variant = keyof typeof textSize;
type Tone = 'primary' | 'secondary' | 'error' | 'onTint';

export function T({ variant = 'body', tone = 'primary', weight, style, ...rest }: TextProps & { variant?: Variant; tone?: Tone; weight?: '400' | '600' | '700' }) {
  const c = usePalette();
  const color = tone === 'secondary' ? c.secondaryLabel : tone === 'error' ? c.error : tone === 'onTint' ? c.onTint : c.label;
  const defaultWeight = variant === 'largeTitle' || variant === 'title' ? '700' : variant === 'headline' ? '600' : '400';
  return <Text {...rest} style={[{ fontSize: textSize[variant], color, fontWeight: weight ?? defaultWeight }, style]} />;
}

/** Text whose screen-reader label reads amounts with their currency names. */
export function SpokenText({ value, ...rest }: Omit<TextProps, 'children'> & { value: Spoken; variant?: Variant; tone?: Tone; weight?: '400' | '600' | '700' }) {
  return (
    <T accessibilityLabel={value.spoken} {...rest}>
      {value.text}
    </T>
  );
}

const asSpoken = (v: string | Spoken): Spoken => (typeof v === 'string' ? { text: v, spoken: v } : v);

/** The persistent preview label. */
export function PreviewBanner() {
  const c = usePalette();
  return (
    <View style={[styles.banner, { backgroundColor: c.banner, borderBottomColor: c.separator }]}>
      <T variant="footnote" weight="600" style={styles.center} accessibilityRole="text">
        Engine preview — sample data — final design in progress
      </T>
    </View>
  );
}

export function SampleTag({ isSample = true }: { isSample?: boolean }) {
  const c = usePalette();
  if (!isSample) return null;
  return (
    <View style={[styles.tag, { borderColor: c.secondaryLabel }]} accessible accessibilityLabel="Sample data">
      <T variant="footnote" tone="secondary" importantForAccessibility="no">
        Sample
      </T>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'outlined',
  disabled,
  accessibilityLabel,
  accessibilityHint,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'outlined' | 'plain';
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const c = usePalette();
  const filled = variant === 'filled';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.button,
        variant === 'plain' ? styles.plainButton : null,
        {
          backgroundColor: filled ? c.tint : pressed ? c.pressed : 'transparent',
          borderColor: variant === 'outlined' ? c.tint : 'transparent',
          opacity: disabled ? 0.45 : pressed && filled ? 0.75 : 1,
        },
        style,
      ]}
    >
      <T tone={filled ? 'onTint' : 'primary'} weight="600" style={styles.center} importantForAccessibility="no">
        {label}
      </T>
    </Pressable>
  );
}

/** A selectable pill. Selection shows as a check mark and weight, not only as colour. */
export function Chip({
  label,
  selected,
  onPress,
  role = 'radio',
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  role?: 'radio' | 'checkbox' | 'tab';
  accessibilityLabel?: string;
}) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={role === 'checkbox' ? { checked: selected } : { selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: selected ? c.tint : c.separator, backgroundColor: selected ? c.tint : pressed ? c.pressed : c.surface },
      ]}
    >
      <T variant="subhead" tone={selected ? 'onTint' : 'primary'} weight={selected ? '700' : '400'} importantForAccessibility="no">
        {selected ? `✓ ${label}` : label}
      </T>
    </Pressable>
  );
}

export function ChipRow({ children, label, role = 'radiogroup' }: { children: ReactNode; label?: string; role?: AccessibilityRole }) {
  return (
    <View style={styles.chipRow} accessibilityRole={role} accessibilityLabel={label}>
      {children}
    </View>
  );
}

/** A header bar for screens pushed on a stack: back button and title. */
export function BackBar({ label, onBack }: { label: string; onBack: () => void }) {
  const c = usePalette();
  return (
    <View style={[styles.backBar, { borderBottomColor: c.separator }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Back to ${label}`}
        onPress={onBack}
        hitSlop={8}
        style={({ pressed }) => [styles.backButton, { backgroundColor: pressed ? c.pressed : 'transparent' }]}
      >
        <T weight="600" importantForAccessibility="no">
          ‹ {label}
        </T>
      </Pressable>
    </View>
  );
}

/** A scrolling screen with a large title and an optional action beside it. */
export function Screen({
  title,
  back,
  action,
  intro,
  children,
}: {
  title: string;
  back?: { label: string; onPress: () => void };
  action?: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View style={styles.flex}>
      {back ? <BackBar label={back.label} onBack={back.onPress} /> : null}
      <ScrollView style={styles.flex} contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
        <View style={styles.titleRow}>
          <T variant={back ? 'title' : 'largeTitle'} accessibilityRole="header" style={styles.shrink}>
            {title}
          </T>
          {action}
        </View>
        {intro ? <View style={styles.intro}>{intro}</View> : null}
        {children}
      </ScrollView>
    </View>
  );
}

/** A grouped list section in the platform's style. */
export function Section({ title, footer, children }: { title?: string; footer?: ReactNode; children: ReactNode }) {
  const c = usePalette();
  // toArray already drops null, undefined and booleans, so separators only go between real rows.
  const items = Children.toArray(children);
  return (
    <View style={styles.section}>
      {title ? (
        <T variant="footnote" tone="secondary" weight={list.headerUppercase ? '400' : '600'} accessibilityRole="header" style={[styles.sectionTitle, list.headerUppercase ? styles.upper : null]}>
          {title}
        </T>
      ) : null}
      <View style={[styles.sectionBody, { backgroundColor: c.surface, borderColor: c.separator }]}>
        {items.map((child, i) => (
          <Fragment key={isValidElement(child) && child.key !== null ? child.key : i}>
            {i > 0 ? <View style={[styles.separator, { backgroundColor: c.separator }]} /> : null}
            {child}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <View style={styles.sectionFooter}>{typeof footer === 'string' ? <T variant="footnote" tone="secondary">{footer}</T> : footer}</View>
      ) : null}
    </View>
  );
}

/**
 * One list row. Read as a single item by screen readers unless it holds its own controls.
 * Side-by-side detail text moves under the title at large text sizes.
 */
export function Row({
  title,
  subtitle,
  detail,
  onPress,
  hint,
  children,
  sample,
  titleWeight,
}: {
  title: string | Spoken;
  subtitle?: string | Spoken | (string | Spoken)[];
  detail?: string | Spoken;
  onPress?: () => void;
  hint?: string;
  children?: ReactNode;
  /** Shows the "Sample" label (sample records must always be labelled). */
  sample?: boolean;
  titleWeight?: '400' | '600' | '700';
}) {
  const c = usePalette();
  const large = useLargeText();
  const t = asSpoken(title);
  const subs = (Array.isArray(subtitle) ? subtitle : subtitle ? [subtitle] : []).map(asSpoken);
  const d = detail ? asSpoken(detail) : null;
  const label = [t.spoken, d?.spoken, ...subs.map((s) => s.spoken), sample ? 'Sample data' : null].filter(Boolean).join('. ');
  const body = (
    <>
      <View style={[styles.rowMain, large ? styles.rowStack : null]}>
        <View style={styles.rowText}>
          <T weight={titleWeight ?? '400'}>{t.text}</T>
          {subs.map((s, i) => (
            <T key={i} variant="subhead" tone="secondary">
              {s.text}
            </T>
          ))}
        </View>
        {d ? (
          <T weight="600" style={large ? null : styles.detail}>
            {d.text}
          </T>
        ) : null}
        {onPress ? (
          <T tone="secondary" importantForAccessibility="no" style={styles.chevron}>
            ›
          </T>
        ) : null}
      </View>
      {sample ? <SampleTag /> : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        onPress={onPress}
        style={({ pressed }) => [styles.row, { backgroundColor: pressed ? c.pressed : 'transparent' }]}
      >
        {body}
        {children}
      </Pressable>
    );
  }
  if (children) {
    return (
      <View style={styles.row}>
        <View accessible accessibilityLabel={label}>
          {body}
        </View>
        {children}
      </View>
    );
  }
  return (
    <View style={styles.row} accessible accessibilityLabel={label}>
      {body}
    </View>
  );
}

/** Body text inside a section, for messages and empty states. */
export function Note({ children, tone = 'secondary', live }: { children: ReactNode; tone?: Tone; live?: boolean }) {
  return (
    <View style={styles.row}>
      <T tone={tone} accessibilityLiveRegion={live ? 'polite' : undefined}>
        {children}
      </T>
    </View>
  );
}

/** A plain horizontal bar, decorative only: the row's text carries the value. */
export function Bar({ fraction }: { fraction: number }) {
  const c = usePalette();
  const pct = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
  return (
    <View style={[styles.barTrack, { backgroundColor: c.track }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: c.tint, minWidth: pct > 0 ? 2 : 0 }]} />
    </View>
  );
}

/** A labelled text field with its validation message underneath. */
export function Field({
  label,
  error,
  hint,
  prefix,
  inputStyle,
  ...input
}: TextInputProps & { label: string; error?: string | null; hint?: string; prefix?: string; inputStyle?: StyleProp<TextStyle> }) {
  const c = usePalette();
  return (
    <View style={styles.field}>
      <T variant="subhead" weight="600" importantForAccessibility="no">
        {label}
      </T>
      <View style={[styles.inputWrap, { backgroundColor: c.input, borderColor: error ? c.error : c.separator }]}>
        {prefix ? (
          <T tone="secondary" importantForAccessibility="no">
            {prefix}
          </T>
        ) : null}
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={c.secondaryLabel}
          {...input}
          style={[styles.input, { color: c.label }, inputStyle]}
        />
      </View>
      {error ? (
        <T variant="subhead" tone="error" accessibilityLiveRegion="polite">
          {`Check: ${error}`}
        </T>
      ) : hint ? (
        <T variant="footnote" tone="secondary">
          {hint}
        </T>
      ) : null}
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <T variant="subhead" tone="error" accessibilityLiveRegion="polite">
      {children}
    </T>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  shrink: { flexShrink: 1 },
  center: { textAlign: 'center' },
  upper: { textTransform: 'uppercase' },
  banner: { paddingVertical: space.s, paddingHorizontal: space.l, borderBottomWidth: StyleSheet.hairlineWidth },
  tag: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  button: { minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, paddingHorizontal: space.l, paddingVertical: space.s, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  plainButton: { borderWidth: 0, paddingHorizontal: space.m },
  chip: { minHeight: MIN_TOUCH, paddingHorizontal: space.m, paddingVertical: space.s, borderRadius: 22, borderWidth: 1, justifyContent: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.s },
  backBar: { borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.s },
  backButton: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: space.s, alignSelf: 'flex-start', borderRadius: 8 },
  screenContent: { paddingBottom: 40 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: space.m, paddingHorizontal: list.inset + space.xs, paddingTop: space.l },
  intro: { paddingHorizontal: list.inset + space.xs, paddingTop: space.s, gap: space.s },
  section: { marginTop: space.xl },
  sectionTitle: { marginHorizontal: list.inset + space.l, marginBottom: space.s - 2 },
  sectionBody: {
    marginHorizontal: list.inset,
    borderRadius: list.radius,
    overflow: 'hidden',
    borderTopWidth: Platform.OS === 'android' ? StyleSheet.hairlineWidth : 0,
    borderBottomWidth: Platform.OS === 'android' ? StyleSheet.hairlineWidth : 0,
  },
  sectionFooter: { marginHorizontal: list.inset + space.l, marginTop: space.s - 2 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: space.l },
  row: { minHeight: MIN_TOUCH, paddingHorizontal: space.l, paddingVertical: space.m - 2, justifyContent: 'center', gap: space.s },
  rowMain: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  rowStack: { flexDirection: 'column', alignItems: 'flex-start', gap: space.xs },
  rowText: { flexShrink: 1, flexGrow: 1, gap: 2 },
  detail: { textAlign: 'right', flexShrink: 0, maxWidth: '50%' },
  chevron: { fontSize: textSize.title },
  barTrack: { height: 10, borderRadius: 5, overflow: 'hidden', width: '100%' },
  barFill: { height: '100%', borderRadius: 5 },
  field: { gap: space.xs + 2 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: space.s, borderWidth: 1, borderRadius: 8, paddingHorizontal: space.m },
  input: { flex: 1, minHeight: MIN_TOUCH, fontSize: Math.max(16, textSize.body), paddingVertical: space.s },
});
