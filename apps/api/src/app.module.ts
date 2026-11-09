import { APP_GUARD } from "@nestjs/core";
import { AuthController } from "./auth/auth.controller";
import { AuthGuard } from "./auth/auth.guard";
import { SessionStore } from "./auth/session-store";
import { DomainModule } from "./domain/domain.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnvironment } from "./config/environment";
import { HealthController } from "./health/health.controller";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }), PrismaModule, DomainModule],
  controllers: [HealthController, AuthController],
  providers: [SessionStore, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
