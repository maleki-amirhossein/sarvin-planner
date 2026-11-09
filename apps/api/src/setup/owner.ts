import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword } from "../auth/password";
import { provisionOwner } from "./provision-owner";
import { z } from "zod";

async function main() {
  const email = z.email().max(254).parse(process.argv[2]?.trim().toLowerCase());
  const recover = process.argv[3] === "--recover";
  if (process.argv.length > (recover ? 4 : 3)) throw new Error("Usage: owner <email> [--recover]");
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error("Run owner setup in an interactive terminal. Passwords are never accepted as command-line arguments.");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL must be configured");
  const { default: password } = await import("@inquirer/password");
  const first = await password({ message: "New owner password (12–1024 characters):", mask: "*", validate: value => value.length >= 12 && value.length <= 1024 || "Use 12–1024 characters." });
  const repeat = await password({ message: "Repeat password:", mask: "*" });
  if (first !== repeat) throw new Error("Passwords did not match; nothing changed.");
  const hash = await hashPassword(first);
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  try {
    await prisma.$transaction(tx => provisionOwner(tx, email, hash, recover));
    console.log(recover ? "Password recovered; all sessions revoked." : "Owner created. Sign in and choose your work start date during setup.");
  } finally { await prisma.$disconnect(); }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error && !('code' in error) ? error.message : "Owner setup failed. Check configuration and database availability.");
  process.exitCode = 1;
});
