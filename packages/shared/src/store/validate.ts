import { compareCodeUnits } from '../internal/decimal';
import { isCurrencyCode } from '../money/currencies';
import { isMoney } from '../money/money';
import { isInstant, isLocalDate } from '../model/dates';
import { validateExpense } from '../model/factories';
import type { Expense, Group, Person, Profile, Settlement } from '../model/types';
import { COLLECTION_NAMES, type CollectionName, type DataSnapshot, type EntityMap } from './repository';

export interface DataIssue {
  readonly collection: CollectionName | 'root';
  readonly id: string | null;
  readonly problem: string;
}

export class DataValidationError extends Error {
  readonly issues: readonly DataIssue[];
  constructor(issues: readonly DataIssue[]) {
    const head = issues
      .slice(0, 5)
      .map((i) => `${i.collection}${i.id ? `/${i.id}` : ''}: ${i.problem}`)
      .join('; ');
    super(`Invalid data (${issues.length} issue${issues.length === 1 ? '' : 's'}): ${head}`);
    this.name = 'DataValidationError';
    this.issues = issues;
  }
}

type Check = (record: Record<string, unknown>) => string[];

const str = (v: unknown) => typeof v === 'string';
const meta: Check = (r) => [
  ...(str(r.id) && (r.id as string).length > 0 ? [] : ['id must be a non-empty string']),
  ...(isInstant(r.createdAt) ? [] : ['createdAt must be an ISO instant']),
  ...(isInstant(r.updatedAt) ? [] : ['updatedAt must be an ISO instant']),
  ...(r.isSample === undefined || r.isSample === true ? [] : ['isSample must be true or absent']),
];

export const RECORD_CHECKS: { readonly [K in CollectionName]: Check } = {
  profiles: (r) => [
    ...meta(r),
    ...(str(r.personId) ? [] : ['personId must be a string']),
    ...(str(r.displayName) ? [] : ['displayName must be a string']),
    ...(isCurrencyCode(r.defaultCurrency) ? [] : ['defaultCurrency must be a supported ISO 4217 code']),
    ...(str(r.locale) ? [] : ['locale must be a string']),
  ],
  people: (r) => [
    ...meta(r),
    ...(str(r.displayName) ? [] : ['displayName must be a string']),
    ...(r.linkedUserId === null || str(r.linkedUserId) ? [] : ['linkedUserId must be a string or null']),
  ],
  groups: (r) => [
    ...meta(r),
    ...(str(r.name) ? [] : ['name must be a string']),
    ...(isCurrencyCode(r.currency) ? [] : ['currency must be a supported ISO 4217 code']),
    ...(Array.isArray(r.memberIds) && r.memberIds.every(str) ? [] : ['memberIds must be a string array']),
    ...(str(r.createdBy) ? [] : ['createdBy must be a string']),
    ...(typeof r.archived === 'boolean' ? [] : ['archived must be a boolean']),
  ],
  expenses: (r) => {
    const base = [
      ...meta(r),
      ...(r.groupId === null || str(r.groupId) ? [] : ['groupId must be a string or null']),
      ...(str(r.categoryId) ? [] : ['categoryId must be a string']),
      ...(str(r.createdBy) ? [] : ['createdBy must be a string']),
      ...(Array.isArray(r.paidBy) && Array.isArray(r.splits) && typeof r.split === 'object' && r.split !== null ? [] : ['paidBy, split and splits are required']),
    ];
    if (base.length) return base;
    try {
      return validateExpense(r as unknown as Expense).map((i) => `expense ${i.code}${i.personId ? ` (${i.personId})` : ''}`);
    } catch {
      // Malformed nested data (e.g. a payer without an amount) from corrupt or foreign storage.
      return ['expense is malformed'];
    }
  },
  settlements: (r) => [
    ...meta(r),
    ...(r.groupId === null || str(r.groupId) ? [] : ['groupId must be a string or null']),
    ...(str(r.fromPersonId) && str(r.toPersonId) && r.fromPersonId !== r.toPersonId ? [] : ['fromPersonId and toPersonId must be two different people']),
    ...(isMoney(r.amount) && (r.amount as { amountMinor: number }).amountMinor > 0 ? [] : ['amount must be positive Money']),
    ...(r.status === 'pending' || r.status === 'confirmed' ? [] : ['status must be pending or confirmed']),
    ...(['cash', 'bank_transfer', 'card', 'mobile_payment', 'other'].includes(r.method as string) ? [] : ['method is not recognised']),
    ...(isLocalDate(r.occurredOn) ? [] : ['occurredOn must be YYYY-MM-DD']),
    ...(r.dueOn === undefined || r.dueOn === null || isLocalDate(r.dueOn) ? [] : ['dueOn must be YYYY-MM-DD or null']),
  ],
  budgets: (r) => [
    ...meta(r),
    ...(r.categoryId === null || str(r.categoryId) ? [] : ['categoryId must be a string or null']),
    ...(isMoney(r.amount) && (r.amount as { amountMinor: number }).amountMinor > 0 ? [] : ['amount must be positive Money']),
    ...(r.period === 'monthly' ? [] : ['period must be monthly']),
  ],
};

/** Checks one record of a collection; returns problems (empty when valid). */
export function validateRecord(collection: CollectionName, record: unknown): string[] {
  if (typeof record !== 'object' || record === null) return ['record must be an object'];
  return RECORD_CHECKS[collection](record as Record<string, unknown>);
}

/** Read access to the records other records point at. */
export interface ReferenceView {
  hasPerson(id: string): boolean;
  getGroup(id: string): Group | undefined;
}

/** People an expense names: payers, split participants and its creator. */
export function peopleInExpense(expense: Expense): string[] {
  return [...new Set([...expense.paidBy.map((p) => p.personId), ...expense.splits.map((x) => x.personId), expense.createdBy])];
}

/** People in an expense's payers or split who are not in `memberIds`. */
function nonMembers(expense: Expense, memberIds: readonly string[]): string[] {
  const issues = validateExpense(expense, { memberIds });
  return [...new Set(issues.filter((i) => i.code === 'not_a_member' && i.personId !== undefined).map((i) => i.personId as string))];
}

/**
 * Reference problems of one shape-valid record: profile -> person, group members, expense and
 * settlement people and group, and expense payers/participants being members of its group.
 * The same rules apply when loading a snapshot and on every repository write, so data that
 * was saved can always be loaded again.
 */
export function recordReferenceIssues<K extends CollectionName>(collection: K, record: EntityMap[K], view: ReferenceView): string[] {
  const problems: string[] = [];
  const person = (id: string) => {
    if (!view.hasPerson(id)) problems.push(`unknown person ${id}`);
  };
  switch (collection) {
    case 'profiles':
      person((record as Profile).personId);
      break;
    case 'groups':
      for (const m of (record as Group).memberIds) if (!view.hasPerson(m)) problems.push(`unknown member ${m}`);
      break;
    case 'expenses': {
      const e = record as Expense;
      peopleInExpense(e).forEach(person);
      if (e.groupId !== null) {
        const g = view.getGroup(e.groupId);
        if (!g) problems.push(`unknown group ${e.groupId}`);
        else for (const id of nonMembers(e, g.memberIds)) problems.push(`${id} is not a member of ${g.id}`);
      }
      break;
    }
    case 'settlements': {
      const st = record as Settlement;
      person(st.fromPersonId);
      person(st.toPersonId);
      if (st.groupId !== null && !view.getGroup(st.groupId)) problems.push(`unknown group ${st.groupId}`);
      break;
    }
    case 'people':
    case 'budgets':
      break;
  }
  return problems;
}

/**
 * Problems that writing `group` would cause for existing expenses: removing a member who
 * still pays or shares in one of the group's expenses is refused.
 */
export function groupUpdateIssues(group: Group, expenses: Iterable<Expense>): string[] {
  const problems: string[] = [];
  for (const e of expenses) {
    if (e.groupId !== group.id) continue;
    for (const id of nonMembers(e, group.memberIds)) problems.push(`member ${id} is still in expense ${e.id}`);
  }
  return problems;
}

/** Records that still point at the record about to be deleted (empty when deleting is safe). */
export function deletionIssues(collection: CollectionName, id: string, data: { readonly [K in CollectionName]: Iterable<EntityMap[K]> }): string[] {
  const problems: string[] = [];
  if (collection === 'people') {
    for (const p of data.profiles) if (p.personId === id) problems.push(`still referenced by profile ${p.id}`);
    for (const g of data.groups) if (g.memberIds.includes(id)) problems.push(`still a member of group ${g.id}`);
    for (const e of data.expenses) if (peopleInExpense(e).includes(id)) problems.push(`still referenced by expense ${e.id}`);
    for (const s of data.settlements) if (s.fromPersonId === id || s.toPersonId === id) problems.push(`still referenced by settlement ${s.id}`);
  }
  if (collection === 'groups') {
    for (const e of data.expenses) if (e.groupId === id) problems.push(`still referenced by expense ${e.id}`);
    for (const s of data.settlements) if (s.groupId === id) problems.push(`still referenced by settlement ${s.id}`);
  }
  return problems;
}

/**
 * Validates a whole snapshot: every record's shape and integrity, unique ids, and references
 * (see recordReferenceIssues).
 */
export function validateSnapshot(snapshot: unknown): DataIssue[] {
  if (typeof snapshot !== 'object' || snapshot === null) return [{ collection: 'root', id: null, problem: 'snapshot must be an object' }];
  const s = snapshot as Record<string, unknown>;
  const issues: DataIssue[] = [];
  for (const name of COLLECTION_NAMES) {
    const list = s[name];
    if (!Array.isArray(list)) {
      issues.push({ collection: name, id: null, problem: 'must be an array' });
      continue;
    }
    const seen = new Set<string>();
    for (const record of list) {
      const id = typeof record?.id === 'string' ? (record.id as string) : null;
      if (id !== null && seen.has(id)) issues.push({ collection: name, id, problem: 'duplicate id' });
      if (id !== null) seen.add(id);
      for (const problem of validateRecord(name, record)) issues.push({ collection: name, id, problem });
    }
  }
  if (issues.length) return issues;

  const data = snapshot as DataSnapshot;
  const people = new Set(data.people.map((p: Person) => p.id));
  const groups = new Map(data.groups.map((g: Group) => [g.id, g]));
  const view: ReferenceView = { hasPerson: (id) => people.has(id), getGroup: (id) => groups.get(id) };
  for (const name of COLLECTION_NAMES) {
    for (const record of data[name] as readonly EntityMap[typeof name][]) {
      for (const problem of recordReferenceIssues(name, record, view)) issues.push({ collection: name, id: record.id, problem });
    }
  }
  return issues;
}

/** Sorts every collection by id so equal data serialises identically. */
export function normalizeSnapshot(snapshot: DataSnapshot): DataSnapshot {
  const byId = <T extends { id: string }>(list: readonly T[]) => [...list].sort((a, b) => compareCodeUnits(a.id, b.id));
  return {
    profiles: byId(snapshot.profiles),
    people: byId(snapshot.people),
    groups: byId(snapshot.groups),
    expenses: byId(snapshot.expenses),
    settlements: byId(snapshot.settlements),
    budgets: byId(snapshot.budgets),
  };
}
