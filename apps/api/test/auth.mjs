import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { Client } from 'pg';
const require = createRequire(import.meta.url);
const secure = process.argv.includes('--https');
const origin = secure ? 'https://planner.example.invalid' : 'http://localhost:3000';
const database = `sarvin_auth_test_${randomUUID().replaceAll('-', '')}`;
const admin = new Client({ connectionString: process.env.DATABASE_URL });
await admin.connect();
let created = false, app, db;
try {
  await admin.query(`CREATE DATABASE "${database}"`); created = true;
  const url = new URL(process.env.DATABASE_URL); url.pathname = `/${database}`;
  Object.assign(process.env, { DATABASE_URL: url.toString(), NODE_ENV: 'test', SESSION_SECRET: randomBytes(48).toString('base64'), APP_ORIGINS: origin, COOKIE_SECURE: String(secure), ALLOW_INSECURE_LOCAL_HTTP: 'true', TRUST_PROXY: 'loopback' });
  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], { env: process.env, stdio: 'pipe' });
  db = new Client({ connectionString: url.toString() }); await db.connect();
  const { hashPassword } = require('../dist/auth/password.js');
  const password = randomBytes(24).toString('base64');
  const ownerId = randomUUID();
  await db.query('INSERT INTO "Owner" (id,email,"passwordHash","updatedAt") VALUES ($1,$2,$3,now())', [ownerId, 'test@example.invalid', await hashPassword(password)]);
  const { createApplication } = require('../dist/application.js');
  app = await createApplication(); await app.listen(0, '127.0.0.1');
  const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
  let cookie = '', token = '';
  async function request(path, { body, method = 'GET', origin: requestOrigin = origin, csrf = token, sendCookie = true } = {}) {
    const response = await fetch(base + path, { method, headers: { ...(sendCookie && cookie ? { Cookie: cookie } : {}), ...(requestOrigin ? { Origin: requestOrigin } : {}), ...(secure ? { 'X-Forwarded-Proto': 'https' } : {}), ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const data = response.status === 204 ? null : await response.json();
    return { response, data, setCookie };
  }
  async function getToken() { const result = await request('/auth/csrf'); assert.equal(result.response.status, 200); token = result.data.csrfToken; return result; }
  async function login() { await getToken(); const result = await request('/auth/login', { method: 'POST', body: { email: 'test@example.invalid', password } }); assert.equal(result.response.status, 200); await getToken(); return result; }
  assert.equal((await request('/auth/me')).response.status, 401);
  const health = await request('/health'); assert.deepEqual(health.data, { status: 'ok' });
  assert.equal(health.response.headers.get('cache-control'), 'private, no-store');
  const anonymous = await getToken();
  assert.match(anonymous.setCookie, /HttpOnly/i); assert.match(anonymous.setCookie, /SameSite=Lax/i); assert.match(anonymous.setCookie, /Path=\//i); if (secure) { assert.match(anonymous.setCookie, /Secure/i); assert.match(anonymous.setCookie, /^__Host-/); } else assert.doesNotMatch(anonymous.setCookie, /Secure/i);
  const beforeLogin = cookie;
  assert.equal((await request('/auth/login', { method: 'POST', csrf: '', body: { email: 'test@example.invalid', password } })).response.status, 403);
  assert.equal((await request('/auth/login', { method: 'POST', origin: 'https://evil.invalid', body: { email: 'test@example.invalid', password } })).response.status, 403);
  const wrong = await request('/auth/login', { method: 'POST', body: { email: 'test@example.invalid', password: 'wrong' } });
  const unknown = await request('/auth/login', { method: 'POST', body: { email: 'nobody@example.invalid', password: 'wrong' } });
  assert.equal(wrong.response.status, 401); assert.equal(unknown.response.status, 401); assert.equal(wrong.data.message, unknown.data.message);
  const signed = await login(); assert.notEqual(cookie, beforeLogin); assert.equal(signed.data.ownerId, ownerId); assert.ok(Date.parse(signed.data.expiresAt) > Date.now());
  assert.deepEqual(Object.keys(signed.data).sort(), ['email', 'expiresAt', 'ownerId']);
  assert.equal((await request('/auth/me')).response.status, 200);
  assert.equal((await request('/auth/me', { sendCookie: false })).response.status, 401);
  assert.equal((await request('/auth/logout', { method: 'POST', csrf: 'bad' })).response.status, 403);
  assert.equal((await request('/auth/logout', { method: 'POST' })).response.status, 204);
  assert.equal((await request('/auth/me')).response.status, 401);
  await login();
  await db.query("UPDATE session SET expire = now() - interval '1 second'");
  assert.equal((await request('/auth/me')).response.status, 401);
  await login();
  const anotherCookie = cookie;
  await login();
  assert.equal((await request('/auth/revoke-all', { method: 'POST' })).response.status, 204);
  cookie = anotherCookie;
  assert.equal((await request('/auth/me')).response.status, 401);
  const sessions = await db.query("SELECT count(*)::int AS n FROM session WHERE sess->>'ownerId' IS NOT NULL"); assert.equal(sessions.rows[0].n, 0);
  await login();
  assert.equal((await request('/auth/change-password', { method: 'POST', body: { currentPassword: 'wrong', newPassword: password + 'new' } })).response.status, 401);
  assert.equal((await request('/auth/change-password', { method: 'POST', body: { currentPassword: password, newPassword: password + 'new' } })).response.status, 204);
  assert.equal((await request('/auth/me')).response.status, 401);
  const { verifyPassword } = require('../dist/auth/password.js');
  const changed = await db.query('SELECT "passwordHash" FROM "Owner" WHERE id=$1', [ownerId]);
  assert.equal(await verifyPassword(changed.rows[0].passwordHash, password + 'new'), true);
  await getToken();
  let limited = false;
  for (let i = 0; i < 12; i++) { const result = await request('/auth/login', { method: 'POST', body: { email: 'test@example.invalid', password: 'wrong' } }); if (result.response.status === 429) { limited = true; break; } }
  assert.ok(limited);
  console.log('PASS: real HTTP authentication, session rotation/persistence/expiry/revocation, generic failures, CSRF/Origin, cookies, public health, password change, secure proxy cookies, and rate limiting.');
} finally {
  await app?.close(); await db?.end();
  if (created) await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
  await admin.end();
}
