// apps/mobile/src/features/expense/components/SplitBar.tsx
// The split bar (DIRECTION.md section 5, with a009's Exact Bar grafted in): one bar in the group's
// line colour, a segment per person at full and reduced strength, and a hatched remainder while
// the amounts do not reach the total. In Exact mode the boundaries drag: a Pan gesture (active
// after 6 points sideways, failing after 12 points vertical so the screen still scrolls) turns
// finger travel into whole minor units on the UI thread, moves them between the two neighbours
// (each clamped at zero), snaps to whole major units, ticks once per unit and gives a selection
// haptic when a share reaches zero. The labels under the bar follow the drag through animated
// props on read-only TextInputs, formatted by a worklet; on release the parts go back to the form,
// so evaluate() and the engine's validateSplit decide what is saved. Each segment is an adjustable
// accessibility element with increment and decrement actions. Beyond 8 people entry is numeric only.
import { formatMoney, minorUnits, type CurrencyCode, type PersonId } from '@finbuddy/shared';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text as RNText, TextInput, View, type AccessibilityActionEvent, type TextInputProps, type TextStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { FONT, RADIUS, SPACE, TIMING, Text, bestOn, fireHaptic, lineSwatch, readoutFamilyFor, readoutWeightFor, scaledType, useTheme, type HapticKind, type LineColor } from '@/design';
import { PersonAvatar } from '@/features/common/PersonAvatar';

import { adjustShare, dragStep, formatMinorWorklet, moneyFormatSpec, moveBoundary, shareColour, snapBoundary, type MoneyFormatSpec } from '../splitMath';
import { Hatch } from './Hatch';

/** Beyond this many people the boundaries are too close to drag; amounts are typed instead. */
export const MAX_DRAG_PEOPLE = 8;

const BAR_HEIGHT = 28;
const TRACK_HEIGHT = 44;
const HANDLE_HIT = 44;
const INK = '#1A1420';

export interface SplitBarPerson {
  readonly id: PersonId;
  readonly name: string;
  readonly amountMinor: number;
  /** Takes one of the leftover minor units (the "+1" tick). */
  readonly remainder?: boolean;
  /** Left out of an equal or adjusted split. */
  readonly excluded?: boolean;
}

export interface SplitBarProps {
  people: readonly SplitBarPerson[];
  /** The expense total in minor units; null while the amount is not valid. */
  totalMinor: number | null;
  currency: CurrencyCode;
  locale: string;
  line: LineColor;
  /** Exact mode: the boundaries can be dragged (up to MAX_DRAG_PEOPLE people). */
  draggable?: boolean;
  /** Called on release (and on an accessibility increment) with every person's new amount, in order. */
  onCommit?: (parts: number[]) => void;
  /** Told when a drag starts and ends, so anything computed from the last saved state can step aside. */
  onDragChange?: (dragging: boolean) => void;
  /** The avatars and live amounts under the bar (off where rows below already list the shares). */
  legend?: boolean;
  testID?: string;
}

export function SplitBar({ people, totalMinor, currency, locale, line, draggable = false, onCommit, onDragChange, legend = true, testID }: SplitBarProps) {
  const theme = useTheme();
  const c = theme.colors;
  const amounts = people.map((p) => Math.max(0, Math.round(p.amountMinor)));
  const assigned = amounts.reduce((a, b) => a + b, 0);
  const total = totalMinor ?? assigned;
  const denominator = Math.max(total, assigned);
  const overMinor = totalMinor !== null && assigned > totalMinor ? assigned - totalMinor : 0;
  const remainderMinor = totalMinor !== null && totalMinor > assigned ? totalMinor - assigned : 0;
  const decimals = minorUnits(currency);
  const tooMany = people.length > MAX_DRAG_PEOPLE;
  const canDrag = draggable && !tooMany && totalMinor !== null && totalMinor > 0 && people.length > 1 && !!onCommit;

  const [width, setWidth] = useState(0);
  // While a finger moves money the "+1" ticks describe the old split, so they step aside until release.
  const [dragging, setDragging] = useState(false);
  const dragChange = (next: boolean) => {
    setDragging(next);
    onDragChange?.(next);
  };
  const parts = useSharedValue<number[]>(amounts);
  const start = useSharedValue<number[]>(amounts);
  const denom = useSharedValue(denominator);
  const barWidth = useSharedValue(0);

  // Engine-driven changes ease into place (snap under Reduce Motion); drags write `parts` directly.
  const key = amounts.join(',');
  useEffect(() => {
    const next = key === '' ? [] : key.split(',').map(Number);
    denom.set(denominator);
    if (parts.get().length !== next.length || theme.reduceMotion) parts.set(next);
    else parts.set(withTiming(next, TIMING.standard));
  }, [key, denominator, theme.reduceMotion, parts, denom]);

  const spec = useMemo(() => moneyFormatSpec(currency, locale), [currency, locale]);
  const step = dragStep(decimals, denominator, width);
  const unit = 10 ** decimals;
  const lineFill = lineSwatch(line, theme.scheme).fill;
  const colours = people.map((_, i) => shareColour(lineFill, i, theme.scheme));
  const money = (minor: number) => formatMoney({ amountMinor: minor, currency }, { locale });
  const spoken = (minor: number) => formatMoney({ amountMinor: minor, currency }, { locale, currencyDisplay: 'name' });
  // The widest label any share can show, so the live labels never clip as they change.
  const sizer = money(Math.max(total, ...amounts, 0));

  const commit = (next: number[]) => onCommit?.(next);
  const accessibilityAction = (index: number) => (event: AccessibilityActionEvent) => {
    const name = event.nativeEvent.actionName;
    if (name !== 'increment' && name !== 'decrement') return;
    const next = adjustShare(amounts, index, name === 'increment' ? unit : -unit);
    fireHaptic('select', theme.haptics);
    commit(next);
  };

  return (
    <View style={styles.box} testID={testID}>
      <View
        style={styles.track}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          setWidth(w);
          barWidth.set(w);
        }}
      >
        <View style={[styles.bar, { backgroundColor: c.fill }]} accessibilityRole={canDrag ? undefined : 'image'} accessible={!canDrag} accessibilityLabel={canDrag ? undefined : barSummary(people, amounts, remainderMinor, spoken)}>
          {people.map((p, i) => (
            <Segment key={p.id} index={i} parts={parts} denom={denom} barWidth={barWidth} color={colours[i] ?? lineFill} />
          ))}
          {remainderMinor > 0 && width > 0 ? <Remainder parts={parts} denom={denom} barWidth={barWidth} width={width} stripe={c.labelTertiary} ground={c.surfaceAlt} testID={testID ? `${testID}-remainder` : undefined} /> : null}
          {!canDrag ? people.slice(0, -1).map((p, i) => <Separator key={`sep-${p.id}`} index={i} parts={parts} denom={denom} barWidth={barWidth} color={c.surface} />) : null}
          {overMinor > 0 && width > 0 && totalMinor !== null ? (
            <View pointerEvents="none" style={[styles.over, { left: (totalMinor / denominator) * width }]}>
              <Hatch width={width} height={BAR_HEIGHT} stripe={c.danger} ground={c.dangerWash} gap={5} />
            </View>
          ) : null}
        </View>
        {overMinor > 0 && width > 0 && totalMinor !== null ? <View pointerEvents="none" style={[styles.overMarker, { left: (totalMinor / denominator) * width - 1, backgroundColor: c.danger }]} /> : null}
        {canDrag
          ? people.map((p, i) => (
              <SegmentTarget
                key={`target-${p.id}`}
                index={i}
                parts={parts}
                denom={denom}
                barWidth={barWidth}
                label={`${p.name}, ${spoken(amounts[i] ?? 0)}`}
                onAction={accessibilityAction(i)}
                testID={testID ? `${testID}-segment-${i}` : undefined}
              />
            ))
          : null}
        {canDrag
          ? people.slice(0, -1).map((p, i) => (
              <BoundaryHandle
                key={`handle-${p.id}`}
                index={i}
                parts={parts}
                start={start}
                denom={denom}
                barWidth={barWidth}
                step={step}
                haptics={theme.haptics}
                onCommit={commit}
                onDragChange={dragChange}
                pill={c.surface}
                edge={c.label}
                testID={testID ? `${testID}-handle-${i}` : undefined}
              />
            ))
          : null}
      </View>

      {legend ? (
        <View style={styles.legend} accessibilityElementsHidden={canDrag} importantForAccessibility={canDrag ? 'no-hide-descendants' : 'auto'}>
          {people.map((p, i) => (
            <LegendItem key={p.id} person={dragging ? { ...p, remainder: false } : p} index={i} parts={parts} spec={spec} sizer={sizer} initial={money(amounts[i] ?? 0)} spokenAmount={spoken(amounts[i] ?? 0)} colour={colours[i] ?? lineFill} unit={spoken(1)} testID={testID ? `${testID}-legend-${i}` : undefined} />
          ))}
          {remainderMinor > 0 ? (
            <View style={styles.item} accessible accessibilityLabel={`Not assigned yet, ${spoken(remainderMinor)}`} testID={testID ? `${testID}-legend-unassigned` : undefined}>
              <View style={[styles.swatch, { borderColor: c.labelTertiary }]}>
                <Hatch width={28} height={28} stripe={c.labelTertiary} ground={c.surfaceAlt} gap={5} />
              </View>
              <View style={styles.itemText}>
                <Text role="footnote" color="labelSecondary" numberOfLines={1}>
                  Not assigned
                </Text>
                <Text role="readoutS" color="labelSecondary">
                  {money(remainderMinor)}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {canDrag ? (
        <Text role="footnote" color="labelSecondary">
          Drag a divider to move money between neighbours.
        </Text>
      ) : draggable && tooMany ? (
        <Text role="footnote" color="labelSecondary">
          {`With more than ${MAX_DRAG_PEOPLE} people, type each amount below.`}
        </Text>
      ) : null}
    </View>
  );
}

function barSummary(people: readonly SplitBarPerson[], amounts: readonly number[], remainderMinor: number, spoken: (minor: number) => string): string {
  const shares = people.map((p, i) => (p.excluded ? `${p.name} left out` : `${p.name} ${spoken(amounts[i] ?? 0)}`)).join(', ');
  return remainderMinor > 0 ? `Split bar: ${shares}. ${spoken(remainderMinor)} not assigned yet.` : `Split bar: ${shares}.`;
}

interface Geometry {
  parts: SharedValue<number[]>;
  denom: SharedValue<number>;
  barWidth: SharedValue<number>;
}

/** One person's span of the bar, as a left offset and a width in points. */
function useSpan({ index, parts, denom, barWidth }: Geometry & { index: number }) {
  return useAnimatedStyle(() => {
    const list = parts.value;
    const d = denom.value;
    const w = barWidth.value;
    if (d <= 0 || w <= 0) return { left: 0, width: 0 };
    let before = 0;
    for (let k = 0; k < index; k++) before += list[k] ?? 0;
    return { left: (before / d) * w, width: ((list[index] ?? 0) / d) * w };
  });
}

/** The drawn segment inside the 28-point bar. */
function Segment({ index, parts, denom, barWidth, color }: Geometry & { index: number; color: string }) {
  const style = useSpan({ index, parts, denom, barWidth });
  return <Animated.View pointerEvents="none" style={[styles.segment, { backgroundColor: color }, style]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden />;
}

/**
 * The same span as an adjustable element the full height of the track (44 points), so the
 * screen-reader control is a full-size target even though the bar it describes is 28 points tall.
 */
function SegmentTarget({ index, parts, denom, barWidth, label, onAction, testID }: Geometry & { index: number; label: string; onAction: (e: AccessibilityActionEvent) => void; testID?: string }) {
  const style = useSpan({ index, parts, denom, barWidth });
  return (
    <Animated.View
      style={[styles.segmentTarget, style]}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityHint="Swipe up or down to move one unit to or from the next person"
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAction}
      testID={testID}
    />
  );
}

function Separator({ index, parts, denom, barWidth, color }: Geometry & { index: number; color: string }) {
  const style = useAnimatedStyle(() => {
    const list = parts.value;
    const d = denom.value;
    const w = barWidth.value;
    let through = 0;
    for (let k = 0; k <= index; k++) through += list[k] ?? 0;
    const visible = d > 0 && w > 0 && (list[index] ?? 0) > 0 && (list[index + 1] ?? 0) > 0;
    return { left: d > 0 ? (through / d) * w - 1 : 0, opacity: visible ? 1 : 0 };
  });
  return <Animated.View pointerEvents="none" style={[styles.separator, { backgroundColor: color }, style]} />;
}

function Remainder({ parts, denom, barWidth, width, stripe, ground, testID }: Geometry & { width: number; stripe: string; ground: string; testID?: string }) {
  const style = useAnimatedStyle(() => {
    const list = parts.value;
    const d = denom.value;
    const w = barWidth.value;
    let sum = 0;
    for (let k = 0; k < list.length; k++) sum += list[k] ?? 0;
    return { left: d > 0 ? (sum / d) * w : 0 };
  });
  return (
    <Animated.View pointerEvents="none" style={[styles.remainder, style]} testID={testID}>
      <View style={[styles.remainderCanvas, { width }]}>
        <Hatch width={width} height={BAR_HEIGHT} stripe={stripe} ground={ground} />
      </View>
    </Animated.View>
  );
}

function BoundaryHandle({
  index,
  parts,
  start,
  denom,
  barWidth,
  step,
  haptics,
  onCommit,
  onDragChange,
  pill,
  edge,
  testID,
}: Geometry & { index: number; start: SharedValue<number[]>; step: number; haptics: boolean; onCommit: (next: number[]) => void; onDragChange: (dragging: boolean) => void; pill: string; edge: string; testID?: string }) {
  const haptic = (kind: HapticKind) => fireHaptic(kind, haptics);
  const active = useSharedValue(false);
  const style = useAnimatedStyle(() => {
    const list = parts.value;
    const d = denom.value;
    const w = barWidth.value;
    let through = 0;
    for (let k = 0; k <= index; k++) through += list[k] ?? 0;
    return { transform: [{ translateX: d > 0 ? (through / d) * w - HANDLE_HIT / 2 : -HANDLE_HIT / 2 }] };
  });
  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onStart(() => {
      cancelAnimation(parts);
      start.set(parts.get().slice());
      active.set(true);
      scheduleOnRN(onDragChange, true);
    })
    .onUpdate((e) => {
      const d = denom.get();
      const w = barWidth.get();
      if (d <= 0 || w <= 0) return;
      const next = snapBoundary(moveBoundary(start.get(), index, (e.translationX / w) * d), index, step);
      const prev = parts.get();
      const left = next[index] ?? 0;
      const right = next[index + 1] ?? 0;
      const prevLeft = prev[index] ?? 0;
      const prevRight = prev[index + 1] ?? 0;
      if (left === prevLeft && right === prevRight) return;
      if ((left === 0 && prevLeft !== 0) || (right === 0 && prevRight !== 0)) scheduleOnRN(haptic, 'select');
      else if (Math.floor(left / step) !== Math.floor(prevLeft / step)) scheduleOnRN(haptic, 'start');
      parts.set(next);
    })
    // Ended or cancelled by the system: whatever the bar shows goes back to the form, so they never disagree.
    .onFinalize(() => {
      if (!active.get()) return;
      active.set(false);
      scheduleOnRN(onCommit, parts.get().slice());
      scheduleOnRN(onDragChange, false);
    });
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.handleHit, style]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden testID={testID}>
        <View style={[styles.handle, { backgroundColor: pill, borderColor: edge }]} />
      </Animated.View>
    </GestureDetector>
  );
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

function LegendItem({
  person,
  index,
  parts,
  spec,
  sizer,
  initial,
  spokenAmount,
  colour,
  unit,
  testID,
}: {
  person: SplitBarPerson;
  index: number;
  parts: SharedValue<number[]>;
  spec: MoneyFormatSpec;
  sizer: string;
  initial: string;
  spokenAmount: string;
  colour: string;
  unit: string;
  testID?: string;
}) {
  const theme = useTheme();
  const c = theme.colors;
  const { fontSize, lineHeight } = scaledType('readoutS', theme.readoutScale);
  const family = readoutFamilyFor(sizer, FONT.readoutMedium);
  const glyph: TextStyle = { fontSize, lineHeight, height: lineHeight, fontFamily: family, fontWeight: readoutWeightFor(family, '600'), fontVariant: ['tabular-nums'], color: c.label };
  const animatedProps = useAnimatedProps(() => ({ text: formatMinorWorklet(parts.value[index] ?? 0, spec) }) as unknown as Partial<TextInputProps>);
  const label = person.excluded ? `${person.name}, left out` : `${person.name}, ${spokenAmount}${person.remainder ? `, takes one leftover ${unit}` : ''}`;
  return (
    <View style={styles.item} accessible accessibilityLabel={label} testID={testID}>
      <PersonAvatar name={person.name} size={28} fill={colour} on={bestOn(colour, ['#FFFFFF', INK])} />
      <View style={styles.itemText}>
        <Text role="footnote" color="labelSecondary" numberOfLines={1}>
          {person.name}
        </Text>
        {person.excluded ? (
          <Text role="subhead" color="labelTertiary">
            Left out
          </Text>
        ) : (
          <View style={styles.amountLine}>
            <View>
              <RNText style={[glyph, styles.sizer]} allowFontScaling={false} importantForAccessibility="no" accessibilityElementsHidden>
                {sizer}
              </RNText>
              <AnimatedTextInput
                editable={false}
                pointerEvents="none"
                caretHidden
                underlineColorAndroid="transparent"
                defaultValue={initial}
                animatedProps={animatedProps}
                allowFontScaling={false}
                importantForAccessibility="no"
                accessibilityElementsHidden
                style={[glyph, styles.liveInput]}
                testID={testID ? `${testID}-amount` : undefined}
              />
            </View>
            {person.remainder ? <RemainderTick /> : null}
          </View>
        )}
      </View>
    </View>
  );
}

/** "+1": this person carries one of the leftover minor units, so the shares add up exactly. */
export function RemainderTick() {
  const { colors: c } = useTheme();
  return (
    <View style={[styles.tick, { backgroundColor: c.tintWash }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Text role="caption" style={{ color: c.onTintWash, fontWeight: '700' }} allowFontScaling={false}>
        +1
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: SPACE.m },
  track: { height: TRACK_HEIGHT, justifyContent: 'center' },
  bar: { height: BAR_HEIGHT, borderRadius: RADIUS.tile, overflow: 'hidden' },
  segment: { position: 'absolute', top: 0, bottom: 0 },
  segmentTarget: { position: 'absolute', top: 0, height: TRACK_HEIGHT },
  separator: { position: 'absolute', top: 0, bottom: 0, width: 2 },
  remainder: { position: 'absolute', top: 0, bottom: 0, right: 0, overflow: 'hidden' },
  remainderCanvas: { position: 'absolute', top: 0, bottom: 0, right: 0 },
  over: { position: 'absolute', top: 0, bottom: 0, right: 0, overflow: 'hidden', opacity: 0.8 },
  overMarker: { position: 'absolute', top: 0, bottom: 0, width: 2 },
  handleHit: { position: 'absolute', top: 0, left: 0, width: HANDLE_HIT, height: TRACK_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  handle: { width: 8, height: TRACK_HEIGHT - 6, borderRadius: 4, borderWidth: 1.5 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: SPACE.l, rowGap: SPACE.m },
  item: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s, flexGrow: 1, minWidth: '28%' },
  itemText: { gap: 1, flexShrink: 1 },
  amountLine: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs + 2 },
  sizer: { opacity: 0 },
  liveInput: { position: 'absolute', left: 0, top: 0, right: 0, padding: 0, margin: 0, borderWidth: 0, backgroundColor: 'transparent' },
  tick: { borderRadius: 999, paddingHorizontal: SPACE.xs + 2, paddingVertical: 1 },
  swatch: { width: 28, height: 28, borderRadius: 8, overflow: 'hidden', borderWidth: 1 },
});
