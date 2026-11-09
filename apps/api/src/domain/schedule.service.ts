import { Injectable } from "@nestjs/common";
import type { TaskSeries } from "../generated/prisma/client";
import type { DTO } from "../http/contracts";
import { fail } from "../http/errors";
import {
  dbDate,
  dateString,
  instant,
  occupiedMinutes,
  overlap,
  range,
  shift,
  today,
  wallInstant,
  type Interval,
} from "../time/calendar";
import { expand, type Rule } from "../time/recurrence";
import { digest, type Transaction } from "./mutations";
export function taskRule(series: TaskSeries): Rule {
  return { ...series, title: (series.template as DTO["TaskDefinition"]).title };
}
export function safeRange(from: string, to: string) {
  try {
    const bounds = { startAt: instant(from), endAt: instant(to) };
    if (bounds.endAt <= bounds.startAt) throw new RangeError();
    const first = today(bounds.startAt),
      last = today(new Date(bounds.endAt.getTime() - 1));
    range(first, shift(last, 1));
    return { bounds, from: first, to: shift(last, 1) };
  } catch {
    return fail(
      400,
      "RANGE_TOO_LARGE",
      "بازه باید معتبر و حداکثر ۹۳ روز باشد.",
    );
  }
}
@Injectable()
export class ScheduleService {
  async materialize(
    tx: Transaction,
    ownerId: string,
    from: string,
    to: string,
  ) {
    const segments = await tx.taskSeries.findMany({
      where: {
        root: { ownerId },
        task: { deletedAt: null },
        deletedAt: null,
        effectiveFrom: { lt: dbDate(to) },
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: dbDate(shift(from, -1)) } },
        ],
      },
      take: 1001,
    });
    if (segments.length > 1000)
      fail(400, "RANGE_TOO_LARGE", "بازه کوچک‌تری انتخاب کنید.");
    let count = 0;
    for (const segment of segments) {
      for (const event of expand(taskRule(segment), from, to)) {
        if (++count > 1000)
          fail(400, "RANGE_TOO_LARGE", "بازه کوچک‌تری انتخاب کنید.");
        await tx.taskOccurrence.upsert({
          where: { occurrenceKey: event.occurrenceKey },
          update: {},
          create: {
            taskId: segment.taskId,
            seriesId: segment.id,
            occurrenceKey: event.occurrenceKey,
            originalLocalDate: dbDate(event.originalLocalDate),
            scheduledStartAt: event.startAt,
            scheduledEndAt: event.endAt,
            snapshot: segment.template!,
          },
        });
      }
    }
  }
  async events(
    tx: Transaction,
    ownerId: string,
    from: string,
    to: string,
  ): Promise<DTO["ScheduleEvent"][]> {
    const requested = safeRange(from, to);
    const { bounds } = requested;
    await this.materialize(tx, ownerId, requested.from, requested.to);
    const occurrences = await tx.taskOccurrence.findMany({
      where: {
        task: { ownerId, deletedAt: null },
        canceledAt: null,
        scheduledStartAt: { lt: bounds.endAt },
        scheduledEndAt: { gt: bounds.startAt },
      },
      take: 1001,
    });
    const fixed = await tx.fixedSeries.findMany({
      where: { root: { ownerId }, deletedAt: null },
      include: {
        root: {
          include: {
            exceptions: {
              where: {
                OR: [
                  {
                    originalLocalDate: {
                      gte: dbDate(shift(requested.from, -1)),
                      lt: dbDate(requested.to),
                    },
                  },
                  {
                    startAt: { lt: bounds.endAt },
                    endAt: { gt: bounds.startAt },
                  },
                ],
              },
              take: 1001,
            },
          },
        },
      },
      take: 1001,
    });
    if (occurrences.length > 1000 || fixed.length > 1000)
      fail(400, "RANGE_TOO_LARGE", "بازه کوچک‌تری انتخاب کنید.");
    const events: DTO["ScheduleEvent"][] = occurrences.map((v) => ({
      id: v.id,
      occurrenceKey: v.occurrenceKey,
      kind: "task",
      title: (v.snapshot as DTO["TaskDefinition"]).title,
      startAt: v.scheduledStartAt!.toISOString(),
      endAt: v.scheduledEndAt!.toISOString(),
      category: (v.snapshot as DTO["TaskDefinition"]).category ?? "personal",
      priority: (v.snapshot as DTO["TaskDefinition"]).priority ?? "normal",
      status: v.status,
      version: v.version,
      taskId: v.taskId,
      seriesId: v.seriesId,
      originalLocalDate: v.originalLocalDate
        ? dateString(v.originalLocalDate)
        : null,
      editable: true,
      resizable: true,
      completionAllowed: true,
      continuesBefore: v.scheduledStartAt! < bounds.startAt,
      continuesAfter: v.scheduledEndAt! > bounds.endAt,
    }));
    for (const series of fixed) {
      if (series.root.exceptions.length > 1000)
        fail(400, "RANGE_TOO_LARGE", "بازه کوچک‌تری انتخاب کنید.");
      for (const event of expand(
        series,
        requested.from,
        requested.to,
        series.root.exceptions,
      )) {
        if (!overlap(event, bounds)) continue;
        events.push({
          id: event.occurrenceKey,
          occurrenceKey: event.occurrenceKey,
          kind: series.kind,
          title: event.title,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt.toISOString(),
          category: series.kind === "work" ? "work" : "university",
          priority: null,
          status: null,
          version: event.version,
          taskId: null,
          seriesId: series.id,
          originalLocalDate: event.originalLocalDate,
          editable: false,
          resizable: false,
          completionAllowed: false,
          continuesBefore: event.startAt < bounds.startAt,
          continuesAfter: event.endAt > bounds.endAt,
        });
        if (events.length > 1000)
          fail(400, "RANGE_TOO_LARGE", "بازه کوچک‌تری انتخاب کنید.");
      }
    }
    return events.sort(
      (a, b) => a.startAt.localeCompare(b.startAt) || a.id.localeCompare(b.id),
    );
  }
  async read(
    tx: Transaction,
    ownerId: string,
    from: string,
    to: string,
    revision: number,
  ): Promise<DTO["ScheduleResponse"]> {
    const requested = safeRange(from, to);
    const events = await this.events(tx, ownerId, from, to);
    const priorities = await tx.dailyPriority.findMany({
      where: {
        ownerId,
        localDate: { gte: dbDate(requested.from), lt: dbDate(requested.to) },
        occurrence: { canceledAt: null, task: { deletedAt: null } },
      },
      include: { occurrence: true },
    });
    const days: DTO["DaySummary"][] = [];
    for (let day = requested.from; day < requested.to; day = shift(day, 1)) {
      const bounds = {
        startAt: new Date(
          Math.max(
            wallInstant(day, "00:00").getTime(),
            requested.bounds.startAt.getTime(),
          ),
        ),
        endAt: new Date(
          Math.min(
            wallInstant(shift(day, 1), "00:00").getTime(),
            requested.bounds.endAt.getTime(),
          ),
        ),
      };
      const visible = events.filter((e) =>
        overlap(
          { startAt: new Date(e.startAt), endAt: new Date(e.endAt) },
          bounds,
        ),
      );
      const tasks = new Map(
        events
          .filter(
            (e) => e.kind === "task" && today(new Date(e.startAt)) === day,
          )
          .map((e) => [e.id, e.status]),
      );
      for (const p of priorities.filter((p) => dateString(p.localDate) === day))
        tasks.set(p.occurrenceId, p.occurrence.status);
      const reading = visible.filter(
        (e) => e.kind === "task" && e.category === "reading",
      );
      const completed = [...tasks.values()].filter(
        (v) => v === "completed",
      ).length;
      days.push({
        localDate: day,
        eventCount: visible.length,
        occupiedMinutes: occupiedMinutes(
          visible.map((e) => ({
            startAt: new Date(e.startAt),
            endAt: new Date(e.endAt),
          })),
          bounds,
        ),
        plannedTaskCount: tasks.size,
        completedTaskCount: completed,
        remainingTaskCount: tasks.size - completed,
        plannedReadingCount: reading.length,
        plannedReadingMinutes: reading.reduce(
          (sum, e) =>
            sum +
            (Math.min(new Date(e.endAt).getTime(), bounds.endAt.getTime()) -
              Math.max(
                new Date(e.startAt).getTime(),
                bounds.startAt.getTime(),
              )) /
              60000,
          0,
        ),
      });
    }
    return {
      from: requested.bounds.startAt.toISOString(),
      to: requested.bounds.endAt.toISOString(),
      timezone: "Asia/Tehran",
      revision,
      events,
      days,
    };
  }
  async check(
    tx: Transaction,
    ownerId: string,
    proposed: Interval,
    context: unknown,
    revision: number,
    confirmation?: string,
    exclude: string[] = [],
  ) {
    const events = await this.events(
      tx,
      ownerId,
      proposed.startAt.toISOString(),
      proposed.endAt.toISOString(),
    );
    const conflicts = events
      .filter(
        (e) => !exclude.includes(e.id) && !exclude.includes(e.occurrenceKey),
      )
      .map((e) => ({
        id: e.id,
        occurrenceKey: e.occurrenceKey,
        title: e.title,
        kind: e.kind,
        startAt: e.startAt,
        endAt: e.endAt,
        version: e.version,
      }));
    this.confirm(ownerId, context, revision, conflicts, confirmation);
  }
  confirm(
    ownerId: string,
    context: unknown,
    revision: number,
    conflicts: DTO["ConflictItem"][],
    confirmation?: string,
  ) {
    if (!conflicts.length) return;
    const unique = [
      ...new Map(conflicts.map((c) => [c.occurrenceKey, c])).values(),
    ].sort((a, b) => a.occurrenceKey.localeCompare(b.occurrenceKey));
    const conflictSnapshot = digest({
      ownerId,
      context,
      revision,
      conflicts: unique,
    });
    if (conflictSnapshot !== confirmation)
      fail(
        409,
        "SCHEDULE_CONFLICT",
        "این زمان با برنامه‌های زیر هم‌پوشانی دارد. پس از بررسی تأیید کنید.",
        { conflictSnapshot, scheduleRevision: revision, conflicts: unique },
      );
  }
}
