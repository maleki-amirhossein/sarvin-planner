import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { OwnerRequest } from "../auth/session";
import { PrismaService } from "../prisma/prisma.service";
import { input, nonempty, uuid, type DTO } from "../http/contracts";
import { parse, fail } from "../http/errors";
import {
  dbDate,
  dateString,
  instant,
  shift,
  validateInterval,
} from "../time/calendar";
import { occurrence, occursOn, validateRule } from "../time/recurrence";
import {
  Mutations,
  expectVersion,
  bumpRootVersion,
  type Transaction,
} from "./mutations";
import { fixedDto, exceptionDto } from "./mappers";
import { pageFields, pagination } from "./pagination";
import { ScheduleService } from "./schedule.service";
import { SeriesConflicts } from "./series-conflicts";
const listSchema = z
  .object({ ...pageFields, kind: z.enum(["work", "class"]).optional() })
  .strict();
function definition(body: DTO["FixedSeriesCreate"]) {
  return {
    kind: body.kind,
    title: nonempty(body.title),
    notes: body.notes ?? null,
    location: body.location ?? null,
    weekdays: body.weekdays,
    timezone: body.timezone,
    effectiveFrom: dbDate(body.effectiveFrom),
    effectiveUntil: body.effectiveUntil ? dbDate(body.effectiveUntil) : null,
    localStartTime: body.localStartTime,
    localEndTime: body.localEndTime,
    endsNextDay: body.endsNextDay,
    everyWeeks: body.everyWeeks,
    anchorWeekStart: body.anchorWeekStart ? dbDate(body.anchorWeekStart) : null,
    parity: body.parity ?? null,
  };
}
@Injectable()
export class FixedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mutations: Mutations,
    private readonly schedule: ScheduleService,
    private readonly conflicts: SeriesConflicts,
  ) {}
  async list(req: OwnerRequest, raw: unknown) {
    const query = parse(listSchema, raw),
      page = pagination(query, req.owner.id, { kind: query.kind });
    const rows = await this.prisma.fixedSeries.findMany({
      where: {
        AND: [
          {
            root: { ownerId: req.owner.id },
            deletedAt: null,
            kind: query.kind,
          },
          page.where,
        ],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: page.take,
    });
    return page.finish(rows, fixedDto);
  }
  private async owned(tx: Transaction, ownerId: string, id: string) {
    const current = await tx.fixedSeries.findFirst({
      where: { id: uuid(id), root: { ownerId }, deletedAt: null },
    });
    if (!current) fail(404, "NOT_FOUND", "برنامه ثابت پیدا نشد.");
    return current;
  }
  create(req: OwnerRequest, raw: unknown) {
    const body = input("FixedSeriesCreate", raw),
      data = definition(body);
    return this.mutations.run(
      req,
      "fixed.create",
      body,
      async (tx, revision) => {
        const id = randomUUID(),
          rootSeriesId = randomUUID(),
          proposed = { ...data, id, rootSeriesId, version: 1 };
        validateRule(proposed);
        // Request identity must be stable across a confirmation retry; generated IDs are excluded.
        await this.conflicts.check(
          tx,
          req.owner.id,
          proposed,
          { operation: "fixed.create", body },
          revision,
          body.conflictSnapshot,
        );
        await tx.seriesRoot.create({
          data: { id: rootSeriesId, ownerId: req.owner.id },
        });
        const created = await tx.fixedSeries.create({
          data: { ...data, id, rootSeriesId },
        });
        await this.changed(tx, req.owner.id);
        return fixedDto(created);
      },
      true,
    );
  }
  private async changed(tx: Transaction, ownerId: string) {
    await tx.owner.update({
      where: { id: ownerId },
      data: { scheduleRevision: { increment: 1 } },
    });
  }
  update(req: OwnerRequest, id: string, raw: unknown) {
    const body = input("FixedSeriesPatch", raw);
    return this.mutations.run(
      req,
      `fixed.update:${id}`,
      body,
      async (tx, revision) => {
        const current = await this.owned(tx, req.owner.id, id);
        expectVersion(req.get("If-Match"), current, fixedDto(current));
        if (!occursOn(current, body.originalLocalDate))
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
                ![
                  "title",
                  "localStartTime",
                  "localEndTime",
                  "endsNextDay",
                ].includes(key),
            )
          )
            fail(
              400,
              "INVALID_SCOPE",
              "برای تغییر قانون تکرار، رخدادهای آینده را انتخاب کنید.",
            );
          const revised = {
            ...current,
            title:
              patch.title !== undefined ? nonempty(patch.title) : current.title,
            localStartTime: patch.localStartTime ?? current.localStartTime,
            localEndTime: patch.localEndTime ?? current.localEndTime,
            endsNextDay: patch.endsNextDay ?? current.endsNextDay,
          };
          validateRule(revised);
          const event = occurrence(revised, originalLocalDate);
          const existing = await tx.occurrenceException.findUnique({
            where: {
              rootSeriesId_originalLocalDate: {
                rootSeriesId: current.rootSeriesId,
                originalLocalDate: dbDate(originalLocalDate),
              },
            },
          });
          if (existing)
            fail(
              409,
              "STALE_VERSION",
              "این رخداد استثنا دارد؛ همان استثنا را ویرایش کنید.",
              {
                current: exceptionDto(existing),
                currentVersion: existing.version,
              },
            );
          await this.schedule.check(
            tx,
            req.owner.id,
            event,
            { id, body, version: current.version },
            revision,
            conflictSnapshot,
            [event.occurrenceKey],
          );
          const exception = await tx.occurrenceException.create({
            data: {
              rootSeriesId: current.rootSeriesId,
              originalLocalDate: dbDate(originalLocalDate),
              kind: "override",
              title: event.title,
              startAt: event.startAt,
              endAt: event.endAt,
            },
          });
          await bumpRootVersion(tx, current.rootSeriesId, current.version + 1);
          await this.changed(tx, req.owner.id);
          return { scope: "this" as const, exception: exceptionDto(exception) };
        }
        const future = definition({
          ...fixedDto(current),
          ...patch,
          effectiveFrom: originalLocalDate,
        });
        const proposed = {
          ...future,
          id: randomUUID(),
          rootSeriesId: current.rootSeriesId,
          version: 1,
        };
        validateRule(proposed);
        const retained =
          originalLocalDate > dateString(current.effectiveFrom)
            ? {
                rule: {
                  ...current,
                  effectiveUntil: dbDate(shift(originalLocalDate, -1)),
                },
                kind: current.kind,
              }
            : undefined;
        const later = await tx.fixedSeries.findMany({
          where: {
            rootSeriesId: current.rootSeriesId,
            deletedAt: null,
            effectiveFrom: { gt: dbDate(originalLocalDate) },
          },
        });
        // Persisted exceptions stay with the stable root and are never silently removed.
        await this.conflicts.check(
          tx,
          req.owner.id,
          proposed,
          { id, body, version: current.version },
          revision,
          conflictSnapshot,
          [id, ...later.map((segment) => segment.id)],
          retained,
        );
        await tx.fixedSeries.updateMany({
          where: { id: { in: later.map((segment) => segment.id) } },
          data: {
            deletedAt: new Date(),
            terminatedAt: dbDate(originalLocalDate),
            version: { increment: 1 },
          },
        });
        await tx.fixedSeries.update({
          where: { id },
          data: {
            effectiveUntil:
              retained?.rule.effectiveUntil ?? current.effectiveUntil,
            terminatedAt: dbDate(originalLocalDate),
            deletedAt: retained ? null : new Date(),
            version: { increment: 1 },
          },
        });
        // Same-day replacement cannot share the segment's unique start date. Reuse its identity,
        // but only when no earlier part of that segment exists.
        let updated;
        if (!retained)
          updated = await tx.fixedSeries.update({
            where: { id },
            data: { ...future, deletedAt: null, terminatedAt: null },
          });
        else
          updated = await tx.fixedSeries.upsert({
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
        await bumpRootVersion(tx, current.rootSeriesId, current.version + 1);
        await this.changed(tx, req.owner.id);
        return {
          scope: "future" as const,
          series: fixedDto(
            await tx.fixedSeries.findUniqueOrThrow({
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
      `fixed.delete:${id}`,
      body,
      async (tx) => {
        const current = await this.owned(tx, req.owner.id, id);
        expectVersion(req.get("If-Match"), current, fixedDto(current));
        if (!occursOn(current, body.originalLocalDate))
          fail(
            400,
            "INVALID_SCOPE",
            "تاریخ انتخاب‌شده یک رخداد این برنامه نیست.",
          );
        if (body.scope === "this") {
          const key = {
            rootSeriesId: current.rootSeriesId,
            originalLocalDate: dbDate(body.originalLocalDate),
          };
          const existing = await tx.occurrenceException.findUnique({
            where: { rootSeriesId_originalLocalDate: key },
          });
          if (existing)
            fail(
              409,
              "STALE_VERSION",
              "این رخداد استثنا دارد؛ همان استثنا را ویرایش کنید.",
              {
                current: exceptionDto(existing),
                currentVersion: existing.version,
              },
            );
          const result = await tx.occurrenceException.create({
            data: { ...key, kind: "cancel" },
          });
          await bumpRootVersion(tx, current.rootSeriesId, current.version + 1);
          await this.changed(tx, req.owner.id);
          return { id: result.id, version: result.version, deleted: true };
        }
        // Future scope terminates every later segment of the same stable root.
        const cutoff = body.originalLocalDate;
        await tx.fixedSeries.updateMany({
          where: {
            rootSeriesId: current.rootSeriesId,
            deletedAt: null,
            effectiveFrom: { gt: dbDate(cutoff) },
          },
          data: {
            deletedAt: new Date(),
            terminatedAt: dbDate(cutoff),
            version: { increment: 1 },
          },
        });
        await tx.fixedSeries.update({
          where: { id },
          data: {
            effectiveUntil:
              cutoff > dateString(current.effectiveFrom)
                ? dbDate(shift(cutoff, -1))
                : current.effectiveUntil,
            deletedAt:
              cutoff === dateString(current.effectiveFrom) ? new Date() : null,
            terminatedAt: dbDate(cutoff),
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
  async exceptions(req: OwnerRequest, id: string, raw: unknown) {
    const series = await this.owned(this.prisma, req.owner.id, id);
    const query = parse(z.object(pageFields).strict(), raw),
      page = pagination(query, req.owner.id, { seriesId: id });
    const rows = await this.prisma.occurrenceException.findMany({
      where: { AND: [{ rootSeriesId: series.rootSeriesId }, page.where] },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: page.take,
    });
    return page.finish(rows, exceptionDto);
  }
  exceptionWrite(
    req: OwnerRequest,
    id: string,
    raw: unknown,
    exceptionId?: string,
    remove = false,
  ) {
    const body = remove
      ? parse(
          z
            .object({ conflictSnapshot: z.string().max(512).optional() })
            .strict(),
          raw ?? {},
        )
      : exceptionId
        ? input("ExceptionPatch", raw)
        : input("ExceptionCreate", raw);
    return this.mutations.run(
      req,
      `fixed.exception:${id}:${exceptionId ?? "create"}:${remove}`,
      body,
      async (tx, revision) => {
        const series = await this.owned(tx, req.owner.id, id);
        const current = exceptionId
          ? await tx.occurrenceException.findFirst({
              where: {
                id: uuid(exceptionId),
                rootSeriesId: series.rootSeriesId,
              },
            })
          : null;
        if (exceptionId && !current) fail(404, "NOT_FOUND", "استثنا پیدا نشد.");
        if (current)
          expectVersion(req.get("If-Match"), current, exceptionDto(current));
        const merged = {
          ...(current ? exceptionDto(current) : {}),
          ...body,
        } as DTO["ExceptionCreate"];
        const originalLocalDate = current
          ? dateString(current.originalLocalDate)
          : merged.originalLocalDate;
        if (
          !occursOn(series, originalLocalDate) &&
          !(
            current &&
            originalLocalDate >= dateString(series.effectiveFrom) &&
            (!series.effectiveUntil ||
              originalLocalDate <= dateString(series.effectiveUntil))
          )
        )
          fail(400, "INVALID_SCOPE", "تاریخ به این بخش برنامه تعلق ندارد.");
        const original = occurrence(series, originalLocalDate);
        if (remove) {
          if (occursOn(series, originalLocalDate))
            await this.schedule.check(
              tx,
              req.owner.id,
              original,
              { id, exceptionId, remove, version: current!.version },
              revision,
              body.conflictSnapshot,
              [original.occurrenceKey],
            );
          await tx.occurrenceException.delete({ where: { id: current!.id } });
          await bumpRootVersion(tx, series.rootSeriesId, series.version + 1);
          await this.changed(tx, req.owner.id);
          return {
            id: current!.id,
            version: current!.version + 1,
            deleted: true,
          };
        }
        const data = {
          kind: merged.action,
          title: merged.replacementTitle ?? null,
          startAt: merged.replacementStartAt
            ? instant(merged.replacementStartAt)
            : null,
          endAt: merged.replacementEndAt
            ? instant(merged.replacementEndAt)
            : null,
        };
        if (data.kind === "override") {
          if (!data.startAt || !data.endAt)
            fail(400, "VALIDATION_ERROR", "شروع و پایان استثنا را مشخص کنید.");
          validateInterval({ startAt: data.startAt, endAt: data.endAt });
          await this.schedule.check(
            tx,
            req.owner.id,
            { startAt: data.startAt, endAt: data.endAt },
            { id, exceptionId, body, version: current?.version },
            revision,
            merged.conflictSnapshot,
            [original.occurrenceKey],
          );
        } else if (data.startAt || data.endAt)
          fail(
            400,
            "VALIDATION_ERROR",
            "لغو رخداد نباید زمان جایگزین داشته باشد.",
          );
        let result;
        if (current)
          result = await tx.occurrenceException.update({
            where: { id: current.id },
            data: { ...data, version: { increment: 1 } },
          });
        else {
          const existing = await tx.occurrenceException.findUnique({
            where: {
              rootSeriesId_originalLocalDate: {
                rootSeriesId: series.rootSeriesId,
                originalLocalDate: dbDate(originalLocalDate),
              },
            },
          });
          if (existing)
            fail(
              409,
              "STALE_VERSION",
              "این رخداد استثنا دارد؛ همان استثنا را ویرایش کنید.",
              {
                current: exceptionDto(existing),
                currentVersion: existing.version,
              },
            );
          result = await tx.occurrenceException.create({
            data: {
              rootSeriesId: series.rootSeriesId,
              originalLocalDate: dbDate(originalLocalDate),
              ...data,
            },
          });
        }
        await bumpRootVersion(tx, series.rootSeriesId, series.version + 1);
        await this.changed(tx, req.owner.id);
        return exceptionDto(result);
      },
      !exceptionId,
    );
  }
}
