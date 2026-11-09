import { date, dateString, overlap, range, shift, TIMEZONE, wallInstant, weekStart, type Interval } from "./calendar";
export interface Rule {
  id: string; rootSeriesId: string; title: string; weekdays: number[]; localStartTime: string;
  localEndTime?: string; endsNextDay?: boolean; durationMinutes?: number;
  timezone: string; effectiveFrom: Date; effectiveUntil: Date | null;
  everyWeeks?: number; anchorWeekStart?: Date | null; parity?: number | null; version: number;
}
export interface Exception { rootSeriesId: string; originalLocalDate: Date; kind: "cancel" | "override"; title: string | null; startAt: Date | null; endAt: Date | null; version: number }
export interface Expanded extends Interval { occurrenceKey: string; originalLocalDate: string; seriesId: string; rootSeriesId: string; title: string; version: number; overridden: boolean }
export function validateRule(rule: Rule) {
  if (!rule.weekdays.length || rule.weekdays.length > 7 || new Set(rule.weekdays).size !== rule.weekdays.length || rule.weekdays.some(d => !Number.isInteger(d) || d < 1 || d > 7)) throw new RangeError("INVALID_WEEKDAYS");
  if (rule.timezone !== TIMEZONE) throw new RangeError("UNSUPPORTED_TIMEZONE");
  if (rule.effectiveUntil && rule.effectiveUntil < rule.effectiveFrom) throw new RangeError("INVALID_EFFECTIVE_RANGE");
  wallInstant(dateString(rule.effectiveFrom), rule.localStartTime, rule.timezone);
  if (rule.durationMinutes !== undefined) {
    if (!Number.isInteger(rule.durationMinutes) || rule.durationMinutes < 1 || rule.durationMinutes > 1440) throw new RangeError("INVALID_DURATION");
  } else {
    if (!rule.localEndTime) throw new RangeError("END_REQUIRED");
    wallInstant(dateString(rule.effectiveFrom), rule.localEndTime, rule.timezone);
    if (!rule.endsNextDay && rule.localEndTime <= rule.localStartTime) throw new RangeError("INVALID_INTERVAL");
  }
  const every = rule.everyWeeks ?? 1;
  if (![1, 2].includes(every)) throw new RangeError("INVALID_FREQUENCY");
  if (every === 2 && (!rule.anchorWeekStart || date(dateString(rule.anchorWeekStart)).dayOfWeek !== 6 || ![0, 1].includes(rule.parity ?? -1))) throw new RangeError("ALTERNATE_ANCHOR_REQUIRED");
  if (every === 1 && (rule.anchorWeekStart != null || rule.parity != null)) throw new RangeError("UNEXPECTED_ANCHOR");
}
export function occursOn(rule: Rule, day: string) {
  if (day < dateString(rule.effectiveFrom) || (rule.effectiveUntil && day > dateString(rule.effectiveUntil)) || !rule.weekdays.includes(date(day).dayOfWeek)) return false;
  if ((rule.everyWeeks ?? 1) === 2) {
    const weeks = date(weekStart(day)).since(date(dateString(rule.anchorWeekStart!)), { largestUnit: "days" }).days / 7;
    return ((weeks % 2) + 2) % 2 === rule.parity;
  }
  return true;
}
export function occurrence(rule: Rule, day: string): Expanded {
  const startAt = wallInstant(day, rule.localStartTime, rule.timezone);
  const endAt = rule.durationMinutes === undefined ? wallInstant(rule.endsNextDay ? shift(day, 1) : day, rule.localEndTime!, rule.timezone) : new Date(startAt.getTime() + rule.durationMinutes * 60000);
  return { occurrenceKey: `${rule.rootSeriesId}:${day}`, seriesId: rule.id, rootSeriesId: rule.rootSeriesId, originalLocalDate: day, title: rule.title, startAt, endAt, version: rule.version, overridden: false };
}
/** Expands local calendar dates; never advances UTC by 24 hours. Includes moved-in exceptions. */
export function expand(rule: Rule, from: string, to: string, exceptions: Exception[] = []): Expanded[] {
  validateRule(rule); const bounds = range(from, to);
  const overrides = new Map(exceptions.filter(e => e.rootSeriesId === rule.rootSeriesId).map(e => [dateString(e.originalLocalDate), e]));
  const candidates = new Set<string>();
  for (let day = shift(from, -1); day < to; day = shift(day, 1)) candidates.add(day);
  for (const [day, e] of overrides) if (e.kind === "override" && e.startAt && e.endAt && overlap({ startAt: e.startAt, endAt: e.endAt }, bounds)) candidates.add(day);
  const events: Expanded[] = [];
  for (const day of candidates) {
    const e = overrides.get(day);
    const inSegment = day >= dateString(rule.effectiveFrom) && (!rule.effectiveUntil || day <= dateString(rule.effectiveUntil));
    if (!occursOn(rule, day) && !(e && inSegment)) continue;
    if (e?.kind === "cancel") continue;
    let event = occurrence(rule, day);
    if (e?.kind === "override") {
      if (!e.startAt || !e.endAt || e.endAt <= e.startAt) throw new RangeError("INVALID_EXCEPTION");
      event = { ...event, startAt: e.startAt, endAt: e.endAt, title: e.title ?? event.title, version: e.version, overridden: true };
    }
    if (overlap(event, bounds)) events.push(event);
  }
  if (events.length > 1000) throw new RangeError("RANGE_TOO_LARGE");
  return events.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}
