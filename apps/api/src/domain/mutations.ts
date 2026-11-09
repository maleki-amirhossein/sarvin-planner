import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";
import type { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { fail } from "../http/errors";
import { uuid } from "../http/contracts";
import type { OwnerRequest } from "../auth/session";
export function canonical(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .filter(([key, v]) => v !== undefined && key !== "conflictSnapshot")
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => `${JSON.stringify(key)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export function digest(value: unknown) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}
export function expectVersion(
  header: string | undefined,
  current: { version: number },
  safeCurrent?: unknown,
) {
  if (!header)
    fail(
      428,
      "PRECONDITION_REQUIRED",
      "نسخه اطلاعات مشخص نیست. صفحه را تازه کنید.",
    );
  if (
    !/^"(0|[1-9]\d*)"$/.test(header) ||
    Number(header.slice(1, -1)) !== current.version
  )
    fail(
      409,
      "STALE_VERSION",
      "اطلاعات در جای دیگری تغییر کرده است. نسخه تازه را بارگیری کنید.",
      {
        currentVersion: current.version,
        ...(safeCurrent ? { current: safeCurrent } : {}),
      },
    );
}
export type Transaction = Prisma.TransactionClient;
@Injectable()
export class Mutations {
  constructor(private readonly prisma: PrismaService) {}
  async run<T>(
    req: OwnerRequest,
    operation: string,
    body: unknown,
    action: (tx: Transaction, revision: number) => Promise<T>,
    keyRequired = false,
  ): Promise<T> {
    const rawKey =
      req.method === "GET" || operation === "schedule.preview"
        ? undefined
        : req.get("Idempotency-Key");
    if (keyRequired && !rawKey)
      fail(400, "VALIDATION_ERROR", "شناسه درخواست الزامی است.");
    const key = rawKey ? uuid(rawKey) : undefined;
    const ownerId = req.owner.id;
    const requestDigest = digest({ body, version: req.get("If-Match") });
    return this.prisma.$transaction(
      async (tx) => {
        const owners = await tx.$queryRaw<
          { scheduleRevision: number; sessionGeneration: number }[]
        >`SELECT "scheduleRevision", "sessionGeneration" FROM "Owner" WHERE id = ${ownerId}::uuid FOR UPDATE`;
        if (
          !owners.length ||
          owners[0].sessionGeneration !== req.session.generation
        )
          fail(401, "UNAUTHORIZED", "لطفاً دوباره وارد شوید.");
        if (key) {
          const existing = await tx.idempotencyRecord.findUnique({
            where: { ownerId_operation_key: { ownerId, operation, key } },
          });
          if (existing && existing.expiresAt > new Date()) {
            if (existing.requestDigest !== requestDigest)
              fail(
                409,
                "IDEMPOTENCY_KEY_REUSED",
                "این شناسه درخواست قبلاً برای اطلاعات دیگری استفاده شده است.",
              );
            return existing.responseBody as T;
          }
          if (existing)
            await tx.idempotencyRecord.delete({ where: { id: existing.id } });
        }
        const result = await action(tx, owners[0].scheduleRevision);
        if (key)
          await tx.idempotencyRecord.create({
            data: {
              ownerId,
              operation,
              key,
              requestDigest,
              responseStatus:
                req.method === "POST" &&
                operation !== "settings.onboarding" &&
                operation !== "schedule.preview"
                  ? 201
                  : 200,
              responseBody: JSON.parse(
                JSON.stringify(result),
              ) as Prisma.InputJsonValue,
              expiresAt: new Date(Date.now() + 25 * 3600000),
            },
          });
        return result;
      },
      { maxWait: 5000, timeout: 15000 },
    );
  }
}

/** A future-scoped edit touches the whole root, so any segment/occurrence edit invalidates
 * every segment version in that root. Runs only while the owner row is locked. */
export async function bumpRootVersion(
  tx: Transaction,
  rootSeriesId: string,
  version?: number,
) {
  let next = version;
  if (next === undefined) {
    const fixed = await tx.fixedSeries.aggregate({
      where: { rootSeriesId },
      _max: { version: true },
    });
    const tasks = await tx.taskSeries.aggregate({
      where: { rootSeriesId },
      _max: { version: true },
    });
    next = Math.max(fixed._max.version ?? 0, tasks._max.version ?? 0) + 1;
  }
  await tx.fixedSeries.updateMany({
    where: { rootSeriesId },
    data: { version: next },
  });
  await tx.taskSeries.updateMany({
    where: { rootSeriesId },
    data: { version: next },
  });
}
