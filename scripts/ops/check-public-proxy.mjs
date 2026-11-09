import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { isIP } from "node:net";

// For an existing host TLS proxy. Never print the resolved secret-bearing config.
const config = JSON.parse(
  execFileSync("docker", ["compose", "config", "--format", "json"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }),
);
const { api, db, web, caddy } = config.services;
assert.equal(config.networks.database.internal, true);
for (const service of [api, db, web]) {
  assert.ok(!service.ports?.length, "Backend ports must stay private");
  assert.notEqual(service.network_mode, "host");
}
assert.equal(caddy.ports.length, 1);
assert.equal(
  caddy.ports[0].host_ip,
  "127.0.0.1",
  "Internal HTTP proxy must be loopback-only",
);
assert.equal(Number(caddy.ports[0].published), 18080);
assert.equal(Number(caddy.ports[0].target), 80);
assert.notEqual(caddy.network_mode, "host");
assert.ok(
  isIP(caddy.environment.HOST_PROXY_IP),
  "Trust one explicit host gateway",
);
assert.ok(
  caddy.volumes.some(
    (v) =>
      v.target === "/etc/caddy/Caddyfile" &&
      v.read_only &&
      v.source.endsWith("Caddyfile.nginx"),
  ),
);
assert.equal(String(api.environment.COOKIE_SECURE), "true");
assert.equal(String(api.environment.ALLOW_INSECURE_LOCAL_HTTP), "false");
for (const origin of api.environment.APP_ORIGINS.split(",")) {
  const url = new URL(origin);
  assert.equal(url.protocol, "https:");
  assert.equal(url.origin, origin);
  assert.ok(!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
}
assert.ok(
  db.environment.POSTGRES_PASSWORD.length >= 32 &&
    !/replace|local_only/i.test(db.environment.POSTGRES_PASSWORD),
);
assert.ok(
  api.environment.SESSION_SECRET.length >= 48 &&
    !api.environment.SESSION_SECRET.startsWith("replace-"),
);
for (const service of [api, web])
  assert.ok(!/:(local|latest|RELEASE_TAG)$/.test(service.image));
console.log(
  "Public TLS proxy configuration passed: Secure cookies, exact HTTPS origins and private upstreams. Verify the host TLS listener and forwarding chain separately.",
);
