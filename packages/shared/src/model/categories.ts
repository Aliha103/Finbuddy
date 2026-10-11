/**
 * Default expense categories. Ids are stable storage keys and must never be renamed;
 * `defaultLabel` is an English fallback until the design team's copy and translations
 * exist. Colors and icons are deliberately absent: the design system maps ids to them.
 */
export interface Category {
  readonly id: CategoryId;
  readonly defaultLabel: string;
}

export const DEFAULT_CATEGORY_IDS = [
  'food',
  'groceries',
  'transport',
  'housing',
  'utilities',
  'entertainment',
  'shopping',
  'travel',
  'healthcare',
  'education',
  'personal_care',
  'subscriptions',
  'gifts',
  'fees',
  'other',
] as const;

/** A category id. Default ids are listed above; custom categories may use other strings. */
export type CategoryId = (typeof DEFAULT_CATEGORY_IDS)[number] | (string & {});

const LABELS: Record<(typeof DEFAULT_CATEGORY_IDS)[number], string> = {
  food: 'Food & dining',
  groceries: 'Groceries',
  transport: 'Transport',
  housing: 'Housing',
  utilities: 'Utilities',
  entertainment: 'Entertainment',
  shopping: 'Shopping',
  travel: 'Travel',
  healthcare: 'Healthcare',
  education: 'Education',
  personal_care: 'Personal care',
  subscriptions: 'Subscriptions',
  gifts: 'Gifts & donations',
  fees: 'Fees & charges',
  other: 'Other',
};

export const DEFAULT_CATEGORIES: readonly Category[] = Object.freeze(
  DEFAULT_CATEGORY_IDS.map((id) => Object.freeze({ id, defaultLabel: LABELS[id] })),
);

/** Fallback for unknown or missing categories. */
export const FALLBACK_CATEGORY_ID: CategoryId = 'other';

export function isDefaultCategoryId(id: string): boolean {
  return (DEFAULT_CATEGORY_IDS as readonly string[]).includes(id);
}
