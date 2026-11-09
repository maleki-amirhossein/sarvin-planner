/** Disposable browser QA only. Never seeds the owner's database. */
import "dotenv/config";
import { randomUUID, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { writeFileSync, unlinkSync } from "node:fs";
import { createServer, request } from "node:http";
import { URL } from "node:url";
import { Client } from "pg";
const require = createRequire(import.meta.url),
  name = `sarvin_browser_test_${randomUUID().replaceAll("-", "")}`;
const admin = new Client({ connectionString: process.env.DATABASE_URL });
await admin.connect();
admin.on("error", () => {
  console.error(
    "QA database connection interrupted; restart the disposable QA server.",
  );
});
let app,
  proxy,
  created = false;
const credentialFile = new URL("../.env.qa-session.json", import.meta.url);
async function cleanup() {
  proxy?.close();
  await app?.close();
  if (created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  await admin.end();
  try {
    unlinkSync(credentialFile);
  } catch {
    /* Already removed. */
  }
}
try {
  await admin.query(`CREATE DATABASE "${name}"`);
  created = true;
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `/${name}`;
  Object.assign(process.env, {
    DATABASE_URL: url.toString(),
    NODE_ENV: "test",
    SESSION_SECRET: randomBytes(48).toString("base64"),
    APP_ORIGINS: "http://localhost:3100",
    COOKIE_SECURE: "false",
    ALLOW_INSECURE_LOCAL_HTTP: "true",
    TRUST_PROXY: "loopback",
  });
  execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
    env: process.env,
    stdio: "pipe",
  });
  const password = randomBytes(24).toString("base64"),
    email = "browser-qa@example.invalid",
    ownerId = randomUUID();
  const db = new Client({ connectionString: url.toString() });
  await db.connect();
  const { hashPassword } = require("../dist/auth/password.js");
  await db.query(
    'INSERT INTO "Owner" (id,email,"passwordHash","updatedAt") VALUES ($1,$2,$3,now())',
    [ownerId, email, await hashPassword(password)],
  );
  await db.query(
    'INSERT INTO "UserSettings" ("ownerId","updatedAt") VALUES ($1,now())',
    [ownerId],
  );
  await db.end();
  writeFileSync(credentialFile, JSON.stringify({ email, password }), {
    mode: 0o600,
  });
  const { createApplication } = require("../dist/application.js");
  app = await createApplication();
  await app.listen(3101, "127.0.0.1");
  proxy = createServer((req, res) => {
    const upstream = request(
      {
        hostname: "127.0.0.1",
        port: req.url.startsWith("/api/") ? 3101 : 3000,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (reply) => {
        res.writeHead(reply.statusCode, reply.headers);
        reply.pipe(res);
      },
    );
    upstream.on("error", () => {
      res.writeHead(502);
      res.end("QA upstream unavailable");
    });
    req.pipe(upstream);
  });
  await new Promise((resolve) => proxy.listen(3100, "127.0.0.1", resolve));
  if (process.env.QA_FIXTURES === "1") {
    let cookie = "",
      csrf = "";
    const call = async (path, body, version) => {
      const r = await fetch("http://127.0.0.1:3101/api" + path, {
        method: body ? "POST" : "GET",
        headers: {
          Origin: "http://localhost:3100",
          Cookie: cookie,
          "Content-Type": "application/json",
          "X-CSRF-Token": csrf,
          "Idempotency-Key": randomUUID(),
          ...(version === undefined ? {} : { "If-Match": `"${version}"` }),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const set = r.headers.get("set-cookie");
      if (set) cookie = set.split(";")[0];
      const data = await r.json();
      if (!r.ok) throw new Error(`QA fixture failed: ${path} ${r.status}`);
      return data;
    };
    csrf = (await call("/auth/csrf")).csrfToken;
    await call("/auth/login", { email, password });
    csrf = (await call("/auth/csrf")).csrfToken;
    await call("/settings/onboarding", {
      timezone: "Asia/Tehran",
      workEffectiveFrom: "2026-11-07",
      readingGoalWeekStart: "2026-11-07",
      readingGoal: { unit: "minutes", target: 150 },
    });
    await call("/tasks", {
      title: "کار آزمایشی قابل زمان‌بندی",
      category: "reading",
      estimateMinutes: 60,
    });
    await call("/books", {
      title: "کتاب آزمایشی پذیرش",
      author: "نویسنده آزمایشی",
      status: "reading",
    });
    await call("/reading-sessions", {
      startedAt: "2026-11-07T10:00:00Z",
      endedAt: "2026-11-07T10:30:00Z",
      topic: "جلسه آزمایشی اول",
    });
    await call("/reading-sessions", {
      startedAt: "2026-11-07T11:00:00Z",
      endedAt: "2026-11-07T12:00:00Z",
      topic: "جلسه آزمایشی دوم",
    });
  }
  console.log(
    "Disposable browser QA ready at http://localhost:3100; credentials stored in ignored local file.",
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => {
      void cleanup().then(() => process.exit(0));
    });
} catch (error) {
  await cleanup();
  throw error;
}
