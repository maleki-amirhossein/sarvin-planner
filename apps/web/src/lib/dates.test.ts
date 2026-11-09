import assert from "node:assert/strict";
import { test } from "node:test";
import { formatJalaliDate, startOfTehranWeek } from "./dates";

test("Nowruz is formatted in the Jalali calendar with Persian digits", () => {
  assert.equal(
    formatJalaliDate(new Date("2025-03-21T08:00:00Z"), "yyyy/MM/dd"),
    "۱۴۰۴/۰۱/۰۱",
  );
});
test("Tehran midnight, not the host timezone, determines the date", () => {
  assert.equal(
    formatJalaliDate(new Date("2025-03-20T20:29:59Z"), "yyyy/MM/dd"),
    "۱۴۰۳/۱۲/۳۰",
  );
  assert.equal(
    formatJalaliDate(new Date("2025-03-20T20:30:00Z"), "yyyy/MM/dd"),
    "۱۴۰۴/۰۱/۰۱",
  );
});
test("Weeks begin at Saturday midnight in Tehran", () => {
  assert.equal(
    startOfTehranWeek(new Date("2025-03-25T12:00:00Z")).toISOString(),
    "2025-03-21T20:30:00.000Z",
  );
});

test("Persian/Arabic typed Jalali dates reject rollover and accept Nowruz", async () => {
  const { parseJalaliDate, latinDigits, jalaliMonth } = await import("./dates");
  assert.equal(latinDigits("۱۴۰۴/٠١/۰۱"), "1404/01/01");
  assert.equal(parseJalaliDate("۱۴۰۴/۰۱/۰۱"), "2025-03-21");
  assert.equal(parseJalaliDate("۱۴۰۳/۱۲/۳۰"), "2025-03-20");
  assert.equal(parseJalaliDate("۱۴۰۴/۱۲/۳۰"), null);
  assert.equal(parseJalaliDate("۱۴۰۴/۰۷/۳۱"), null);
  assert.equal(jalaliMonth("2025-03-21", -1).days, 30);
  assert.equal(jalaliMonth("2025-03-21").days, 31);
  assert.equal(jalaliMonth("2025-03-21", 1).first, "2025-04-21");
});
test("Local-date week navigation is independent of host timezone", async () => {
  const { fromLocalDate, localDate, shiftDate } = await import("./dates");
  assert.equal(shiftDate("2025-03-22", -7), "2025-03-15");
  assert.equal(localDate(fromLocalDate("2025-03-21")), "2025-03-21");
  assert.throws(() => fromLocalDate("2025-02-30"));
});
