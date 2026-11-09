import { Injectable } from "@nestjs/common";
import { z } from "zod";
import type { OwnerRequest } from "../auth/session";
import { PrismaService } from "../prisma/prisma.service";
import { input, nonempty, uuid, type DTO } from "../http/contracts";
import { parse, fail } from "../http/errors";
import {
  instant,
  validateInterval,
  wallInstant,
  weekBounds,
} from "../time/calendar";
import { expectVersion, Mutations, type Transaction } from "./mutations";
import { bookDto, readingDto, goalDto } from "./mappers";
import { pagination, pageFields } from "./pagination";
import { safeRange } from "./schedule.service";
import { saturday } from "./settings.service";
@Injectable()
export class ReadingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mutations: Mutations,
  ) {}
  async books(req: OwnerRequest, raw: unknown) {
    const q = parse(
      z
        .object({
          ...pageFields,
          status: z.enum(["reading", "finished", "archived"]).optional(),
          q: z.string().max(200).optional(),
        })
        .strict(),
      raw,
    );
    const page = pagination(q, req.owner.id, { status: q.status, q: q.q });
    const rows = await this.prisma.book.findMany({
      where: {
        AND: [
          {
            ownerId: req.owner.id,
            deletedAt: null,
            status: q.status,
            ...(q.q ? { title: { contains: q.q, mode: "insensitive" } } : {}),
          },
          page.where,
        ],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: page.take,
    });
    return page.finish(rows, bookDto);
  }
  bookCreate(req: OwnerRequest, raw: unknown) {
    const body = input("BookCreate", raw);
    body.title = nonempty(body.title);
    this.bookPages(body);
    return this.mutations.run(
      req,
      "books.create",
      body,
      async (tx) =>
        bookDto(
          await tx.book.create({ data: { ...body, ownerId: req.owner.id } }),
        ),
      true,
    );
  }
  private bookPages(body: {
    totalPages?: number | null;
    currentPage?: number | null;
  }) {
    if (
      body.totalPages &&
      body.currentPage &&
      body.currentPage > body.totalPages
    )
      fail(
        400,
        "VALIDATION_ERROR",
        "صفحه فعلی نباید از تعداد صفحه‌های کتاب بیشتر باشد.",
      );
  }
  bookUpdate(req: OwnerRequest, id: string, raw: unknown, remove = false) {
    uuid(id);
    const body = remove ? {} : input("BookPatch", raw);
    if (body.title !== undefined) body.title = nonempty(body.title);
    return this.mutations.run(
      req,
      `books.${remove ? "delete" : "update"}:${id}`,
      body,
      async (tx) => {
        const current = await tx.book.findFirst({
          where: { id, ownerId: req.owner.id, deletedAt: null },
        });
        if (!current) fail(404, "NOT_FOUND", "کتاب پیدا نشد.");
        expectVersion(req.get("If-Match"), current, bookDto(current));
        this.bookPages({ ...current, ...body });
        const result = await tx.book.update({
          where: { id },
          data: {
            ...body,
            deletedAt: remove ? new Date() : undefined,
            version: { increment: 1 },
          },
        });
        return remove
          ? { id, version: result.version, deleted: true }
          : bookDto(result);
      },
    );
  }
  async sessions(req: OwnerRequest, raw: unknown) {
    const q = parse(
      z
        .object({
          ...pageFields,
          from: z.string().optional(),
          to: z.string().optional(),
          bookId: z.uuid().optional(),
        })
        .strict(),
      raw,
    );
    if (Boolean(q.from) !== Boolean(q.to))
      fail(400, "VALIDATION_ERROR", "شروع و پایان بازه را با هم انتخاب کنید.");
    const bounds = q.from && q.to ? safeRange(q.from, q.to).bounds : null;
    const page = pagination(q, req.owner.id, {
      from: q.from,
      to: q.to,
      bookId: q.bookId,
    });
    const rows = await this.prisma.readingSession.findMany({
      where: {
        AND: [
          {
            ownerId: req.owner.id,
            bookId: q.bookId,
            ...(bounds
              ? { startAt: { lt: bounds.endAt }, endAt: { gt: bounds.startAt } }
              : {}),
          },
          page.where,
        ],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: page.take,
    });
    return page.finish(rows, readingDto);
  }
  private async sessionData(
    tx: Transaction,
    ownerId: string,
    body: DTO["ReadingSessionCreate"],
  ) {
    const startAt = instant(body.startedAt),
      endAt = instant(body.endedAt);
    validateInterval({ startAt, endAt });
    if (
      endAt.getTime() - startAt.getTime() > 24 * 3600000 ||
      endAt > new Date()
    )
      fail(
        400,
        "VALIDATION_ERROR",
        "مطالعه واقعی باید در گذشته و حداکثر ۲۴ ساعت باشد.",
      );
    const book = body.bookId
      ? await tx.book.findFirst({
          where: { id: body.bookId, ownerId, deletedAt: null },
        })
      : null;
    if (body.bookId && !book) fail(404, "NOT_FOUND", "کتاب پیدا نشد.");
    if (
      body.occurrenceId &&
      !(await tx.taskOccurrence.findFirst({
        where: {
          id: body.occurrenceId,
          task: { ownerId, deletedAt: null },
          canceledAt: null,
        },
      }))
    )
      fail(404, "NOT_FOUND", "کار پیدا نشد.");
    return {
      startAt,
      endAt,
      pages: body.pages ?? null,
      bookId: body.bookId ?? null,
      bookTitleSnapshot: book?.title ?? null,
      occurrenceId: body.occurrenceId ?? null,
      topic: body.topic ?? null,
      note: body.note ?? null,
    };
  }
  create(req: OwnerRequest, raw: unknown, quick = false) {
    const quickBody = quick ? input("QuickReadingCreate", raw) : null;
    const body = quickBody
      ? {
          startedAt: wallInstant(
            quickBody.localDate,
            quickBody.localStartTime,
          ).toISOString(),
          endedAt: new Date(
            wallInstant(
              quickBody.localDate,
              quickBody.localStartTime,
            ).getTime() +
              quickBody.durationMinutes * 60000,
          ).toISOString(),
          pages: quickBody.pages,
          bookId: quickBody.bookId,
          occurrenceId: quickBody.occurrenceId,
          topic: quickBody.topic,
          note: quickBody.note,
        }
      : input("ReadingSessionCreate", raw);
    return this.mutations.run(
      req,
      quick ? "reading.quick" : "reading.create",
      body,
      async (tx) =>
        readingDto(
          await tx.readingSession.create({
            data: {
              ...(await this.sessionData(tx, req.owner.id, body)),
              ownerId: req.owner.id,
            },
          }),
        ),
      true,
    );
  }
  update(req: OwnerRequest, id: string, raw: unknown, remove = false) {
    uuid(id);
    const body = remove ? {} : input("ReadingSessionPatch", raw);
    return this.mutations.run(
      req,
      `reading.${remove ? "delete" : "update"}:${id}`,
      body,
      async (tx) => {
        const current = await tx.readingSession.findFirst({
          where: { id, ownerId: req.owner.id },
        });
        if (!current) fail(404, "NOT_FOUND", "مطالعه پیدا نشد.");
        expectVersion(req.get("If-Match"), current, readingDto(current));
        if (remove) {
          await tx.readingSession.delete({ where: { id } });
          return { id, version: current.version + 1, deleted: true };
        }
        // Archived/deleted links remain valid on edits that do not change that link.
        const merged = { ...readingDto(current), ...body };
        const data = await this.sessionData(tx, req.owner.id, {
          ...merged,
          bookId: body.bookId === undefined ? null : body.bookId,
          occurrenceId:
            body.occurrenceId === undefined ? null : body.occurrenceId,
        });
        return readingDto(
          await tx.readingSession.update({
            where: { id },
            data: {
              ...data,
              bookId: body.bookId === undefined ? current.bookId : data.bookId,
              bookTitleSnapshot:
                body.bookId === undefined
                  ? current.bookTitleSnapshot
                  : data.bookTitleSnapshot,
              occurrenceId:
                body.occurrenceId === undefined
                  ? current.occurrenceId
                  : data.occurrenceId,
              version: { increment: 1 },
            },
          }),
        );
      },
    );
  }
  async totals(
    tx: Transaction,
    ownerId: string,
    from: Date,
    to: Date,
  ): Promise<DTO["ReadingTotals"]> {
    // Aggregate in PostgreSQL rather than downloading an unbounded reading history.
    const [totals] = await tx.$queryRaw<
      { minutes: number; pages: number; sessions: number }[]
    >`
      SELECT COALESCE(sum(extract(epoch FROM (LEAST("endAt", ${to}::timestamptz) - GREATEST("startAt", ${from}::timestamptz))) / 60),0)::float8 AS minutes,
      COALESCE(sum(CASE WHEN "startAt" >= ${from}::timestamptz THEN COALESCE(pages,0) ELSE 0 END),0)::float8 AS pages,
      count(*) FILTER (WHERE "startAt" >= ${from}::timestamptz)::float8 AS sessions
      FROM "ReadingSession" WHERE "ownerId" = ${ownerId}::uuid AND "startAt" < ${to}::timestamptz AND "endAt" > ${from}::timestamptz`;
    return totals;
  }
  async goal(
    tx: Transaction,
    ownerId: string,
    week: string,
  ): Promise<DTO["GoalState"]> {
    const weekStart = saturday(week),
      bounds = weekBounds(week);
    const explicit = await tx.weeklyGoal.findUnique({
      where: { ownerId_weekStart: { ownerId, weekStart } },
    });
    const fallback = await tx.defaultGoal.findFirst({
      where: { ownerId, effectiveFromWeek: { lte: weekStart } },
      orderBy: { effectiveFromWeek: "desc" },
    });
    const actual = await this.totals(tx, ownerId, bounds.startAt, bounds.endAt);
    const chosen = explicit ?? fallback,
      unit = chosen?.unit ?? null,
      target = chosen?.target ?? null;
    const amount = unit ? actual[unit] : 0;
    return {
      weekStart: week,
      source: explicit ? "explicit" : unit ? "default" : "none",
      version: explicit?.version ?? 0,
      unit,
      target,
      actual: amount,
      remaining: target ? Math.max(target - amount, 0) : null,
      percent: target ? (100 * amount) / target : null,
    };
  }
  getGoal(req: OwnerRequest, week: string) {
    return this.mutations.run(req, "goals.read", { week }, (tx) =>
      this.goal(tx, req.owner.id, week),
    );
  }
  goalWrite(req: OwnerRequest, week: string, raw: unknown, remove = false) {
    const weekStart = saturday(week),
      body = remove ? null : input("WeeklyGoalWrite", raw);
    return this.mutations.run(
      req,
      `goals.${remove ? "delete" : "put"}:${week}`,
      body,
      async (tx) => {
        const current = await tx.weeklyGoal.findUnique({
          where: { ownerId_weekStart: { ownerId: req.owner.id, weekStart } },
        });
        expectVersion(
          req.get("If-Match"),
          { version: current?.version ?? 0 },
          await this.goal(tx, req.owner.id, week),
        );
        if (remove) {
          if (!current)
            fail(404, "NOT_FOUND", "هدف اختصاصی برای این هفته ثبت نشده است.");
          await tx.weeklyGoal.delete({ where: { id: current.id } });
          return {
            id: current.id,
            version: current.version + 1,
            deleted: true,
          };
        }
        const result = await tx.weeklyGoal.upsert({
          where: { ownerId_weekStart: { ownerId: req.owner.id, weekStart } },
          create: { ownerId: req.owner.id, weekStart, ...body! },
          update: { ...body!, version: { increment: 1 } },
        });
        return goalDto(result);
      },
    );
  }
}
