// apps/mobile/src/features/expense/SplitEditorScreen.tsx
// The split editor (DIRECTION.md section 4), pushed inside the add stack: the platform's segmented
// control for the method, the split bar in the group's line colour with each person's live share
// (and the "+1" on whoever takes a leftover minor unit), then one row per person with the method's
// input: a checkbox (Equally), an amount (Exact), a percentage, a shares stepper, or a signed
// adjustment. The running line and every message come from evaluate(), so they are the engine's.
// Done stays disabled until the split resolves; the first problem is shown and announced.
import { allocateMinor, formatMoneyForInput, parseMoneyInput, participantsOf, type Money, type PersonId } from '@finbuddy/shared';
import { Stack, router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Card, INPUT_RESET, Icon, ListSection, Readout, SPACE, SampleChip, Segmented, Text, bestOn, focusRing, lineSwatch, useHaptic, useTheme } from '@/design';
import { EmptyState } from '@/features/common/EmptyState';
import { cleanName } from '@/features/common/format';
import { HeaderButton } from '@/features/common/HeaderButton';
import { CheckMark, PersonRow } from '@/features/common/PersonRow';
import { Screen } from '@/features/common/Screen';
import { useGroupLineColor } from '@/features/groups/lineColors';

import { InlineField } from './components/InlineField';
import { MAX_DRAG_PEOPLE, SplitBar, type SplitBarPerson } from './components/SplitBar';
import { SPLIT_METHODS, normaliseNumber, withMethod, type SplitMethod } from './form';
import { possessive, useExpenseModel, type ExpenseModel } from './model';
import { useExpenseSession } from './session';
import { moneyFormatSpec, remainderCarriers, shareColour } from './splitMath';

const INK = '#1A1420';

export function SplitEditorScreen() {
  const model = useExpenseModel();
  if (!model) return <Screen testID="split">{null}</Screen>;
  if (!model.group) {
    return (
      <Screen testID="split">
        <EmptyState title="A personal expense is all yours" message="Choose a group under Who is it for to split it with other people." action={{ label: 'Back', onPress: () => router.back() }} />
      </Screen>
    );
  }
  return <SplitEditor model={model} groupId={model.group.group.id} />;
}

/** What the bar shows per person: the engine's shares when the split resolves, else a preview of what was typed. */
function barParts(model: ExpenseModel): number[] {
  const { form, result, members, f } = model;
  const total = result.total;
  if (result.resolved) return members.map((id) => result.resolved?.[id]?.amountMinor ?? 0);
  const parseAmount = (text: string) => {
    const r = parseMoneyInput(text, form.currency, { locale: f.locale, allowZero: true });
    return r.ok ? r.value.amountMinor : 0;
  };
  switch (form.method) {
    case 'exact':
      return members.map((id) => parseAmount(form.exact[id] ?? ''));
    case 'percentage':
      return members.map((id) => {
        const n = normaliseNumber(form.percent[id] ?? '', f.locale);
        return total && n !== null ? Math.floor((total.amountMinor * Number(n)) / 100) : 0;
      });
    case 'shares': {
      const weights = members.map((id) => normaliseNumber(form.shares[id] ?? '', f.locale) ?? '0');
      if (!total || !weights.some((w) => Number(w) > 0)) return members.map(() => 0);
      return allocateMinor(total.amountMinor, weights);
    }
    default:
      return members.map(() => 0);
  }
}

function SplitEditor({ model, groupId }: { model: ExpenseModel; groupId: string }) {
  const theme = useTheme();
  const c = theme.colors;
  const { setForm } = useExpenseSession();
  const line = useGroupLineColor(groupId);
  const { f, form, result, members, group } = model;
  const total = result.total;
  const currency = form.currency;
  const spec = useMemo(() => moneyFormatSpec(currency, f.locale), [currency, f.locale]);

  const parts = barParts(model);
  const resolvedList = result.resolved && total ? participantsOf(result.spec).map((personId) => ({ personId, amount: result.resolved?.[personId] ?? ({ amountMinor: 0, currency } as Money) })) : null;
  const carriers = resolvedList && total ? remainderCarriers(result.spec, resolvedList, total.amountMinor) : new Set<PersonId>();
  const excluded = (id: PersonId) => (form.method === 'equal' || form.method === 'adjustment') && form.included[id] === false;
  const people: SplitBarPerson[] = members.map((id, i) => ({ id, name: f.name(id), amountMinor: parts[i] ?? 0, remainder: carriers.has(id), excluded: excluded(id) }));
  const lineFill = lineSwatch(line, theme.scheme).fill;
  const colours = members.map((_, i) => shareColour(lineFill, i, theme.scheme));
  const [dragging, setDragging] = useState(false);

  // The running line above already states a sum that is off ("£70.00 of £100.00 assigned"), so the same fact is not repeated in red.
  const problems = [...result.splitGeneral.filter((m) => m !== result.splitSumMessage), ...members.map((id) => result.splitErrors[id]).filter((m): m is string => !!m)];
  const first = total ? problems[0] : 'Enter the amount first: the split needs a total.';
  const done = result.resolved !== null && total !== null;

  const setMethod = (method: SplitMethod) => setForm((s) => withMethod(s, method, members, total, f.locale));
  const setPer = (key: 'exact' | 'percent' | 'shares' | 'adjustment', id: PersonId, value: string) => setForm((s) => ({ ...s, [key]: { ...s[key], [id]: value } }));
  const toggle = (id: PersonId) => setForm((s) => ({ ...s, included: { ...s.included, [id]: s.included[id] === false } }));
  const commitExact = (next: number[]) =>
    setForm((s) => ({ ...s, exact: Object.fromEntries(members.map((id, i) => [id, formatMoneyForInput({ amountMinor: next[i] ?? 0, currency }, f.locale)])) }));

  const leftovers = carriers.size;
  const method = SPLIT_METHODS.find((m) => m.id === form.method);

  return (
    <Screen automaticallyAdjustKeyboardInsets testID="split">
      <Stack.Screen options={{ headerRight: () => <HeaderButton label="Done" emphasis disabled={!done} onPress={() => router.back()} testID="split-done" /> }} />

      <View style={styles.head}>
        <View style={styles.headLine}>
          <Text role="subhead" color="labelSecondary" style={styles.flex}>
            {`Splitting in ${cleanName(group?.group.name ?? '')}`}
          </Text>
          {group?.group.isSample ? <SampleChip /> : null}
        </View>
        {total ? <Readout money={total} locale={f.locale} role="readoutL" testID="split-total" /> : <Text role="body" color="labelSecondary">No amount yet</Text>}
      </View>

      <View style={styles.block}>
        <Segmented label="Split method" options={SPLIT_METHODS} value={form.method} onChange={setMethod} testID="split-method" />
        {method ? (
          <Text role="footnote" color="labelSecondary">
            {method.description}
          </Text>
        ) : null}
      </View>

      <Card testID="split-card">
        <View style={styles.cardBody}>
          <SplitBar people={people} totalMinor={total?.amountMinor ?? null} currency={currency} locale={f.locale} line={line} draggable={form.method === 'exact'} onCommit={commitExact} onDragChange={setDragging} testID="split-bar" />
          <View style={[styles.rule, { backgroundColor: c.separator }]} />
          <Text role="subhead" color="label" accessibilityLabel={progressLine(model).spoken} accessibilityLiveRegion="polite" testID="split-progress">
            {progressLine(model).text}
          </Text>
          {leftovers > 0 && total && !dragging ? (
            <Text role="footnote" color="labelSecondary" testID="split-leftover">
              {`${f.money(total)} does not divide exactly, so +1 marks who takes one extra ${f.money({ amountMinor: 1, currency })}. The shares still add up to the total.`}
            </Text>
          ) : null}
          {first && !done ? (
            <Text role="footnote" color="danger" accessibilityRole="alert" accessibilityLiveRegion="polite" testID="split-first-problem">
              {first}
            </Text>
          ) : null}
        </View>
      </Card>

      <ListSection header={rowsHeader(form.method)} footer={rowsFooter(form.method, members.length)} style={styles.flushList}>
        {members.map((id, i) => (
          <MethodRow key={id} model={model} id={id} colour={colours[i] ?? lineFill} spec={spec} onSet={setPer} onToggle={toggle} />
        ))}
      </ListSection>
    </Screen>
  );
}

function progressLine(model: ExpenseModel) {
  const { f, form, result, members } = model;
  if (form.method === 'equal') {
    const n = members.filter((id) => form.included[id] !== false).length;
    if (!result.total) return f.say(`Equally between ${n} ${n === 1 ? 'person' : 'people'}`);
    return f.say(result.total, ` shared equally by ${n} ${n === 1 ? 'person' : 'people'}`);
  }
  return result.splitProgress ?? f.say('Enter the amount first');
}

function rowsHeader(method: SplitMethod): string {
  switch (method) {
    case 'equal':
      return 'Who shares it';
    case 'exact':
      return 'Amounts';
    case 'percentage':
      return 'Percentages';
    case 'shares':
      return 'Shares';
    case 'adjustment':
      return 'Adjustments';
  }
}

function rowsFooter(method: SplitMethod, count: number): string | undefined {
  switch (method) {
    case 'equal':
      return 'Untick anyone who is not sharing this.';
    case 'exact':
      return count > MAX_DRAG_PEOPLE ? 'Type each amount. Leave a field empty for someone who is not sharing.' : 'Type each amount, or drag the dividers in the bar. Leave a field empty for someone who is not sharing.';
    case 'percentage':
      return 'Leave a field empty for someone who is not sharing.';
    case 'shares':
      return 'Shares are proportional, such as nights stayed. Zero leaves someone out.';
    case 'adjustment':
      return 'Plus for someone who had more, minus for someone who had less. The rest is split equally.';
  }
}

function MethodRow({
  model,
  id,
  colour,
  spec,
  onSet,
  onToggle,
}: {
  model: ExpenseModel;
  id: PersonId;
  colour: string;
  spec: ReturnType<typeof moneyFormatSpec>;
  onSet: (key: 'exact' | 'percent' | 'shares' | 'adjustment', id: PersonId, value: string) => void;
  onToggle: (id: PersonId) => void;
}) {
  const { minTouch } = useTheme();
  const { f, form, result } = model;
  const name = f.name(id);
  const whose = possessive(f, id);
  const error = result.splitErrors[id] ?? null;
  const avatar = { avatarFill: colour, avatarOn: bestOn(colour, ['#FFFFFF', INK]) };
  const included = form.included[id] !== false;
  const currencyWord = f.currencyName(form.currency);

  switch (form.method) {
    case 'equal':
      return (
        <PersonRow
          name={name}
          {...avatar}
          detail={included ? undefined : 'Left out'}
          control={<CheckMark checked={included} />}
          onPress={() => onToggle(id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: included }}
          accessibilityLabel={`${name}, shares this`}
          error={error}
          testID={`split-row-${id}`}
        />
      );
    case 'exact':
      return (
        <PersonRow
          name={name}
          {...avatar}
          error={error}
          control={
            <InlineField
              accessibilityLabel={`${whose} amount, in ${currencyWord}`}
              prefix={spec.prefix.trim() || undefined}
              suffix={spec.suffix.trim() || undefined}
              value={form.exact[id] ?? ''}
              onChangeText={(v) => onSet('exact', id, v)}
              placeholder={formatMoneyForInput({ amountMinor: 0, currency: form.currency }, f.locale)}
              invalid={!!error}
              testID={`split-input-${id}`}
            />
          }
          testID={`split-row-${id}`}
        />
      );
    case 'percentage':
      return (
        <PersonRow
          name={name}
          {...avatar}
          error={error}
          control={
            <InlineField
              accessibilityLabel={`${whose} percentage of the total`}
              suffix="%"
              width={112}
              value={form.percent[id] ?? ''}
              onChangeText={(v) => onSet('percent', id, v)}
              placeholder="0"
              invalid={!!error}
              testID={`split-input-${id}`}
            />
          }
          testID={`split-row-${id}`}
        />
      );
    case 'shares':
      return <PersonRow name={name} {...avatar} error={error} control={<SharesStepper whose={whose} who={f.isMe(id) ? 'you' : name} value={form.shares[id] ?? ''} onChange={(v) => onSet('shares', id, v)} invalid={!!error} locale={f.locale} testID={`split-input-${id}`} />} testID={`split-row-${id}`} />;
    case 'adjustment':
      return (
        <PersonRow
          name={name}
          {...avatar}
          leading={
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: included }} aria-checked={included} accessibilityLabel={`${name}, shares this`} onPress={() => onToggle(id)} style={[styles.includeTarget, { width: minTouch, height: minTouch, marginHorizontal: -(minTouch - CHECK_SIZE) / 2 }]} testID={`split-include-${id}`}>
              <CheckMark checked={included} />
            </Pressable>
          }
          detail={included ? undefined : 'Left out'}
          error={error}
          control={
            <InlineField
              accessibilityLabel={`${whose} adjustment, plus or minus, in ${currencyWord}`}
              prefix={spec.prefix.trim() || undefined}
              suffix={spec.suffix.trim() || undefined}
              value={form.adjustment[id] ?? ''}
              onChangeText={(v) => onSet('adjustment', id, v)}
              placeholder={`+${formatMoneyForInput({ amountMinor: 0, currency: form.currency }, f.locale)}`}
              keyboardType="numbers-and-punctuation"
              inputMode="text"
              editable={included}
              invalid={!!error}
              testID={`split-input-${id}`}
            />
          }
          testID={`split-row-${id}`}
        />
      );
  }
}

/** A shares stepper: minus, the number (typeable, decimals allowed), plus. Zero or empty leaves the person out. */
function SharesStepper({ whose, who, value, onChange, invalid, locale, testID }: { whose: string; who: string; value: string; onChange: (v: string) => void; invalid: boolean; locale: string; testID?: string }) {
  const theme = useTheme();
  const c = theme.colors;
  const haptic = useHaptic();
  const [focused, setFocused] = useState(false);
  const n = Number(normaliseNumber(value, locale) ?? '0');
  const step = (delta: number) => {
    const next = Math.max(0, Math.floor(n) + delta);
    haptic('select');
    onChange(next === 0 ? '' : String(next));
  };
  const button = (kind: 'minus' | 'plus', label: string, disabled: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => step(kind === 'plus' ? 1 : -1)}
      style={({ pressed }) => [styles.stepButton, { width: theme.minTouch, height: theme.minTouch, backgroundColor: pressed ? c.pressed : c.fill, opacity: disabled ? 0.4 : 1 }]}
      testID={testID ? `${testID}-${kind}` : undefined}
    >
      <Icon name={kind === 'plus' ? 'add' : 'minus'} size={18} color={c.label} />
    </Pressable>
  );
  return (
    <View style={styles.stepper}>
      {button('minus', `One share fewer for ${who}`, n <= 0)}
      <TextInput
        accessibilityLabel={`${whose} shares`}
        value={value}
        onChangeText={onChange}
        placeholder="0"
        placeholderTextColor={c.labelTertiary}
        keyboardType="decimal-pad"
        inputMode="decimal"
        selectionColor={c.tint}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.stepValue, { color: c.label, borderColor: invalid ? c.danger : focused ? c.tint : 'transparent', minHeight: theme.minTouch }, INPUT_RESET, focused ? focusRing(c.tint) : null]}
        testID={testID}
      />
      {button('plus', `One share more for ${who}`, false)}
    </View>
  );
}

/** The checkbox mark's size (CheckMark); its target is the platform's minimum touch size around it. */
const CHECK_SIZE = 24;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  includeTarget: { alignItems: 'center', justifyContent: 'center' },
  head: { gap: SPACE.xs },
  headLine: { flexDirection: 'row', alignItems: 'center', gap: SPACE.s },
  block: { gap: SPACE.s },
  cardBody: { gap: SPACE.m },
  rule: { height: StyleSheet.hairlineWidth },
  flushList: { paddingHorizontal: 0 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: SPACE.xs },
  stepButton: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  stepValue: { width: 52, textAlign: 'center', fontSize: 17, fontVariant: ['tabular-nums'], borderWidth: 1.5, borderRadius: 10, paddingVertical: 0 },
});
