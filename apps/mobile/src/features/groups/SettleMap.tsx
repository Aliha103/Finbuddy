// apps/mobile/src/features/groups/SettleMap.tsx
// The settle map: a group's debts in one currency drawn on its white card. Members are rings on a
// rail in the group's line colour; every debt is an arc from payer to payee. The segmented toggle
// "All debts | Fewest payments" morphs between pairwiseDebts and simplifyDebts from one shared
// progress value (Reanimated); the amount chips are real text riding each arc's apex, each a button
// that opens Settle up. Reduce Motion switches instantly. Until Skia can draw (the web preview
// before CanvasKit loads) the map is a plain list of the same transfers.
import type { Money, Transfer } from '@finbuddy/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { EASING, SPACE, Text, useHaptic, useTheme, type LineColor } from '@/design';

import type { Spoken } from '../common/format';
import { useSkiaReady } from '../common/skiaWeb';
import { graphicColor } from './graphicColor';
import { Segmented } from './Segmented';
import { SettleArcs } from './SettleArcs';
import { CHIP_HEIGHT, CHIP_WIDTH, LABEL_HEIGHT, RING_R, blend, buildSlots, layoutStations, mapMetrics, type ArcSlot } from './settleMapGeometry';

export type SettleMapMode = 'all' | 'fewest';

export interface SettleMapMember {
  readonly id: string;
  /** "You", "Avery". */
  readonly label: string;
  readonly isMe: boolean;
}

export interface SettleMapProps {
  members: readonly SettleMapMember[];
  /** Every debt in one currency, from pairwiseDebts. */
  all: readonly Transfer[];
  /** The fewest payments in the same currency, from simplifyDebts. */
  fewest: readonly Transfer[];
  mode: SettleMapMode;
  onModeChange: (mode: SettleMapMode) => void;
  line: LineColor;
  money: (m: Money) => string;
  /** The sentence for one transfer, for chips and the spoken summary. */
  sentence: (t: Transfer) => Spoken;
  onSelect?: (t: Transfer) => void;
  testID?: string;
}

const MORPH_MS = 600;
const MODES: readonly SettleMapMode[] = ['all', 'fewest'];

export function SettleMap({ members, all, fewest, mode, onModeChange, line, money, sentence, onSelect, testID }: SettleMapProps) {
  const theme = useTheme();
  const c = theme.colors;
  const haptic = useHaptic();
  const ready = useSkiaReady();
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(mode === 'fewest' ? 1 : 0);
  const { railY, height } = mapMetrics(members.length);
  const meId = members.find((m) => m.isMe)?.id ?? null;

  const stations = useMemo(
    () =>
      layoutStations(
        members.map((m) => m.id),
        width,
      ),
    [members, width],
  );
  const slots = useMemo(() => buildSlots(all, fewest, stations), [all, fewest, stations]);

  // The first run only places the map; the morph (and its haptic) belongs to a change of mode.
  const placed = useRef(false);
  useEffect(() => {
    const target = mode === 'fewest' ? 1 : 0;
    if (!placed.current || theme.reduceMotion) {
      placed.current = true;
      progress.set(target);
      return;
    }
    const arrived = () => haptic('select');
    progress.set(
      withTiming(target, { duration: MORPH_MS, easing: EASING.emphasizedDecelerate }, (done) => {
        if (done) scheduleOnRN(arrived);
      }),
    );
    // The haptic callback is stable enough for a morph; re-running on every theme change is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, theme.reduceMotion, progress]);

  const current = mode === 'fewest' ? fewest : all;
  const summary = `${current.length === 0 ? 'No debts' : `${current.length} ${mode === 'fewest' ? (current.length === 1 ? 'payment' : 'payments') : current.length === 1 ? 'debt' : 'debts'}`}${
    current.length ? `: ${current.map((t) => sentence(t).spoken).join('; ')}` : ''
  }`;
  const caption =
    mode === 'fewest'
      ? current.length === 0
        ? 'Nothing to pay.'
        : `${current.length} ${current.length === 1 ? 'payment settles' : 'payments settle'} everyone.`
      : current.length === 0
        ? 'No debts between members.'
        : `${current.length} ${current.length === 1 ? 'debt' : 'debts'} between ${members.length} people, netted pair by pair.`;

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width));

  return (
    <View style={styles.box} testID={testID}>
      <Segmented
        values={['All debts', 'Fewest payments']}
        selectedIndex={MODES.indexOf(mode)}
        onChange={(i) => onModeChange(MODES[i] ?? 'fewest')}
        label="How to show the debts"
        testID={testID ? `${testID}-mode` : undefined}
      />
      {ready ? (
        <View style={[styles.canvas, { height }]} onLayout={onLayout} accessible accessibilityRole="image" accessibilityLabel={summary} testID={testID ? `${testID}-canvas` : undefined}>
          {width > 0 ? (
            <>
              <SettleArcs
                width={width}
                height={height}
                railY={railY}
                stations={stations}
                meId={meId}
                slots={slots}
                progress={progress}
                lineColor={graphicColor(line.fill, c.surface, c.label)}
                surfaceColor={c.surface}
                railColor={c.separator}
              />
              {stations.map((s, i) => {
                const member = members[i];
                const stationWidth = Math.min(88, stations.length > 1 ? (width - 2 * 36) / (stations.length - 1) : width);
                return (
                  <Text
                    key={s.id}
                    role="footnote"
                    color={member?.isMe ? 'label' : 'labelSecondary'}
                    numberOfLines={1}
                    importantForAccessibility="no"
                    style={[styles.station, member?.isMe ? styles.bold : null, { width: stationWidth, left: s.x - stationWidth / 2, top: railY + RING_R + 6, lineHeight: LABEL_HEIGHT }]}
                  >
                    {member?.label ?? ''}
                  </Text>
                );
              })}
              {slots.map((slot) => (
                <AmountChip key={slot.key} slot={slot} mode={mode} progress={progress} railY={railY} money={money} sentence={sentence} onSelect={onSelect} />
              ))}
            </>
          ) : null}
        </View>
      ) : (
        <View style={styles.plain} accessibilityRole="list" testID={testID ? `${testID}-list` : undefined}>
          {current.length ? (
            current.map((t) => (
              <Text key={`${t.from}>${t.to}`} role="subhead" accessibilityLabel={sentence(t).spoken}>
                {sentence(t).text}
              </Text>
            ))
          ) : (
            <Text role="subhead" color="labelSecondary">
              Nothing to draw.
            </Text>
          )}
        </View>
      )}
      <Text role="footnote" color="labelSecondary" accessibilityLiveRegion="polite">
        {caption}
      </Text>
    </View>
  );
}

function AmountChip({
  slot,
  mode,
  progress,
  railY,
  money,
  sentence,
  onSelect,
}: {
  slot: ArcSlot;
  mode: SettleMapMode;
  progress: SharedValue<number>;
  railY: number;
  money: (m: Money) => string;
  sentence: (t: Transfer) => Spoken;
  onSelect?: (t: Transfer) => void;
}) {
  const { colors: c } = useTheme();
  const style = useAnimatedStyle(() => {
    const g = blend(slot, progress.value);
    return {
      opacity: Math.min(1, Math.max(0, g.present)),
      // The apex of a cubic whose two control points sit at height h is at 0.75 h.
      transform: [{ translateX: (g.x0 + g.x1) / 2 - CHIP_WIDTH / 2 }, { translateY: railY - 0.75 * g.h - CHIP_HEIGHT / 2 }],
    };
  }, [slot, railY]);
  // The amount printed is the one in the state the map is heading to; the chip fades with its arc.
  const amount = mode === 'fewest' ? (slot.amountB ?? slot.amountA) : (slot.amountA ?? slot.amountB);
  if (!amount) return null;
  const present = mode === 'fewest' ? slot.b.present : slot.a.present;
  const transfer: Transfer = { from: slot.from, to: slot.to, amount };
  const said = sentence(transfer);
  return (
    <Animated.View style={[styles.chipWrap, style]} pointerEvents={present ? 'box-none' : 'none'}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={said.spoken}
        accessibilityHint={onSelect ? 'Opens Settle up for this payment' : undefined}
        accessibilityElementsHidden={!present}
        importantForAccessibility={present ? 'yes' : 'no-hide-descendants'}
        disabled={!onSelect || !present}
        onPress={onSelect ? () => onSelect(transfer) : undefined}
        hitSlop={6}
        style={({ pressed }) => [styles.chip, { backgroundColor: pressed ? c.pressed : c.fill, borderColor: c.surface }]}
        testID={`arc-${slot.from}-${slot.to}`}
      >
        <Text role="caption" tabular style={[styles.chipText, { color: c.label }]} numberOfLines={1} importantForAccessibility="no">
          {money(amount)}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: { gap: SPACE.m },
  canvas: { alignSelf: 'stretch', overflow: 'visible' },
  station: { position: 'absolute', textAlign: 'center' },
  bold: { fontWeight: '600' },
  chipWrap: { position: 'absolute', left: 0, top: 0, width: CHIP_WIDTH, alignItems: 'center' },
  chip: { height: CHIP_HEIGHT, paddingHorizontal: SPACE.s, justifyContent: 'center', borderRadius: 999, borderWidth: 1.5 },
  chipText: { textAlign: 'center', fontWeight: '600' },
  plain: { gap: SPACE.xs, paddingVertical: SPACE.s },
});
