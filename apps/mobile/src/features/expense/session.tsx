// apps/mobile/src/features/expense/session.tsx
// One add-expense session shared by every screen in the add stack (the sheet, the split editor,
// payers, currency, category). It lives in the stack's layout, so it starts clean each time the
// sheet opens and is gone when it closes. It starts from the route params: ?groupId= opens the
// sheet on that group (its currency, its members), ?expenseId= opens an existing expense for
// editing exactly as it was entered. When the store is already loaded (every normal open) the
// session exists on the first render, so the amount field mounts focused with the keypad up.
import { type ExpenseId } from '@finbuddy/shared';
import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';

import { selectExpense, selectProfile, useDataStore, useDeviceLocale, type DataState } from '@/data';

import { initialForm, type FormState } from './form';
import { formFromExpense } from './edit';

export interface ExpenseSession {
  readonly form: FormState;
  /** The form as it was when the sheet opened: the discard guard compares against it. */
  readonly initial: FormState;
  /** The expense being edited, or null for a new one. */
  readonly editingId: ExpenseId | null;
  /** Save was pressed: every field shows its problem, not only the touched ones. */
  readonly showAll: boolean;
  /** ?expenseId= named an expense that no longer exists. */
  readonly missing: boolean;
}

export interface SessionParams {
  readonly groupId?: string;
  readonly expenseId?: string;
}

/** The session the params ask for, or null while the store is not ready (or has no profile). */
export function sessionFor(state: Pick<DataState, 'status' | 'snapshot' | 'today'>, locale: string, params: SessionParams): ExpenseSession | null {
  if (state.status !== 'ready') return null;
  const profile = selectProfile(state.snapshot);
  if (!profile) return null;
  const me = profile.personId;
  const fresh = (groupId: string | null, currency = profile.defaultCurrency) => initialForm({ groupId, currency, me, today: state.today });
  if (params.expenseId) {
    const expense = selectExpense(state.snapshot, params.expenseId);
    if (!expense) {
      const form = fresh(null);
      return { form, initial: form, editingId: null, showAll: false, missing: true };
    }
    const group = expense.groupId ? state.snapshot.groups.find((g) => g.id === expense.groupId) : undefined;
    const form = formFromExpense(expense, locale, me, group?.memberIds ?? [me]);
    return { form, initial: form, editingId: expense.id, showAll: false, missing: false };
  }
  const group = params.groupId ? state.snapshot.groups.find((g) => g.id === params.groupId && !g.archived) : undefined;
  const form = group ? fresh(group.id, group.currency) : fresh(null);
  return { form, initial: form, editingId: null, showAll: false, missing: false };
}

interface SessionStore {
  readonly session: ExpenseSession | null;
  readonly setSession: (update: (current: ExpenseSession | null) => ExpenseSession | null) => void;
}

const SessionContext = createContext<SessionStore | null>(null);

export function ExpenseSessionProvider({ params, children }: { params: SessionParams; children: ReactNode }) {
  const locale = useDeviceLocale();
  const [stored, setStored] = useState<ExpenseSession | null>(() => sessionFor(useDataStore.getState(), locale, params));
  // A cold deep link: until the store has loaded there is no session; once it has, the session is
  // derived from the store and becomes the stored one on the first edit.
  const status = useDataStore((s) => s.status);
  const hasProfile = useDataStore((s) => s.snapshot.profiles.length > 0);
  const derived = useMemo(() => (stored === null && status === 'ready' && hasProfile ? sessionFor(useDataStore.getState(), locale, params) : null), [stored, status, hasProfile, locale, params]);
  const session = stored ?? derived;

  const setSession = useCallback(
    (update: (current: ExpenseSession | null) => ExpenseSession | null) => setStored((current) => update(current ?? sessionFor(useDataStore.getState(), locale, params))),
    [locale, params],
  );
  const value = useMemo<SessionStore>(() => ({ session, setSession }), [session, setSession]);
  return <SessionContext value={value}>{children}</SessionContext>;
}

export interface SessionHandle {
  readonly session: ExpenseSession | null;
  /** Updates the form; a no-op before the session exists. */
  setForm(update: FormState | ((current: FormState) => FormState)): void;
  setShowAll(showAll: boolean): void;
}

export function useExpenseSession(): SessionHandle {
  const store = use(SessionContext);
  if (!store) throw new Error('useExpenseSession() needs <ExpenseSessionProvider> (the add stack layout)');
  const { session, setSession } = store;
  const setForm = useCallback<SessionHandle['setForm']>(
    (update) => setSession((current) => (current ? { ...current, form: typeof update === 'function' ? update(current.form) : update } : current)),
    [setSession],
  );
  const setShowAll = useCallback<SessionHandle['setShowAll']>((showAll) => setSession((current) => (current ? { ...current, showAll } : current)), [setSession]);
  return useMemo(() => ({ session, setForm, setShowAll }), [session, setForm, setShowAll]);
}
