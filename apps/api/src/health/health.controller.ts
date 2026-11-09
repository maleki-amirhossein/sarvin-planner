import { Public } from "../auth/auth.guard";
import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Public()
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("live")
  live() { return { status: "ok" }; }

  @Get()
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok" };
    } catch {
      throw new ServiceUnavailableException({ code: "UNAVAILABLE", message: "سرویس آماده نیست." });
    }
  }
}
