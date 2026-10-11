// apps/mobile/src/features/spending/MonthBars.tsx
// Six months of your own spending as bars: the selected month at full tint, the others muted, month
// labels under each column. Scrub to read: a pan across the bars (or a tap on one) selects a month,
// with a selection tick each time the month changes; the caller's readout follows. For screen
// readers the chart is one adjustable element (increment and decrement move the month), and the
// screen offers the same months as a list of rows.
import type { MonthChange, MonthKey } from '@finbuddy/shared';
import { useState } from 'react';
import { StyleSheet, View, type AccessibilityActionEvent, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { SPACE, Text, useHaptic, useTheme } from '@/design';

import { indexAtX, layoutBars } from './barGeometry';
import { BarsDrawing } from './BarsDrawing';
import { monthName } from './copy';

export interface MonthBarsProps {
  /** Oldest first. */
  months: readonly MonthChange[];
  currentMonth: MonthKey;
  selected: MonthKey;
  onSelect: (month: MonthKey) => void;
  locale: string;
  /** Spoken value of the selected month, for the adjustable element ("October so far, 2,057.84 British pounds"). */
  spokenSelected: string;
  height?: number;
  testID?: string;
}

/** Opacity of the months that are not selected: lighter graphite on the surface, never a second hue. */
const MUTED = 0.32;

export function MonthBars({ months, currentMonth, selected, onSelect, locale, spokenSelected, height = 120, testID }: MonthBarsProps) {
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
  const layout = layoutBars(
    months.map((m) => m.current.amountMinor),
    width,
    height,
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
          <BarsDrawing layout={layout} width={width} height={height} selectedIndex={selectedIndex} barColor={c.tint} mutedOpacity={MUTED} baselineColor={c.separator} />
        ) : (
          <View style={{ height }} />
        )}
        <View style={styles.labels} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {months.map((m, i) => {
            const isSelected = i === selectedIndex;
            const isCurrent = m.month === currentMonth;
            return (
              <Text
                key={m.month}
                role="caption"
                color={isSelected ? 'label' : 'labelSecondary'}
                align="center"
                numberOfLines={1}
                style={[{ width: layout.column || undefined, flex: layout.column ? undefined : 1 }, isSelected || isCurrent ? styles.strong : null]}
              >
                {monthName(locale, m.month, 'short')}
              </Text>
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
  strong: { fontWeight: '600' },
});
