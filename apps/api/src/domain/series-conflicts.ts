import { Injectable } from "@nestjs/common";
import type { DTO } from "../http/contracts";
import { fail } from "../http/errors";
import { expand, type Rule } from "../time/recurrence";
import { overlap, shift, today } from "../time/calendar";
import { ruleConflictWitnesses } from "../time/rule-conflicts";
import type { Transaction } from "./mutations";
import { ScheduleService, taskRule } from "./schedule.service";
@Injectable()
export class SeriesConflicts {
  constructor(private readonly schedule: ScheduleService) {}
  async check(
    tx: Transaction,
    ownerId: string,
    proposed: Rule,
    context: unknown,
    revision: number,
    confirmation?: string,
    excludeSeriesIds: string[] = [],
    retained?: {
      rule: Rule;
      kind: "task" | "work" | "class";
    },
  ) {
    const fixed = await tx.fixedSeries.findMany({
      where: {
        root: { ownerId },
        deletedAt: null,
        id: { notIn: excludeSeriesIds },
      },
      take: 1001,
    });
    const taskSeries = await tx.taskSeries.findMany({
      where: {
        root: { ownerId },
        task: { deletedAt: null },
        deletedAt: null,
        id: { notIn: excludeSeriesIds },
      },
      take: 1001,
    });
    const fixedExceptions = await tx.occurrenceException.findMany({
      where: { root: { ownerId } },
      take: 1001,
    });
    const explicit = await tx.taskOccurrence.findMany({
      where: {
        task: { ownerId, deletedAt: null },
        canceledAt: null,
        scheduledStartAt: { not: null },
        OR: [{ seriesId: null }, { overridden: true }],
      },
      take: 1001,
    });
    const overrides = await tx.taskOccurrence.findMany({
      where: {
        task: { ownerId, deletedAt: null },
        seriesId: { not: null },
        overridden: true,
      },
      include: { series: { select: { rootSeriesId: true } } },
      take: 1001,
    });
    const exceptions = [
      ...fixedExceptions,
      ...overrides.map((o) => ({
        rootSeriesId: o.series!.rootSeriesId,
        originalLocalDate: o.originalLocalDate!,
        kind: (!o.canceledAt && o.scheduledStartAt && o.scheduledEndAt
          ? "override"
          : "cancel") as "override" | "cancel",
        title: (o.snapshot as DTO["TaskDefinition"]).title,
        startAt: o.scheduledStartAt,
        endAt: o.scheduledEndAt,
        version: o.version,
      })),
    ];
    if (
      [fixed, taskSeries, exceptions, explicit, overrides].some(
        (rows) => rows.length > 1000,
      )
    )
      fail(400, "RANGE_TOO_LARGE", "تعداد برنامه‌ها برای این بررسی زیاد است.");
    const others = [
      ...fixed.map((rule) => ({ rule, kind: rule.kind as "work" | "class" })),
      ...taskSeries.map((rule) => ({
        rule: taskRule(rule),
        kind: "task" as const,
      })),
      ...(retained ? [retained] : []),
    ];
    const conflicts: DTO["ConflictItem"][] = [];
    for (const { rule, kind } of others) {
      for (const event of ruleConflictWitnesses(proposed, rule, exceptions))
        conflicts.push({
          id: event.occurrenceKey,
          occurrenceKey: event.occurrenceKey,
          title: event.title,
          kind,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt.toISOString(),
          version: event.version,
        });
    }
    for (const event of explicit) {
      const bounds = {
        startAt: event.scheduledStartAt!,
        endAt: event.scheduledEndAt!,
      };
      const from = today(bounds.startAt),
        to = shift(today(new Date(bounds.endAt.getTime() - 1)), 1);
      if (
        expand(proposed, from, to, exceptions).some(
          (candidate) =>
            candidate.occurrenceKey !== event.occurrenceKey &&
            overlap(candidate, bounds),
        )
      )
        conflicts.push({
          id: event.id,
          occurrenceKey: event.occurrenceKey,
          title: (event.snapshot as DTO["TaskDefinition"]).title,
          kind: "task",
          startAt: bounds.startAt.toISOString(),
          endAt: bounds.endAt.toISOString(),
          version: event.version,
        });
    }
    this.schedule.confirm(ownerId, context, revision, conflicts, confirmation);
  }
}
