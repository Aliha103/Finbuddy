import { compareCodeUnits } from '../internal/decimal';
import type { Group } from '../model/types';
import {
  COLLECTION_NAMES,
  emptySnapshot,
  type ChangeListener,
  type Collection,
  type CollectionName,
  type DataSnapshot,
  type EntityMap,
  type Repository,
  type RepositoryChange,
} from './repository';
import {
  DataValidationError,
  deletionIssues,
  groupUpdateIssues,
  normalizeSnapshot,
  recordReferenceIssues,
  validateRecord,
  validateSnapshot,
  type ReferenceView,
} from './validate';

// Records are plain JSON data; copying on the way in and out keeps callers from mutating the store.
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/**
 * Repository held in memory. Pair it with attachPersistence() to save to AsyncStorage/SQLite.
 * Writes are validated with the same rules as loading a snapshot, so whatever was saved can be
 * loaded again: an expense whose splits or payers do not add up, a record naming an unknown
 * person or group, an expense with people outside its group, removing a group member who is
 * still in that group's expenses, and deleting a person or group that other records still use
 * are all rejected with DataValidationError.
 */
export class InMemoryRepository implements Repository {
  private data: { [K in CollectionName]: Map<string, EntityMap[K]> };
  private readonly listeners = new Set<ChangeListener>();

  readonly profiles: Collection<EntityMap['profiles']>;
  readonly people: Collection<EntityMap['people']>;
  readonly groups: Collection<EntityMap['groups']>;
  readonly expenses: Collection<EntityMap['expenses']>;
  readonly settlements: Collection<EntityMap['settlements']>;
  readonly budgets: Collection<EntityMap['budgets']>;

  constructor(initial: DataSnapshot = emptySnapshot()) {
    this.data = InMemoryRepository.load(initial);
    this.profiles = this.collection('profiles');
    this.people = this.collection('people');
    this.groups = this.collection('groups');
    this.expenses = this.collection('expenses');
    this.settlements = this.collection('settlements');
    this.budgets = this.collection('budgets');
  }

  private static load(snapshot: DataSnapshot): { [K in CollectionName]: Map<string, EntityMap[K]> } {
    const issues = validateSnapshot(snapshot);
    if (issues.length) throw new DataValidationError(issues);
    const copy = clone(snapshot);
    return {
      profiles: new Map(copy.profiles.map((r) => [r.id, r])),
      people: new Map(copy.people.map((r) => [r.id, r])),
      groups: new Map(copy.groups.map((r) => [r.id, r])),
      expenses: new Map(copy.expenses.map((r) => [r.id, r])),
      settlements: new Map(copy.settlements.map((r) => [r.id, r])),
      budgets: new Map(copy.budgets.map((r) => [r.id, r])),
    };
  }

  private emit(change: RepositoryChange) {
    for (const listener of [...this.listeners]) listener(change);
  }

  private readonly view: ReferenceView = {
    hasPerson: (id) => this.data.people.has(id),
    getGroup: (id) => this.data.groups.get(id),
  };

  private values(): { [K in CollectionName]: Iterable<EntityMap[K]> } {
    const d = this.data;
    return {
      profiles: d.profiles.values(),
      people: d.people.values(),
      groups: d.groups.values(),
      expenses: d.expenses.values(),
      settlements: d.settlements.values(),
      budgets: d.budgets.values(),
    };
  }

  private reject(collection: CollectionName, id: string | null, problems: readonly string[]): void {
    if (problems.length) throw new DataValidationError(problems.map((problem) => ({ collection, id, problem })));
  }

  private collection<K extends CollectionName>(name: K): Collection<EntityMap[K]> {
    return {
      get: async (id) => {
        const record = this.data[name].get(id);
        return record === undefined ? undefined : clone(record);
      },
      list: async (filter) =>
        [...this.data[name].values()]
          .filter((r) => !filter || filter(r))
          .sort((a, b) => compareCodeUnits(a.id, b.id))
          .map(clone),
      put: async (record) => {
        const id = typeof record?.id === 'string' ? record.id : null;
        this.reject(name, id, validateRecord(name, record));
        this.reject(name, id, recordReferenceIssues(name, record, this.view));
        if (name === 'groups') this.reject(name, id, groupUpdateIssues(record as Group, this.data.expenses.values()));
        const copy = clone(record);
        this.data[name].set(copy.id, copy);
        this.emit({ type: 'put', collection: name, id: copy.id });
        return clone(copy);
      },
      delete: async (id) => {
        if (this.data[name].has(id)) this.reject(name, id, deletionIssues(name, id, this.values()));
        const existed = this.data[name].delete(id);
        if (existed) this.emit({ type: 'delete', collection: name, id });
        return existed;
      },
    };
  }

  subscribe(listener: ChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async snapshot(): Promise<DataSnapshot> {
    const out = {} as { -readonly [K in CollectionName]: EntityMap[K][] };
    for (const name of COLLECTION_NAMES) (out as Record<CollectionName, unknown[]>)[name] = [...this.data[name].values()].map(clone);
    return normalizeSnapshot(out);
  }

  async replaceAll(snapshot: DataSnapshot): Promise<void> {
    this.data = InMemoryRepository.load(snapshot);
    this.emit({ type: 'reset' });
  }
}
