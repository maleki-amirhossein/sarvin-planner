import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import type { NestExpressApplication } from "@nestjs/platform-express";
import express, { type Request, type Response, type NextFunction } from "express";
import session from "express-session";
import { rateLimit } from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { AppModule } from "./app.module";
import { ApiErrorFilter } from "./http/errors";
import { SessionStore } from "./auth/session-store";
import { csrf, SESSION_MAX_AGE } from "./auth/session";

export async function createApplication() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false, abortOnError: false, logger: ["error", "warn"] });
  const config = app.get(ConfigService);
  app.setGlobalPrefix("api");
  app.set("trust proxy", config.getOrThrow<string>("TRUST_PROXY").split(","));
  app.disable("x-powered-by");
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Request-Id", randomUUID());
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
  app.use(express.json({ limit: "64kb" }));
  const error = (res: Response, status: number, code: string, message: string) => res.status(status).json({ code, message, requestId: res.getHeader("X-Request-Id") });
  // Limit anonymous session allocation as well as expensive password verification.
  app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false, handler: (_req, res) => error(res, 429, "RATE_LIMITED", "کمی صبر کنید و دوباره تلاش کنید.") }));
  for (const path of ["/api/auth/login", "/api/auth/change-password"]) {
    app.use(path, rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false, handler: (_req, res) => error(res, 429, "RATE_LIMITED", "کمی صبر کنید و دوباره تلاش کنید.") }));
  }
  app.use(session({ store: app.get(SessionStore).store, name: config.get<boolean>("COOKIE_SECURE") ? "__Host-sarvin.sid" : "sarvin.sid", secret: config.getOrThrow("SESSION_SECRET"), resave: false, saveUninitialized: false, rolling: false, cookie: { httpOnly: true, secure: config.getOrThrow<boolean>("COOKIE_SECURE"), sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE } }));
  const origins = new Set(config.getOrThrow<string>("APP_ORIGINS").split(","));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && !origins.has(req.get("Origin") ?? "")) { error(res, 403, "CSRF_REJECTED", "درخواست معتبر نیست. صفحه را تازه کنید."); return; }
    csrf.csrfSynchronisedProtection(req, res, err => err ? error(res, 403, "CSRF_REJECTED", "درخواست معتبر نیست. صفحه را تازه کنید.") : next());
  });
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = typeof err === "object" && err && "status" in err ? Number(err.status) : 503;
    error(res, status === 413 ? 413 : status === 400 ? 400 : 503, status === 413 ? "VALIDATION_ERROR" : status === 400 ? "VALIDATION_ERROR" : "UNAVAILABLE", "درخواست انجام نشد. ورودی و اتصال را بررسی کنید.");
  });
  app.useGlobalFilters(new ApiErrorFilter());
  app.enableShutdownHooks();
  return app;
}
