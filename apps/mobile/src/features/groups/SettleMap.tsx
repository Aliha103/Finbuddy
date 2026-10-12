// apps/mobile/src/features/groups/SettleMap.tsx
// The settle map: a group's debts in one currency drawn on its white card. Members are rings on a
// rail in the group's line colour; every debt is an arc from payer to payee. The segmented toggle
// "All debts | Fewest payments" morphs between pairwiseDebts and simplifyDebts from one shared
// progress value (Reanimated). The amount chips are real text on each arc (labels, not buttons:
// each transfer's Settle up is a full-size button in the plan under the map, and chips packed this
// close could never be 44-point targets). Each state places its own chips so none overlaps another
// or a station (placeChips); during the morph the arcs move while the leaving state's chips fade
// out early and the arriving state's fade in late, so two sets of labels never share the map, and
// a chip that is the same in both states simply stays. Reduce Motion switches instantly. Until
// Skia can draw (the web preview before CanvasKit loads) the map is a plain list of the same
// transfers.
import type { Money, Transfer } from '@finbuddy/shared';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { EASING, SPACE, Segmented, Text, graphicColor, lineSwatch, useHaptic, useTheme, type LineColor, type SegmentOption } from '@/design';

import type { Spoken } from '../common/format';
import { useSkiaReady } from '../common/skiaWeb';
import { SettleArcs } from './SettleArcs';
import { CHIP_HEIGHT, LABEL_HEIGHT, RING_R, buildSlots, estimateChipWidth, layoutStations, mapMetrics, placeChips, type ChipPlace } from './settleMapGeometry';

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
  /** The sentence for one transfer, for the spoken summary and the plain list. */
  sentence: (t: Transfer) => Spoken;
  testID?: string;
}

const MORPH_MS = 600;
/** The share of the morph over which the leaving chips fade out (and, at the other end, the arriving ones fade in). */
const CHIP_FADE = 0.3;

/** One amount chip as drawn: the state it belongs to ('both' when it is the same in each), its text and centre. */
interface ChipView {
  readonly id: string;
  readonly state: 'all' | 'fewest' | 'both';
  readonly text: string;
  readonly at: ChipPlace;
}
const MODES: readonly SegmentOption<SettleMapMode>[] = [
  { id: 'all', label: 'All debts', description: 'Every debt between two people, netted pair by pair' },
  { id: 'fewest', label: 'Fewest payments', description: 'The fewest payments that settle everyone' },
];

export function SettleMap({ members, all, fewest, mode, onModeChange, line, money, sentence, testID }: SettleMapProps) {
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

  // Chip widths as measured (estimated until then), and each state's placement from them.
  const [chipWidths, setChipWidths] = useState<Readonly<Record<string, number>>>({});
  const onChipWidth = useCallback((text: string, w: number) => {
    setChipWidths((prev) => (Math.abs((prev[text] ?? 0) - w) < 0.5 ? prev : { ...prev, [text]: w }));
  }, []);
  const chips = useMemo(() => {
    const widthOf = (text: string) => chipWidths[text] ?? estimateChipWidth(text);
    const inAll = slots.filter((sl) => sl.amountA).map((sl) => ({ id: sl.key, g: sl.a, text: money(sl.amountA!), width: widthOf(money(sl.amountA!)) }));
    const inFewest = slots.filter((sl) => sl.amountB).map((sl) => ({ id: sl.key, g: sl.b, text: money(sl.amountB!), width: widthOf(money(sl.amountB!)) }));
    const placedAll = placeChips(inAll, railY, width);
    const placedFewest = placeChips(inFewest, railY, width);
    const out: ChipView[] = [];
    for (const c of inAll) {
      const a = placedAll.get(c.id)!;
      const twin = inFewest.find((b) => b.id === c.id);
      const b = twin ? placedFewest.get(c.id) : undefined;
      if (twin && b && twin.text === c.text && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5) out.push({ id: `both:${c.id}`, state: 'both', text: c.text, at: a });
      else out.push({ id: `all:${c.id}`, state: 'all', text: c.text, at: a });
    }
    for (const c of inFewest) {
      if (out.some((v) => v.id === `both:${c.id}`)) continue;
      out.push({ id: `fewest:${c.id}`, state: 'fewest', text: c.text, at: placedFewest.get(c.id)! });
    }
    return out;
  }, [slots, chipWidths, money, railY, width]);

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
        options={MODES}
        value={mode}
        onChange={onModeChange}
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
                lineColor={graphicColor(lineSwatch(line, theme.scheme).fill, c.surface, c.label)}
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
              {chips.map((chip) => (
                <AmountChip key={chip.id} chip={chip} progress={progress} onWidth={onChipWidth} />
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

function AmountChip({ chip, progress, onWidth }: { chip: ChipView; progress: SharedValue<number>; onWidth: (text: string, width: number) => void }) {
  const { colors: c } = useTheme();
  const { state, text, at } = chip;
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    // 'all' is fully shown at p = 0 and gone by CHIP_FADE; 'fewest' arrives over the last CHIP_FADE.
    const opacity = state === 'both' ? 1 : state === 'all' ? 1 - p / CHIP_FADE : (p - (1 - CHIP_FADE)) / CHIP_FADE;
    return { opacity: Math.min(1, Math.max(0, opacity)) };
  }, [state]);
  // The map is one accessible image whose label is the whole plan, so the chip is for the eye only.
  return (
    <Animated.View
      style={[styles.chipWrap, { left: at.x - CHIP_SLOT / 2, top: at.y - CHIP_HEIGHT / 2 }, style]}
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <View style={[styles.chip, { backgroundColor: c.fill, borderColor: c.surface }]} onLayout={(e) => onWidth(text, e.nativeEvent.layout.width)} testID={`arc-${chip.id}`}>
        <Text role="caption" tabular style={[styles.chipText, { color: c.label }]} numberOfLines={1}>
          {text}
        </Text>
      </View>
    </Animated.View>
  );
}

/** The box a chip is centred in; wider than any chip, so the chip's own width never shifts its centre. */
const CHIP_SLOT = 160;

const styles = StyleSheet.create({
  box: { gap: SPACE.m },
  canvas: { alignSelf: 'stretch', overflow: 'visible' },
  station: { position: 'absolute', textAlign: 'center' },
  bold: { fontWeight: '600' },
  chipWrap: { position: 'absolute', width: CHIP_SLOT, height: CHIP_HEIGHT, alignItems: 'center', zIndex: 1 },
  chip: { height: CHIP_HEIGHT, paddingHorizontal: SPACE.s, justifyContent: 'center', borderRadius: 999, borderWidth: 1.5 },
  chipText: { textAlign: 'center', fontWeight: '600' },
  plain: { gap: SPACE.xs, paddingVertical: SPACE.s },
});
