import { Temporal } from "@js-temporal/polyfill";
import { dateString, overlap, shift, today, wallInstant } from "./calendar";
import { occurrence, occursOn, validateRule, type Expanded, type Exception, type Rule } from "./recurrence";
const endOfTime = "9998-12-31";
function adjusted(rule: Rule, day: string, exceptions: Exception[]): Expanded | null {
  const exception = exceptions.find(e => e.rootSeriesId === rule.rootSeriesId && dateString(e.originalLocalDate) === day);
  const inSegment = day >= dateString(rule.effectiveFrom) && (!rule.effectiveUntil || day <= dateString(rule.effectiveUntil));
  if (!occursOn(rule, day) && !(exception && inSegment)) return null;
  const original = occurrence(rule, day);
  if (exception?.kind === "cancel") return null;
  if (exception?.kind === "override" && exception.startAt && exception.endAt) return { ...original, startAt: exception.startAt, endAt: exception.endAt, title: exception.title ?? original.title, version: exception.version, overridden: true };
  return original;
}
/** Finite witnesses for a 14-day pattern, plus every finite exception and timezone transition.
 * Same-zone rules are enforced by validateRule. No visible-week sampling is used as proof.
 */
export function ruleConflictWitnesses(a: Rule, b: Rule, exceptions: Exception[] = []): Expanded[] {
  validateRule(a); validateRule(b);
  const first = [dateString(a.effectiveFrom), shift(dateString(b.effectiveFrom), -1)].sort().at(-1)!;
  const last = [a.effectiveUntil ? dateString(a.effectiveUntil) : endOfTime, b.effectiveUntil ? shift(dateString(b.effectiveUntil), 1) : endOfTime].sort()[0];
  const candidates = new Set<string>();
  // Once a phase has an ordinary pair, further cycles repeat. Exceptions only affect finite dates.
  for (let i = 0; first <= last && i < 14; i++) {
    let day = shift(first, i);
    for (let skipped = 0; day <= last && skipped <= exceptions.length; skipped++, day = shift(day, 14)) {
      candidates.add(day);
      if (!exceptions.some(e => [day, shift(day, -1), shift(day, 1)].includes(dateString(e.originalLocalDate)))) break;
    }
  }
  for (const e of exceptions) {
    candidates.add(dateString(e.originalLocalDate));
    if (e.startAt && e.endAt) {
      for (const day of [today(e.startAt), today(e.endAt)]) for (const delta of [-1, 0, 1]) candidates.add(shift(day, delta));
    }
  }
  let zdt = Temporal.Instant.fromEpochMilliseconds(wallInstant(first, "00:00").getTime()).toZonedDateTimeISO(a.timezone);
  for (let i = 0; first <= last && i < 1000; i++) {
    const next = zdt.getTimeZoneTransition("next");
    if (!next || next.toPlainDate().toString() > last) break;
    for (const delta of [-1, 0, 1]) candidates.add(shift(next.toPlainDate().toString(), delta));
    zdt = next.add({ seconds: 1 });
    if (i === 999) throw new RangeError("TOO_MANY_TRANSITIONS");
  }
  const conflicts = new Map<string, Expanded>();
  for (const day of candidates) {
    const left = adjusted(a, day, exceptions);
    if (!left) continue;
    const nearby = new Set([shift(today(left.startAt), -1), today(left.startAt), today(left.endAt)]);
    for (const e of exceptions) if (e.rootSeriesId === b.rootSeriesId && e.startAt && e.endAt && overlap(left, { startAt: e.startAt, endAt: e.endAt })) nearby.add(dateString(e.originalLocalDate));
    for (const rightDay of nearby) {
      const right = adjusted(b, rightDay, exceptions);
      if (right && overlap(left, right)) conflicts.set(right.occurrenceKey, right);
    }
  }
  return [...conflicts.values()];
}
