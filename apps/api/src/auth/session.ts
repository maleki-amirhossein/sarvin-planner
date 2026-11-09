import { csrfSync } from "csrf-sync";
import type { Request } from "express";
export const csrf = csrfSync({ getTokenFromRequest: req => req.get("X-CSRF-Token") });
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
declare module "express-session" {
  interface SessionData { ownerId?: string; generation?: number; absoluteExpiresAt?: number }
}
export type OwnerRequest = Request & { owner: { id: string; email: string; sessionGeneration: number } };
export const saveSession = (req: Request) => new Promise<void>((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
export const destroySession = (req: Request) => new Promise<void>((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()));
export const regenerateSession = (req: Request) => new Promise<void>((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
