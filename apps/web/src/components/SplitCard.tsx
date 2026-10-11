// The hero's primary object: the real split engine from packages/shared, presented as a card the
// visitor types into. parseMoneyInput reads the amount in the visitor's own number format,
// validateSplit and resolveSplit do the splitting, and every figure is formatted by the engine.
import {
  allocateMinor,
  formatMoney,
  formatMoneyForInput,
  formatMoneyToParts,
  getNumberSeparators,
  minorUnits,
  parseMoneyInput,
  resolveSplit,
  toDecimalString,
  validateSplit,
  type CurrencyCode,
  type Money,
  type ParseMoneyErrorCode,
  type SplitIssue,
  type SplitSpec,
} from '@finbuddy/shared';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { CaretDownIcon } from '@phosphor-icons/react/dist/csr/CaretDown';
import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { MinusIcon } from '@phosphor-icons/react/dist/csr/Minus';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import * as Tabs from '@radix-ui/react-tabs';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { cn } from '../lib/cn';
import { initials } from '../lib/colors';
import { CURRENCIES, currencyName, visitorLocale } from '../lib/locale';
import { useReducedMotion } from '../lib/media';
import { PEOPLE } from '../lib/sample';
import { Button } from './Button';
import { SampleChip } from './Chip';
import { HoldButton } from './HoldButton';
import { Odometer } from './Odometer';

type Method = 'equal' | 'exact' | 'percentage' | 'shares';
const METHODS: readonly { value: Method; label: string }[] = [
  { value: 'equal', label: 'Equally' },
  { value: 'exact', label: 'Exact' },
  { value: 'percentage', label: 'Percent' },
  { value: 'shares', label: 'Shares' },
];
const SUGGESTED: readonly CurrencyCode[] = ['GBP', 'EUR', 'USD', 'JPY', 'INR', 'KWD'];
const DEFAULT_TOTAL: Money = { amountMinor: 10000, currency: 'GBP' };
const DEFAULT_PEOPLE = 3;
const SSR_LOCALE = 'en-GB';
const MAX_SHARES = 9;

function parseError(code: ParseMoneyErrorCode, currency: CurrencyCode, maxDecimals: number, locale: string): string {
  const name = currencyName(currency, locale);
  switch (code) {
    case 'empty':
      return 'Enter an amount.';
    case 'invalid':
      return "That doesn't look like an amount. Type digits only.";
    case 'negative':
      return "Amounts can't be negative.";
    case 'exponent':
      return 'Write the amount out in full.';
    case 'too_many_decimals':
      return maxDecimals === 0 ? `${name} has no smaller unit, so enter a whole number.` : `${name} allows at most ${maxDecimals} decimal place${maxDecimals === 1 ? '' : 's'}.`;
    case 'too_large':
      return 'That amount is too large.';
    case 'zero':
      return 'The total must be more than zero.';
  }
}

/** "12,5 %" or "12.5" -> "12.5" for the engine; anything else is passed through for it to reject. */
function percentForEngine(text: string, decimal: string): string {
  const cleaned = text.replace(/[\s%]/g, '');
  if (cleaned === '') return '0';
  return decimal === '.' ? cleaned : cleaned.replace(decimal, '.');
}

/** Carries an amount into another currency when it is representable there ("100.00" GBP -> "100" JPY). */
function carryAmount(money: Money, to: CurrencyCode, locale: string): string | null {
  let decimal = toDecimalString(money);
  if (decimal.includes('.')) decimal = decimal.replace(/0+$/, '').replace(/\.$/, '');
  const result = parseMoneyInput(decimal, to, { locale: 'en', allowZero: false });
  return result.ok ? formatMoneyForInput(result.value, locale) : null;
}

export function SplitCard({ className }: { className?: string }) {
  // The prerendered card is in en-GB; after hydration it switches to the visitor's own format.
  const [locale, setLocale] = useState(SSR_LOCALE);
  // Currency names come from the runtime's Intl data, which differs between Node (the prerender)
  // and browsers for rare currencies, so the option labels gain their names after hydration.
  const [named, setNamed] = useState(false);
  const { decimal } = getNumberSeparators(locale);
  const reduce = useReducedMotion();
  const ids = useId();

  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_TOTAL.currency);
  const [amountText, setAmountText] = useState(() => formatMoneyForInput(DEFAULT_TOTAL, locale));
  const [amountBlurred, setAmountBlurred] = useState(false);
  const [active, setActive] = useState<readonly string[]>(() => PEOPLE.slice(0, DEFAULT_PEOPLE).map((p) => p.id));
  const [method, setMethod] = useState<Method>('equal');
  const [exactText, setExactText] = useState<Record<string, string> | null>(null);
  const [percentText, setPercentText] = useState<Record<string, string> | null>(null);
  const [shares, setShares] = useState<Record<string, number>>({});
  const [settled, setSettled] = useState(false);
  const [offerConfirm, setOfferConfirm] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const lastTotal = useRef<Money>(DEFAULT_TOTAL);
  useEffect(() => {
    setNamed(true);
    const own = visitorLocale();
    if (own === SSR_LOCALE) return;
    setLocale(own);
    // Re-type the untouched default in the visitor's separators ("100,00" in Germany).
    setAmountText((text) => (text === formatMoneyForInput(DEFAULT_TOTAL, SSR_LOCALE) ? formatMoneyForInput(DEFAULT_TOTAL, own) : text));
  }, []);
  const lastShares = useRef(new Map<string, Money>());

  const participants = PEOPLE.filter((p) => active.includes(p.id));
  const parsed = parseMoneyInput(amountText, currency, { locale, allowZero: false });
  if (parsed.ok) lastTotal.current = parsed.value;
  const total = parsed.ok ? parsed.value : lastTotal.current;
  const amountError = !parsed.ok && (parsed.error !== 'empty' || amountBlurred) ? parseError(parsed.error, currency, parsed.maxDecimals, locale) : null;
  const fmt = (m: Money) => formatMoney(m, { locale });
  const ones = participants.map(() => 1);

  // Until a person edits them, the Exact and Percent fields hold the even split.
  const evenExact = Object.fromEntries(
    allocateMinor(total.amountMinor, ones).map((minor, i) => [participants[i]?.id ?? '', formatMoneyForInput({ amountMinor: minor, currency: total.currency }, locale)]),
  );
  const evenPercent = Object.fromEntries(allocateMinor(10000, ones).map((v, i) => [participants[i]?.id ?? '', `${Math.floor(v / 100)}${decimal}${String(v % 100).padStart(2, '0')}`]));
  const exactValues = exactText ?? evenExact;
  const percentValues = percentText ?? evenPercent;

  const exactParsed = participants.map((p) => {
    const text = exactValues[p.id] ?? '';
    if (text.trim() === '') return { id: p.id, minor: 0, error: null as string | null };
    const r = parseMoneyInput(text, total.currency, { locale, allowZero: true });
    return r.ok ? { id: p.id, minor: r.value.amountMinor, error: null } : { id: p.id, minor: Number.NaN, error: parseError(r.error, total.currency, r.maxDecimals, locale) };
  });

  const spec: SplitSpec =
    method === 'equal'
      ? { type: 'equal', participants: participants.map((p) => p.id) }
      : method === 'exact'
        ? { type: 'exact', amounts: exactParsed.map((e) => ({ personId: e.id, amountMinor: e.minor })) }
        : method === 'percentage'
          ? { type: 'percentage', percentages: participants.map((p) => ({ personId: p.id, percent: percentForEngine(percentValues[p.id] ?? '', decimal) })) }
          : { type: 'shares', shares: participants.map((p) => ({ personId: p.id, shares: shares[p.id] ?? 1 })) };

  const validation = validateSplit(spec, total);
  const result = validation.ok && parsed.ok ? resolveSplit(spec, total) : null;
  if (result) for (const s of result) lastShares.current.set(s.personId, s.amount);
  const issues: readonly SplitIssue[] = validation.ok ? [] : validation.issues;
  const rowIssue = (id: string) => issues.find((i) => i.personId === id && i.code !== 'exact_sum_mismatch');

  const unit: Money = { amountMinor: 1, currency: total.currency };
  const leftover = participants.length ? total.amountMinor - Math.floor(total.amountMinor / participants.length) * participants.length : 0;

  const touch = () => {
    setSettled(false);
    setOfferConfirm(false);
    setConfirming(false);
  };

  const status = (() => {
    if (!parsed.ok) return null;
    if (method === 'equal') {
      if (leftover === 0) return `${fmt(total)} splits evenly ${participants.length} way${participants.length === 1 ? '' : 's'}, with nothing left over.`;
      return leftover === 1
        ? `FinBuddy gives the extra ${fmt(unit)} to the first person, every time.`
        : `FinBuddy gives one extra ${fmt(unit)} each to the first ${leftover} people, every time.`;
    }
    if (method === 'exact') {
      if (exactParsed.some((e) => Number.isNaN(e.minor))) return 'Fix the amount marked below.';
      const assigned = exactParsed.reduce((acc, e) => acc + e.minor, 0);
      const diff = total.amountMinor - assigned;
      const a = fmt({ amountMinor: assigned, currency: total.currency });
      if (diff > 0) return `${a} of ${fmt(total)} assigned, ${fmt({ amountMinor: diff, currency: total.currency })} left.`;
      if (diff < 0) return `${a} assigned, ${fmt({ amountMinor: -diff, currency: total.currency })} more than ${fmt(total)}.`;
      return `All of ${fmt(total)} assigned.`;
    }
    if (method === 'percentage') {
      const sumIssue = issues.find((i) => i.code === 'percent_sum_out_of_tolerance');
      if (issues.some((i) => i.code === 'invalid_percent')) return 'Fix the percentage marked below.';
      if (sumIssue?.actual !== undefined) return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(Number(sumIssue.actual))}% of 100% assigned.`;
      return 'Adds up to 100%. Leftover pennies go by the largest remainder.';
    }
    const list = participants.map((p) => shares[p.id] ?? 1);
    return `Split ${list.join(' : ')}, ${list.reduce((a, b) => a + b, 0)} shares in all.`;
  })();

  const toggle = (id: string) => {
    touch();
    setActive((prev) => (prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : PEOPLE.filter((p) => prev.includes(p.id) || p.id === id).map((p) => p.id)));
  };

  const changeCurrency = (next: CurrencyCode) => {
    touch();
    const carried = parsed.ok ? carryAmount(parsed.value, next, locale) : null;
    if (carried !== null) setAmountText(carried);
    setExactText(null);
    setCurrency(next);
  };

  const settle = () => {
    setSettled(true);
    setOfferConfirm(false);
    setConfirming(false);
  };

  const prefix = formatMoneyToParts(total, { locale });
  const symbolFirst = prefix.findIndex((p) => p.type === 'currency') < prefix.findIndex((p) => p.type === 'integer');
  const symbol = prefix.find((p) => p.type === 'currency')?.value ?? total.currency;
  const zero: Money = { amountMinor: 0, currency: total.currency };
  const helpId = `${ids}-help`;

  const rows = (control?: (id: string, name: string) => ReactNode) => (
    <ul className="mt-1 divide-y divide-separator">
      {participants.map((p, i) => {
        const share = settled ? zero : (result?.[i]?.amount ?? lastShares.current.get(p.id) ?? zero);
        const stale = !settled && !result;
        const issue = rowIssue(p.id);
        const fieldError = method === 'exact' ? exactParsed[i]?.error : issue ? 'Use a number like 25 or 33.33.' : null;
        return (
          <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
            <span aria-hidden="true" className={cn('inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold', i === 0 ? 'bg-tint text-on-tint' : 'bg-tint-wash text-on-tint-wash')}>
              {initials(p.name)}
            </span>
            <span className="min-w-12 flex-1 truncate text-[16px]">{p.name}</span>
            {control?.(p.id, p.name)}
            <span className="ml-auto flex min-w-[5.5rem] flex-col items-end">
              <Odometer money={share} locale={locale} className={cn('text-[20px] transition-colors duration-[240ms]', stale && 'text-label-3')} />
              {method === 'equal' && result && !settled && i < leftover ? <span className="mt-1 text-[12px] text-label-2">extra {fmt(unit)}</span> : null}
            </span>
            {fieldError ? (
              <span role="alert" className="w-full pl-11 text-[13px] text-danger">
                {fieldError}
              </span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );

  const fieldClass =
    'h-10 w-[6.5rem] rounded-[10px] bg-fill px-3 text-right text-[16px] font-semibold outline-none ring-tint focus-visible:ring-2 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-danger';

  return (
    <article aria-labelledby={`${ids}-title`} className={cn('rounded-[12px] bg-surface p-4 text-label shadow-card ring-1 ring-separator sm:p-6', className)}>
      <header className="flex items-center justify-between gap-3">
        <h2 id={`${ids}-title`} className="title text-[20px]">
          Split a bill
        </h2>
        <SampleChip />
      </header>

      <div className="mt-4">
        <label htmlFor={`${ids}-amount`} className="text-[13px] font-medium text-label-2">
          Total
        </label>
        <div className="group/amount">
        <div className="mt-1 flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-baseline gap-1 rounded-[10px] text-[40px] sm:text-[48px]">
            {symbolFirst ? <span aria-hidden="true" className="readout text-label-2">{symbol}</span> : null}
            <input
              id={`${ids}-amount`}
              inputMode="decimal"
              autoComplete="off"
              spellCheck={false}
              value={amountText}
              aria-invalid={amountError ? true : undefined}
              aria-describedby={amountError ? `${ids}-amount-error` : undefined}
              onChange={(e) => {
                touch();
                setAmountText(e.target.value);
                setExactText(null);
              }}
              onBlur={() => setAmountBlurred(true)}
              className="amount-input leading-[1.1] text-label"
            />
            {!symbolFirst ? <span aria-hidden="true" className="readout text-label-2">{symbol}</span> : null}
          </div>
          <div className="relative shrink-0 rounded-full focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-tint">
            <span aria-hidden="true" className="pointer-events-none inline-flex h-10 items-center gap-1.5 rounded-full bg-fill pr-3 pl-4 text-[16px] font-semibold">
              {currency}
              <CaretDownIcon size={16} />
            </span>
            <label htmlFor={`${ids}-currency`} className="sr-only">
              Currency
            </label>
            <select
              id={`${ids}-currency`}
              value={currency}
              onChange={(e) => changeCurrency(e.target.value as CurrencyCode)}
              className="absolute inset-0 cursor-pointer appearance-none opacity-0"
            >
              <optgroup label="Suggested">
                {SUGGESTED.map((code) => (
                  <option key={code} value={code}>
                    {named ? `${code}, ${currencyName(code, locale)}` : code}
                  </option>
                ))}
              </optgroup>
              <optgroup label="All currencies">
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {named ? `${code}, ${currencyName(code, locale)}` : code}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
        {/* The field's focus state: the rule under the amount turns to the tint. */}
        <div className="h-0.5 rounded-full bg-separator transition-colors duration-[160ms] group-focus-within/amount:bg-tint" aria-hidden="true" />
        </div>
        <p id={`${ids}-amount-error`} role={amountError ? 'alert' : undefined} className={cn('mt-2 min-h-5 text-[13px]', amountError ? 'text-danger' : 'text-label-2')}>
          {amountError ?? `${currencyName(total.currency, locale)}, ${minorUnits(total.currency) === 0 ? 'no decimals' : `${minorUnits(total.currency)} decimals`}`}
        </p>
      </div>

      <fieldset className="mt-4">
        <legend className="text-[13px] font-medium text-label-2">Who's in</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PEOPLE.map((p) => {
            const on = active.includes(p.id);
            const last = on && active.length === 1;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={on}
                aria-disabled={last || undefined}
                title={last ? 'At least one person pays' : undefined}
                onClick={() => !last && toggle(p.id)}
                className={cn(
                  'inline-flex h-9 items-center gap-2 rounded-full pr-3.5 pl-1 text-[15px] font-medium transition-colors duration-[160ms]',
                  on ? 'bg-tint text-on-tint' : 'text-label-2 ring-1 ring-separator ring-inset hover:text-label',
                  last && 'cursor-not-allowed',
                )}
              >
                <span aria-hidden="true" className={cn('inline-flex size-7 items-center justify-center rounded-full text-[12px] font-semibold', on ? 'bg-on-tint/15' : 'bg-fill')}>
                  {initials(p.name)}
                </span>
                {p.name}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Tabs.Root
        value={method}
        onValueChange={(v) => {
          touch();
          setMethod(v as Method);
        }}
        className="mt-4"
      >
        <Tabs.List aria-label="How to split" className="grid grid-cols-4 gap-1 rounded-full bg-fill p-1">
          {METHODS.map((m) => (
            <Tabs.Trigger
              key={m.value}
              value={m.value}
              className="h-9 rounded-full text-[15px] font-medium text-label-2 transition-colors duration-[160ms] hover:text-label data-[state=active]:bg-surface data-[state=active]:text-label data-[state=active]:shadow-[0_1px_2px_rgba(26,20,32,0.14)]"
            >
              {m.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="equal" className="outline-none">
          {rows()}
        </Tabs.Content>
        <Tabs.Content value="exact" className="outline-none">
          {rows((id, name) => (
            <input
              aria-label={`${name}'s amount`}
              inputMode="decimal"
              autoComplete="off"
              value={exactValues[id] ?? ''}
              aria-invalid={exactParsed.find((e) => e.id === id)?.error ? true : undefined}
              onChange={(e) => {
                touch();
                setExactText({ ...exactValues, [id]: e.target.value });
              }}
              className={fieldClass}
            />
          ))}
        </Tabs.Content>
        <Tabs.Content value="percentage" className="outline-none">
          {rows((id, name) => (
            <span className="relative">
              <input
                aria-label={`${name}'s percentage`}
                inputMode="decimal"
                autoComplete="off"
                value={percentValues[id] ?? ''}
                aria-invalid={rowIssue(id) ? true : undefined}
                onChange={(e) => {
                  touch();
                  setPercentText({ ...percentValues, [id]: e.target.value });
                }}
                className={cn(fieldClass, 'pr-7')}
              />
              <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[15px] text-label-2">
                %
              </span>
            </span>
          ))}
        </Tabs.Content>
        <Tabs.Content value="shares" className="outline-none">
          {rows((id, name) => {
            const n = shares[id] ?? 1;
            const set = (next: number) => {
              touch();
              setShares((prev) => ({ ...prev, [id]: Math.min(MAX_SHARES, Math.max(1, next)) }));
            };
            return (
              <span className="inline-flex items-center rounded-full bg-fill" role="group" aria-label={`${name}'s shares`}>
                <button type="button" aria-label={`One fewer share for ${name}`} disabled={n <= 1} onClick={() => set(n - 1)} className="inline-flex size-10 items-center justify-center rounded-full text-label disabled:text-label-3">
                  <MinusIcon size={16} aria-hidden="true" />
                </button>
                <output aria-live="polite" className="w-6 text-center text-[16px] font-semibold">
                  {n}
                </output>
                <button type="button" aria-label={`One more share for ${name}`} disabled={n >= MAX_SHARES} onClick={() => set(n + 1)} className="inline-flex size-10 items-center justify-center rounded-full text-label disabled:text-label-3">
                  <PlusIcon size={16} aria-hidden="true" />
                </button>
              </span>
            );
          })}
        </Tabs.Content>
      </Tabs.Root>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-[14px] text-label-2" aria-live="polite">
          {settled ? null : status}
        </p>
        {(method === 'exact' && exactText) || (method === 'percentage' && percentText) ? (
          <button
            type="button"
            onClick={() => {
              touch();
              if (method === 'exact') setExactText(null);
              else setPercentText(null);
            }}
            className="text-[14px] font-semibold text-tint underline underline-offset-4"
          >
            Fill evenly
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex min-h-12 flex-wrap items-center gap-x-4 gap-y-3 border-t border-separator pt-4">
        {settled ? (
          <>
            <p className="flex items-center gap-2 text-[15px] font-medium" role="status">
              <CheckCircleIcon size={20} className="text-credit" aria-hidden="true" />
              Settled up. Every share rolled to zero.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setSettled(false)} className="ml-auto">
              <ArrowCounterClockwiseIcon size={16} aria-hidden="true" />
              Split again
            </Button>
          </>
        ) : reduce ? (
          confirming ? (
            <>
              <Button onClick={settle}>Confirm, everyone has paid</Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setConfirming(true)} disabled={!result}>
              Settle up
            </Button>
          )
        ) : (
          <>
            <HoldButton label="Hold to settle up" onConfirm={settle} onShortPress={() => setOfferConfirm(true)} disabled={!result} describedBy={helpId} />
            <p id={helpId} className="text-[14px] text-label-2">
              {offerConfirm ? (
                <>
                  Keep holding until the ring closes, or{' '}
                  <button type="button" onClick={settle} className="font-semibold text-tint underline underline-offset-4">
                    confirm without holding
                  </button>
                  .
                </>
              ) : (
                'Press and hold until the ring closes, like settling up in the app.'
              )}
            </p>
          </>
        )}
      </div>
    </article>
  );
}
