import type { Prisma } from "../generated/prisma/client";
/** Administrative transaction only: no HTTP endpoint calls this function. */
export async function provisionOwner(tx: Prisma.TransactionClient, email: string, passwordHash: string, recover = false) {
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(193001104)`;
  const owner = await tx.owner.findFirst();
  if (owner) {
    if (!recover || owner.email !== email) throw new Error("An owner already exists. Recovery requires its exact email and --recover.");
    await tx.owner.update({ where: { id: owner.id }, data: { passwordHash, sessionGeneration: { increment: 1 } } });
    await tx.authSession.deleteMany();
    return owner.id;
  }
  if (recover) throw new Error("No owner exists to recover.");
  return (await tx.owner.create({ data: { email, passwordHash, settings: { create: {} } } })).id;
}
