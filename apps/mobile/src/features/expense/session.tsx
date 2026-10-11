// apps/mobile/src/features/expense/session.tsx
// One add-expense session shared by every screen in the add stack (the sheet, the split editor,
// payers, currency, category). It lives in the stack's layout, so it starts clean each time the
// sheet opens and is gone when it closes. The sheet starts it from its route params; the other
// screens only read and update the form.
import type { ExpenseId } from '@finbuddy/shared';
import { createContext, use, useCallback, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';

import type { FormState } from './form';

export interface ExpenseSession {
  readonly form: FormState;
  /** The form as it was when the sheet opened: the discard guard compares against it. */
  readonly initial: FormState;
  /** The expense being edited, or null for a new one. */
  readonly editingId: ExpenseId | null;
  /** Save was pressed: every field shows its problem, not only the touched ones. */
  readonly showAll: boolean;
}

interface SessionStore {
  readonly session: ExpenseSession | null;
  readonly setSession: Dispatch<SetStateAction<ExpenseSession | null>>;
}

const SessionContext = createContext<SessionStore | null>(null);

export function ExpenseSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ExpenseSession | null>(null);
  const value = useMemo<SessionStore>(() => ({ session, setSession }), [session]);
  return <SessionContext value={value}>{children}</SessionContext>;
}

export interface SessionHandle {
  readonly session: ExpenseSession | null;
  /** Starts (or restarts) the session with an initial form. */
  start(form: FormState, editingId: ExpenseId | null): void;
  /** Updates the form; a no-op before start(). */
  setForm(update: FormState | ((current: FormState) => FormState)): void;
  setShowAll(showAll: boolean): void;
}

export function useExpenseSession(): SessionHandle {
  const store = use(SessionContext);
  if (!store) throw new Error('useExpenseSession() needs <ExpenseSessionProvider> (the add stack layout)');
  const { session, setSession } = store;
  const start = useCallback<SessionHandle['start']>((form, editingId) => setSession({ form, initial: form, editingId, showAll: false }), [setSession]);
  const setForm = useCallback<SessionHandle['setForm']>(
    (update) => setSession((current) => (current ? { ...current, form: typeof update === 'function' ? update(current.form) : update } : current)),
    [setSession],
  );
  const setShowAll = useCallback<SessionHandle['setShowAll']>((showAll) => setSession((current) => (current ? { ...current, showAll } : current)), [setSession]);
  return useMemo(() => ({ session, start, setForm, setShowAll }), [session, start, setForm, setShowAll]);
}
