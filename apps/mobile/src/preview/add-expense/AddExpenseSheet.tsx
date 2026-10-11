import { CURRENCY_CODES, DEFAULT_CATEGORIES, addDays, type CurrencyCode, type PersonId } from '@finbuddy/shared';
import { useState } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { addExpense, useGroups, useProfile, useToday } from '@/data';

import { useFormat, type Formatter } from '@/features/common/format';
import { useNavigation } from '../navigation';
import { useReducedMotion } from '../motion';
import { usePalette, space } from '../theme';
import { Button, Chip, ChipRow, ErrorText, Field, Note, PreviewBanner, Row, Section, SpokenText, T, styles } from '../ui';
import { SPLIT_METHODS, evaluate, initialForm, issueMessage, withGroup, withMethod, withPayerMode, type FormState } from '@/features/expense/form';

/** The add-expense modal sheet. Mounted fresh each time it opens, so the form starts clean. */
export function AddExpenseSheet() {
  const nav = useNavigation();
  const reduceMotion = useReducedMotion();
  const open = nav.sheet?.name === 'addExpense';
  return (
    <Modal
      visible={open}
      animationType={reduceMotion ? 'fade' : 'slide'}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : undefined}
      // react-native-web paints an opaque white modal root; the form paints its own (dark-mode aware) background.
      transparent={Platform.OS === 'web'}
      onRequestClose={nav.closeSheet}
    >
      <SafeAreaProvider>{open ? <AddExpenseForm groupId={nav.sheet?.groupId ?? null} onClose={nav.closeSheet} /> : null}</SafeAreaProvider>
    </Modal>
  );
}

function relativeDay(f: Formatter, date: string, today: string): string {
  if (date === today) return `Today, ${f.date(date)}`;
  if (date === addDays(today, -1)) return `Yesterday, ${f.date(date)}`;
  return f.date(date);
}

function AddExpenseForm({ groupId: initialGroupId, onClose }: { groupId: string | null; onClose: () => void }) {
  const f = useFormat();
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const groups = useGroups().filter((g) => !g.group.archived);
  const today = useToday();
  const me = profile?.personId ?? '';
  const defaultCurrency: CurrencyCode = profile?.defaultCurrency ?? 'USD';
  const groupCurrency = (id: string | null) => groups.find((g) => g.group.id === id)?.group.currency ?? defaultCurrency;

  const [form, setForm] = useState<FormState>(() => initialForm({ groupId: initialGroupId, currency: groupCurrency(initialGroupId), me, today }));
  const [touched, setTouched] = useState({ amount: false });
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [currencyQuery, setCurrencyQuery] = useState<string | null>(null);

  const group = groups.find((g) => g.group.id === form.groupId)?.group ?? null;
  const members: readonly PersonId[] = group ? group.memberIds : [me];
  const result = evaluate(form, { f, me, members });
  const update = (patch: Partial<FormState>) => setForm((s) => ({ ...s, ...patch }));
  const setPer = (key: 'payerAmounts' | 'exact' | 'percent' | 'shares', id: PersonId, value: string) => setForm((s) => ({ ...s, [key]: { ...s[key], [id]: value } }));

  const showAmountError = result.amountError !== null && (!result.amountEmpty || touched.amount || showAll);
  const currencyWord = f.currencyName(form.currency);

  const suggested = [...new Set<CurrencyCode>([groupCurrency(form.groupId), defaultCurrency, ...groups.map((g) => g.group.currency), 'EUR', 'USD', form.currency])];
  const query = (currencyQuery ?? '').trim().toUpperCase();
  const matches =
    currencyQuery === null
      ? []
      : CURRENCY_CODES.filter((code) => !query || code.includes(query) || f.currencyName(code).toUpperCase().includes(query)).slice(0, 24);

  async function save() {
    setShowAll(true);
    setSaveErrors([]);
    if (!result.draft) {
      AccessibilityInfo.announceForAccessibility('Some fields need checking before this can be saved.');
      return;
    }
    setSaving(true);
    try {
      const outcome = await addExpense(result.draft);
      if (outcome.ok) {
        AccessibilityInfo.announceForAccessibility(`Saved ${outcome.expense.description}, ${f.spokenMoney(outcome.expense.total)}.`);
        onClose();
        return;
      }
      const messages = [...outcome.issues.map((i) => issueMessage(f, i, form.currency)), ...outcome.problems];
      setSaveErrors(messages.length ? messages : ['The expense could not be saved.']);
    } catch (error) {
      setSaveErrors([error instanceof Error ? error.message : String(error)]);
    } finally {
      setSaving(false);
    }
  }

  const share = (id: PersonId) => (result.resolved?.[id] ? f.say('Share: ', result.resolved[id]) : f.say('Share: not worked out yet'));

  return (
    <View style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[local.header, { paddingTop: Platform.OS === 'ios' ? space.s : insets.top + space.s, borderBottomColor: c.separator, backgroundColor: c.surface }]}>
        <Button label="Cancel" variant="plain" onPress={onClose} accessibilityHint="Closes without saving" />
        <T variant="headline" accessibilityRole="header" style={[styles.shrink, styles.center]}>
          Add expense
        </T>
        <Button label={saving ? 'Saving…' : 'Save'} variant="filled" onPress={() => void save()} disabled={saving} />
      </View>
      <PreviewBanner />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <Section title="Expense">
            <View style={[styles.row, { gap: space.m }]}>
              <Field
                label="Description"
                value={form.description}
                onChangeText={(description) => update({ description })}
                placeholder="Dinner, rent, taxi…"
                hint="Optional. If empty, the category name is used."
                returnKeyType="next"
                maxLength={120}
              />
              <Field
                label={`Amount (${form.currency})`}
                accessibilityLabel={`Amount in ${currencyWord}`}
                prefix={form.currency}
                value={form.amountText}
                onChangeText={(amountText) => update({ amountText })}
                onBlur={() => setTouched({ amount: true })}
                keyboardType="decimal-pad"
                inputMode="decimal"
                placeholder="0"
                error={showAmountError ? result.amountError : null}
              />
            </View>
          </Section>

          <Section title="Who is it for?">
            <View style={styles.row}>
              <ChipRow label="Personal or group">
                <Chip
                  label="Just me (personal)"
                  selected={form.groupId === null}
                  onPress={() => setForm((s) => withGroup(s, null, defaultCurrency, me))}
                />
                {groups.map((g) => (
                  <Chip
                    key={g.group.id}
                    label={g.group.name}
                    selected={form.groupId === g.group.id}
                    onPress={() => setForm((s) => withGroup(s, g.group.id, g.group.currency, me))}
                  />
                ))}
              </ChipRow>
            </View>
          </Section>

          <Section title="Currency" footer={group ? `${group.name} uses ${f.currencyName(group.currency)} by default.` : `Personal expenses use your default, ${f.currencyName(defaultCurrency)}.`}>
            <View style={[styles.row, { gap: space.m }]}>
              <ChipRow label="Currency">
                {suggested.map((code) => (
                  <Chip key={code} label={code} selected={form.currency === code} onPress={() => update({ currency: code })} accessibilityLabel={f.currencyName(code)} />
                ))}
              </ChipRow>
              {currencyQuery === null ? (
                <Button label="More currencies" onPress={() => setCurrencyQuery('')} style={{ alignSelf: 'flex-start' }} />
              ) : (
                <View style={{ gap: space.s }}>
                  <Field label="Find a currency" value={currencyQuery} onChangeText={setCurrencyQuery} placeholder="Code or name, e.g. CHF" autoCapitalize="characters" />
                  <ChipRow label="Matching currencies">
                    {matches.map((code) => (
                      <Chip
                        key={code}
                        label={code}
                        selected={form.currency === code}
                        onPress={() => {
                          update({ currency: code });
                          setCurrencyQuery(null);
                        }}
                        accessibilityLabel={f.currencyName(code)}
                      />
                    ))}
                  </ChipRow>
                  {matches.length === 0 ? <T tone="secondary">No currency matches.</T> : null}
                </View>
              )}
            </View>
          </Section>

          {group ? (
            <Section title="Paid by">
              <View style={[styles.row, { gap: space.m }]}>
                <ChipRow label="How many people paid">
                  <Chip label="One person" selected={form.payerMode === 'single'} onPress={() => setForm((s) => withPayerMode(s, 'single', members, result.total, f.locale))} />
                  <Chip label="Several people" selected={form.payerMode === 'multiple'} onPress={() => setForm((s) => withPayerMode(s, 'multiple', members, result.total, f.locale))} />
                </ChipRow>
                {form.payerMode === 'single' ? (
                  <ChipRow label="Who paid">
                    {members.map((id) => (
                      <Chip key={id} label={f.name(id)} selected={form.payerId === id} onPress={() => update({ payerId: id })} accessibilityLabel={`${f.name(id)} paid`} />
                    ))}
                  </ChipRow>
                ) : (
                  <View style={{ gap: space.m }}>
                    {members.map((id) => (
                      <Field
                        key={id}
                        label={`${f.name(id)} paid`}
                        accessibilityLabel={`Amount ${f.name(id)} paid, in ${currencyWord}`}
                        prefix={form.currency}
                        value={form.payerAmounts[id] ?? ''}
                        onChangeText={(v) => setPer('payerAmounts', id, v)}
                        keyboardType="decimal-pad"
                        inputMode="decimal"
                        placeholder="Didn't pay"
                        error={result.payerErrors[id] ?? null}
                      />
                    ))}
                    {result.payerProgress ? <SpokenText value={result.payerProgress} variant="subhead" tone="secondary" /> : null}
                    {(showAll || result.total) && result.payerGeneral.length ? result.payerGeneral.map((m) => <ErrorText key={m}>{`Check: ${m}`}</ErrorText>) : null}
                  </View>
                )}
              </View>
            </Section>
          ) : null}

          {group ? (
            <Section title="Split" footer="Shares are worked out exactly and always add up to the total.">
              <View style={styles.row}>
                <ChipRow label="Split method">
                  {SPLIT_METHODS.map((m) => (
                    <Chip key={m.id} label={m.label} selected={form.method === m.id} onPress={() => setForm((s) => withMethod(s, m.id, members, result.total, f.locale))} />
                  ))}
                </ChipRow>
              </View>
              {members.map((id) => {
                const error = result.splitErrors[id] ?? null;
                const name = f.name(id);
                const s = share(id);
                if (form.method === 'equal') {
                  const included = form.included[id] !== false;
                  return (
                    <View key={id} style={[styles.row, { gap: space.s }]}>
                      <Chip
                        role="checkbox"
                        label={name}
                        selected={included}
                        onPress={() => setForm((st) => ({ ...st, included: { ...st.included, [id]: !included } }))}
                        accessibilityLabel={`Include ${name}`}
                      />
                      {included ? <SpokenText value={s} variant="subhead" tone="secondary" /> : <T variant="subhead" tone="secondary">Not included</T>}
                    </View>
                  );
                }
                const key = form.method === 'exact' ? 'exact' : form.method === 'percentage' ? 'percent' : 'shares';
                // "Your percentage", never "You's percentage".
                const whose = f.isMe(id) ? 'Your' : `${name}'s`;
                const fieldLabel = form.method === 'exact' ? `${whose} amount` : form.method === 'percentage' ? `${whose} percentage` : `${whose} shares`;
                const spokenLabel =
                  form.method === 'exact' ? `${whose} exact amount, in ${currencyWord}` : form.method === 'percentage' ? `${whose} percentage of the total` : `${whose} number of shares`;
                return (
                  <View key={id} style={[styles.row, { gap: space.xs }]}>
                    <Field
                      label={fieldLabel}
                      accessibilityLabel={spokenLabel}
                      prefix={form.method === 'exact' ? form.currency : undefined}
                      value={form[key][id] ?? ''}
                      onChangeText={(v) => setPer(key, id, v)}
                      keyboardType="decimal-pad"
                      inputMode="decimal"
                      placeholder={form.method === 'shares' ? 'Not included' : form.method === 'percentage' ? '0 (not included)' : 'Not included'}
                      error={error}
                    />
                    <SpokenText value={s} variant="subhead" tone="secondary" />
                  </View>
                );
              })}
              {result.splitProgress || result.splitGeneral.length ? (
                <View style={[styles.row, { gap: space.xs }]}>
                  {result.splitProgress && form.method !== 'equal' ? <SpokenText value={result.splitProgress} variant="subhead" tone="secondary" /> : null}
                  {result.splitGeneral.map((m) => (
                    <ErrorText key={m}>{`Check: ${m}`}</ErrorText>
                  ))}
                </View>
              ) : null}
            </Section>
          ) : (
            <Section title="Split" footer="A personal expense counts fully toward your own spending.">
              <Row title="Only you" detail={result.resolved?.[me] ? f.say(result.resolved[me]) : undefined} />
            </Section>
          )}

          <Section title="Category">
            <View style={styles.row}>
              <ChipRow label="Category">
                {DEFAULT_CATEGORIES.map((cat) => (
                  <Chip key={cat.id} label={cat.defaultLabel} selected={form.categoryId === cat.id} onPress={() => update({ categoryId: cat.id })} />
                ))}
              </ChipRow>
            </View>
          </Section>

          <Section title="Date">
            <View style={[styles.row, { gap: space.s }]}>
              <T weight="600" accessibilityLiveRegion="polite">
                {relativeDay(f, form.date, today)}
              </T>
              <View style={[styles.rowMain, { flexWrap: 'wrap' }]}>
                <Button label="‹ Day before" onPress={() => update({ date: addDays(form.date, -1) })} accessibilityLabel="Previous day" />
                <Button label="Day after ›" onPress={() => update({ date: addDays(form.date, 1) })} disabled={form.date >= today} accessibilityLabel="Next day" />
                {form.date !== today ? <Button label="Today" variant="plain" onPress={() => update({ date: today })} /> : null}
              </View>
            </View>
          </Section>

          <Section>
            <View style={[styles.row, { gap: space.s }]}>
              {showAll && !result.draft ? <ErrorText>Some fields need checking before this can be saved. Each one says what to fix.</ErrorText> : null}
              {saveErrors.map((m) => (
                <ErrorText key={m}>{m}</ErrorText>
              ))}
              <Button label={saving ? 'Saving…' : 'Save expense'} variant="filled" onPress={() => void save()} disabled={saving} />
            </View>
          </Section>
          {!profile ? <Note>Profile not loaded.</Note> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const local = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.s,
    paddingHorizontal: space.s,
    paddingBottom: space.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
