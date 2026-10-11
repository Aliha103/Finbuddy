// apps/mobile/src/features/spending/copy.ts
// The spending screens' own small words. The month and pace sentences ("Up 68% (£829.50) from
// September", "£159.50 of £200.00, 20 days left, ahead of pace") live with the Formatter in
// features/common/format.ts.

/** The engine's excludedCurrencies, in the direction's words; null when nothing was left out. */
export function excludedNote(excluded: readonly string[]): string | null {
  if (excluded.length === 0) return null;
  const list = excluded.length === 1 ? excluded[0] : `${excluded.slice(0, -1).join(', ')} and ${excluded[excluded.length - 1]}`;
  return `Spending in ${list} is not counted, currencies are never mixed`;
}

/** "3 expenses", "1 expense" */
export function expenseCount(n: number): string {
  return `${n} ${n === 1 ? 'expense' : 'expenses'}`;
}
