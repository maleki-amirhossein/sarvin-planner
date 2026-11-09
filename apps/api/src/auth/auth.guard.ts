import { CanActivate, ExecutionContext, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma/prisma.service";
import { fail } from "../http/errors";
import { type OwnerRequest } from "./session";
export const Public = () => SetMetadata("public", true);
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>("public", [context.getHandler(), context.getClass()])) return true;
    const req = context.switchToHttp().getRequest<OwnerRequest>();
    const session = req.session;
    if (!session?.ownerId || !session.absoluteExpiresAt || session.absoluteExpiresAt <= Date.now()) fail(401, "UNAUTHORIZED", "لطفاً دوباره وارد شوید.");
    const owner = await this.prisma.owner.findUnique({ where: { id: session.ownerId }, select: { id: true, email: true, sessionGeneration: true } });
    if (!owner || owner.sessionGeneration !== session.generation) fail(401, "UNAUTHORIZED", "لطفاً دوباره وارد شوید.");
    req.owner = owner;
    return true;
  }
}
