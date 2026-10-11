// apps/mobile/src/features/home/FinBuddyCard.tsx
// The FinBuddy card: the one tint-coloured surface on Home (Card tone="tint", DECISIONS.md). One
// readout per currency with its direction word above it, stacked largest first (readoutXL for the
// first, readoutM for the rest), the Sample chip while the data is sample, "All settled up" or
// "Nothing to settle" when there is nothing to show. The readouts roll when balances change; a
// currency that reaches zero rolls down to 0 before it leaves (Roll to Zero). While Home is covered
// (the settle sheet, a pushed screen) the card holds what it showed, so the roll plays on return.
import type { Money } from '@finbuddy/shared';
import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Card, DURATION, Readout, SPACE, SampleChip, Text, fitRole, useCardColors, useLayoutTransition, useTheme } from '@/design';

import { useCardReadouts } from './rolling';

export interface FinBuddyCardProps {
  /** owed minus owe, per currency, signed (personalOverview.net). */
  nets: readonly Money[];
  /** Anything logged at all: decides between "Nothing to settle" and "All settled up". */
  hasEntries: boolean;
  sample: boolean;
  locale: string;
}

/** The value while the screen is focused; the last focused value while it is covered. */
function useHeldWhileCovered<T>(value: T): T {
  const focused = useIsFocused();
  const [held, setHeld] = useState(value);
  if (focused && held !== value) setHeld(value);
  return focused ? value : held;
}

/**
 * Layout transitions only once the screen has been in front for one slow beat. A covered screen can
 * report a zero size (the web preview hides it), and a layout transition would animate from that
 * on return; the readouts' roll is a transform and plays either way.
 */
function useSettledFocus(): boolean {
  const focused = useIsFocused();
  const [settled, setSettled] = useState(focused);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(focused), focused ? DURATION.slow : 0);
    return () => clearTimeout(timer);
  }, [focused]);
  return focused && settled;
}

export function FinBuddyCard(props: FinBuddyCardProps) {
  const { reduceMotion } = useTheme();
  const animate = useSettledFocus() && !reduceMotion;
  const layout = useLayoutTransition(animate);
  return (
    <Animated.View layout={layout}>
      <Card tone="tint" testID="home-card">
        <CardBody {...props} animate={animate} />
      </Card>
    </Animated.View>
  );
}

function CardBody({ nets, hasEntries, sample, locale, animate }: FinBuddyCardProps & { animate: boolean }) {
  const theme = useTheme();
  const card = useCardColors();
  const on = card?.on ?? theme.colors.onTint;
  const muted = card?.onMuted ?? theme.colors.onTint;
  const shownNets = useHeldWhileCovered(nets);
  const readouts = useCardReadouts(shownNets);
  const layout = useLayoutTransition(animate);
  const longest = Math.max(0, ...readouts.map((r) => String(Math.abs(r.money.amountMinor)).length));

  return (
    <View style={styles.body}>
      <View style={styles.top}>
        <Text role="headline" style={{ color: on }}>
          FinBuddy
        </Text>
        {sample ? <SampleChip /> : null}
      </View>

      {readouts.length === 0 ? (
        <View style={styles.empty}>
          <Text role="title" style={{ color: on }} accessibilityRole="header">
            {hasEntries ? 'All settled up' : 'Nothing to settle'}
          </Text>
          <Text role="subhead" style={{ color: muted }}>
            {hasEntries ? 'Nobody owes anybody, in any currency.' : 'Your balances, one per currency, read here once you share a cost.'}
          </Text>
        </View>
      ) : (
        <View style={styles.readouts}>
          {readouts.map((r, i) => {
            const owed = r.money.amountMinor >= 0;
            const role = fitRole(i === 0 ? 'readoutXL' : 'readoutM', theme.fontScale, longest);
            const amount = { amountMinor: Math.abs(r.money.amountMinor), currency: r.money.currency };
            return (
              <Animated.View
                key={r.money.currency}
                layout={layout}
                entering={animate ? FadeIn.duration(DURATION.quick) : undefined}
                exiting={animate ? FadeOut.duration(DURATION.quick) : undefined}
                style={styles.block}
              >
                <Text role="subhead" style={{ color: muted }}>
                  {r.money.amountMinor === 0 ? 'Settled' : owed ? "You're owed" : 'You owe'}
                </Text>
                <Readout money={amount} locale={locale} role={role} textColor={on} live={i === 0} testID={`home-readout-${r.money.currency}`} />
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: SPACE.l },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.s },
  readouts: { gap: SPACE.m },
  block: { gap: 2 },
  empty: { gap: SPACE.xs, paddingBottom: SPACE.xs },
});
