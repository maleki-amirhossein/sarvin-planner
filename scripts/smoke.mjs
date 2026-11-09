import assert from "node:assert/strict";

const web = process.env.WEB_URL ?? "http://127.0.0.1:3000";
const api = process.env.API_URL ?? web;
const health = await fetch(`${api}/api/health`, {
  signal: AbortSignal.timeout(10_000),
});
assert.equal(health.status, 200, "API/database readiness");
assert.deepEqual(await health.json(), { status: "ok" });
const live = await fetch(`${api}/api/health/live`);
assert.equal(live.status, 200, "API liveness");
const page = await fetch(web, { signal: AbortSignal.timeout(10_000) });
assert.equal(page.status, 200, "Web page");
const html = await page.text();
assert.match(html, /lang="fa"/);
assert.match(html, /dir="rtl"/);
assert.match(html, /برنامه‌ریز سروین/);
const login = await fetch(`${web}/login`, {
  signal: AbortSignal.timeout(10000),
});
assert.equal(login.status, 200, "Login page");
assert.match(await login.text(), /lang="fa"/);
const logo = await fetch(`${web}/sarvin-planner-logo.png`, {
  signal: AbortSignal.timeout(10000),
});
assert.equal(logo.status, 200, "Approved logo asset");
assert.match(logo.headers.get("content-type") ?? "", /image\/png/);
const privateData = await fetch(`${api}/api/auth/me`, {
  signal: AbortSignal.timeout(10000),
});
assert.equal(privateData.status, 401, "Anonymous private access denied");
console.log(`Smoke checks passed: ${web} and ${api}/api/health`);
