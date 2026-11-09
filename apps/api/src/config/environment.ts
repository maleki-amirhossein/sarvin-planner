import { z } from "zod";
const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().url().refine(value => /^postgres(ql)?:/.test(value)),
  SESSION_SECRET: z.string().min(32).refine(value => !value.startsWith("replace-")),
  APP_ORIGINS: z.string().default("http://localhost:3000,http://localhost:8080"),
  COOKIE_SECURE: z.enum(["true", "false"]).default("true").transform(value => value === "true"),
  ALLOW_INSECURE_LOCAL_HTTP: z.enum(["true", "false"]).default("false"),
  TRUST_PROXY: z.string().default("loopback"),
}).superRefine((value, ctx) => {
  let origins: URL[] = [];
  try { origins = value.APP_ORIGINS.split(",").map(origin => new URL(origin)); } catch { ctx.addIssue({ code: "custom", path: ["APP_ORIGINS"], message: "Invalid origins" }); return; }
  if (origins.some(url => url.origin !== url.href.replace(/\/$/, "") || url.username || url.password)) ctx.addIssue({ code: "custom", path: ["APP_ORIGINS"], message: "Origins only" });
  if (!value.COOKIE_SECURE && (value.ALLOW_INSECURE_LOCAL_HTTP !== "true" || origins.some(url => !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) ctx.addIssue({ code: "custom", path: ["COOKIE_SECURE"], message: "Insecure cookies only for explicit localhost" });
  if (value.COOKIE_SECURE && origins.some(url => url.protocol !== "https:")) ctx.addIssue({ code: "custom", path: ["APP_ORIGINS"], message: "HTTPS required" });
});
export function validateEnvironment(input: Record<string, unknown>) {
  const result = environmentSchema.safeParse(input);
  if (!result.success) throw new Error(`Invalid environment: ${result.error.issues.map(issue => issue.path.join(".")).join(", ")}`);
  return result.data;
}
