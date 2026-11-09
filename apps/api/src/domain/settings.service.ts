import { SeriesConflicts } from "./series-conflicts";
import { Injectable } from "@nestjs/common";
import type { OwnerRequest } from "../auth/session";
import { PrismaService } from "../prisma/prisma.service";
import { input, type DTO, uuid } from "../http/contracts";
import { fail } from "../http/errors";
import { bootstrapWork } from "../setup/bootstrap-work";
import { dbDate, dateString, today, weekStart } from "../time/calendar";
import { expectVersion, Mutations, type Transaction } from "./mutations";
export function saturday(value: string) {
  if (weekStart(value) !== value)
    fail(400, "VALIDATION_ERROR", "شروع هفته باید شنبه باشد.");
  return dbDate(value);
}
@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mutations: Mutations,
    private readonly conflicts: SeriesConflicts,
  ) {}
  async read(
    ownerId: string,
    tx: Transaction = this.prisma,
  ): Promise<DTO["Settings"]> {
    const settings = await tx.userSettings.findUniqueOrThrow({
      where: { ownerId },
    });
    const rules = await tx.defaultGoal.findMany({
      where: { ownerId },
      orderBy: { effectiveFromWeek: "asc" },
    });
    return {
      version: settings.version,
      timezone: "Asia/Tehran",
      weekStartsOn: 6,
      onboardingComplete: settings.workEffectiveFrom !== null,
      workEffectiveFrom: settings.workEffectiveFrom
        ? dateString(settings.workEffectiveFrom)
        : null,
      defaultGoals: rules.map((rule) => ({
        effectiveFromWeek: dateString(rule.effectiveFromWeek),
        goal:
          rule.unit && rule.target
            ? { unit: rule.unit, target: rule.target }
            : null,
      })),
    };
  }
  onboard(req: OwnerRequest, raw: unknown) {
    const body = input("OnboardingWrite", raw);
    if (Boolean(body.readingGoal) !== Boolean(body.readingGoalWeekStart))
      fail(400, "VALIDATION_ERROR", "هدف و هفته آن را با هم انتخاب کنید.");
    return this.mutations.run(
      req,
      "settings.onboarding",
      body,
      async (tx, revision) => {
        const settings = await tx.userSettings.findUniqueOrThrow({
          where: { ownerId: req.owner.id },
        });
        if (settings.workEffectiveFrom)
          fail(
            409,
            "STALE_VERSION",
            "راه‌اندازی قبلاً انجام شده است. از تنظیمات استفاده کنید.",
          );
        await this.conflicts.check(
          tx,
          req.owner.id,
          {
            id: "work-bootstrap",
            rootSeriesId: "work-bootstrap",
            title: "کار",
            weekdays: [6, 7, 1, 2, 3],
            localStartTime: "08:00",
            localEndTime: "13:00",
            timezone: "Asia/Tehran",
            effectiveFrom: dbDate(body.workEffectiveFrom),
            effectiveUntil: null,
            version: 1,
          },
          { operation: "settings.onboarding", body },
          revision,
          body.conflictSnapshot,
        );
        await bootstrapWork(tx, req.owner.id, body.workEffectiveFrom);
        if (body.readingGoal && body.readingGoalWeekStart)
          await tx.weeklyGoal.create({
            data: {
              ownerId: req.owner.id,
              weekStart: saturday(body.readingGoalWeekStart),
              ...body.readingGoal,
            },
          });
        return this.read(req.owner.id, tx);
      },
      true,
    );
  }
  update(req: OwnerRequest, raw: unknown) {
    const body = input("SettingsPatch", raw);
    return this.mutations.run(req, "settings.update", body, async (tx) => {
      const settings = await tx.userSettings.findUniqueOrThrow({
        where: { ownerId: req.owner.id },
      });
      expectVersion(
        req.get("If-Match"),
        settings,
        await this.read(req.owner.id, tx),
      );
      if (body.defaultGoal) {
        const effectiveFromWeek = saturday(body.defaultGoal.effectiveFromWeek);
        if (body.defaultGoal.effectiveFromWeek <= weekStart(today()))
          fail(
            400,
            "VALIDATION_ERROR",
            "هدف پیش‌فرض باید از یک هفته آینده شروع شود.",
          );
        await tx.defaultGoal.upsert({
          where: {
            ownerId_effectiveFromWeek: {
              ownerId: req.owner.id,
              effectiveFromWeek,
            },
          },
          create: {
            ownerId: req.owner.id,
            effectiveFromWeek,
            unit: body.defaultGoal.goal?.unit ?? null,
            target: body.defaultGoal.goal?.target ?? null,
          },
          update: {
            unit: body.defaultGoal.goal?.unit ?? null,
            target: body.defaultGoal.goal?.target ?? null,
            version: { increment: 1 },
          },
        });
      }
      await tx.userSettings.update({
        where: { ownerId: req.owner.id },
        data: { version: { increment: 1 } },
      });
      return this.read(req.owner.id, tx);
    });
  }
  async priorities(
    ownerId: string,
    day: string,
    tx: Transaction = this.prisma,
  ): Promise<DTO["DailyPriorities"]> {
    const settings = await tx.userSettings.findUniqueOrThrow({
      where: { ownerId },
    });
    const rows = await tx.dailyPriority.findMany({
      where: {
        ownerId,
        localDate: dbDate(day),
        occurrence: { canceledAt: null, task: { deletedAt: null } },
      },
      orderBy: { position: "asc" },
    });
    return {
      localDate: day,
      version: settings.prioritiesVersion,
      occurrenceIds: rows.map((row) => row.occurrenceId),
    };
  }
  setPriorities(req: OwnerRequest, day: string, raw: unknown) {
    const body = input("DailyPriorityWrite", raw);
    const localDate = dbDate(day);
    body.occurrenceIds.forEach(uuid);
    return this.mutations.run(req, `priorities:${day}`, body, async (tx) => {
      const current = await this.priorities(req.owner.id, day, tx);
      expectVersion(req.get("If-Match"), current, current);
      const found = await tx.taskOccurrence.count({
        where: {
          id: { in: body.occurrenceIds },
          canceledAt: null,
          task: { ownerId: req.owner.id, deletedAt: null },
        },
      });
      if (found !== body.occurrenceIds.length)
        fail(404, "NOT_FOUND", "یک یا چند کار پیدا نشد.");
      await tx.dailyPriority.deleteMany({
        where: { ownerId: req.owner.id, localDate },
      });
      await tx.dailyPriority.createMany({
        data: body.occurrenceIds.map((occurrenceId, i) => ({
          ownerId: req.owner.id,
          localDate,
          occurrenceId,
          position: i + 1,
        })),
      });
      await tx.userSettings.update({
        where: { ownerId: req.owner.id },
        data: { prioritiesVersion: { increment: 1 } },
      });
      return this.priorities(req.owner.id, day, tx);
    });
  }
}
