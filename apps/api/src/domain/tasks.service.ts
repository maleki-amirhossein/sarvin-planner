import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { OwnerRequest } from "../auth/session";
import { PrismaService } from "../prisma/prisma.service";
import { type DTO, input, nonempty, uuid } from "../http/contracts";
import { fail, parse } from "../http/errors";
import { dbDate, instant, today, validateInterval } from "../time/calendar";
import { expectVersion, Mutations, bumpRootVersion } from "./mutations";
import { occurrenceDto, taskDto } from "./mappers";
import { ScheduleService } from "./schedule.service";
import { pageFields, pagination } from "./pagination";
import type { Prisma } from "../generated/prisma/client";
const include = {
  occurrences: { where: { seriesId: null } },
  series: { select: { id: true } },
} as const;
const filtersSchema = z
  .object({
    ...pageFields,
    status: z.enum(["incomplete", "completed"]).optional(),
    category: z
      .enum(["personal", "reading", "work", "university", "other"])
      .optional(),
    priority: z.enum(["low", "normal", "high"]).optional(),
    q: z.string().max(200).optional(),
    view: z
      .enum(["all", "unscheduled", "scheduled", "overdue", "completed"])
      .default("all"),
  })
  .strict();
export function snapshot(v: DTO["TaskDefinition"]): Prisma.InputJsonObject {
  return {
    title: nonempty(v.title),
    description: v.description ?? null,
    category: v.category ?? "personal",
    priority: v.priority ?? "normal",
    estimateMinutes: v.estimateMinutes ?? null,
    dueDate: v.dueDate ?? null,
  };
}
@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mutations: Mutations,
    private readonly schedule: ScheduleService,
  ) {}
  async list(req: OwnerRequest, raw: unknown) {
    const query = parse(filtersSchema, raw);
    const filters = {
      status: query.status,
      category: query.category,
      priority: query.priority,
      q: query.q,
      view: query.view,
    };
    const page = pagination(query, req.owner.id, filters);
    const occurrence: Prisma.TaskOccurrenceWhereInput = {
      canceledAt: null,
      ...(query.status ? { status: query.status } : {}),
    };
    if (query.view === "unscheduled")
      Object.assign(occurrence, {
        scheduledStartAt: null,
        status: "incomplete",
      });
    if (query.view === "scheduled") occurrence.scheduledStartAt = { not: null };
    if (query.view === "completed") occurrence.status = "completed";
    const where: Prisma.TaskWhereInput = {
      ownerId: req.owner.id,
      deletedAt: null,
      category: query.category,
      priority: query.priority,
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: "insensitive" } },
              { description: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    if (query.view !== "all" || query.status)
      where.occurrences = { some: occurrence };
    if (query.view === "overdue")
      where.AND = [
        {
          OR: [
            {
              dueDate: { lt: dbDate(today()) },
              occurrences: { some: { canceledAt: null, status: "incomplete" } },
            },
            {
              occurrences: {
                some: {
                  canceledAt: null,
                  status: "incomplete",
                  scheduledEndAt: { lt: new Date() },
                },
              },
            },
          ],
        },
      ];
    const rows = await this.prisma.task.findMany({
      where: { AND: [where, page.where] },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: page.take,
      include,
    });
    return page.finish(rows, taskDto);
  }
  async get(req: OwnerRequest, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: uuid(id), ownerId: req.owner.id, deletedAt: null },
      include,
    });
    if (!task) fail(404, "NOT_FOUND", "کار پیدا نشد.");
    return taskDto(task);
  }
  create(req: OwnerRequest, raw: unknown) {
    const body = input("TaskCreate", raw);
    body.title = nonempty(body.title);
    return this.mutations.run(
      req,
      "tasks.create",
      body,
      async (tx) => {
        const occurrenceId = randomUUID();
        const task = await tx.task.create({
          data: {
            ...body,
            dueDate: body.dueDate ? dbDate(body.dueDate) : null,
            ownerId: req.owner.id,
            occurrences: {
              create: {
                id: occurrenceId,
                occurrenceKey: occurrenceId,
                snapshot: snapshot(body),
              },
            },
          },
          include,
        });
        return taskDto(task);
      },
      true,
    );
  }
  update(req: OwnerRequest, id: string, raw: unknown) {
    uuid(id);
    const body = input("TaskPatch", raw);
    if (body.title !== undefined) body.title = nonempty(body.title);
    return this.mutations.run(req, `tasks.update:${id}`, body, async (tx) => {
      const current = await tx.task.findFirst({
        where: { id, ownerId: req.owner.id, deletedAt: null },
        include,
      });
      if (!current) fail(404, "NOT_FOUND", "کار پیدا نشد.");
      expectVersion(req.get("If-Match"), current, taskDto(current));
      const task = await tx.task.update({
        where: { id },
        data: {
          ...body,
          dueDate:
            body.dueDate === undefined
              ? undefined
              : body.dueDate
                ? dbDate(body.dueDate)
                : null,
          version: { increment: 1 },
        },
        include,
      });
      if (!current.series.length)
        await tx.taskOccurrence.updateMany({
          where: { taskId: id, seriesId: null },
          data: {
            snapshot: snapshot(taskDto(task)),
            version: { increment: 1 },
          },
        });
      await tx.owner.update({
        where: { id: req.owner.id },
        data: { scheduleRevision: { increment: 1 } },
      });
      return taskDto(task);
    });
  }
  delete(req: OwnerRequest, id: string) {
    uuid(id);
    return this.mutations.run(req, `tasks.delete:${id}`, {}, async (tx) => {
      const current = await tx.task.findFirst({
        where: { id, ownerId: req.owner.id, deletedAt: null },
        include,
      });
      if (!current) fail(404, "NOT_FOUND", "کار پیدا نشد.");
      expectVersion(req.get("If-Match"), current, taskDto(current));
      if (current.series.length)
        fail(
          400,
          "INVALID_SCOPE",
          "برای کار تکرارشونده، یک رخداد یا رخدادهای آینده را انتخاب کنید.",
        );
      await tx.task.update({
        where: { id },
        data: { deletedAt: new Date(), version: { increment: 1 } },
      });
      await tx.owner.update({
        where: { id: req.owner.id },
        data: { scheduleRevision: { increment: 1 } },
      });
      return { id, version: current.version + 1, deleted: true };
    });
  }
  async occurrences(req: OwnerRequest, raw: unknown) {
    const query = parse(
      z
        .object({
          ...pageFields,
          taskId: z.uuid(),
          view: z
            .enum(["all", "unscheduled", "scheduled", "overdue", "completed"])
            .default("all"),
        })
        .strict(),
      raw,
    );
    const task = await this.get(req, query.taskId);
    const page = pagination(query, req.owner.id, {
      taskId: task.id,
      view: query.view,
    });
    const where: Prisma.TaskOccurrenceWhereInput = {
      taskId: task.id,
      canceledAt: null,
    };
    if (query.view === "unscheduled")
      Object.assign(where, { scheduledStartAt: null, status: "incomplete" });
    if (query.view === "scheduled") where.scheduledStartAt = { not: null };
    if (query.view === "completed") where.status = "completed";
    if (query.view === "overdue") {
      where.status = "incomplete";
      if (!task.dueDate || task.dueDate >= today())
        where.scheduledEndAt = { lt: new Date() };
    }
    const rows = await this.prisma.taskOccurrence.findMany({
      where: { AND: [where, page.where] },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: page.take,
    });
    return page.finish(rows, occurrenceDto);
  }
  async occurrence(req: OwnerRequest, id: string) {
    const found = await this.prisma.taskOccurrence.findFirst({
      where: { id: uuid(id), task: { ownerId: req.owner.id, deletedAt: null } },
    });
    if (!found) fail(404, "NOT_FOUND", "رخداد پیدا نشد.");
    return occurrenceDto(found);
  }
  mutateOccurrence(
    req: OwnerRequest,
    id: string,
    raw: unknown,
    remove = false,
  ) {
    uuid(id);
    const body = remove ? {} : input("OccurrencePatch", raw);
    if (
      !remove &&
      body.status === undefined &&
      body.scheduledStartAt === undefined &&
      body.snapshot === undefined
    )
      fail(400, "VALIDATION_ERROR", "تغییری مشخص نشده است.");
    if (
      (body.scheduledStartAt === undefined) !==
        (body.scheduledEndAt === undefined) ||
      (body.scheduledStartAt === null) !== (body.scheduledEndAt === null)
    )
      fail(400, "VALIDATION_ERROR", "شروع و پایان را با هم مشخص کنید.");
    if (body.scheduledStartAt && body.scheduledEndAt) {
      try {
        validateInterval({
          startAt: instant(body.scheduledStartAt),
          endAt: instant(body.scheduledEndAt),
        });
      } catch {
        fail(400, "VALIDATION_ERROR", "پایان باید بعد از شروع باشد.");
      }
    }
    return this.mutations.run(
      req,
      `occurrences.${remove ? "delete" : "update"}:${id}`,
      body,
      async (tx, revision) => {
        const current = await tx.taskOccurrence.findFirst({
          where: {
            id,
            task: { ownerId: req.owner.id, deletedAt: null },
            canceledAt: null,
          },
        });
        if (!current) fail(404, "NOT_FOUND", "رخداد پیدا نشد.");
        expectVersion(req.get("If-Match"), current, occurrenceDto(current));
        if (body.scheduledStartAt && body.scheduledEndAt)
          await this.schedule.check(
            tx,
            req.owner.id,
            {
              startAt: instant(body.scheduledStartAt),
              endAt: instant(body.scheduledEndAt),
            },
            { id, version: current.version, body },
            revision,
            body.conflictSnapshot,
            [id],
          );
        const unchangedStatus =
          body.status !== undefined && body.status === current.status;
        if (body.snapshot && !current.seriesId)
          fail(
            400,
            "INVALID_SCOPE",
            "عنوان کار یک‌باره را از فرم کار ویرایش کنید.",
          );
        if (
          unchangedStatus &&
          body.scheduledStartAt === undefined &&
          body.snapshot === undefined &&
          !remove
        )
          return occurrenceDto(current);
        const updated = await tx.taskOccurrence.update({
          where: { id },
          data: {
            scheduledStartAt:
              body.scheduledStartAt === undefined
                ? undefined
                : body.scheduledStartAt
                  ? instant(body.scheduledStartAt)
                  : null,
            scheduledEndAt:
              body.scheduledEndAt === undefined
                ? undefined
                : body.scheduledEndAt
                  ? instant(body.scheduledEndAt)
                  : null,
            snapshot: body.snapshot ? snapshot(body.snapshot) : undefined,
            status: body.status,
            completedAt:
              body.status === undefined || unchangedStatus
                ? undefined
                : body.status === "completed"
                  ? new Date()
                  : null,
            canceledAt: remove ? new Date() : undefined,
            overridden: true,
            version: { increment: 1 },
          },
        });
        await tx.owner.update({
          where: { id: req.owner.id },
          data: { scheduleRevision: { increment: 1 } },
        });
        if (current.seriesId) {
          const series = await tx.taskSeries.findUniqueOrThrow({
            where: { id: current.seriesId },
          });
          await bumpRootVersion(tx, series.rootSeriesId);
        }
        return remove
          ? { id, version: updated.version, deleted: true }
          : occurrenceDto(updated);
      },
    );
  }
}
