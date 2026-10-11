import { describe, expect, it } from 'vitest';

import { money } from '../money/money';
import { fixedClock, testDeps, withTimeZone } from '../test/helpers';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_IDS,
  ExpenseValidationError,
  addDays,
  addMonths,
  buildExpense,
  createBudget,
  createGroup,
  createIdGenerator,
  createPerson,
  createProfile,
  createSeededIdGenerator,
  createSettlement,
  daysBetween,
  daysInMonth,
  isDefaultCategoryId,
  isInstant,
  isLocalDate,
  isMonthKey,
  isUlid,
  lastDayOfMonth,
  localDateFromDate,
  localDateInTimeZone,
  makeLocalDate,
  monthOf,
  monthRange,
  todayLocal,
  validateExpense,
} from './index';

describe('dates', () => {
  it('keeps years 0000-0099 in their own century', () => {
    expect(addDays('0050-01-01', 1)).toBe('0050-01-02');
    expect(addDays('0099-12-31', 1)).toBe('0100-01-01');
    expect(daysBetween('0050-01-01', '0051-01-01')).toBe(365);
    expect(isLocalDate('0000-02-29')).toBe(true); // year 0 is a leap year in the proleptic Gregorian calendar
    expect(isLocalDate('0100-02-29')).toBe(false);
    expect(daysInMonth('0001-02')).toBe(28);
  });

  it('monthRange terminates at the year 9999 boundary', () => {
    expect(monthRange('9999-11', '9999-12')).toEqual(['9999-11', '9999-12']);
    expect(monthRange('2026-03', '2026-01')).toEqual([]);
  });

  it('validates calendar dates', () => {
    expect(isLocalDate('2024-02-29')).toBe(true);
    expect(isLocalDate('2026-02-29')).toBe(false);
    expect(isLocalDate('2026-04-31')).toBe(false);
    expect(isLocalDate('2026-1-01')).toBe(false);
    expect(isLocalDate('2026-01-01T00:00:00Z')).toBe(false);
    expect(isMonthKey('2026-12')).toBe(true);
    expect(isMonthKey('2026-13')).toBe(false);
    expect(isInstant('2026-03-01T12:00:00.000Z')).toBe(true);
    expect(isInstant('2026-03-01')).toBe(false);
    expect(() => makeLocalDate(2026, 2, 30)).toThrow(RangeError);
  });

  it('does calendar arithmetic without time zones', () => {
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31);
    expect(daysBetween('2026-03-08', '2026-03-01')).toBe(-7);
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-11', 14)).toBe('2028-01');
    expect(monthRange('2025-11', '2026-02')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
    expect(monthRange('2026-02', '2026-01')).toEqual([]);
    expect(daysInMonth('2024-02')).toBe(29);
    expect(lastDayOfMonth('2026-02')).toBe('2026-02-28');
    expect(monthOf('2026-03-14')).toBe('2026-03');
  });

  it('keeps DST-crossing arithmetic exact in a DST time zone', () => {
    withTimeZone('America/New_York', () => {
      expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
      expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
      expect(daysBetween('2026-03-01', '2026-03-31')).toBe(30);
      expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    });
  });

  it('takes the local calendar date, not the UTC one (negative UTC offset)', () => {
    withTimeZone('America/Los_Angeles', () => {
      // 8pm on Feb 28 in Los Angeles is already March 1 in UTC.
      const evening = new Date('2026-03-01T04:00:00.000Z');
      expect(localDateFromDate(evening)).toBe('2026-02-28');
      expect(todayLocal(() => evening)).toBe('2026-02-28');
      expect(evening.toISOString().slice(0, 10)).toBe('2026-03-01'); // the old bug
    });
    expect(localDateInTimeZone('2026-03-01T04:00:00.000Z', 'America/Los_Angeles')).toBe('2026-02-28');
    expect(localDateInTimeZone('2026-02-28T20:00:00.000Z', 'Asia/Tokyo')).toBe('2026-03-01');
  });
});

describe('ids', () => {
  it('generates sortable ULIDs', () => {
    let t = 1_700_000_000_000;
    let b = 0;
    const ids = createIdGenerator({ now: () => t++, random: (n) => Uint8Array.from({ length: n }, () => b++ % 256) });
    const a = ids();
    const c = ids();
    expect(isUlid(a)).toBe(true);
    expect(a.length).toBe(26);
    expect(a < c).toBe(true);
  });

  it('is deterministic when seeded and unique across many ids', () => {
    const first = createSeededIdGenerator(7);
    const second = createSeededIdGenerator(7);
    const list = Array.from({ length: 5000 }, () => first());
    expect(Array.from({ length: 5000 }, () => second())).toEqual(list);
    expect(new Set(list).size).toBe(5000);
    expect(createSeededIdGenerator(8)()).not.toBe(list[0]);
  });

  it('uses crypto.getRandomValues by default', () => {
    const id = createIdGenerator()();
    expect(isUlid(id)).toBe(true);
  });
});

describe('categories', () => {
  it('has stable unique ids and no design attributes', () => {
    expect(new Set(DEFAULT_CATEGORY_IDS).size).toBe(DEFAULT_CATEGORY_IDS.length);
    expect(DEFAULT_CATEGORY_IDS).toContain('other');
    for (const c of DEFAULT_CATEGORIES) expect(Object.keys(c).sort()).toEqual(['defaultLabel', 'id']);
    expect(isDefaultCategoryId('food')).toBe(true);
    expect(isDefaultCategoryId('crypto')).toBe(false);
  });
});

describe('factories', () => {
  const deps = testDeps();
  const me = createPerson({ displayName: 'Tester A' }, deps);
  const other = createPerson({ displayName: 'Tester B', email: 'b@example.invalid' }, deps);

  it('creates people, profiles and groups', () => {
    expect(me.linkedUserId).toBeNull();
    expect(me.createdAt).toBe('2026-03-01T12:00:00.000Z');
    expect(other.email).toBe('b@example.invalid');
    expect(() => createPerson({ displayName: '  ' }, deps)).toThrow(RangeError);
    const profile = createProfile({ personId: me.id, displayName: 'Tester A', defaultCurrency: 'GBP', locale: 'en-GB' }, deps);
    expect(profile.defaultCurrency).toBe('GBP');
    const g = createGroup({ name: ' Flat ', currency: 'GBP', createdBy: me.id, memberIds: [other.id, me.id, other.id] }, deps);
    expect(g.name).toBe('Flat');
    expect(g.memberIds).toEqual([me.id, other.id]);
    expect(g.archived).toBe(false);
  });

  it('builds a personal expense with a single owner split', () => {
    const e = buildExpense({ description: ' Coffee ', total: money(450, 'GBP'), paidBy: me.id, occurredOn: '2026-03-01', createdBy: me.id }, deps);
    expect(e.groupId).toBeNull();
    expect(e.description).toBe('Coffee');
    expect(e.categoryId).toBe('other');
    expect(e.splits).toEqual([{ personId: me.id, amount: money(450, 'GBP') }]);
    expect(e.occurredAt).toBeNull();
    expect(validateExpense(e)).toEqual([]);
  });

  it('rejects invalid expenses with issue codes', () => {
    const bad = () =>
      buildExpense(
        { description: 'x', total: money(1000, 'GBP'), paidBy: [{ personId: me.id, amount: money(900, 'GBP') }], split: { type: 'equal', participants: [me.id, other.id] }, occurredOn: '2026-02-30', createdBy: me.id },
        deps,
      );
    expect(bad).toThrow(ExpenseValidationError);
    try {
      bad();
    } catch (e) {
      expect((e as ExpenseValidationError).issues.map((i) => i.code).sort()).toEqual(['invalid_date', 'payer_sum_mismatch']);
    }
    expect(() =>
      buildExpense({ description: 'x', total: money(0, 'GBP'), paidBy: me.id, occurredOn: '2026-03-01', createdBy: me.id }, deps),
    ).toThrow(ExpenseValidationError);
    expect(() =>
      buildExpense({ description: 'x', total: money(100, 'GBP'), paidBy: me.id, split: { type: 'equal', participants: [me.id, other.id] }, occurredOn: '2026-03-01', createdBy: me.id }, { ...deps, memberIds: [me.id] }),
    ).toThrow(ExpenseValidationError);
  });

  it('detects tampered splits', () => {
    const e = buildExpense({ description: 'x', total: money(1000, 'GBP'), paidBy: me.id, split: { type: 'equal', participants: [me.id, other.id] }, occurredOn: '2026-03-01', createdBy: me.id }, deps);
    const tampered = { ...e, splits: [{ personId: me.id, amount: money(400, 'GBP') }, { personId: other.id, amount: money(600, 'GBP') }] };
    expect(validateExpense(tampered).map((i) => i.code)).toEqual(['splits_mismatch']);
  });

  it('creates settlements and budgets', () => {
    const s = createSettlement({ fromPersonId: other.id, toPersonId: me.id, amount: money(500, 'GBP'), occurredOn: '2026-03-01', status: 'confirmed' }, { ...deps, clock: fixedClock('2026-03-02T00:00:00.000Z') });
    expect(s.confirmedAt).toBe('2026-03-02T00:00:00.000Z');
    expect(s.method).toBe('other');
    expect(() => createSettlement({ fromPersonId: me.id, toPersonId: me.id, amount: money(1, 'GBP'), occurredOn: '2026-03-01' }, deps)).toThrow(RangeError);
    expect(() => createSettlement({ fromPersonId: other.id, toPersonId: me.id, amount: money(0, 'GBP'), occurredOn: '2026-03-01' }, deps)).toThrow(RangeError);
    expect(createBudget({ categoryId: 'food', amount: money(20000, 'GBP') }, deps).period).toBe('monthly');
    expect(() => createBudget({ categoryId: null, amount: money(-1, 'GBP') }, deps)).toThrow(RangeError);
  });
});
