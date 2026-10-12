// apps/mobile/src/features/home/FinBuddyCard.tsx
// The FinBuddy card: the one tint-coloured surface on Home (Card tone="tint", DECISIONS.md). One
// readout per currency with its direction word above it: the profile's currency first in readoutXL,
// then the rest grouped by direction and by code in readoutM (cardOrder.ts; never by size, since
// currencies cannot be compared), the Sample chip while the data is sample, "All settled up" or
// "Nothing to settle" when there is nothing to show. The readouts roll when balances change; a
// currency that reaches zero rolls down to 0 before it leaves (Roll to Zero). While Home is covered
// (the settle sheet, a pushed screen) the card holds what it showed, and it keeps holding through
// the return transition: Home fades back in with every label and figure laid out where it was, and
// only once Home is in front does the roll start, so the whole roll is seen.
import type { CurrencyCode, Money } from '@finbuddy/shared';
import { useIsFocused } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Card, DURATION, Readout, SPACE, SampleChip, Text, fitRole, useCardColors, useLayoutTransition, useTheme } from '@/design';

import { cardRoles } from './cardOrder';
import { useCardReadouts } from './rolling';

export interface FinBuddyCardProps {
  /** owed minus owe, per currency, signed (personalOverview.net). */
  nets: readonly Money[];
  /** Anything logged at all: decides between "Nothing to settle" and "All settled up". */
  hasEntries: boolean;
  sample: boolean;
  locale: string;
  /** The profile's currency: first on the card, and the one hero readout. */
  profileCurrency: CurrencyCode | null | undefined;
}

/**
 * The value once the screen has settled in front; the last settled value while it is covered and
 * through the return transition, so a change made elsewhere (a settle-up) rolls in view.
 */
function useHeldUntilSettled<T>(value: T, settled: boolean): T {
  const [held, setHeld] = useState(value);
  if (settled && held !== value) setHeld(value);
  return settled ? value : held;
}

/**
 * True once the screen has been in front for one slow beat (the return transition). A covered
 * screen can report a zero size (the web preview hides it), so layout transitions wait for this,
 * and the card holds its figures until then. On first mount the screen is already settled.
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
  const settled = useSettledFocus();
  const animate = settled && !reduceMotion;
  const layout = useLayoutTransition(animate);
  return (
    <Animated.View layout={layout}>
      <Card tone="tint" testID="home-card">
        <CardBody {...props} settled={settled} animate={animate} />
      </Card>
    </Animated.View>
  );
}

function CardBody({ nets, hasEntries, sample, locale, profileCurrency, settled, animate }: FinBuddyCardProps & { settled: boolean; animate: boolean }) {
  const theme = useTheme();
  const card = useCardColors();
  const on = card?.on ?? theme.colors.onTint;
  const muted = card?.onMuted ?? theme.colors.onTint;
  const shownNets = useHeldUntilSettled(nets, settled);
  const shownEntries = useHeldUntilSettled(hasEntries, settled);
  const readouts = useCardReadouts(shownNets, profileCurrency);
  const roles = cardRoles(readouts, profileCurrency);
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
            {shownEntries ? 'All settled up' : 'Nothing to settle'}
          </Text>
          <Text role="subhead" style={{ color: muted }}>
            {shownEntries ? 'Nobody owes anybody, in any currency.' : 'Your balances, one per currency, read here once you share a cost.'}
          </Text>
        </View>
      ) : (
        <View style={styles.readouts}>
          {readouts.map((r, i) => {
            const owed = r.money.amountMinor >= 0;
            const role = fitRole(roles[i] ?? 'readoutM', theme.fontScale, longest);
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
