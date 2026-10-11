import type { CurrencyCode } from '../money/currencies';
import type { Money } from '../money/money';
import type { CategoryId } from '../model/categories';
import { addDays, addMonths, daysInMonth, isLocalDate, monthOf, type LocalDate } from '../model/dates';
import { buildExpense, createBudget, createGroup, createPerson, createProfile, createSettlement } from '../model/factories';
import { createSeededIdGenerator } from '../model/ids';
import type { Expense, Group, Person, Settlement, SettlementMethod, SettlementStatus } from '../model/types';
import type { Payer, PersonId, SplitSpec } from '../splits/types';
import { normalizeSnapshot } from './validate';
import type { DataSnapshot } from './repository';

/** The calendar date sample data is built around unless another is given. */
export const SAMPLE_DATA_ANCHOR: LocalDate = '2026-10-15';

/**
 * SAMPLE DATA - ILLUSTRATIVE ONLY. Every record has `isSample: true` and every name ends in
 * "(sample)"; the people are invented. The UI must label it as sample data.
 *
 * Deterministic: the same anchor date always produces identical records and ids. Pass today's
 * date as `anchor` so "this month" insights have something to show.
 *
 * Contents: a GBP personal history over six months (subscriptions, groceries, a food spike
 * and one unusually large purchase this month, a JPY souvenir), plus three groups:
 * a JPY trip, a GBP flat share and a USD dinner club, with people who do not use the app,
 * multi-payer expenses, every split type, monthly rent repayments, partial confirmed
 * settlements and pending ones (one overdue, one due soon), and two GBP budgets.
 */
export function createSampleData(options: { anchor?: LocalDate } = {}): DataSnapshot {
  const anchor = options.anchor ?? SAMPLE_DATA_ANCHOR;
  if (!isLocalDate(anchor)) throw new RangeError(`anchor must be YYYY-MM-DD, got ${JSON.stringify(anchor)}`);
  const ids = createSeededIdGenerator(20261015);
  const anchorMonth = monthOf(anchor);
  /** A date `offset` months from the anchor month, on `day` (clamped to the month and to the anchor). */
  const on = (offset: number, day: number): LocalDate => {
    const month = addMonths(anchorMonth, offset);
    const date = `${month}-${String(Math.min(day, daysInMonth(month))).padStart(2, '0')}`;
    return date > anchor ? anchor : date;
  };
  const clockAt = (date: LocalDate) => () => new Date(`${date}T12:00:00.000Z`);
  const created = clockAt(on(-6, 1));
  const sample = { isSample: true as const };

  const person = (displayName: string): Person => createPerson({ displayName, ...sample }, { ids, clock: created });
  const me = person('You (sample)');
  const avery = person('Avery (sample)');
  const blake = person('Blake (sample)');
  const casey = person('Casey (sample)');
  const devon = person('Devon (sample)');
  const emery = person('Emery (sample)');
  const profile = createProfile({ personId: me.id, displayName: me.displayName, defaultCurrency: 'GBP', locale: 'en-GB', ...sample }, { ids, clock: created });

  const group = (name: string, currency: CurrencyCode, members: readonly Person[]): Group =>
    createGroup({ name, currency, createdBy: me.id, memberIds: members.map((p) => p.id), ...sample }, { ids, clock: created });
  const trip = group('Trip to Japan (sample)', 'JPY', [me, avery, blake]);
  const flat = group('Flat share (sample)', 'GBP', [me, casey, devon]);
  const club = group('Dinner club (sample)', 'USD', [me, avery, emery, devon]);

  const expenses: Expense[] = [];
  const money = (amountMinor: number, currency: CurrencyCode): Money => ({ amountMinor, currency });
  const add = (
    g: Group | null,
    date: LocalDate,
    description: string,
    categoryId: CategoryId,
    total: Money,
    paidBy: PersonId | readonly Payer[],
    split?: SplitSpec,
  ) => {
    expenses.push(
      buildExpense(
        { groupId: g?.id ?? null, description, categoryId, total, paidBy, ...(split ? { split } : {}), occurredOn: date, createdBy: me.id, ...sample },
        { ids, clock: clockAt(date), ...(g ? { memberIds: g.memberIds } : {}) },
      ),
    );
  };
  const gbp = (minor: number) => money(minor, 'GBP');
  const equal = (...people: Person[]): SplitSpec => ({ type: 'equal', participants: people.map((p) => p.id) });

  // Personal history, GBP.
  const groceries = [4520, 3875, 5210, 4105];
  const shopping = [1599, 2450, 899, 3200, 1875, 2200];
  for (let offset = -5; offset <= 0; offset++) {
    add(null, on(offset, 1), 'Train pass', 'transport', gbp(14250), me.id);
    add(null, on(offset, 3), 'Gym membership', 'personal_care', gbp(3500), me.id);
    add(null, on(offset, 5), 'Streaming subscription', 'subscriptions', gbp(1099), me.id);
    [2, 9, 16, 23].forEach((day, i) => {
      if (offset === 0 && on(0, day) !== `${anchorMonth}-${String(day).padStart(2, '0')}`) return;
      add(null, on(offset, day), 'Weekly groceries', 'groceries', gbp(groceries[(i + offset + 5) % 4] ?? 4000), me.id);
    });
    if (offset < 0) {
      add(null, on(offset, 6), 'Lunch out', 'food', gbp(1250 + (offset + 5) * 75), me.id);
      add(null, on(offset, 20), 'Lunch out', 'food', gbp(1400), me.id);
    }
    if (offset >= -3 && offset <= -1) {
      const i = (offset + 3) * 2;
      add(null, on(offset, 12), 'Household items', 'shopping', gbp(shopping[i] ?? 1500), me.id);
      add(null, on(offset, 24), 'Household items', 'shopping', gbp(shopping[i + 1] ?? 1500), me.id);
    }
  }
  // This month: more eating out than usual, and one large purchase.
  add(null, on(0, 4), 'Dinner out', 'food', gbp(4800), me.id);
  add(null, on(0, 6), 'Lunch out', 'food', gbp(1250), me.id);
  add(null, on(0, 8), 'Birthday dinner', 'food', gbp(7600), me.id);
  add(null, on(0, 11), 'Takeaway', 'food', gbp(2300), me.id);
  add(null, on(0, 10), 'New laptop', 'shopping', gbp(89900), me.id);
  // A personal purchase in another currency.
  add(null, on(-2, 13), 'Souvenirs', 'shopping', money(4800, 'JPY'), me.id);

  // Trip to Japan, JPY: multi-payer hotel, equal/shares/exact splits.
  const jpy = (minor: number) => money(minor, 'JPY');
  add(trip, on(-2, 10), 'Hotel (3 nights)', 'travel', jpy(96000), [{ personId: me.id, amount: jpy(50000) }, { personId: avery.id, amount: jpy(46000) }], equal(me, avery, blake));
  add(trip, on(-2, 10), 'Rail passes', 'transport', jpy(90000), blake.id, equal(me, avery, blake));
  add(trip, on(-2, 11), 'Sushi dinner', 'food', jpy(12345), avery.id, {
    type: 'shares',
    shares: [
      { personId: me.id, shares: 1 },
      { personId: avery.id, shares: 1 },
      { personId: blake.id, shares: 2 },
    ],
  });
  add(trip, on(-2, 12), 'Museum tickets', 'entertainment', jpy(6000), me.id, {
    type: 'exact',
    amounts: [
      { personId: me.id, amountMinor: 2400 },
      { personId: avery.id, amountMinor: 1800 },
      { personId: blake.id, amountMinor: 1800 },
    ],
  });

  // Flat share, GBP: rent by percentage, bills split equally, a multi-payer shop with an adjustment.
  for (let offset = -5; offset <= 0; offset++) {
    add(flat, on(offset, 1), 'Rent', 'housing', gbp(180000), casey.id, {
      type: 'percentage',
      percentages: [
        { personId: me.id, percent: '40' },
        { personId: casey.id, percent: '30' },
        { personId: devon.id, percent: '30' },
      ],
    });
    if (offset < 0) add(flat, on(offset, 15), 'Energy bill', 'utilities', gbp(9000 + (offset + 5) * 437), me.id, equal(me, casey, devon));
  }
  add(flat, on(-1, 18), 'Big grocery shop', 'groceries', gbp(12000), [{ personId: me.id, amount: gbp(7000) }, { personId: devon.id, amount: gbp(5000) }], {
    type: 'adjustment',
    adjustments: [
      { personId: me.id, adjustmentMinor: 0 },
      { personId: casey.id, adjustmentMinor: 0 },
      { personId: devon.id, adjustmentMinor: 1000 },
    ],
  });

  // Dinner club, USD: rotating payers, every split type, one dinner paid by two people.
  const usd = (minor: number) => money(minor, 'USD');
  add(club, on(-4, 20), 'Club dinner', 'food', usd(18740), avery.id, equal(me, avery, emery, devon));
  add(club, on(-3, 20), 'Club dinner', 'food', usd(22000), emery.id, {
    type: 'percentage',
    percentages: [
      { personId: me.id, percent: '33.33' },
      { personId: avery.id, percent: '33.33' },
      { personId: emery.id, percent: '33.33' },
      { personId: devon.id, percent: 0 },
    ],
  });
  add(club, on(-2, 20), 'Club dinner', 'food', usd(25600), me.id, {
    type: 'adjustment',
    adjustments: [
      { personId: me.id, adjustmentMinor: 0 },
      { personId: avery.id, adjustmentMinor: 0 },
      { personId: emery.id, adjustmentMinor: 1500 },
      { personId: devon.id, adjustmentMinor: 0 },
    ],
  });
  add(club, on(-1, 20), 'Club dinner', 'food', usd(19850), [{ personId: devon.id, amount: usd(10000) }, { personId: emery.id, amount: usd(9850) }], equal(me, avery, emery, devon));
  add(club, on(0, 12), 'Club dinner', 'food', usd(21333), me.id, equal(me, avery, emery, devon));

  const settle = (g: Group, from: Person, to: Person, amount: Money, status: SettlementStatus, occurredOn: LocalDate, method: SettlementMethod, dueOn: LocalDate | null = null): Settlement =>
    createSettlement({ groupId: g.id, fromPersonId: from.id, toPersonId: to.id, amount, status, method, occurredOn, dueOn, ...sample }, { ids, clock: clockAt(occurredOn) });
  const settlements: Settlement[] = [];
  // Flatmates repay Casey their rent share each month (all but the current month).
  for (let offset = -5; offset <= -1; offset++) {
    settlements.push(settle(flat, me, casey, gbp(72000), 'confirmed', on(offset, 2), 'bank_transfer'));
    settlements.push(settle(flat, devon, casey, gbp(54000), 'confirmed', on(offset, 3), 'bank_transfer'));
  }
  settlements.push(
    // Partial, confirmed.
    settle(trip, blake, me, jpy(10000), 'confirmed', on(-1, 2), 'cash'),
    settle(flat, me, casey, gbp(30000), 'confirmed', on(-1, 25), 'bank_transfer'),
    settle(club, emery, avery, usd(4000), 'confirmed', on(-2, 28), 'mobile_payment'),
    // Pending: one overdue, one due soon (relative to the anchor date).
    settle(flat, devon, me, gbp(4500), 'pending', on(0, 1), 'bank_transfer', addDays(anchor, -3)),
    settle(flat, me, casey, gbp(20000), 'pending', anchor, 'bank_transfer', addDays(anchor, 2)),
  );

  const budgets = [
    createBudget({ categoryId: 'food', amount: gbp(20000), ...sample }, { ids, clock: created }),
    createBudget({ categoryId: null, amount: gbp(250000), ...sample }, { ids, clock: created }),
  ];

  return normalizeSnapshot({
    profiles: [profile],
    people: [me, avery, blake, casey, devon, emery],
    groups: [trip, flat, club],
    expenses,
    settlements,
    budgets,
  });
}
