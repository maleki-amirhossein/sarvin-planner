import type { Prisma } from "../generated/prisma/client";

/** Called within the owner's serialized transaction, after explicit onboarding input. */
export async function bootstrapWork(tx: Prisma.TransactionClient, ownerId: string, effectiveFrom: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) throw new Error("INVALID_LOCAL_DATE");
  const date = new Date(`${effectiveFrom}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== effectiveFrom) throw new Error("INVALID_LOCAL_DATE");
  await tx.$queryRaw`SELECT id FROM "Owner" WHERE id = ${ownerId}::uuid FOR UPDATE`;
  const settings = await tx.userSettings.findUniqueOrThrow({ where: { ownerId } });
  if (settings.workEffectiveFrom && settings.workEffectiveFrom.getTime() !== date.getTime()) throw new Error("WORK_ALREADY_CONFIGURED");
  const root = await tx.seriesRoot.upsert({
    where: { ownerId_bootstrapKey: { ownerId, bootstrapKey: "default-work" } },
    create: { ownerId, bootstrapKey: "default-work" }, update: {},
  });
  const work = await tx.fixedSeries.upsert({
    where: { rootSeriesId_effectiveFrom: { rootSeriesId: root.id, effectiveFrom: date } },
    create: { rootSeriesId: root.id, kind: "work", title: "کار", weekdays: [6, 7, 1, 2, 3], localStartTime: "08:00", localEndTime: "13:00", effectiveFrom: date },
    update: {},
  });
  if (!settings.workEffectiveFrom) {
    await tx.userSettings.update({ where: { ownerId }, data: { workEffectiveFrom: date, version: { increment: 1 } } });
    await tx.owner.update({ where: { id: ownerId }, data: { scheduleRevision: { increment: 1 } } });
  }
  return work;
}
