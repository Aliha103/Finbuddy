// apps/mobile/src/features/spending/MonthBars.tsx
// Six months of your own spending as bars: the months in the data-mark neutral (3:1 on the card),
// the selected one in the tint (a selection is a state of action), month labels under each column.
// The tint and the data mark are too close to tell apart by colour alone, so the selected month's
// label also sits in a tint pill, the only label with emphasis. The month still running is drawn
// open, an outline hatched when the bar is tall enough (it is partial, never drawn as a finished
// month), and a month the engine flagged with a category spike carries a small attention triangle
// above its bar. Scrub to read: a pan across the bars (or a tap on one) selects a month,
// with a selection tick each time the month changes; the caller's readout follows. For screen
// readers the chart is one adjustable element (increment and decrement move the month), and the
// screen offers the same months as a list of rows.
import type { MonthChange, MonthKey } from '@finbuddy/shared';
import { useState } from 'react';
import { StyleSheet, View, type AccessibilityActionEvent, type LayoutChangeEvent, type StyleProp, type TextStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { RADIUS, SPACE, Text, useHaptic, useTheme } from '@/design';
import { monthName } from '@/features/common/format';

import { CHART_HEIGHT, indexAtX, layoutBars, monthCues, type PartialMark } from './barGeometry';
import { BarsDrawing } from './BarsDrawing';

export interface MonthBarsProps {
  /** Oldest first. */
  months: readonly MonthChange[];
  currentMonth: MonthKey;
  selected: MonthKey;
  onSelect: (month: MonthKey) => void;
  /** Months the engine flagged with a category spike (spikeMonths); each gets a marker. */
  spikes?: ReadonlySet<MonthKey>;
  locale: string;
  /** Spoken value of the selected month, for the adjustable element ("October so far, 2,057.84 British pounds"). */
  spokenSelected: string;
  height?: number;
  testID?: string;
}

const NO_SPIKES: ReadonlySet<MonthKey> = new Set();

export function MonthBars({ months, currentMonth, selected, onSelect, spikes = NO_SPIKES, locale, spokenSelected, height = CHART_HEIGHT.spending, testID }: MonthBarsProps) {
  const theme = useTheme();
  const c = theme.colors;
  const haptic = useHaptic();
  const [width, setWidth] = useState(0);
  const widthValue = useSharedValue(0);
  const lastIndex = useSharedValue(-1);
  const count = months.length;
  const selectedIndex = Math.max(
    0,
    months.findIndex((m) => m.month === selected),
  );
  const cues = monthCues(
    months.map((m) => m.month),
    months[selectedIndex]?.month ?? selected,
    currentMonth,
    spikes,
  );
  const layout = layoutBars(
    months.map((m) => m.current.amountMinor),
    width,
    height,
    { partialIndex: cues.findIndex((cue) => cue.partial), spikes: cues.map((cue) => cue.spike) },
  );

  /** Runs on the JS thread: one tick per month change, then the caller's readout rolls. */
  const select = (index: number) => {
    const month = months[index];
    if (!month || month.month === selected) return;
    haptic('select');
    onSelect(month.month);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setWidth(w);
    widthValue.set(w);
  };

  // A horizontal pan scrubs; vertical movement is left to the screen's scroll.
  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onStart((e) => {
      const i = indexAtX(e.x, widthValue.get(), count);
      lastIndex.set(i);
      scheduleOnRN(select, i);
    })
    .onUpdate((e) => {
      const i = indexAtX(e.x, widthValue.get(), count);
      if (i !== lastIndex.get()) {
        lastIndex.set(i);
        scheduleOnRN(select, i);
      }
    })
    .onFinalize(() => {
      lastIndex.set(-1);
    });
  const tap = Gesture.Tap().onEnd((e) => {
    scheduleOnRN(select, indexAtX(e.x, widthValue.get(), count));
  });
  const gesture = Gesture.Exclusive(pan, tap);

  const onAccessibilityAction = (e: AccessibilityActionEvent) => {
    const step = e.nativeEvent.actionName === 'increment' ? 1 : e.nativeEvent.actionName === 'decrement' ? -1 : 0;
    if (step) select(Math.max(0, Math.min(count - 1, selectedIndex + step)));
  };

  return (
    <GestureDetector gesture={gesture}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Spending by month"
        accessibilityHint="Swipe up or down to move between months"
        accessibilityValue={{ text: spokenSelected }}
        accessibilityActions={[
          { name: 'increment', label: 'Next month' },
          { name: 'decrement', label: 'Previous month' },
        ]}
        onAccessibilityAction={onAccessibilityAction}
        onLayout={onLayout}
        style={styles.chart}
        testID={testID}
      >
        {width > 0 ? (
          <BarsDrawing layout={layout} width={width} height={height} selectedIndex={selectedIndex} barColor={c.dataMark} selectedColor={c.tint} baselineColor={c.separator} markerColor={c.attention} />
        ) : (
          <View style={{ height }} />
        )}
        <View style={styles.labels} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {months.map((m, i) => {
            const cue = cues[i];
            const isSelected = cue?.selected === true;
            return (
              <View key={m.month} style={[styles.cell, { width: layout.column || undefined, flex: layout.column ? undefined : 1 }]} testID={isSelected ? `${testID ?? 'chart'}-selected-label` : undefined}>
                <View style={[styles.pill, isSelected ? { backgroundColor: c.tint } : null]}>
                  <Text role="caption" color={isSelected ? 'onTint' : 'labelSecondary'} align="center" numberOfLines={1} style={isSelected ? styles.strong : null}>
                    {monthName(locale, m.month, 'short')}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  chart: { alignSelf: 'stretch', gap: SPACE.xs + 2 },
  labels: { flexDirection: 'row' },
  // The pill spans the column less a small inset, so a label never gets less room than before.
  cell: { paddingHorizontal: 2 },
  pill: { borderRadius: RADIUS.pill, paddingVertical: 2 },
  strong: { fontWeight: '600' },
});

/** The spike marker as a glyph, for the key under a chart (the chart draws the same triangle). */
const SPIKE_GLYPH = '\u25B2';

export interface ChartKeyProps {
  /** A sentence before the key (the card's own footnote), if any. */
  lead?: string;
  /** The current month's name: "October". */
  thisMonth: string;
  /** How the current month's bar is drawn (partialMark); null when it is not marked. */
  partial: PartialMark | null;
  /** A spike marker is drawn. */
  spike: boolean;
  /** What a marker means here: "a category spike", "a spike in this category". */
  spikeMeaning?: string;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

/** The chart's own marks in words, in the card's foot: "October so far is hatched. ▲ marks a category spike." */
export function ChartKey({ lead, thisMonth, partial, spike, spikeMeaning = 'a category spike', style, testID }: ChartKeyProps) {
  if (!lead && !partial && !spike) return null;
  const parts = [lead, partial ? `${thisMonth} so far is ${partial}.` : null].filter((x): x is string => !!x).join(' ');
  const spoken = [parts, spike ? `A triangle marks ${spikeMeaning}.` : null].filter(Boolean).join(' ');
  return (
    <Text role="footnote" color="labelTertiary" accessibilityLabel={spoken} style={style} testID={testID}>
      {parts}
      {spike ? (
        <>
          {parts ? ' ' : ''}
          <Text role="footnote" color="attention">
            {SPIKE_GLYPH}
          </Text>
          {/* A no-break space keeps the triangle with its words. */}
          {`\u00A0marks ${spikeMeaning}.`}
        </>
      ) : null}
    </Text>
  );
}
