import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";

// A separate localhost-only access mode, not a substitute for public HTTPS.
// Never print the resolved config: it contains database and session secrets.
const config = JSON.parse(
  execFileSync("docker", ["compose", "config", "--format", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
const { api, db, web, caddy } = config.services;
assert.equal(
  config.networks.database.internal,
  true,
  "Private database network required",
);
for (const service of [api, db, web]) {
  assert.ok(!service.ports?.length, "Only the tunnel proxy may publish a port");
  assert.notEqual(service.network_mode, "host", "Host networking forbidden");
}
assert.notEqual(caddy.network_mode, "host", "Host networking forbidden");
assert.equal(caddy.ports.length, 1, "Exactly one loopback HTTP port required");
const port = caddy.ports[0];
assert.equal(port.host_ip, "127.0.0.1", "Public HTTP binding forbidden");
assert.equal(Number(port.published), 18080, "Expected tunnel port 18080");
assert.equal(Number(port.target), 80, "Expected HTTP proxy target");
assert.equal(port.protocol, "tcp", "Expected TCP tunnel");
assert.equal(caddy.environment.CADDY_SITE_ADDRESS, ":80");
assert.equal(String(api.environment.COOKIE_SECURE), "false");
assert.equal(String(api.environment.ALLOW_INSECURE_LOCAL_HTTP), "true");
assert.equal(
  api.environment.APP_ORIGINS,
  "http://localhost:18080,http://127.0.0.1:18080",
);
assert.ok(
  db.environment.POSTGRES_PASSWORD.length >= 32 &&
    !/replace|local_only/i.test(db.environment.POSTGRES_PASSWORD),
  "Random database password required",
);
assert.ok(
  api.environment.SESSION_SECRET.length >= 48 &&
    !api.environment.SESSION_SECRET.startsWith("replace-"),
  "Random session secret required",
);
for (const service of [api, web]) {
  assert.ok(
    service.image && !/:(local|latest|RELEASE_TAG)$/.test(service.image),
    "Explicit release image required",
  );
}
console.log(
  "Private tunnel configuration passed: loopback-only proxy, isolated database, localhost origins and release images.",
);
