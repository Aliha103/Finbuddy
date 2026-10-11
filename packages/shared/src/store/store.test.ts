import { describe, expect, it } from 'vitest';

import { computeNetBalances } from '../balances/balances';
import { money } from '../money/money';
import { buildExpense, createGroup, createPerson, createSettlement } from '../model/factories';
import { fixedClock, testDeps } from '../test/helpers';
import {
  DATA_FORMAT_VERSION,
  DataFormatError,
  DataValidationError,
  InMemoryRepository,
  SAMPLE_DATA_ANCHOR,
  attachPersistence,
  createSampleData,
  deserializeSnapshot,
  emptySnapshot,
  loadSnapshot,
  migrateData,
  saveSnapshot,
  serializeSnapshot,
  validateSnapshot,
  type DataSnapshot,
  type RepositoryChange,
  type StorageAdapter,
} from './index';

class MemoryStorage implements StorageAdapter {
  readonly items = new Map<string, string>();
  writes = 0;
  async getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  async setItem(key: string, value: string) {
    this.writes++;
    this.items.set(key, value);
  }
  async removeItem(key: string) {
    this.items.delete(key);
  }
}

const deps = testDeps(21);
function smallData() {
  const a = createPerson({ displayName: 'Tester A' }, deps);
  const b = createPerson({ displayName: 'Tester B' }, deps);
  const g = createGroup({ name: 'Test group', currency: 'EUR', createdBy: a.id, memberIds: [b.id] }, deps);
  const e = buildExpense({ groupId: g.id, description: 'Dinner', total: money(3001, 'EUR'), paidBy: a.id, split: { type: 'equal', participants: [a.id, b.id] }, occurredOn: '2026-03-01', createdBy: a.id }, { ...deps, memberIds: g.memberIds });
  return { a, b, g, e };
}
const settlementBetween = (from: string, to: string, groupId: string | null) =>
  createSettlement({ groupId, fromPersonId: from, toPersonId: to, amount: money(500, 'EUR'), occurredOn: '2026-03-02' }, deps);

describe('InMemoryRepository', () => {
  it('does CRUD and notifies subscribers', async () => {
    const repo = new InMemoryRepository();
    const changes: RepositoryChange[] = [];
    const stop = repo.subscribe((c) => changes.push(c));
    const { a, b, g, e } = smallData();
    await repo.people.put(a);
    await repo.people.put(b);
    await repo.groups.put(g);
    await repo.expenses.put(e);
    expect(await repo.expenses.get(e.id)).toEqual(e);
    expect((await repo.people.list()).map((p) => p.id)).toEqual([a.id, b.id].sort());
    expect(await repo.people.list((p) => p.displayName === 'Tester B')).toEqual([b]);
    expect(await repo.expenses.delete(e.id)).toBe(true);
    expect(await repo.expenses.delete(e.id)).toBe(false);
    expect(await repo.expenses.get(e.id)).toBeUndefined();
    stop();
    await repo.people.put({ ...a, displayName: 'Renamed' });
    expect(changes.map((c) => c.type)).toEqual(['put', 'put', 'put', 'put', 'delete']);
    expect(changes[3]).toEqual({ type: 'put', collection: 'expenses', id: e.id });
  });

  it('returns copies, so callers cannot mutate stored data', async () => {
    const { a } = smallData();
    const repo = new InMemoryRepository();
    await repo.people.put(a);
    const got = (await repo.people.get(a.id)) as { displayName: string };
    got.displayName = 'mutated';
    expect((await repo.people.get(a.id))?.displayName).toBe('Tester A');
  });

  it('rejects invalid writes', async () => {
    const { a, b, g, e } = smallData();
    const repo = new InMemoryRepository({ ...emptySnapshot(), people: [a, b], groups: [g] });
    await expect(repo.expenses.put({ ...e, splits: [] })).rejects.toThrow(DataValidationError);
    await expect(repo.expenses.put({ ...e, total: { amountMinor: 1.5, currency: 'EUR' } })).rejects.toThrow(DataValidationError);
    await expect(repo.expenses.put({ ...e, groupId: 'missing' })).rejects.toThrow(DataValidationError);
    await expect(repo.groups.put({ ...g, currency: 'ZZZ' as never })).rejects.toThrow(DataValidationError);
    await repo.groups.put({ ...g, memberIds: [a.id] });
    await expect(repo.expenses.put(e)).rejects.toThrow(DataValidationError); // b is no longer a member
    expect(await repo.expenses.list()).toEqual([]);
  });

  it('keeps references intact so saved data always loads again', async () => {
    const { a, b, g, e } = smallData();
    const repo = new InMemoryRepository({ ...emptySnapshot(), people: [a, b], groups: [g], expenses: [e] });
    // Unknown people or groups are refused on write, as they are on load.
    await expect(repo.groups.put({ ...g, memberIds: [a.id, 'ghost'] })).rejects.toThrow(DataValidationError);
    await expect(repo.settlements.put(settlementBetween('ghost', a.id, null))).rejects.toThrow(DataValidationError);
    await expect(repo.settlements.put(settlementBetween(b.id, a.id, 'missing-group'))).rejects.toThrow(DataValidationError);
    // A member who is still in the group's expenses cannot be removed from it.
    await expect(repo.groups.put({ ...g, memberIds: [a.id] })).rejects.toThrow(/still in expense/);
    // People and groups other records use cannot be deleted.
    await expect(repo.people.delete(b.id)).rejects.toThrow(/still/);
    await expect(repo.groups.delete(g.id)).rejects.toThrow(/still referenced by expense/);
    // Deleting the dependents first works, and the result still round-trips.
    expect(await repo.expenses.delete(e.id)).toBe(true);
    await repo.groups.put({ ...g, memberIds: [a.id] });
    expect(await repo.people.delete(b.id)).toBe(true);
    expect(await repo.groups.delete(g.id)).toBe(true);
    expect(await repo.people.delete('never-existed')).toBe(false);
    const snap = await repo.snapshot();
    expect(validateSnapshot(snap)).toEqual([]);
    expect(deserializeSnapshot(serializeSnapshot(snap))).toEqual(snap);
  });

  it('reports malformed stored records as issues instead of crashing', () => {
    const { a, b, g, e } = smallData();
    const broken = { ...e, paidBy: [{ personId: a.id }] };
    const issues = validateSnapshot({ ...emptySnapshot(), people: [a, b], groups: [g], expenses: [broken] });
    expect(issues).toEqual([{ collection: 'expenses', id: e.id, problem: 'expense is malformed' }]);
  });

  it('replaces all data and emits a reset', async () => {
    const repo = new InMemoryRepository();
    const changes: RepositoryChange[] = [];
    repo.subscribe((c) => changes.push(c));
    await repo.replaceAll(createSampleData());
    expect(changes).toEqual([{ type: 'reset' }]);
    expect((await repo.groups.list()).length).toBe(3);
    await expect(repo.replaceAll({ ...emptySnapshot(), groups: [{ bad: true }] } as unknown as DataSnapshot)).rejects.toThrow(DataValidationError);
  });
});

describe('serialization', () => {
  it('round-trips the sample data exactly', () => {
    const data = createSampleData();
    const json = serializeSnapshot(data, { clock: fixedClock() });
    const env = JSON.parse(json);
    expect(env).toMatchObject({ format: 'finbuddy.data', version: DATA_FORMAT_VERSION, savedAt: '2026-03-01T12:00:00.000Z' });
    expect(deserializeSnapshot(json)).toEqual(data);
    expect(serializeSnapshot(deserializeSnapshot(json), { clock: fixedClock() })).toBe(json);
  });

  it('rejects unknown, newer and corrupt data', () => {
    expect(() => deserializeSnapshot('not json')).toThrow(DataFormatError);
    expect(() => deserializeSnapshot('[]')).toThrow(DataFormatError);
    expect(() => deserializeSnapshot(JSON.stringify({ format: 'other', version: 1, data: {} }))).toThrow(DataFormatError);
    expect(() => deserializeSnapshot(JSON.stringify({ format: 'finbuddy.data', version: 0, data: {} }))).toThrow(DataFormatError);
    expect(() => deserializeSnapshot(JSON.stringify({ format: 'finbuddy.data', version: DATA_FORMAT_VERSION + 1, data: emptySnapshot() }))).toThrow(/newer/);
    const data = createSampleData();
    const broken = { ...data, expenses: data.expenses.map((e, i) => (i === 0 ? { ...e, total: { amountMinor: 12.34, currency: 'GBP' } } : e)) };
    expect(() => deserializeSnapshot(JSON.stringify({ format: 'finbuddy.data', version: 1, savedAt: 'x', data: broken }))).toThrow(DataValidationError);
  });

  it('runs migrations step by step', () => {
    // A pretend v2 that renamed people[].displayName to people[].name.
    const v1 = JSON.parse(serializeSnapshot(createSampleData(), { clock: fixedClock() }));
    const toV2 = { from: 1, migrate: (d: unknown) => ({ ...(d as DataSnapshot), people: (d as DataSnapshot).people.map(({ displayName, ...rest }) => ({ ...rest, name: displayName })) }) };
    const v2Data = migrateData(v1.data, 1, { migrations: [toV2], targetVersion: 2 }) as { people: { name: string }[] };
    expect(v2Data.people[0]?.name).toMatch(/\(sample\)$/);
    // And back down to the current shape, to prove deserialize applies a chain and validates the result.
    const back = { from: 2, migrate: (d: unknown) => ({ ...(d as object), people: (d as { people: { name: string }[] }).people.map(({ name, ...rest }) => ({ ...rest, displayName: name })) }) };
    const json = JSON.stringify({ ...v1, version: 2, data: v2Data });
    expect(deserializeSnapshot(json, { migrations: [back], targetVersion: 3 })).toEqual(createSampleData());
    expect(() => migrateData({}, 1, { migrations: [], targetVersion: 2 })).toThrow(/No migration from data version 1/);
  });

  it('saves to and loads from a storage adapter', async () => {
    const storage = new MemoryStorage();
    expect(await loadSnapshot(storage)).toBeNull();
    await saveSnapshot(storage, createSampleData());
    expect(await loadSnapshot(storage)).toEqual(createSampleData());
  });

  it('persists repository changes, coalescing bursts', async () => {
    const storage = new MemoryStorage();
    const repo = new InMemoryRepository();
    const persistence = attachPersistence(repo, storage, { key: 'k' });
    const { a, b } = smallData();
    await Promise.all([repo.people.put(a), repo.people.put(b)]);
    await persistence.flush();
    const saved = await loadSnapshot(storage, 'k');
    expect(saved?.people.map((p) => p.id).sort()).toEqual([a.id, b.id].sort());
    expect(storage.writes).toBeLessThanOrEqual(2);
    persistence.stop();
    await repo.people.delete(a.id);
    await persistence.flush();
    expect((await loadSnapshot(storage, 'k'))?.people).toHaveLength(2);
  });
});

describe('sample data', () => {
  const data = createSampleData();

  it('is deterministic and valid', () => {
    expect(createSampleData()).toEqual(data);
    expect(validateSnapshot(data)).toEqual([]);
    expect(createSampleData({ anchor: SAMPLE_DATA_ANCHOR })).toEqual(data);
    const other = createSampleData({ anchor: '2027-02-03' });
    expect(validateSnapshot(other)).toEqual([]);
    expect(other.expenses.every((e) => e.occurredOn <= '2027-02-03')).toBe(true);
    expect(() => createSampleData({ anchor: '2026-02-30' })).toThrow(RangeError);
  });

  it('labels every record as sample data with illustrative names', () => {
    for (const list of Object.values(data)) for (const r of list as { isSample?: boolean }[]) expect(r.isSample).toBe(true);
    for (const p of data.people) expect(p.displayName).toMatch(/\(sample\)$/);
    for (const g of data.groups) expect(g.name).toMatch(/\(sample\)$/);
  });

  it('covers the cases the app must handle', () => {
    expect(data.groups.map((g) => g.currency).sort()).toEqual(['GBP', 'JPY', 'USD']);
    expect(data.people.filter((p) => p.linkedUserId === null).length).toBe(data.people.length);
    expect(data.expenses.some((e) => e.paidBy.length > 1)).toBe(true);
    expect(new Set(data.expenses.map((e) => e.split.type))).toEqual(new Set(['equal', 'exact', 'percentage', 'shares', 'adjustment']));
    expect(data.expenses.some((e) => e.groupId === null && e.total.currency !== 'GBP')).toBe(true);
    const months = new Set(data.expenses.filter((e) => e.groupId === null).map((e) => e.occurredOn.slice(0, 7)));
    expect(months.size).toBeGreaterThanOrEqual(6);
    expect(data.settlements.some((s) => s.status === 'pending')).toBe(true);
    expect(data.settlements.some((s) => s.status === 'confirmed')).toBe(true);
    expect(data.budgets.length).toBeGreaterThan(0);
    // Partial settlement: the trip still has open balances after Blake's confirmed payment.
    for (const g of data.groups) {
      for (const c of computeNetBalances(data.expenses, data.settlements, { groupId: g.id })) {
        expect(c.balances.reduce((s, m) => s + m.net.amountMinor, 0)).toBe(0);
        expect(c.balances.some((m) => m.net.amountMinor !== 0)).toBe(true);
      }
    }
  });
});
