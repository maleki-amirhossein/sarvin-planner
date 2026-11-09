import { TZDate } from "@date-fns/tz";
import {
  format,
  startOfWeek,
  parse,
  isValid,
  startOfMonth,
  addMonths,
  getDaysInMonth,
} from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";

export const APP_TIME_ZONE = "Asia/Tehran";
export const WEEK_STARTS_ON = 6;
export const persianDigits = (value: string | number) =>
  String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)]!);
export const latinDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
export function formatJalaliDate(
  date: Date,
  pattern = "EEEE d MMMM yyyy",
): string {
  return persianDigits(
    format(new TZDate(date, APP_TIME_ZONE), pattern, { locale: faIR }),
  );
}
export function startOfTehranWeek(date: Date): Date {
  return new Date(
    startOfWeek(new TZDate(date, APP_TIME_ZONE), {
      weekStartsOn: WEEK_STARTS_ON,
    }).getTime(),
  );
}
export function localDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join("-");
}
export function fromLocalDate(value: string): TZDate {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("تاریخ نامعتبر است.");
  const [year, month, day] = value.split("-").map(Number);
  const date = new TZDate(year!, month! - 1, day!, 12, 0, 0, APP_TIME_ZONE);
  if (localDate(date) !== value) throw new Error("تاریخ نامعتبر است.");
  return date;
}
export function shiftDate(value: string, days: number): string {
  const date = fromLocalDate(value);
  date.setDate(date.getDate() + days);
  return localDate(date);
}
export function parseJalaliDate(value: string): string | null {
  const normalized = latinDigits(value.trim());
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(normalized)) return null;
  const date = parse(
    normalized,
    "yyyy/MM/dd",
    new TZDate(2025, 0, 1, 12, APP_TIME_ZONE),
  );
  return isValid(date) && format(date, "yyyy/MM/dd") === normalized
    ? localDate(date)
    : null;
}
export function jalaliMonth(value: string, offset = 0) {
  const first = startOfMonth(addMonths(fromLocalDate(value), offset));
  return {
    title: formatJalaliDate(first, "MMMM yyyy"),
    first: localDate(first),
    padding: (first.getDay() + 1) % 7,
    days: getDaysInMonth(first),
  };
}
export function formatTime(value: string | Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

/** Presentation/input conversion only; the API validates and owns schedule semantics. */
export function localTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
export function inputInstant(day: string, time: string) {
  const normalized = latinDigits(time);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(normalized))
    throw new Error("ساعت را به صورت ۱۴:۳۰ وارد کنید.");
  fromLocalDate(day);
  const [year, month, date] = day.split("-").map(Number),
    [hour, minute] = normalized.split(":").map(Number);
  return new TZDate(
    year,
    month - 1,
    date,
    hour,
    minute,
    0,
    0,
    APP_TIME_ZONE,
  ).toISOString();
}
