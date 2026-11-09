import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
// Validate resolved configuration without printing secrets.
const config = JSON.parse(
  execFileSync("docker", ["compose", "config", "--format", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
const api = config.services.api.environment,
  db = config.services.db.environment,
  caddy = config.services.caddy;
assert.equal(String(api.COOKIE_SECURE), "true", "Secure cookies required");
assert.equal(
  String(api.ALLOW_INSECURE_LOCAL_HTTP),
  "false",
  "Local HTTP opt-out forbidden",
);
assert.ok(
  db.POSTGRES_PASSWORD.length >= 32 &&
    !/replace|local_only/i.test(db.POSTGRES_PASSWORD),
  "Unique random database password required",
);
assert.ok(
  api.SESSION_SECRET.length >= 48 && !api.SESSION_SECRET.startsWith("replace-"),
  "Random session secret required",
);
assert.ok(
  !config.services.db.ports?.length,
  "Database port must not be published",
);
assert.ok(
  !config.services.api.ports?.length && !config.services.web.ports?.length,
  "Only Caddy may publish app ports",
);
const origins = api.APP_ORIGINS.split(",");
for (const origin of origins) {
  const url = new URL(origin);
  assert.ok(
    url.protocol === "https:" &&
      !/(localhost|example\.(com|org|net))$/.test(url.hostname),
    "Real HTTPS origin required",
  );
  assert.equal(origin, url.origin, "Use exact origin");
}
assert.ok(
  origins.includes(`https://${caddy.environment.CADDY_SITE_ADDRESS}`),
  "Caddy domain must match allowed origin",
);
console.log(
  "Production configuration checks passed. DNS, HTTPS, server access and off-server backups still require real verification.",
);
