import {
  DEFAULT_CATEGORIES,
  formatMoney,
  getNumberSeparators,
  isLocalDate,
  isMoney,
  minorUnits,
  type CurrencyCode,
  type LocalDate,
  type Money,
  type MonthKey,
  type ParseMoneyErrorCode,
  type PersonId,
  type Settlement,
  type Transfer,
} from '@finbuddy/shared';

import { useDeviceLocale, usePeople, useProfile } from '@/data';

/**
 * PREVIEW COPY. Plain English placeholder strings until the design team writes final copy.
 * Every amount goes through formatMoney with the device locale; every sentence also has a
 * spoken form where amounts carry their currency name ("12.50 British pounds").
 */
export interface Spoken {
  readonly text: string;
  readonly spoken: string;
}
export type Part = string | Money | Spoken;

export interface Formatter {
  readonly locale: string;
  money(m: Money): string;
  spokenMoney(m: Money): string;
  /** Joins text and amounts into one sentence with a screen-reader form. */
  say(...parts: Part[]): Spoken;
  date(d: LocalDate): string;
  month(m: MonthKey): string;
  number(n: number, maxFractionDigits?: number): string;
  percent(ratio: number): string;
  currencyName(c: CurrencyCode): string;
  category(id: string | null | undefined): string;
  /** "You" for the profile owner, otherwise the person's name. */
  name(personId: PersonId): string;
  isMe(personId: PersonId): boolean;
}

const categoryLabels = new Map<string, string>(DEFAULT_CATEGORIES.map((c) => [c.id, c.defaultLabel]));

export function categoryLabel(id: string | null | undefined): string {
  if (!id) return 'All spending';
  return categoryLabels.get(id) ?? id.replace(/_/g, ' ');
}

const absolute = (m: Money): Money => (m.amountMinor < 0 ? { amountMinor: -m.amountMinor, currency: m.currency } : m);

function isSpoken(part: Part): part is Spoken {
  return typeof part === 'object' && 'spoken' in part;
}

export function createFormatter(locale: string, me: PersonId | null, names: ReadonlyMap<PersonId, { displayName: string }>): Formatter {
  const money = (m: Money) => formatMoney(m, { locale });
  const spokenMoney = (m: Money) => formatMoney(m, { locale, currencyDisplay: 'name' });
  const utc = (d: string) => new Date(`${d}T00:00:00.000Z`);
  let displayNames: { of(code: string): string | undefined } | null = null;
  try {
    const DisplayNames = (Intl as unknown as { DisplayNames?: new (l: string, o: { type: string }) => { of(code: string): string | undefined } }).DisplayNames;
    displayNames = DisplayNames ? new DisplayNames(locale, { type: 'currency' }) : null;
  } catch {
    displayNames = null;
  }
  return {
    locale,
    money,
    spokenMoney,
    say: (...parts) => ({
      text: parts.map((p) => (typeof p === 'string' ? p : isSpoken(p) ? p.text : money(p))).join(''),
      spoken: parts.map((p) => (typeof p === 'string' ? p : isSpoken(p) ? p.spoken : spokenMoney(p))).join(''),
    }),
    date: (d) => (isLocalDate(d) ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(utc(d)) : d),
    month: (m) => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(utc(`${m}-01`)),
    number: (n, maxFractionDigits = 2) => new Intl.NumberFormat(locale, { maximumFractionDigits: maxFractionDigits }).format(n),
    percent: (ratio) => new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(ratio),
    currencyName: (c) => {
      const name = displayNames?.of(c);
      return name && name !== c ? `${name} (${c})` : c;
    },
    category: categoryLabel,
    name: (personId) => (personId === me ? 'You' : (names.get(personId)?.displayName ?? 'Someone')),
    isMe: (personId) => personId === me,
  };
}

export function useFormat(): Formatter {
  const locale = useDeviceLocale();
  const profile = useProfile();
  const people = usePeople();
  return createFormatter(locale, profile?.personId ?? null, people);
}

/** "You owe Blake (sample) ¥21,486", "Avery (sample) owes you $135.99", "Devon (sample) owes Casey (sample) £701.21". */
export function transferSentence(f: Formatter, t: Transfer): Spoken {
  if (f.isMe(t.from)) return f.say('You owe ', f.name(t.to), ' ', t.amount);
  if (f.isMe(t.to)) return f.say(f.name(t.from), ' owes you ', t.amount);
  return f.say(f.name(t.from), ' owes ', f.name(t.to), ' ', t.amount);
}

/** A member's net in a group: "Casey (sample) is owed £758.76", "You owe £57.55", "Blake (sample) is settled up". */
export function memberNetSentence(f: Formatter, personId: PersonId, net: Money): Spoken {
  const me = f.isMe(personId);
  const who = f.name(personId);
  if (net.amountMinor === 0) return f.say(me ? "You're settled up" : `${who} is settled up`);
  if (net.amountMinor > 0) return f.say(me ? "You're owed " : `${who} is owed `, absolute(net));
  return f.say(me ? 'You owe ' : `${who} owes `, absolute(net));
}

/** The profile owner's position: "You owe £57.55", "You're owed $185.92". */
export function myNetSentence(f: Formatter, net: Money): Spoken {
  return net.amountMinor >= 0 ? f.say("You're owed ", absolute(net)) : f.say('You owe ', absolute(net));
}

/** A payment, in the past tense: "You paid Casey (sample) £720.00". */
export function settlementSentence(f: Formatter, s: Settlement): Spoken {
  if (s.status === 'pending') {
    if (f.isMe(s.fromPersonId)) return f.say("You're paying ", f.name(s.toPersonId), ' ', s.amount);
    if (f.isMe(s.toPersonId)) return f.say(f.name(s.fromPersonId), ' is paying you ', s.amount);
    return f.say(f.name(s.fromPersonId), ' is paying ', f.name(s.toPersonId), ' ', s.amount);
  }
  if (f.isMe(s.fromPersonId)) return f.say('You paid ', f.name(s.toPersonId), ' ', s.amount);
  if (f.isMe(s.toPersonId)) return f.say(f.name(s.fromPersonId), ' paid you ', s.amount);
  return f.say(f.name(s.fromPersonId), ' paid ', f.name(s.toPersonId), ' ', s.amount);
}

/** An example amount typed the local way: "12.50", "12,50", "1250" for JPY. */
export function exampleAmount(currency: CurrencyCode, locale: string): string {
  const digits = minorUnits(currency);
  if (digits === 0) return '1250';
  return `12${getNumberSeparators(locale).decimal}${'5'.padEnd(digits, '0')}`;
}

/** Human message for each parseMoneyInput error code. */
export function parseErrorMessage(f: Formatter, code: ParseMoneyErrorCode, currency: CurrencyCode, maxDecimals: number): string {
  switch (code) {
    case 'empty':
      return 'Enter an amount.';
    case 'invalid':
      return `That doesn't look like an amount. Type digits, like ${exampleAmount(currency, f.locale)}.`;
    case 'negative':
      return "Amounts can't be negative. Enter what was paid, without a minus sign.";
    case 'exponent':
      return 'Write the amount out in full, without scientific notation.';
    case 'too_many_decimals':
      return maxDecimals === 0
        ? `${f.currencyName(currency)} has no smaller unit, so enter a whole number.`
        : `${f.currencyName(currency)} allows at most ${maxDecimals} decimal place${maxDecimals === 1 ? '' : 's'}.`;
    case 'too_large':
      return 'That amount is too large.';
    case 'zero':
      return 'The total must be more than zero.';
  }
}

/** Formats any insight value: amounts, dates, numbers or plain words. */
export function valueText(f: Formatter, value: unknown, key = ''): Spoken {
  if (isMoney(value)) return f.say(value);
  if (key === 'category' || key === 'categoryId') return f.say(categoryLabel(value as string | null));
  if (typeof value === 'string' && isLocalDate(value)) return f.say(f.date(value));
  if (key === 'ratio' && typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) return f.say(f.number(Number(value)));
  if (typeof value === 'number') return f.say(f.number(value));
  if (typeof value === 'boolean') return f.say(value ? 'yes' : 'no');
  if (value === null || value === undefined) return f.say('none');
  return f.say(String(value));
}
