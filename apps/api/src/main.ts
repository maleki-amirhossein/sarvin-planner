import { ConfigService } from "@nestjs/config";
import { createApplication } from "./application";
async function bootstrap() {
  const app = await createApplication();
  await app.listen(app.get(ConfigService).getOrThrow<number>("PORT"), "0.0.0.0");
}
void bootstrap().catch(() => {
  console.error("API startup failed. Check configuration and database availability.");
  process.exitCode = 1;
});
