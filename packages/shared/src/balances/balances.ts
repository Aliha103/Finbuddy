import { compareCodeUnits } from '../internal/decimal';
import type { CurrencyCode } from '../money/currencies';
import { allocateMinor, type Money } from '../money/money';
import type { Expense, GroupId, Settlement } from '../model/types';
import type { PersonId } from '../splits/types';

/**
 * Sign convention used everywhere in this module:
 * net > 0  -> the person is owed money (others owe them);
 * net < 0  -> the person owes money.
 * Balances are always per currency. Nothing here adds amounts of different currencies;
 * use sumConverted() from fx/ with explicit rates when a single figure is needed.
 * Only settlements with status 'confirmed' change balances; pending ones are ignored.
 */
export interface MemberBalance {
  readonly personId: PersonId;
  readonly net: Money;
}

export interface CurrencyBalances {
  readonly currency: CurrencyCode;
  /** Sorted by personId; nets sum to exactly zero. */
  readonly balances: readonly MemberBalance[];
}

export interface GroupBalances {
  /** null collects expenses and settlements outside any group. */
  readonly groupId: GroupId | null;
  /** Sorted by currency code. */
  readonly byCurrency: readonly CurrencyBalances[];
}

/** `from` owes (or should pay) `to` the positive `amount`. */
export interface Transfer {
  readonly from: PersonId;
  readonly to: PersonId;
  readonly amount: Money;
}

export class UnbalancedLedgerError extends Error {
  constructor(currency: CurrencyCode, residualMinor: number) {
    super(`Balances in ${currency} do not sum to zero (residual ${residualMinor})`);
    this.name = 'UnbalancedLedgerError';
  }
}

function safeAdd(a: number, b: number): number {
  const r = a + b;
  if (!Number.isSafeInteger(r)) throw new RangeError('Balance exceeds Number.MAX_SAFE_INTEGER');
  return r;
}

class NetLedger {
  readonly nets = new Map<CurrencyCode, Map<PersonId, number>>();
  addTo(currency: CurrencyCode, personId: PersonId, deltaMinor: number) {
    let byPerson = this.nets.get(currency);
    if (!byPerson) this.nets.set(currency, (byPerson = new Map()));
    byPerson.set(personId, safeAdd(byPerson.get(personId) ?? 0, deltaMinor));
  }
  toBalances(includePeople: readonly PersonId[] = []): CurrencyBalances[] {
    return [...this.nets.entries()]
      .sort(([a], [b]) => compareCodeUnits(a, b))
      .map(([currency, byPerson]) => {
        for (const personId of includePeople) if (!byPerson.has(personId)) byPerson.set(personId, 0);
        return {
          currency,
          balances: [...byPerson.entries()]
            .sort(([a], [b]) => compareCodeUnits(a, b))
            .map(([personId, amountMinor]) => ({ personId, net: { amountMinor: amountMinor === 0 ? 0 : amountMinor, currency } })),
        };
      });
  }
}

function inScope(groupId: GroupId | null, scope: GroupId | null | undefined): boolean {
  return scope === undefined || groupId === scope;
}

export interface BalanceScope {
  /** Restrict to one group, or null for non-group records. Omit for everything. */
  readonly groupId?: GroupId | null;
  /** People to list even when their net is zero (e.g. all group members). */
  readonly memberIds?: readonly PersonId[];
}

/**
 * Net balance per person per currency. Each expense credits payers with what they paid and
 * debits participants with their share; each confirmed settlement credits the payer and
 * debits the receiver. Per currency, the nets always sum to exactly zero.
 */
export function computeNetBalances(expenses: readonly Expense[], settlements: readonly Settlement[], scope: BalanceScope = {}): CurrencyBalances[] {
  const ledger = new NetLedger();
  for (const e of expenses) {
    if (!inScope(e.groupId, scope.groupId)) continue;
    for (const p of e.paidBy) ledger.addTo(p.amount.currency, p.personId, p.amount.amountMinor);
    for (const s of e.splits) ledger.addTo(s.amount.currency, s.personId, -s.amount.amountMinor);
  }
  for (const s of settlements) {
    if (s.status !== 'confirmed' || !inScope(s.groupId, scope.groupId)) continue;
    ledger.addTo(s.amount.currency, s.fromPersonId, s.amount.amountMinor);
    ledger.addTo(s.amount.currency, s.toPersonId, -s.amount.amountMinor);
  }
  return ledger.toBalances(scope.memberIds);
}

/** computeNetBalances for every group (and the null "no group" bucket) present in the data. */
export function balancesByGroup(expenses: readonly Expense[], settlements: readonly Settlement[]): GroupBalances[] {
  const ids = new Set<GroupId | null>();
  for (const e of expenses) ids.add(e.groupId);
  for (const s of settlements) if (s.status === 'confirmed') ids.add(s.groupId);
  return [...ids]
    .sort((a, b) => (a === null ? -1 : b === null ? 1 : compareCodeUnits(a, b)))
    .map((groupId) => ({ groupId, byCurrency: computeNetBalances(expenses, settlements, { groupId }) }));
}

/** Pair ledger keyed by currency + ordered pair; value = what the first id owes the second. */
class PairLedger {
  private readonly pairs = new Map<string, { currency: CurrencyCode; a: PersonId; b: PersonId; aOwesB: number }>();
  owe(currency: CurrencyCode, debtor: PersonId, creditor: PersonId, amountMinor: number) {
    if (debtor === creditor || amountMinor === 0) return;
    const [a, b, sign] = compareCodeUnits(debtor, creditor) < 0 ? [debtor, creditor, 1] : [creditor, debtor, -1];
    const key = JSON.stringify([currency, a, b]);
    const entry = this.pairs.get(key) ?? { currency, a, b, aOwesB: 0 };
    entry.aOwesB = safeAdd(entry.aOwesB, sign * amountMinor);
    this.pairs.set(key, entry);
  }
  transfers(): Transfer[] {
    const out: Transfer[] = [];
    for (const { currency, a, b, aOwesB } of this.pairs.values()) {
      if (aOwesB > 0) out.push({ from: a, to: b, amount: { amountMinor: aOwesB, currency } });
      if (aOwesB < 0) out.push({ from: b, to: a, amount: { amountMinor: -aOwesB, currency } });
    }
    return out.sort(compareTransfers);
  }
}

function compareTransfers(x: Transfer, y: Transfer): number {
  return compareCodeUnits(x.amount.currency, y.amount.currency) || compareCodeUnits(x.from, y.from) || compareCodeUnits(x.to, y.to);
}

/**
 * Splits one expense into who owes which payer. With several payers each participant's share
 * is divided among the payers in proportion to what they still have to be repaid, processing
 * participants in split order; this keeps every payer's total exact (no rounding drift).
 */
export function expenseDebts(expense: Expense): Transfer[] {
  const currency = expense.total.currency;
  const remaining = expense.paidBy.map((p) => p.amount.amountMinor);
  const ledger = new PairLedger();
  for (const split of expense.splits) {
    const share = split.amount.amountMinor;
    if (share === 0) continue;
    const parts = allocateMinor(share, remaining);
    parts.forEach((part, i) => {
      const payer = expense.paidBy[i];
      if (!payer) return;
      remaining[i] = (remaining[i] ?? 0) - part;
      ledger.owe(currency, split.personId, payer.personId, part);
    });
  }
  return ledger.transfers();
}

/**
 * Who owes whom, pair by pair, without simplification: debts from every expense in scope,
 * netted per pair and currency, minus confirmed settlements. Summing a person's incoming
 * minus outgoing amounts gives exactly their computeNetBalances() net.
 */
export function pairwiseDebts(expenses: readonly Expense[], settlements: readonly Settlement[], scope: Pick<BalanceScope, 'groupId'> = {}): Transfer[] {
  const ledger = new PairLedger();
  for (const e of expenses) {
    if (!inScope(e.groupId, scope.groupId)) continue;
    for (const t of expenseDebts(e)) ledger.owe(t.amount.currency, t.from, t.to, t.amount.amountMinor);
  }
  for (const s of settlements) {
    if (s.status !== 'confirmed' || !inScope(s.groupId, scope.groupId)) continue;
    // Paying someone reduces what you owe them (or makes them owe you).
    ledger.owe(s.amount.currency, s.toPersonId, s.fromPersonId, s.amount.amountMinor);
  }
  return ledger.transfers();
}

/**
 * Turns net balances into a small set of transfers that settles everyone (at most n-1 per
 * currency). Greedy: repeatedly the largest debtor pays the largest creditor the smaller of
 * the two amounts; ties go to the lower personId, so the output is deterministic.
 * Every person's net is conserved exactly. Throws UnbalancedLedgerError if a currency's nets
 * do not sum to zero.
 */
export function simplifyDebts(input: readonly CurrencyBalances[] | GroupBalances): Transfer[] {
  const byCurrency = 'byCurrency' in input ? input.byCurrency : input;
  const transfers: Transfer[] = [];
  for (const { currency, balances } of byCurrency) {
    // BigInt: each net is a safe integer, but the creditors' sum alone may exceed MAX_SAFE_INTEGER.
    const total = balances.reduce((acc, b) => acc + BigInt(b.net.amountMinor), 0n);
    if (total !== 0n) throw new UnbalancedLedgerError(currency, Number(total));
    const creditors = balances.filter((b) => b.net.amountMinor > 0).map((b) => ({ id: b.personId, amt: b.net.amountMinor }));
    const debtors = balances.filter((b) => b.net.amountMinor < 0).map((b) => ({ id: b.personId, amt: -b.net.amountMinor }));
    const pickMax = (list: { id: PersonId; amt: number }[]) =>
      list.reduce<{ id: PersonId; amt: number } | undefined>((best, x) => (x.amt > 0 && (!best || x.amt > best.amt || (x.amt === best.amt && compareCodeUnits(x.id, best.id) < 0)) ? x : best), undefined);
    for (;;) {
      const c = pickMax(creditors);
      const d = pickMax(debtors);
      if (!c || !d) break;
      const amt = Math.min(c.amt, d.amt);
      transfers.push({ from: d.id, to: c.id, amount: { amountMinor: amt, currency } });
      c.amt -= amt;
      d.amt -= amt;
    }
  }
  return transfers;
}

export interface PersonalOverview {
  readonly personId: PersonId;
  /** Total I owe, per currency (positive amounts), from groups where my net is negative. */
  readonly owe: readonly Money[];
  /** Total owed to me, per currency (positive amounts), from groups where my net is positive. */
  readonly owed: readonly Money[];
  /** owed - owe per currency (signed). */
  readonly net: readonly Money[];
  /** My non-zero net in each group and currency. groupId null = outside groups. */
  readonly byGroup: readonly { readonly groupId: GroupId | null; readonly net: Money }[];
  /** My non-zero net with each other person across all groups (positive = they owe me), from pairwiseDebts. */
  readonly byPerson: readonly { readonly personId: PersonId; readonly net: Money }[];
}

/**
 * The "what I owe / what I'm owed" picture for one person. Every figure is per currency and
 * never summed across currencies. owe/owed are taken per group (what settling up each group
 * would move); byPerson nets each counterparty across all groups.
 */
export function personalOverview(personId: PersonId, expenses: readonly Expense[], settlements: readonly Settlement[]): PersonalOverview {
  const owe = new Map<CurrencyCode, number>();
  const owed = new Map<CurrencyCode, number>();
  const byGroup: { groupId: GroupId | null; net: Money }[] = [];
  for (const g of balancesByGroup(expenses, settlements)) {
    for (const cb of g.byCurrency) {
      const mine = cb.balances.find((b) => b.personId === personId);
      if (!mine || mine.net.amountMinor === 0) continue;
      byGroup.push({ groupId: g.groupId, net: mine.net });
      const target = mine.net.amountMinor < 0 ? owe : owed;
      target.set(cb.currency, safeAdd(target.get(cb.currency) ?? 0, Math.abs(mine.net.amountMinor)));
    }
  }
  const people = new Map<string, { personId: PersonId; net: Money }>();
  for (const t of pairwiseDebts(expenses, settlements)) {
    if (t.from !== personId && t.to !== personId) continue;
    const other = t.from === personId ? t.to : t.from;
    const delta = t.from === personId ? -t.amount.amountMinor : t.amount.amountMinor;
    const key = JSON.stringify([other, t.amount.currency]);
    const prev = people.get(key)?.net.amountMinor ?? 0;
    people.set(key, { personId: other, net: { amountMinor: safeAdd(prev, delta), currency: t.amount.currency } });
  }
  const toList = (m: Map<CurrencyCode, number>) =>
    [...m.entries()].sort(([a], [b]) => compareCodeUnits(a, b)).map(([currency, amountMinor]) => ({ amountMinor, currency }));
  const currencies = [...new Set([...owe.keys(), ...owed.keys()])].sort(compareCodeUnits);
  return {
    personId,
    owe: toList(owe),
    owed: toList(owed),
    net: currencies.map((currency) => ({ amountMinor: (owed.get(currency) ?? 0) - (owe.get(currency) ?? 0), currency })),
    byGroup,
    byPerson: [...people.values()]
      .filter((p) => p.net.amountMinor !== 0)
      .sort((a, b) => compareCodeUnits(a.net.currency, b.net.currency) || compareCodeUnits(a.personId, b.personId)),
  };
}
