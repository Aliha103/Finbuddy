/**
 * Calendar dates without time zones.
 *
 * The old web app stored dates as UTC instants and bucketed them with UTC getters, so
 * expenses near midnight moved to the previous day or month for people west of UTC.
 * FinBuddy stores the calendar date a person chose (LocalDate, "YYYY-MM-DD") and does
 * all date arithmetic on the calendar values, so no time zone can shift it.
 */

/** A calendar date, "YYYY-MM-DD". Compare with < / > (lexicographic order is chronological). */
export type LocalDate = string;
/** A calendar month, "YYYY-MM". */
export type MonthKey = string;
/** An exact moment, ISO 8601 with a Z offset, e.g. "2026-03-01T18:30:00.000Z". */
export type Instant = string;
/** Returns the current time; injectable so tests and sample data are deterministic. */
export type Clock = () => Date;

export const systemClock: Clock = () => new Date();

const LOCAL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;
const INSTANT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/;

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/**
 * Milliseconds since the epoch for a UTC calendar date. Unlike Date.UTC, years 0-99 are not
 * remapped to 1900-1999. `month` is 1-12; other values (and other days) roll over like Date.UTC.
 */
function utcMs(year: number, month: number, day: number): number {
  const d = new Date(0);
  d.setUTCFullYear(year, month - 1, day);
  return d.getTime();
}

export function daysInMonthOf(year: number, month: number): number {
  return new Date(utcMs(year, month + 1, 0)).getUTCDate();
}

export function isLocalDate(value: unknown): value is LocalDate {
  if (typeof value !== 'string') return false;
  const m = LOCAL_DATE_RE.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonthOf(year, month);
}

export function isMonthKey(value: unknown): value is MonthKey {
  if (typeof value !== 'string') return false;
  const m = MONTH_RE.exec(value);
  return !!m && Number(m[2]) >= 1 && Number(m[2]) <= 12;
}

export function isInstant(value: unknown): value is Instant {
  return typeof value === 'string' && INSTANT_RE.test(value) && !Number.isNaN(Date.parse(value));
}

export interface CalendarDate {
  readonly year: number;
  readonly month: number; // 1-12
  readonly day: number; // 1-31
}

export function parseLocalDate(value: LocalDate): CalendarDate {
  if (!isLocalDate(value)) throw new RangeError(`Not a YYYY-MM-DD date: ${JSON.stringify(value)}`);
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  return { year: y, month: m, day: d };
}

export function makeLocalDate(year: number, month: number, day: number): LocalDate {
  const value = `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
  if (!isLocalDate(value)) throw new RangeError(`Invalid calendar date: ${value}`);
  return value;
}

/** The calendar date of `date` in the device's time zone (local getters, never UTC getters). */
export function localDateFromDate(date: Date): LocalDate {
  return makeLocalDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** The calendar date of an instant in an explicit IANA time zone, e.g. "America/Los_Angeles". */
export function localDateInTimeZone(instant: Date | Instant, timeZone: string): LocalDate {
  const date = typeof instant === 'string' ? new Date(instant) : instant;
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', numberingSystem: 'latn' } as Intl.DateTimeFormatOptions).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return makeLocalDate(get('year'), get('month'), get('day'));
}

/** Today's calendar date on this device. */
export function todayLocal(clock: Clock = systemClock): LocalDate {
  return localDateFromDate(clock());
}

/** "2026-03-14" -> "2026-03". */
export function monthOf(date: LocalDate): MonthKey {
  parseLocalDate(date);
  return date.slice(0, 7);
}

function toUtcDays(date: LocalDate): number {
  const { year, month, day } = parseLocalDate(date);
  return utcMs(year, month, day) / 86_400_000;
}

function fromUtcDays(days: number): LocalDate {
  const d = new Date(days * 86_400_000);
  return makeLocalDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function addDays(date: LocalDate, days: number): LocalDate {
  if (!Number.isInteger(days)) throw new RangeError('days must be an integer');
  return fromUtcDays(toUtcDays(date) + days);
}

/** Whole days from `from` to `to` (positive when `to` is later). */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return Math.round(toUtcDays(to) - toUtcDays(from));
}

export function compareLocalDate(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function parseMonthKey(value: MonthKey): { year: number; month: number } {
  if (!isMonthKey(value)) throw new RangeError(`Not a YYYY-MM month: ${JSON.stringify(value)}`);
  const [year, month] = value.split('-').map(Number) as [number, number];
  return { year, month };
}

export function addMonths(month: MonthKey, count: number): MonthKey {
  const { year, month: m } = parseMonthKey(month);
  const index = year * 12 + (m - 1) + count;
  return `${pad(Math.floor(index / 12), 4)}-${pad((index % 12) + 1)}`;
}

/** Inclusive list of months from `start` to `end`. Empty when end < start. */
export function monthRange(start: MonthKey, end: MonthKey): MonthKey[] {
  const first = parseMonthKey(start);
  const last = parseMonthKey(end);
  const months: MonthKey[] = [];
  // Count months as integers: string order breaks past 9999-12, which addMonths cannot represent.
  const count = last.year * 12 + last.month - (first.year * 12 + first.month);
  for (let i = 0; i <= count; i++) months.push(addMonths(start, i));
  return months;
}

export function daysInMonth(month: MonthKey): number {
  const { year, month: m } = parseMonthKey(month);
  return daysInMonthOf(year, m);
}

export function firstDayOfMonth(month: MonthKey): LocalDate {
  parseMonthKey(month);
  return `${month}-01`;
}

export function lastDayOfMonth(month: MonthKey): LocalDate {
  return `${month}-${pad(daysInMonth(month))}`;
}
