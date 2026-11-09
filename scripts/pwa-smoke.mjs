import assert from "node:assert/strict";

const web = process.env.WEB_URL ?? "http://127.0.0.1:3000";
async function get(path) {
  const response = await fetch(new URL(path, web), {
    signal: AbortSignal.timeout(10_000),
  });
  assert.equal(response.status, 200, path);
  return response;
}
const html = await (await get("/login")).text();
assert.match(html, /rel="manifest"[^>]*href="\/manifest.webmanifest"/);
assert.match(html, /name="theme-color" content="#00796e"/);
assert.match(html, /\/icons\/apple-touch-icon.png/);
const response = await get("/manifest.webmanifest");
assert.match(
  response.headers.get("content-type"),
  /application\/manifest\+json/,
);
const manifest = await response.json();
assert.equal(manifest.display, "standalone");
assert.equal(manifest.start_url, "/today");
assert.equal(manifest.id, "/");
assert.equal(manifest.scope, "/");
assert.equal(manifest.lang, "fa");
assert.equal(manifest.dir, "rtl");
for (const icon of [
  ...manifest.icons,
  { src: "/icons/apple-touch-icon.png", sizes: "180x180" },
]) {
  const response = await get(icon.src);
  assert.match(response.headers.get("content-type"), /image\/png/);
  const png = Buffer.from(await response.arrayBuffer());
  assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
}
const worker = await get("/sw.js");
assert.match(worker.headers.get("content-type"), /javascript/);
assert.match(worker.headers.get("cache-control"), /no-store/);
assert.match(await worker.text(), /sarvin-offline-v1/);
assert.match(
  await (await get("/offline.html")).text(),
  /سروین منتظر اتصال است/,
);
console.log(`PWA HTTP checks passed: ${web}`);
