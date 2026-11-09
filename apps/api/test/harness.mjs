import 'dotenv/config';
import { jsonSchema } from '../../../scripts/openapi-json-schema.mjs';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { Client } from 'pg';
const require = createRequire(import.meta.url);
const contract = JSON.parse(readFileSync(new URL('../../../docs/contracts/openapi.json', import.meta.url), 'utf8'));
const ajv = new Ajv({ strict: false, allErrors: true }); addFormats(ajv);
ajv.addSchema({ $id: 'sarvin', components: jsonSchema(contract.components) });
function checkResponse(path, method, status, data) {
  const pathname = new URL('http://localhost' + path).pathname;
  const entry = Object.entries(contract.paths).sort(([a], [b]) => Number(a.includes('{')) - Number(b.includes('{'))).find(([pattern]) => new RegExp('^' + pattern.replace(/\{[^}]+\}/g, '[^/]+') + '$').test(pathname));
  const operation = entry?.[1][method.toLowerCase()];
  let response = operation?.responses[String(status)];
  assert.ok(response, `${method} ${pathname}: undocumented status ${status}`);
  if (response.$ref) response = contract.components.responses[response.$ref.split('/').at(-1)];
  const schema = response.content?.['application/json']?.schema;
  if (schema) { const validate = ajv.compile(schema.$ref ? { $ref: 'sarvin' + schema.$ref } : schema); assert.ok(validate(data), `${method} ${pathname}: response contract mismatch ${JSON.stringify(validate.errors)}`); }
}
export async function withApp(run) {
  const database = `sarvin_domain_test_${randomUUID().replaceAll('-', '')}`;
  const admin = new Client({ connectionString: process.env.DATABASE_URL }); await admin.connect();
  let created = false, app, db;
  try {
    await admin.query(`CREATE DATABASE "${database}"`); created = true;
    const url = new URL(process.env.DATABASE_URL); url.pathname = `/${database}`;
    Object.assign(process.env, { DATABASE_URL: url.toString(), NODE_ENV: 'test', SESSION_SECRET: randomBytes(48).toString('base64'), APP_ORIGINS: 'http://localhost:3000', COOKIE_SECURE: 'false', ALLOW_INSECURE_LOCAL_HTTP: 'true', TRUST_PROXY: 'loopback' });
    execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], { env: process.env, stdio: 'pipe' });
    db = new Client({ connectionString: url.toString() }); await db.connect();
    const { hashPassword } = require('../dist/auth/password.js');
    const password = randomBytes(24).toString('base64'), ownerId = randomUUID();
    await db.query('INSERT INTO "Owner" (id,email,"passwordHash","updatedAt") VALUES ($1,$2,$3,now())', [ownerId, 'test@example.invalid', await hashPassword(password)]);
    await db.query('INSERT INTO "UserSettings" ("ownerId","updatedAt") VALUES ($1,now())', [ownerId]);
    const { createApplication } = require('../dist/application.js');
    app = await createApplication(); await app.listen(0, '127.0.0.1');
    const base = `http://127.0.0.1:${app.getHttpServer().address().port}/api`;
    let cookie = '', token = '';
    async function call(path, options = {}) {
      const { body, method = 'GET', version, key, anonymous = false } = options;
      const response = await fetch(base + path, { method, headers: { ...(!anonymous && cookie ? { Cookie: cookie } : {}), Origin: 'http://localhost:3000', ...(token ? { 'X-CSRF-Token': token } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...(version === undefined ? {} : { 'If-Match': `"${version}"` }), ...(key ? { 'Idempotency-Key': key } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const set = response.headers.get('set-cookie'); if (set) cookie = set.split(';')[0];
      const data = response.status === 204 ? null : await response.json();
      checkResponse(path, method, response.status, data);
      return { status: response.status, data };
    }
    token = (await call('/auth/csrf')).data.csrfToken;
    assert.equal((await call('/auth/login', { method: 'POST', body: { email: 'test@example.invalid', password } })).status, 200);
    token = (await call('/auth/csrf')).data.csrfToken;
    await run({ call, db, ownerId });
  } finally {
    await app?.close(); await db?.end();
    if (created) await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
    await admin.end();
  }
}
