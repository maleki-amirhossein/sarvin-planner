import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { OwnerRequest } from "../auth/session";
import { PrismaService } from "../prisma/prisma.service";
import { input, uuid, type DTO } from "../http/contracts";
import { parse, fail } from "../http/errors";
import { dbDate, dateString, shift } from "../time/calendar";
import { occurrence, occursOn, validateRule } from "../time/recurrence";
import {
  expectVersion,
  Mutations,
  bumpRootVersion,
  type Transaction,
} from "./mutations";
import { occurrenceDto, seriesDto } from "./mappers";
import { pageFields, pagination } from "./pagination";
import { ScheduleService, taskRule } from "./schedule.service";
import { SeriesConflicts } from "./series-conflicts";
import { snapshot } from "./tasks.service";
function definition(body: DTO["TaskSeriesCreate"]) {
  return {
    taskId: body.taskId,
    template: snapshot(body.template),
    weekdays: body.weekdays,
    timezone: body.timezone,
    effectiveFrom: dbDate(body.effectiveFrom),
    effectiveUntil: body.effectiveUntil ? dbDate(body.effectiveUntil) : null,
    localStartTime: body.localStartTime,
    durationMinutes: body.durationMinutes,
  };
}
@Injectable()
export class TaskSeriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mutations: Mutations,
    private readonly schedule: ScheduleService,
    private readonly conflicts: SeriesConflicts,
  ) {}
  async list(req: OwnerRequest, raw: unknown) {
    const query = parse(
        z.object({ ...pageFields, taskId: z.uuid().optional() }).strict(),
        raw,
      ),
      page = pagination(query, req.owner.id, { taskId: query.taskId });
    const rows = await this.prisma.taskSeries.findMany({
      where: {
        AND: [
          {
            root: { ownerId: req.owner.id },
            task: { deletedAt: null },
            deletedAt: null,
            taskId: query.taskId,
          },
          page.where,
        ],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: page.take,
    });
    return page.finish(rows, seriesDto);
  }
  private async owned(tx: Transaction, ownerId: string, id: string) {
    const result = await tx.taskSeries.findFirst({
      where: {
        id: uuid(id),
        root: { ownerId },
        task: { deletedAt: null },
        deletedAt: null,
      },
    });
    if (!result) fail(404, "NOT_FOUND", "برنامه تکرارشونده پیدا نشد.");
    return result;
  }
  private async changed(tx: Transaction, ownerId: string) {
    await tx.owner.update({
      where: { id: ownerId },
      data: { scheduleRevision: { increment: 1 } },
    });
  }
  create(req: OwnerRequest, raw: unknown) {
    const body = input("TaskSeriesCreate", raw),
      data = definition(body);
    return this.mutations.run(
      req,
      "task-series.create",
      body,
      async (tx, revision) => {
        const task = await tx.task.findFirst({
          where: { id: body.taskId, ownerId: req.owner.id, deletedAt: null },
          include: {
            series: true,
            occurrences: {
              include: { readingSessions: { select: { id: true }, take: 1 } },
            },
          },
        });
        if (!task) fail(404, "NOT_FOUND", "کار پیدا نشد.");
        if (
          task.series.length ||
          task.occurrences.some(
            (o) =>
              o.status === "completed" ||
              o.scheduledStartAt ||
              o.readingSessions.length,
          )
        )
          fail(
            409,
            "INVALID_SCOPE",
            "برای ساخت برنامه تکرارشونده، یک کار جدید و بدون سابقه انتخاب کنید.",
          );
        const id = randomUUID(),
          rootSeriesId = randomUUID();
        const rule = {
          ...data,
          id,
          rootSeriesId,
          version: 1,
          title: body.template.title,
        };
        validateRule(rule);
        await this.conflicts.check(
          tx,
          req.owner.id,
          rule,
          { operation: "task-series.create", body },
          revision,
          body.conflictSnapshot,
        );
        await tx.seriesRoot.create({
          data: { id: rootSeriesId, ownerId: req.owner.id },
        });
        const result = await tx.taskSeries.create({
          data: { ...data, id, rootSeriesId },
        });
        await tx.taskOccurrence.updateMany({
          where: { taskId: task.id, seriesId: null },
          data: { canceledAt: new Date(), version: { increment: 1 } },
        });
        await tx.task.update({
          where: { id: task.id },
          data: { version: { increment: 1 } },
        });
        await this.changed(tx, req.owner.id);
        return seriesDto(result);
      },
      true,
    );
  }
  update(req: OwnerRequest, id: string, raw: unknown) {
    const body = input("TaskSeriesPatch", raw);
    return this.mutations.run(
      req,
      `task-series.update:${id}`,
      body,
      async (tx, revision) => {
        const current = await this.owned(tx, req.owner.id, id);
        expectVersion(req.get("If-Match"), current, seriesDto(current));
        if (!occursOn(taskRule(current), body.originalLocalDate))
          fail(
            400,
            "INVALID_SCOPE",
            "تاریخ انتخاب‌شده یک رخداد این برنامه نیست.",
          );
        const { scope, originalLocalDate, conflictSnapshot, ...patch } = body;
        if (!Object.keys(patch).length)
          fail(400, "VALIDATION_ERROR", "تغییری مشخص نشده است.");
        if (scope === "this") {
          if (
            Object.keys(patch).some(
              (key) =>
                !["template", "localStartTime", "durationMinutes"].includes(
                  key,
                ),
            )
          )
            fail(
              400,
              "INVALID_SCOPE",
              "برای تغییر تکرار، رخدادهای آینده را انتخاب کنید.",
            );
          await this.schedule.materialize(
            tx,
            req.owner.id,
            originalLocalDate,
            shift(originalLocalDate, 1),
          );
          const existing = await tx.taskOccurrence.findUniqueOrThrow({
            where: {
              occurrenceKey: `${current.rootSeriesId}:${originalLocalDate}`,
            },
          });
          // A materialized override has its own version and editor; do not overwrite it via a stale template version.
          if (existing.overridden)
            fail(
              409,
              "STALE_VERSION",
              "این رخداد جداگانه تغییر کرده است؛ همان رخداد را ویرایش کنید.",
              {
                current: occurrenceDto(existing),
                currentVersion: existing.version,
              },
            );
          const rule = {
            ...taskRule(current),
            localStartTime: patch.localStartTime ?? current.localStartTime,
            durationMinutes: patch.durationMinutes ?? current.durationMinutes,
          };
          validateRule(rule);
          const event = occurrence(rule, originalLocalDate);
          await this.schedule.check(
            tx,
            req.owner.id,
            event,
            { id, body, version: current.version },
            revision,
            conflictSnapshot,
            [existing.id],
          );
          const updated = await tx.taskOccurrence.update({
            where: { id: existing.id },
            data: {
              scheduledStartAt: event.startAt,
              scheduledEndAt: event.endAt,
              snapshot: patch.template ? snapshot(patch.template) : undefined,
              overridden: true,
              version: { increment: 1 },
            },
          });
          await bumpRootVersion(tx, current.rootSeriesId, current.version + 1);
          await this.changed(tx, req.owner.id);
          return { scope: "this" as const, occurrence: occurrenceDto(updated) };
        }
        const future = definition({
          ...seriesDto(current),
          ...patch,
          effectiveFrom: originalLocalDate,
        });
        const proposed = {
          ...future,
          id: randomUUID(),
          rootSeriesId: current.rootSeriesId,
          version: 1,
          title: (future.template as DTO["TaskDefinition"]).title,
        };
        validateRule(proposed);
        const later = await tx.taskSeries.findMany({
          where: {
            rootSeriesId: current.rootSeriesId,
            deletedAt: null,
            effectiveFrom: { gt: dbDate(originalLocalDate) },
          },
        });
        const retained =
          originalLocalDate > dateString(current.effectiveFrom)
            ? {
                rule: {
                  ...taskRule(current),
                  effectiveUntil: dbDate(shift(originalLocalDate, -1)),
                },
                kind: "task" as const,
              }
            : undefined;
        await this.conflicts.check(
          tx,
          req.owner.id,
          proposed,
          { id, body, version: current.version },
          revision,
          conflictSnapshot,
          [id, ...later.map((s) => s.id)],
          retained,
        );
        await tx.taskSeries.updateMany({
          where: { id: { in: later.map((s) => s.id) } },
          data: {
            deletedAt: new Date(),
            terminatedAt: dbDate(originalLocalDate),
            version: { increment: 1 },
          },
        });
        let updated;
        if (!retained)
          updated = await tx.taskSeries.update({
            where: { id },
            data: { ...future, version: { increment: 1 } },
          });
        else {
          await tx.taskSeries.update({
            where: { id },
            data: {
              effectiveUntil: retained.rule.effectiveUntil,
              terminatedAt: dbDate(originalLocalDate),
              version: { increment: 1 },
            },
          });
          updated = await tx.taskSeries.upsert({
            where: {
              rootSeriesId_effectiveFrom: {
                rootSeriesId: current.rootSeriesId,
                effectiveFrom: future.effectiveFrom,
              },
            },
            create: { ...future, rootSeriesId: current.rootSeriesId },
            update: {
              ...future,
              deletedAt: null,
              terminatedAt: null,
              version: { increment: 1 },
            },
          });
        }
        const eligible = await tx.taskOccurrence.findMany({
          where: {
            series: { rootSeriesId: current.rootSeriesId },
            originalLocalDate: { gte: dbDate(originalLocalDate) },
            status: "incomplete",
            overridden: false,
          },
          take: 1001,
        });
        if (eligible.length > 1000)
          fail(400, "RANGE_TOO_LARGE", "تعداد رخدادهای تغییرکرده زیاد است.");
        for (const existing of eligible) {
          const day = dateString(existing.originalLocalDate!);
          const remains = occursOn(taskRule(updated), day),
            event = occurrence(taskRule(updated), day);
          await tx.taskOccurrence.update({
            where: { id: existing.id },
            data: {
              seriesId: updated.id,
              canceledAt: remains ? null : new Date(),
              scheduledStartAt: event.startAt,
              scheduledEndAt: event.endAt,
              snapshot: updated.template!,
              version: { increment: 1 },
            },
          });
        }
        await bumpRootVersion(tx, current.rootSeriesId, current.version + 1);
        await this.changed(tx, req.owner.id);
        return {
          scope: "future" as const,
          series: seriesDto(
            await tx.taskSeries.findUniqueOrThrow({
              where: { id: updated.id },
            }),
          ),
        };
      },
      true,
    );
  }
  delete(req: OwnerRequest, id: string, raw: unknown) {
    const body = input("SeriesDelete", raw);
    return this.mutations.run(
      req,
      `task-series.delete:${id}`,
      body,
      async (tx) => {
        const current = await this.owned(tx, req.owner.id, id);
        expectVersion(req.get("If-Match"), current, seriesDto(current));
        const day = body.originalLocalDate;
        if (!occursOn(taskRule(current), day))
          fail(
            400,
            "INVALID_SCOPE",
            "تاریخ انتخاب‌شده یک رخداد این برنامه نیست.",
          );
        if (body.scope === "this") {
          await this.schedule.materialize(tx, req.owner.id, day, shift(day, 1));
          const existing = await tx.taskOccurrence.findUniqueOrThrow({
            where: { occurrenceKey: `${current.rootSeriesId}:${day}` },
          });
          if (existing.overridden || existing.status === "completed")
            fail(
              409,
              "STALE_VERSION",
              "این رخداد جداگانه تغییر کرده است؛ همان رخداد را حذف کنید.",
              {
                current: occurrenceDto(existing),
                currentVersion: existing.version,
              },
            );
          const result = await tx.taskOccurrence.update({
            where: { id: existing.id },
            data: {
              canceledAt: new Date(),
              overridden: true,
              version: { increment: 1 },
            },
          });
          await bumpRootVersion(tx, current.rootSeriesId, current.version + 1);
          await this.changed(tx, req.owner.id);
          return { id: result.id, version: result.version, deleted: true };
        }
        const changed = await tx.taskOccurrence.findMany({
          where: {
            series: { rootSeriesId: current.rootSeriesId },
            originalLocalDate: { gte: dbDate(day) },
            status: "incomplete",
            canceledAt: null,
            overridden: true,
          },
          take: 1001,
        });
        if (changed.length > 1000)
          fail(400, "RANGE_TOO_LARGE", "تعداد رخدادها زیاد است.");
        const acknowledged = new Set(
          body.acknowledgeAffectedOccurrenceIds ?? [],
        );
        if (changed.some((o) => !acknowledged.has(o.id)))
          fail(
            409,
            "STALE_VERSION",
            "رخدادهای ویرایش‌شده زیر نیز لغو می‌شوند؛ حذف را پس از بررسی تأیید کنید.",
            { affectedOccurrences: changed.map(occurrenceDto) },
          );
        await tx.taskSeries.updateMany({
          where: {
            rootSeriesId: current.rootSeriesId,
            deletedAt: null,
            effectiveFrom: { gt: dbDate(day) },
          },
          data: {
            deletedAt: new Date(),
            terminatedAt: dbDate(day),
            version: { increment: 1 },
          },
        });
        await tx.taskSeries.update({
          where: { id },
          data: {
            effectiveUntil:
              day > dateString(current.effectiveFrom)
                ? dbDate(shift(day, -1))
                : current.effectiveUntil,
            deletedAt:
              day === dateString(current.effectiveFrom) ? new Date() : null,
            terminatedAt: dbDate(day),
            version: { increment: 1 },
          },
        });
        await tx.taskOccurrence.updateMany({
          where: {
            series: { rootSeriesId: current.rootSeriesId },
            originalLocalDate: { gte: dbDate(day) },
            status: "incomplete",
            canceledAt: null,
          },
          data: {
            canceledAt: new Date(),
            overridden: true,
            version: { increment: 1 },
          },
        });
        await bumpRootVersion(tx, current.rootSeriesId, current.version + 1);
        await this.changed(tx, req.owner.id);
        return { id, version: current.version + 1, deleted: true };
      },
      true,
    );
  }
}
