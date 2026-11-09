import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import session from "express-session";
import connectPg from "connect-pg-simple";
@Injectable()
export class SessionStore implements OnModuleDestroy {
  readonly store: InstanceType<ReturnType<typeof connectPg>>;
  constructor(config: ConfigService) {
    const PgStore = connectPg(session);
    this.store = new PgStore({ conString: config.getOrThrow("DATABASE_URL"), createTableIfMissing: false, pruneSessionInterval: 900, disableTouch: true, errorLog: () => console.error("Session store unavailable") });
  }
  async onModuleDestroy() { await this.store.close(); }
}
