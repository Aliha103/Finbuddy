import type { CurrencyCode } from '../money/currencies';
import type { Money } from '../money/money';
import type { Payer, PersonId, Split, SplitSpec } from '../splits/types';
import type { CategoryId } from './categories';
import type { Instant, LocalDate } from './dates';

export type { PersonId } from '../splits/types';
export type ProfileId = string;
export type GroupId = string;
export type ExpenseId = string;
export type SettlementId = string;
export type BudgetId = string;

/**
 * Fields every stored record has. `updatedAt` drives last-write-wins sync later.
 * `isSample` marks demonstration data; it must be visibly labeled in the UI.
 */
export interface RecordMeta {
  readonly createdAt: Instant;
  readonly updatedAt: Instant;
  readonly isSample?: true;
}

/** The person using the app on this device. */
export interface Profile extends RecordMeta {
  readonly id: ProfileId;
  /** The Person record that represents this user in groups and splits. */
  readonly personId: PersonId;
  readonly displayName: string;
  /** Currency for personal expenses and converted overviews. There is no global home currency. */
  readonly defaultCurrency: CurrencyCode;
  /** BCP 47 locale for formatting, e.g. "en-GB". */
  readonly locale: string;
}

/**
 * Anyone money is shared with, including the user themself and contacts who do not have
 * the app. Group membership, payers and splits all reference people, never profiles.
 */
export interface Person extends RecordMeta {
  readonly id: PersonId;
  readonly displayName: string;
  /** Optional contact details for invites and reminders. */
  readonly email?: string;
  readonly phone?: string;
  /** Account id once this person uses FinBuddy; null for people without the app. */
  readonly linkedUserId: string | null;
}

export interface Group extends RecordMeta {
  readonly id: GroupId;
  readonly name: string;
  /** The group's default currency for new expenses. Expenses may use other currencies. */
  readonly currency: CurrencyCode;
  readonly memberIds: readonly PersonId[];
  readonly createdBy: PersonId;
  readonly archived: boolean;
}

/** Placeholder for an attached receipt. Storage of the file itself is not designed yet. */
export interface ReceiptRef {
  /** Device-local URI or future remote URL. */
  readonly uri: string;
  readonly mimeType?: string;
}

export interface Expense extends RecordMeta {
  readonly id: ExpenseId;
  /** null for a personal (or non-group) expense. */
  readonly groupId: GroupId | null;
  readonly description: string;
  readonly categoryId: CategoryId;
  /** Positive total in the currency it was paid in. */
  readonly total: Money;
  /** One or more payers; their amounts sum exactly to `total`. */
  readonly paidBy: readonly Payer[];
  /** How the total was divided, as the person entered it (kept for editing). */
  readonly split: SplitSpec;
  /** Resolved per-person shares; sum exactly to `total`. A personal expense has one split: the owner. */
  readonly splits: readonly Split[];
  /** The calendar date the expense happened, as the person saw it. Never shifted by time zones. */
  readonly occurredOn: LocalDate;
  /** Optional exact moment, for ordering within a day. Display uses `occurredOn`. */
  readonly occurredAt: Instant | null;
  readonly createdBy: PersonId;
  readonly notes?: string;
  readonly receipt?: ReceiptRef | null;
}

export type SettlementStatus = 'pending' | 'confirmed';
export type SettlementMethod = 'cash' | 'bank_transfer' | 'card' | 'mobile_payment' | 'other';

/** A payment between two people to settle a debt. Only confirmed settlements change balances. */
export interface Settlement extends RecordMeta {
  readonly id: SettlementId;
  /** null for a settlement outside any group. */
  readonly groupId: GroupId | null;
  /** The person who pays. */
  readonly fromPersonId: PersonId;
  /** The person who receives. */
  readonly toPersonId: PersonId;
  readonly amount: Money;
  readonly status: SettlementStatus;
  readonly method: SettlementMethod;
  /** Date the payment happened or is planned for. */
  readonly occurredOn: LocalDate;
  /** Optional due date used for reminders. */
  readonly dueOn?: LocalDate | null;
  readonly confirmedAt?: Instant | null;
  readonly note?: string;
}

/** A monthly spending limit for one category (or all spending when categoryId is null), in one currency. */
export interface Budget extends RecordMeta {
  readonly id: BudgetId;
  readonly categoryId: CategoryId | null;
  readonly amount: Money;
  readonly period: 'monthly';
}
