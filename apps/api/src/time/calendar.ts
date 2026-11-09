import { Temporal } from "@js-temporal/polyfill";
export const TIMEZONE = "Asia/Tehran";
export const DISPLAY_WEEKDAYS = [6, 7, 1, 2, 3, 4, 5] as const;
export type Interval = { startAt: Date; endAt: Date };
export function date(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RangeError("INVALID_LOCAL_DATE");
  return Temporal.PlainDate.from(value, { overflow: "reject" });
}
export function dbDate(value: string) { date(value); return new Date(`${value}T00:00:00.000Z`); }
export function dateString(value: Date) { return value.toISOString().slice(0, 10); }
export function shift(value: string, days: number) { return date(value).add({ days }).toString(); }
export function today(now = new Date(), timezone = TIMEZONE) { return Temporal.Instant.fromEpochMilliseconds(now.getTime()).toZonedDateTimeISO(timezone).toPlainDate().toString(); }
export function weekStart(value: string) { const d = date(value); return d.subtract({ days: (d.dayOfWeek + 1) % 7 }).toString(); }
export function wallInstant(day: string, time: string, timezone = TIMEZONE) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new RangeError("INVALID_LOCAL_TIME");
  const d = date(day);
  const zdt = Temporal.ZonedDateTime.from({ timeZone: timezone, year: d.year, month: d.month, day: d.day, hour: Number(time.slice(0, 2)), minute: Number(time.slice(3)) }, { disambiguation: "compatible", overflow: "reject" });
  return new Date(zdt.epochMilliseconds);
}
export function weekBounds(value: string): Interval {
  const start = weekStart(value);
  return { startAt: wallInstant(start, "00:00"), endAt: wallInstant(shift(start, 7), "00:00") };
}
export function range(from: string, to: string): Interval {
  const days = date(to).since(date(from), { largestUnit: "days" }).days;
  if (days < 1 || days > 93) throw new RangeError("RANGE_TOO_LARGE");
  return { startAt: wallInstant(from, "00:00"), endAt: wallInstant(to, "00:00") };
}
export function instant(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.test(value)) throw new RangeError("OFFSET_REQUIRED");
  return new Date(Temporal.Instant.from(value).epochMilliseconds);
}
export function overlap(a: Interval, b: Interval) { return a.startAt < b.endAt && b.startAt < a.endAt; }
export function occupiedMinutes(intervals: Interval[], bounds: Interval) {
  const clipped = intervals.map(i => [Math.max(i.startAt.getTime(), bounds.startAt.getTime()), Math.min(i.endAt.getTime(), bounds.endAt.getTime())]).filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
  if (!clipped.length) return 0;
  let total = 0, start = clipped[0][0], end = clipped[0][0];
  for (const [a, b] of clipped) { if (a > end) { total += end - start; start = a; end = b; } else end = Math.max(end, b); }
  return (total + end - start) / 60000;
}
export function validateInterval(interval: Interval) {
  if (!Number.isFinite(interval.startAt.getTime()) || !Number.isFinite(interval.endAt.getTime()) || interval.endAt <= interval.startAt) throw new RangeError("INVALID_INTERVAL");
}
