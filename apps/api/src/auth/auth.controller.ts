import { Body, Controller, Get, HttpCode, OnModuleInit, Post, Req, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { PrismaService } from "../prisma/prisma.service";
import { fail, parse } from "../http/errors";
import { Public } from "./auth.guard";
import { csrf, destroySession, regenerateSession, saveSession, SESSION_MAX_AGE, type OwnerRequest } from "./session";
import { hashPassword, verifyPassword } from "./password";

const loginSchema = z.object({ email: z.email().max(254).transform(value => value.toLowerCase()), password: z.string().min(1).max(1024) }).strict();
const passwordSchema = z.object({ currentPassword: z.string().min(1).max(1024), newPassword: z.string().min(12).max(1024) }).strict();
@Controller("auth")
export class AuthController implements OnModuleInit {
  private dummyHash = "";
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}
  async onModuleInit() { this.dummyHash = await hashPassword(randomUUID()); }
  @Public() @Get("csrf")
  async csrfToken(@Req() req: Request) {
    const csrfToken = csrf.generateToken(req);
    await saveSession(req);
    return { csrfToken };
  }
  @Public() @Post("login") @HttpCode(200)
  async login(@Body() body: unknown, @Req() req: Request) {
    const input = parse(loginSchema, body);
    const owner = await this.prisma.owner.findUnique({ where: { email: input.email } });
    const valid = await verifyPassword(owner?.passwordHash ?? this.dummyHash, input.password);
    if (!owner || !valid) fail(401, "UNAUTHORIZED", "ایمیل یا رمز عبور درست نیست.");
    await regenerateSession(req);
    req.session.ownerId = owner.id;
    req.session.generation = owner.sessionGeneration;
    req.session.absoluteExpiresAt = Date.now() + SESSION_MAX_AGE;
    req.session.cookie.maxAge = SESSION_MAX_AGE;
    await saveSession(req);
    return { ownerId: owner.id, email: owner.email, expiresAt: new Date(req.session.absoluteExpiresAt).toISOString() };
  }
  @Get("me")
  me(@Req() req: OwnerRequest) { return { ownerId: req.owner.id, email: req.owner.email, expiresAt: new Date(req.session.absoluteExpiresAt!).toISOString() }; }
  private async clear(req: Request, res: Response) {
    await destroySession(req);
    res.clearCookie(this.config.getOrThrow<boolean>("COOKIE_SECURE") ? "__Host-sarvin.sid" : "sarvin.sid", { path: "/", httpOnly: true, sameSite: "lax", secure: this.config.getOrThrow<boolean>("COOKIE_SECURE") });
  }
  @Post("logout") @HttpCode(204)
  async logout(@Req() req: OwnerRequest, @Res({ passthrough: true }) res: Response) { await this.clear(req, res); }
  private async revoke(ownerId: string, passwordHash?: string, expectedHash?: string) {
    await this.prisma.$transaction(async tx => {
      const changed = await tx.owner.updateMany({ where: { id: ownerId, ...(expectedHash ? { passwordHash: expectedHash } : {}) }, data: { sessionGeneration: { increment: 1 }, ...(passwordHash ? { passwordHash } : {}) } });
      if (changed.count !== 1) fail(409, "STALE_VERSION", "رمز عبور تغییر کرده است. دوباره وارد شوید.");
      await tx.$executeRaw`DELETE FROM session WHERE sess->>'ownerId' = ${ownerId}`;
    });
  }
  @Post("revoke-all") @HttpCode(204)
  async revokeAll(@Req() req: OwnerRequest, @Res({ passthrough: true }) res: Response) { await this.revoke(req.owner.id); await this.clear(req, res); }
  @Post("change-password") @HttpCode(204)
  async changePassword(@Body() body: unknown, @Req() req: OwnerRequest, @Res({ passthrough: true }) res: Response) {
    const input = parse(passwordSchema, body);
    const owner = await this.prisma.owner.findUniqueOrThrow({ where: { id: req.owner.id } });
    if (!await verifyPassword(owner.passwordHash, input.currentPassword)) fail(401, "UNAUTHORIZED", "رمز عبور درست نیست.");
    await this.revoke(owner.id, await hashPassword(input.newPassword), owner.passwordHash);
    await this.clear(req, res);
  }
}
