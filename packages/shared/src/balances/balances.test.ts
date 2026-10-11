import { describe, expect, it } from 'vitest';

import { money, type Money } from '../money/money';
import { buildExpense, createSettlement } from '../model/factories';
import { createSeededRandom } from '../model/ids';
import type { Expense, Settlement } from '../model/types';
import type { SplitSpec } from '../splits/types';
import { testDeps } from '../test/helpers';
import { UnbalancedLedgerError, balancesByGroup, computeNetBalances, expenseDebts, pairwiseDebts, personalOverview, simplifyDebts, type CurrencyBalances } from './balances';

const deps = testDeps(3);
const usd = (n: number) => money(n, 'USD');
const exp = (total: Money, paidBy: string | { personId: string; amount: Money }[], split: SplitSpec, groupId: string | null = 'g1', occurredOn = '2026-03-01'): Expense =>
  buildExpense({ groupId, description: 'x', total, paidBy, split, occurredOn, createdBy: 'a' }, deps);
const settle = (from: string, to: string, amount: Money, status: Settlement['status'] = 'confirmed', groupId: string | null = 'g1'): Settlement =>
  createSettlement({ groupId, fromPersonId: from, toPersonId: to, amount, status, occurredOn: '2026-03-02' }, deps);
const nets = (b: readonly CurrencyBalances[]) => Object.fromEntries(b.flatMap((c) => c.balances.map((m) => [`${c.currency}:${m.personId}`, m.net.amountMinor])));

describe('computeNetBalances', () => {
  it('credits payers and debits participants', () => {
    const e = exp(usd(3000), 'a', { type: 'equal', participants: ['a', 'b', 'c'] });
    expect(nets(computeNetBalances([e], []))).toEqual({ 'USD:a': 2000, 'USD:b': -1000, 'USD:c': -1000 });
  });

  it('handles multiple payers', () => {
    const e = exp(usd(9000), [{ personId: 'a', amount: usd(5000) }, { personId: 'b', amount: usd(4000) }], { type: 'equal', participants: ['a', 'b', 'c'] });
    expect(nets(computeNetBalances([e], []))).toEqual({ 'USD:a': 2000, 'USD:b': 1000, 'USD:c': -3000 });
  });

  it('applies only confirmed settlements', () => {
    const e = exp(usd(3000), 'a', { type: 'equal', participants: ['a', 'b', 'c'] });
    const s = [settle('b', 'a', usd(400)), settle('c', 'a', usd(1000), 'pending')];
    expect(nets(computeNetBalances([e], s))).toEqual({ 'USD:a': 1600, 'USD:b': -600, 'USD:c': -1000 });
  });

  it('keeps currencies apart', () => {
    const list = [exp(usd(1000), 'a', { type: 'equal', participants: ['a', 'b'] }), exp(money(1000, 'JPY'), 'b', { type: 'equal', participants: ['a', 'b'] })];
    const b = computeNetBalances(list, []);
    expect(b.map((c) => c.currency)).toEqual(['JPY', 'USD']);
    expect(nets(b)).toEqual({ 'JPY:a': -500, 'JPY:b': 500, 'USD:a': 500, 'USD:b': -500 });
  });

  it('scopes by group and lists zero members', () => {
    const list = [exp(usd(1000), 'a', { type: 'equal', participants: ['a', 'b'] }, 'g1'), exp(usd(1000), 'a', { type: 'equal', participants: ['a', 'c'] }, null)];
    expect(nets(computeNetBalances(list, [], { groupId: 'g1', memberIds: ['a', 'b', 'z'] }))).toEqual({ 'USD:a': 500, 'USD:b': -500, 'USD:z': 0 });
    expect(nets(computeNetBalances(list, [], { groupId: null }))).toEqual({ 'USD:a': 500, 'USD:c': -500 });
    expect(balancesByGroup(list, []).map((g) => g.groupId)).toEqual([null, 'g1']);
  });
});

describe('pairwise debts', () => {
  it('splits a multi-payer expense across payers without drift', () => {
    const e = exp(usd(1000), [{ personId: 'a', amount: usd(333) }, { personId: 'b', amount: usd(667) }], { type: 'equal', participants: ['a', 'b', 'c'] });
    const debts = expenseDebts(e);
    const owedTo = (p: string) => debts.filter((d) => d.to === p).reduce((s, d) => s + d.amount.amountMinor, 0);
    const owedBy = (p: string) => debts.filter((d) => d.from === p).reduce((s, d) => s + d.amount.amountMinor, 0);
    const n = nets(computeNetBalances([e], []));
    for (const p of ['a', 'b', 'c']) expect(owedTo(p) - owedBy(p)).toBe(n[`USD:${p}`]);
  });

  it('nets pairs and applies settlements', () => {
    const list = [exp(usd(1000), 'a', { type: 'equal', participants: ['a', 'b'] }), exp(usd(600), 'b', { type: 'equal', participants: ['a', 'b'] })];
    expect(pairwiseDebts(list, [])).toEqual([{ from: 'b', to: 'a', amount: usd(200) }]);
    expect(pairwiseDebts(list, [settle('b', 'a', usd(200))])).toEqual([]);
    expect(pairwiseDebts(list, [settle('b', 'a', usd(300))])).toEqual([{ from: 'a', to: 'b', amount: usd(100) }]);
  });
});

describe('simplifyDebts', () => {
  it('does not overflow when creditors together exceed MAX_SAFE_INTEGER', () => {
    const big = Number.MAX_SAFE_INTEGER;
    const nets: CurrencyBalances[] = [
      {
        currency: 'USD',
        balances: [
          { personId: 'a', net: usd(big) },
          { personId: 'b', net: usd(big) },
          { personId: 'c', net: usd(-big) },
          { personId: 'd', net: usd(-big) },
        ],
      },
    ];
    expect(simplifyDebts(nets)).toEqual([
      { from: 'c', to: 'a', amount: usd(big) },
      { from: 'd', to: 'b', amount: usd(big) },
    ]);
  });

  it('produces few, deterministic transfers', () => {
    const b: CurrencyBalances[] = [
      {
        currency: 'USD',
        balances: [
          { personId: 'a', net: usd(5000) },
          { personId: 'b', net: usd(-3000) },
          { personId: 'c', net: usd(-1000) },
          { personId: 'd', net: usd(-1000) },
        ],
      },
    ];
    expect(simplifyDebts(b)).toEqual([
      { from: 'b', to: 'a', amount: usd(3000) },
      { from: 'c', to: 'a', amount: usd(1000) },
      { from: 'd', to: 'a', amount: usd(1000) },
    ]);
  });

  it('rejects unbalanced input', () => {
    expect(() => simplifyDebts([{ currency: 'USD', balances: [{ personId: 'a', net: usd(1) }] }])).toThrow(UnbalancedLedgerError);
  });

  it('accepts a GroupBalances and returns nothing when settled', () => {
    expect(simplifyDebts({ groupId: 'g', byCurrency: [{ currency: 'USD', balances: [{ personId: 'a', net: usd(0) }] }] })).toEqual([]);
  });

  it('property: random multi-currency, multi-payer ledgers sum to zero, and simplification conserves every net', () => {
    const rand = createSeededRandom(99);
    const people = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5'];
    const pick = () => people[Math.floor(rand() * people.length)]!;
    for (let run = 0; run < 150; run++) {
      const expenses: Expense[] = [];
      const settlements: Settlement[] = [];
      for (let i = 0; i < 12; i++) {
        const currency = (['USD', 'JPY', 'KWD'] as const)[Math.floor(rand() * 3)]!;
        const total = 1 + Math.floor(rand() * 100000);
        const participants = [...new Set(Array.from({ length: 1 + Math.floor(rand() * 5) }, pick))];
        const payers = [...new Set(Array.from({ length: 1 + Math.floor(rand() * 3) }, pick))];
        const payerAmounts = payers.length <= total ? payers.map((personId, idx) => ({ personId, amount: money(0, currency), idx })) : [];
        if (!payerAmounts.length) continue;
        const parts = (() => {
          const w = payers.map(() => 1 + Math.floor(rand() * 10));
          const s = w.reduce((a, b) => a + b, 0);
          const raw = w.map((x) => Math.floor((total * x) / s));
          raw[0]! += total - raw.reduce((a, b) => a + b, 0);
          return raw;
        })();
        if (parts.some((p) => p <= 0)) continue;
        const spec: SplitSpec = rand() < 0.5 ? { type: 'equal', participants } : { type: 'shares', shares: participants.map((personId) => ({ personId, shares: 1 + Math.floor(rand() * 4) })) };
        expenses.push(exp(money(total, currency), payers.map((personId, idx) => ({ personId, amount: money(parts[idx]!, currency) })), spec));
        if (rand() < 0.3) {
          const from = pick();
          const to = pick();
          if (from !== to) settlements.push(settle(from, to, money(1 + Math.floor(rand() * 5000), currency), rand() < 0.7 ? 'confirmed' : 'pending'));
        }
      }
      const balances = computeNetBalances(expenses, settlements);
      for (const c of balances) expect(c.balances.reduce((a, m) => a + m.net.amountMinor, 0)).toBe(0);
      const transfers = simplifyDebts(balances);
      for (const c of balances) {
        const inCurrency = transfers.filter((t) => t.amount.currency === c.currency);
        expect(inCurrency.length).toBeLessThanOrEqual(Math.max(0, c.balances.length - 1));
        for (const m of c.balances) {
          const flow = inCurrency.reduce((a, t) => a + (t.from === m.personId ? t.amount.amountMinor : 0) - (t.to === m.personId ? t.amount.amountMinor : 0), 0);
          expect(flow).toBe(0 - m.net.amountMinor); // paying out your debt brings you to zero
        }
        expect(inCurrency.every((t) => t.amount.amountMinor > 0 && t.from !== t.to)).toBe(true);
      }
      // Pairwise debts reproduce the same nets exactly.
      const pairs = pairwiseDebts(expenses, settlements);
      const n = nets(balances);
      const fromPairs: Record<string, number> = {};
      for (const t of pairs) {
        fromPairs[`${t.amount.currency}:${t.to}`] = (fromPairs[`${t.amount.currency}:${t.to}`] ?? 0) + t.amount.amountMinor;
        fromPairs[`${t.amount.currency}:${t.from}`] = (fromPairs[`${t.amount.currency}:${t.from}`] ?? 0) - t.amount.amountMinor;
      }
      for (const [k, v] of Object.entries(n)) expect(fromPairs[k] ?? 0).toBe(v);
      expect(simplifyDebts(balances)).toEqual(transfers);
    }
  });
});

describe('personalOverview', () => {
  it('reports owe/owed per currency and never mixes currencies', () => {
    const list = [
      exp(usd(3000), 'a', { type: 'equal', participants: ['a', 'b', 'c'] }, 'g1'),
      exp(usd(1000), 'b', { type: 'equal', participants: ['a', 'b'] }, 'g2'),
      exp(money(900, 'JPY'), 'c', { type: 'equal', participants: ['a', 'c'] }, 'g3'),
      exp(money(500, 'EUR'), 'a', { type: 'equal', participants: ['a', 'b'] }, null),
    ];
    const o = personalOverview('a', list, [settle('b', 'a', usd(200), 'confirmed', 'g1')]);
    expect(o.owed).toEqual([money(250, 'EUR'), usd(1800)]);
    expect(o.owe).toEqual([money(450, 'JPY'), usd(500)]);
    expect(o.net).toEqual([money(250, 'EUR'), money(-450, 'JPY'), usd(1300)]);
    expect(o.byGroup).toEqual([
      { groupId: null, net: money(250, 'EUR') },
      { groupId: 'g1', net: usd(1800) },
      { groupId: 'g2', net: usd(-500) },
      { groupId: 'g3', net: money(-450, 'JPY') },
    ]);
    // b owes a 1000 - 200 (g1) and a owes b 500 (g2): net 300 USD across groups.
    expect(o.byPerson).toEqual([
      { personId: 'b', net: money(250, 'EUR') },
      { personId: 'c', net: money(-450, 'JPY') },
      { personId: 'b', net: usd(300) },
      { personId: 'c', net: usd(1000) },
    ]);
  });
});
