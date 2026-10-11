import type { Budget, Expense, Group, Person, Profile, Settlement } from '../model/types';

/** Everything the app stores locally. Arrays are sorted by id in snapshots. */
export interface DataSnapshot {
  readonly profiles: readonly Profile[];
  readonly people: readonly Person[];
  readonly groups: readonly Group[];
  readonly expenses: readonly Expense[];
  readonly settlements: readonly Settlement[];
  readonly budgets: readonly Budget[];
}

export interface EntityMap {
  profiles: Profile;
  people: Person;
  groups: Group;
  expenses: Expense;
  settlements: Settlement;
  budgets: Budget;
}

export type CollectionName = keyof EntityMap;

export const COLLECTION_NAMES: readonly CollectionName[] = ['profiles', 'people', 'groups', 'expenses', 'settlements', 'budgets'];

export function emptySnapshot(): DataSnapshot {
  return { profiles: [], people: [], groups: [], expenses: [], settlements: [], budgets: [] };
}

/** CRUD for one record type. Records are immutable values: put() replaces the whole record. */
export interface Collection<T extends { readonly id: string }> {
  get(id: string): Promise<T | undefined>;
  /** All records (optionally filtered), sorted by id (ULIDs sort by creation time). */
  list(filter?: (record: T) => boolean): Promise<T[]>;
  /** Insert or replace. Validates the record and throws on invalid data. */
  put(record: T): Promise<T>;
  /** Returns false when the id did not exist. */
  delete(id: string): Promise<boolean>;
}

export type RepositoryChange =
  | { readonly type: 'put' | 'delete'; readonly collection: CollectionName; readonly id: string }
  | { readonly type: 'reset' };

export type ChangeListener = (change: RepositoryChange) => void;

/**
 * The data layer contract. The app talks only to this interface, so the local in-memory
 * store (persisted with a StorageAdapter) can later be replaced by an API-backed one.
 */
export interface Repository {
  readonly profiles: Collection<Profile>;
  readonly people: Collection<Person>;
  readonly groups: Collection<Group>;
  readonly expenses: Collection<Expense>;
  readonly settlements: Collection<Settlement>;
  readonly budgets: Collection<Budget>;
  /** Called after every change. Returns an unsubscribe function. */
  subscribe(listener: ChangeListener): () => void;
  /** A consistent copy of all data, for persistence and for computing balances/analytics. */
  snapshot(): Promise<DataSnapshot>;
  /** Replaces all data (load from storage, import, reset to sample data). Validates first. */
  replaceAll(snapshot: DataSnapshot): Promise<void>;
}
