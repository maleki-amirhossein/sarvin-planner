import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Generation/builds do not need a database. Runtime config requires DATABASE_URL.
  datasource: { url: process.env.DATABASE_URL ?? "postgresql://sarvin:sarvin_local_only@127.0.0.1:5432/sarvin?schema=public" },
});
