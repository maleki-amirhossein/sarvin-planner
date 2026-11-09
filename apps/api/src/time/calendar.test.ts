import { test } from "node:test";
import assert from "node:assert/strict";
import { dbDate, instant, occupiedMinutes, overlap, range, today, wallInstant, weekBounds, weekStart } from "./calendar";
import { expand, type Rule, validateRule } from "./recurrence";
const work: Rule = { id: "segment", rootSeriesId: "root", title: "work", weekdays: [6,7,1,2,3], localStartTime: "08:00", localEndTime: "13:00", timezone: "Asia/Tehran", effectiveFrom: dbDate("2025-03-22"), effectiveUntil: null, version: 1 };
test("Tehran Saturday and Nowruz boundaries independently match UTC", () => {
  assert.equal(today(new Date("2025-03-21T20:29:59Z")), "2025-03-21");
  assert.equal(today(new Date("2025-03-21T20:30:00Z")), "2025-03-22");
  assert.equal(weekStart("2025-03-28"), "2025-03-22");
  assert.equal(weekStart("2025-03-29"), "2025-03-29");
  assert.equal(weekBounds("2025-03-25").startAt.toISOString(), "2025-03-21T20:30:00.000Z");
  assert.equal(weekBounds("2025-03-25").endAt.toISOString(), "2025-03-28T20:30:00.000Z");
  assert.throws(() => dbDate("2025-02-30")); assert.throws(() => instant("2025-03-22T08:00:00"));
  assert.throws(() => range("2025-01-01", "2026-01-01"));
});
test("historical DST uses independent boundaries and compatible disambiguation", () => {
  const bounds = weekBounds("2021-03-22");
  assert.equal(bounds.startAt.toISOString(), "2021-03-19T20:30:00.000Z");
  assert.equal(bounds.endAt.toISOString(), "2021-03-26T19:30:00.000Z");
  assert.equal((bounds.endAt.getTime() - bounds.startAt.getTime()) / 3600000, 167);
  assert.equal(wallInstant("2021-03-22", "00:30").toISOString(), "2021-03-21T21:00:00.000Z");
  assert.equal(wallInstant("2021-09-21", "23:30").toISOString(), "2021-09-21T19:00:00.000Z");
});
test("five work days, exact times, inclusive effective end, no pre-start events", () => {
  const events = expand(work, "2025-03-22", "2025-03-29");
  assert.deepEqual(events.map(e => e.originalLocalDate), ["2025-03-22","2025-03-23","2025-03-24","2025-03-25","2025-03-26"]);
  assert.equal(events[0].startAt.toISOString(), "2025-03-22T04:30:00.000Z"); assert.equal(events[0].endAt.toISOString(), "2025-03-22T09:30:00.000Z");
  assert.equal(expand(work, "2025-03-15", "2025-03-22").length, 0);
  assert.equal(expand({ ...work, effectiveUntil: dbDate("2025-03-24") }, "2025-03-22", "2025-03-29").length, 3);
});
test("alternating rules use anchored local calendar weeks including negative offsets", () => {
  const rule = { ...work, weekdays: [6], effectiveFrom: dbDate("2025-03-01"), everyWeeks: 2, anchorWeekStart: dbDate("2025-03-22"), parity: 0 };
  assert.deepEqual(expand(rule, "2025-03-01", "2025-04-01").map(e => e.originalLocalDate), ["2025-03-08", "2025-03-22"]);
  assert.deepEqual(expand({ ...rule, parity: 1 }, "2025-03-01", "2025-04-01").map(e => e.originalLocalDate), ["2025-03-01", "2025-03-15", "2025-03-29"]);
  assert.throws(() => validateRule({ ...rule, anchorWeekStart: dbDate("2025-03-23") }));
});
test("cancel affects one occurrence, moved-in exception retains original stable key", () => {
  const exception = { rootSeriesId: "root", originalLocalDate: dbDate("2025-03-22"), kind: "cancel" as const, title: null, startAt: null, endAt: null, version: 1 };
  assert.equal(expand(work, "2025-03-22", "2025-03-29", [exception]).length, 4);
  const moved = { ...exception, kind: "override" as const, startAt: wallInstant("2025-04-01", "15:00"), endAt: wallInstant("2025-04-01", "16:00") };
  const event = expand(work, "2025-04-01", "2025-04-02", [moved]).find(e => e.overridden)!;
  assert.equal(event.occurrenceKey, "root:2025-03-22");
  assert.equal(expand(work, "2025-03-22", "2025-03-23", [moved]).length, 0);
});
test("cross-midnight one record, adjacent 13:00 is free, union never double-counts", () => {
  const workEvent = expand(work, "2025-03-22", "2025-03-23")[0];
  assert.equal(overlap(workEvent, { startAt: wallInstant("2025-03-22", "13:00"), endAt: wallInstant("2025-03-22", "14:00") }), false);
  const intersecting = { startAt: wallInstant("2025-03-22", "12:30"), endAt: wallInstant("2025-03-22", "13:30") };
  assert.equal(overlap(workEvent, intersecting), true);
  assert.equal(occupiedMinutes([workEvent, intersecting], range("2025-03-22", "2025-03-23")), 330);
  const night = { ...work, weekdays: [6], localStartTime: "23:30", localEndTime: "00:30", endsNextDay: true };
  const nextDay = expand(night, "2025-03-23", "2025-03-24");
  assert.equal(nextDay.length, 1); assert.equal(nextDay[0].occurrenceKey, "root:2025-03-22");
  assert.equal(occupiedMinutes(nextDay, range("2025-03-23", "2025-03-24")), 30);
});

test("symbolic rule conflicts cover distant starts, parity and finite cancellations", async () => {
  const { ruleConflictWitnesses } = await import("./rule-conflicts.js");
  const future = { ...work, id: "other", rootSeriesId: "other-root", title: "class", effectiveFrom: dbDate("2030-01-01"), localStartTime: "12:30", localEndTime: "13:30" };
  assert.ok(ruleConflictWitnesses(work, future).length > 0);
  assert.equal(ruleConflictWitnesses(work, { ...future, localStartTime: "13:00" }).length, 0);
  const even = { ...work, weekdays: [6], everyWeeks: 2, anchorWeekStart: dbDate("2025-03-22"), parity: 0 };
  assert.equal(ruleConflictWitnesses(even, { ...even, rootSeriesId: "odd", parity: 1 }).length, 0);
  const cancel = { rootSeriesId: "root", originalLocalDate: dbDate("2025-03-22"), kind: "cancel" as const, title: null, startAt: null, endAt: null, version: 1 };
  assert.ok(ruleConflictWitnesses(even, { ...even, rootSeriesId: "same-phase" }, [cancel]).length > 0);
});
