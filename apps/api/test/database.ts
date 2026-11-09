import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { Client } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { provisionOwner } from "../src/setup/provision-owner";
import { bootstrapWork } from "../src/setup/bootstrap-work";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
  const admin = new Client({ connectionString: process.env.DATABASE_URL });
  await admin.connect();
  const database = `sarvin_test_${randomUUID().replaceAll("-", "")}`;
  let created = false;
  let prisma: PrismaClient | undefined;
  let db: Client | undefined;
  try {
    await admin.query(`CREATE DATABASE "${database}"`); created = true;
    const url = new URL(process.env.DATABASE_URL); url.pathname = `/${database}`;
    execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: "pipe" });
    // Second application proves upgrades/retries don't duplicate migration effects.
    execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], { env: { ...process.env, DATABASE_URL: url.toString() }, stdio: "pipe" });
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url.toString() }) });
    db = new Client({ connectionString: url.toString() }); await db.connect();
    assert.equal(await prisma.owner.count(), 0);
    const ownerId = await prisma.$transaction(tx => provisionOwner(tx, "fixture@example.invalid", "not-a-login-hash"));
    const owner = await prisma.owner.findUniqueOrThrow({ where: { id: ownerId } });
    await assert.rejects(prisma.$transaction(tx => provisionOwner(tx, "other@example.invalid", "not-a-login-hash")));
    await assert.rejects(prisma.$transaction(tx => provisionOwner(tx, "other@example.invalid", "not-a-login-hash", true)));
    await prisma.authSession.create({ data: { sid: "disposable-test-session", sess: { ownerId }, expire: new Date(Date.now() + 60000) } });
    await prisma.$transaction(tx => provisionOwner(tx, "fixture@example.invalid", "recovered-test-hash", true));
    assert.equal((await prisma.owner.findUniqueOrThrow({ where: { id: ownerId } })).sessionGeneration, 1);
    assert.equal(await prisma.authSession.count(), 0);
    await assert.rejects(prisma.owner.create({ data: { email: "another@example.invalid", passwordHash: "invalid" } }));
    await assert.rejects(prisma.owner.create({ data: { singleton: false, email: "another@example.invalid", passwordHash: "invalid" } }));
    const first = await prisma.$transaction(tx => bootstrapWork(tx, owner.id, "2026-11-07"));
    const second = await prisma.$transaction(tx => bootstrapWork(tx, owner.id, "2026-11-07"));
    assert.equal(first.id, second.id); assert.deepEqual(first.weekdays, [6, 7, 1, 2, 3]);
    assert.equal(first.localStartTime, "08:00"); assert.equal(first.localEndTime, "13:00");
    assert.equal(await prisma.fixedSeries.count(), 1);
    await assert.rejects(prisma.$transaction(tx => bootstrapWork(tx, owner.id, "2026-11-08")));
    await assert.rejects(prisma.$transaction(tx => bootstrapWork(tx, owner.id, "2026-02-30")));
    const book = await prisma.book.create({ data: { ownerId: owner.id, title: "Test fixture" } });
    const task = await prisma.task.create({ data: { ownerId: owner.id, title: "Test fixture" } });
    const occurrence = await prisma.taskOccurrence.create({ data: { taskId: task.id, occurrenceKey: randomUUID(), snapshot: { title: task.title } } });
    const reading = await prisma.readingSession.create({ data: { ownerId: owner.id, bookId: book.id, bookTitleSnapshot: book.title, occurrenceId: occurrence.id, startAt: new Date("2026-11-07T10:00:00Z"), endAt: new Date("2026-11-07T10:30:00Z") } });
    await prisma.task.update({ where: { id: task.id }, data: { deletedAt: new Date() } });
    await prisma.book.delete({ where: { id: book.id } });
    await prisma.taskOccurrence.delete({ where: { id: occurrence.id } });
    const preserved = await prisma.readingSession.findUniqueOrThrow({ where: { id: reading.id } });
    assert.equal(preserved.bookId, null); assert.equal(preserved.occurrenceId, null); assert.equal(preserved.bookTitleSnapshot, "Test fixture");
    for (const data of [
      { scheduledStartAt: new Date(), scheduledEndAt: null },
      { scheduledStartAt: null, scheduledEndAt: new Date() },
      { scheduledStartAt: new Date("2026-01-01"), scheduledEndAt: new Date("2025-01-01") },
      { status: "completed" as const, completedAt: null },
    ]) await assert.rejects(prisma.taskOccurrence.create({ data: { taskId: task.id, occurrenceKey: randomUUID(), snapshot: {}, ...data } }));
    for (const target of [0, -1]) await assert.rejects(prisma.weeklyGoal.create({ data: { ownerId: owner.id, weekStart: new Date("2026-11-07"), unit: "minutes", target } }));
    await assert.rejects(prisma.weeklyGoal.create({ data: { ownerId: owner.id, weekStart: new Date("2026-11-08"), unit: "minutes", target: 150 } }));
    await prisma.weeklyGoal.create({ data: { ownerId: owner.id, weekStart: new Date("2026-11-07"), unit: "minutes", target: 150 } });
    await assert.rejects(prisma.weeklyGoal.create({ data: { ownerId: owner.id, weekStart: new Date("2026-11-07"), unit: "pages", target: 10 } }));
    await assert.rejects(prisma.readingSession.update({ where: { id: reading.id }, data: { pages: 0 } }));
    await assert.rejects(prisma.readingSession.update({ where: { id: reading.id }, data: { endAt: new Date("2026-11-06") } }));
    const temporal = await db.query("SELECT data_type, datetime_precision FROM information_schema.columns WHERE table_name = 'ReadingSession' AND column_name = 'startAt'");
    assert.equal(temporal.rows[0].data_type, "timestamp with time zone"); assert.equal(temporal.rows[0].datetime_precision, 3);
    assert.equal(await prisma.authSession.count(), 0);
    console.log("PASS: fresh migrations, repeat deploy, singleton, work bootstrap, date/time constraints, goal uniqueness, and retained reading history.");
  } finally {
    await prisma?.$disconnect(); await db?.end();
    if (created) await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
    await admin.end();
  }
}
main().catch(() => { console.error("Database integration test failed; disposable test database cleaned up. Inspect assertions locally without printing credentials."); process.exitCode = 1; });
