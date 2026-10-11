// apps/mobile/src/features/home/PendingPayments.tsx
// Pending payments that involve you: recorded, not yet counted in balances. The words say who is
// paying whom and whether it is overdue (the only place red appears) or due soon; Confirm marks
// the payment as made through the platform's two-step confirmation.
import { daysBetween, type Settlement } from '@finbuddy/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';

import { confirmSettlement, useGroups, useMyPendingSettlements, useToday } from '@/data';
import { Button, DURATION, ListSection, Readout, Row, SPACE, Text, confirmDialog, useHaptic, useTheme } from '@/design';
import { settlementSentence, type Formatter, type Spoken } from '@/features/common/format';

import { cleanName } from './formatter';
import { useLayoutTransition } from './motion';

/** The pending sentence without its amount: "Devon is paying you", "You're paying Casey". */
export function pendingWords(f: Formatter, s: Settlement): Spoken {
  if (f.isMe(s.fromPersonId)) return f.say("You're paying ", f.name(s.toPersonId));
  if (f.isMe(s.toPersonId)) return f.say(f.name(s.fromPersonId), ' is paying you');
  return f.say(f.name(s.fromPersonId), ' is paying ', f.name(s.toPersonId));
}

/** "Overdue by 3 days" (danger), "Due in 2 days" / "Due today" (attention), "Due 1 Nov 2026" (secondary). */
export function dueWords(f: Formatter, s: Settlement, today: string): { text: string; tone: 'danger' | 'attention' | 'labelSecondary' } | null {
  if (!s.dueOn) return null;
  const days = daysBetween(today, s.dueOn);
  if (days < 0) return { text: `Overdue by ${-days} day${days === -1 ? '' : 's'}`, tone: 'danger' };
  if (days === 0) return { text: 'Due today', tone: 'attention' };
  if (days <= 3) return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, tone: 'attention' };
  return { text: `Due ${f.date(s.dueOn)}`, tone: 'labelSecondary' };
}

export function PendingPayments({ f }: { f: Formatter }) {
  const theme = useTheme();
  const haptic = useHaptic();
  const groups = useGroups();
  const pending = useMyPendingSettlements();
  const today = useToday();
  const [busy, setBusy] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const layout = useLayoutTransition();
  if (pending.length === 0) return null;

  const confirm = async (s: Settlement) => {
    const sentence = settlementSentence(f, s);
    const ok = await confirmDialog({ title: 'Confirm payment', message: `${sentence.text}. Confirming counts it in balances.`, confirmLabel: 'Confirm payment' });
    if (!ok) return;
    setBusy(s.id);
    setFailure(null);
    try {
      await confirmSettlement(s.id);
      haptic('success');
    } catch (error) {
      setFailure(`Could not confirm that payment: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Animated.View layout={layout}>
      <ListSection header="Pending payments" footer={failure ?? 'Pending payments do not change a balance until they are confirmed.'}>
        {pending.map((s) => {
          const words = pendingWords(f, s);
          const due = dueWords(f, s, today);
          const group = s.groupId ? groups.find((g) => g.group.id === s.groupId) : undefined;
          return (
            <Animated.View key={s.id} layout={layout} exiting={theme.reduceMotion ? undefined : FadeOut.duration(DURATION.quick)}>
              <Row
                title={words.text}
                titleSpoken={words.spoken}
                subtitle={group ? cleanName(group.group.name) : 'Outside a group'}
                sample={s.isSample === true}
                detail={
                  <View style={styles.detail}>
                    <Readout money={s.amount} locale={f.locale} role="readoutS" inline />
                    {due ? (
                      <Text role="caption" color={due.tone} style={styles.due}>
                        {due.text}
                      </Text>
                    ) : null}
                    <Button
                      label="Confirm"
                      variant="tonal"
                      loading={busy === s.id}
                      disabled={busy !== null && busy !== s.id}
                      onPress={() => void confirm(s)}
                      accessibilityLabel={`Confirm payment. ${settlementSentence(f, s).spoken}`}
                      accessibilityHint="Asks you to confirm, then counts the payment in balances"
                      testID={`confirm-${s.id}`}
                    />
                  </View>
                }
                testID={`pending-${s.id}`}
              />
            </Animated.View>
          );
        })}
      </ListSection>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  detail: { alignItems: 'flex-end', gap: SPACE.xs + 2 },
  due: { fontWeight: '600' },
});
