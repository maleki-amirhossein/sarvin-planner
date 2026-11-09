import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import manifest from "../app/manifest";

const worker = readFileSync(
  new URL("../../public/sw.js", import.meta.url),
  "utf8",
);

function harness(online = true) {
  const handlers = new Map<string, (event: unknown) => void>();
  const cached: string[] = [],
    deleted: string[] = [],
    fetched: unknown[] = [];
  const cache = {
    add: async (path: string) => {
      cached.push(path);
    },
    match: async (path: string) =>
      path === "/offline.html" ? new Response("offline") : undefined,
  };
  vm.runInNewContext(worker, {
    self: {
      location: { origin: "https://87.107.160.160:8443" },
      clients: { claim: async () => {} },
      addEventListener: (name: string, handler: (event: unknown) => void) =>
        handlers.set(name, handler),
    },
    caches: {
      open: async () => cache,
      keys: async () => [
        "sarvin-offline-v0",
        "sarvin-offline-v1",
        "unrelated-cache",
      ],
      delete: async (name: string) => {
        deleted.push(name);
      },
    },
    URL,
    Response,
    fetch: async (request: unknown) => {
      fetched.push(request);
      if (!online) throw new TypeError("offline");
      return new Response("private online content");
    },
  });
  return {
    cached,
    deleted,
    fetched,
    async lifecycle(name: string) {
      let pending: Promise<unknown> | undefined;
      handlers.get(name)!({
        waitUntil: (promise: Promise<unknown>) => {
          pending = promise;
        },
      });
      await pending;
    },
    fetch(path: string, method = "GET", mode = "navigate") {
      let response: Promise<Response> | undefined;
      handlers.get("fetch")!({
        request: {
          url: new URL(path, "https://87.107.160.160:8443").href,
          method,
          mode,
        },
        respondWith: (promise: Promise<Response>) => {
          response = promise;
        },
      });
      return response;
    },
  };
}

test("PWA has stable same-origin identity, Persian metadata and real PNG icon sizes", async () => {
  const data = manifest();
  assert.equal(data.id, "/");
  assert.equal(data.scope, "/");
  assert.equal(data.start_url, "/today");
  assert.equal(data.display, "standalone");
  assert.equal(data.lang, "fa");
  assert.equal(data.dir, "rtl");
  assert.ok(data.icons?.some((icon) => icon.sizes === "192x192"));
  assert.ok(data.icons?.some((icon) => icon.sizes === "512x512"));
  for (const icon of data.icons ?? []) {
    const png = await readFile(
      new URL(`../../public${icon.src}`, import.meta.url),
    );
    assert.equal(png.subarray(1, 4).toString(), "PNG");
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});

test("worker caches only public fallback and cleans only its own old caches", async () => {
  const sw = harness();
  await sw.lifecycle("install");
  await sw.lifecycle("activate");
  assert.deepEqual(sw.cached, ["/offline.html"]);
  assert.deepEqual(sw.deleted, ["sarvin-offline-v0"]);
});

test("online navigation stays fresh and private responses are never cached", async () => {
  const sw = harness();
  assert.equal(
    await (await sw.fetch("/today"))?.text(),
    "private online content",
  );
  assert.equal(sw.fetched.length, 1);
  assert.deepEqual(sw.cached, []);
});

test("offline navigation gets fallback; API, mutations, RSC and external requests pass through", async () => {
  const sw = harness(false);
  assert.equal(await (await sw.fetch("/week"))?.text(), "offline");
  for (const path of ["/api", "/api/auth/me", "/api/export", "/api/tasks"]) {
    assert.equal(sw.fetch(path), undefined);
  }
  assert.equal(sw.fetch("/today", "POST"), undefined);
  assert.equal(sw.fetch("/today?_rsc=abc", "GET", "cors"), undefined);
  assert.equal(sw.fetch("https://example.com/"), undefined);
  assert.deepEqual(sw.cached, []);
});
