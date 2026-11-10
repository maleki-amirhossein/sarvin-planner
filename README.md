# Sarvin planner | برنامه‌ریز سروین

A single-user Persian, RTL personal planner with Jalali day/week navigation, task scheduling, recurring work/classes, actual reading logs, weekly reading goals and review/export. All screens use the NestJS REST API; business rules, authorization and PostgreSQL access stay in NestJS.

**Local app:** http://localhost:8080 through Docker/Caddy, or http://localhost:3000 for host development. No domain is needed. Features are implemented; three real weekly music schedules are saved from 2026-11-09. Real-server deployment and remaining acceptance are pending. The local owner is already provisioned; see the handoff before running setup again. No production sample data or default password is installed.

See the [implementation checklist](docs/implementation/Sarvin-Planner-Implementation-Plan-EN.md), [QA evidence](docs/implementation/qa-report.md), [handoff](docs/implementation/handoff.md), and [Persian user guide](docs/user-guide-fa.md).

## Architecture

- `apps/web`: Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/Radix RTL components, TanStack Query, FullCalendar 7, date-fns-jalali, Vazirmatn.
- `apps/api`: NestJS 12, Prisma 7 PostgreSQL adapter, PostgreSQL 18, opaque PostgreSQL sessions, Argon2 passwords and CSRF/origin checks.
- `compose.yaml`: database, one-shot migration job, API, web and Caddy. API/web images run as non-root users. Caddy preserves `/api` when forwarding to Nest.
- [Domain rules](docs/implementation/domain-contracts.md), [security](docs/implementation/security.md), [OpenAPI](docs/contracts/openapi.json). The contract generates runtime input validation, browser routes and DTO types.

Dependencies are pinned with `pnpm-lock.yaml`. Use Node **24** and pnpm **10.34.9**. ESLint 9 is retained for Next plugin compatibility. FullCalendar 7 bundles React view plugins; the published date-fns-jalali version uses the normal `-0` suffix. Do not substitute older plugin imports or claim Gregorian month navigation is Jalali. This release offers Jalali day/week navigation, not a month grid.

## Local setup

Prerequisites: Node 24, pnpm 10.34.9, Docker Desktop/Engine and Compose v2. Copy only missing files; do not overwrite existing secrets:

```sh
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm install --frozen-lockfile
```

Generate a session secret locally with `openssl rand -base64 48` and put it in `SESSION_SECRET` in both `.env` and `apps/api/.env`. The example placeholder is intentionally rejected. Protect these files with `chmod 600 .env apps/api/.env apps/web/.env.local`. Never commit or send secrets in chat.

```sh
pnpm db:up
pnpm db:deploy
pnpm dev
```

Web is http://localhost:3000; Nest is http://localhost:3001/api. The browser always calls same-origin `/api`. Next rewrites it during host development; Caddy handles it in Docker. Stop watch processes with Ctrl+C; `pnpm db:down` stops the database without deleting data.

Root `.env` configures Compose, API `.env` configures the host API/Prisma, and web `.env.local` configures the host proxy. Keep `DATABASE_URL` synchronized with Compose database credentials/port. `API_INTERNAL_URL` is server-only and captured at build time: rebuild Next if it changes. Do not put credentials in `NEXT_PUBLIC_*` variables.

Local HTTP requires `COOKIE_SECURE=false`, `ALLOW_INSECURE_LOCAL_HTTP=true`, and exact localhost origins. Deployed HTTPS requires secure cookies. See each `.env.example` for all settings. `TRUST_PROXY` must match the actual proxy topology.

## Owner setup

After the database is migrated:

```sh
pnpm --filter @sarvin/api build
pnpm owner malekii.dev@gmail.com
```

Enter the password in the masked terminal prompts (12–1024 characters). There is exactly one owner and no public registration. Sign in and explicitly choose the effective date for Saturday–Wednesday work, 08:00–13:00. The current local owner already has three real weekly music schedules; see the handoff for their confirmed days/times. New installations start without class data. For password recovery, run `pnpm owner malekii.dev@gmail.com --recover`; this revokes all sessions. Never pass passwords as arguments.

For the full Docker stack, use its interactive CLI instead:

```sh
docker compose exec api node dist/setup/owner.js malekii.dev@gmail.com
```

## Build and verification

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm contracts:check
pnpm test:database
pnpm test:auth
pnpm test:domain
```

Database/auth/domain tests require local PostgreSQL with permission to create disposable databases. They create uniquely named databases and clean up only those databases. They never seed the owner's database. Auth runs local HTTP and simulated trusted HTTPS-proxy cases; domain tests exercise real HTTP and validate responses against OpenAPI. Unit tests cover independent Tehran/Jalali/DST/week-boundary expectations.

After a build, run the host apps in separate terminals:

```sh
pnpm --filter @sarvin/api start
pnpm --filter @sarvin/web start
```

Run `pnpm smoke` against port 3000. Readiness `/api/health` queries PostgreSQL and returns 503 on outage; liveness `/api/health/live` checks the process. Smoke verifies login/RTL/assets/proxy health; it does not replace browser workflow QA.

After editing OpenAPI, run `pnpm contracts:generate` and `pnpm contracts:check`. Generated files are `docs/contracts/api.d.ts`, API runtime schemas and web route mappings. Keep them synchronized.

For isolated manual browser QA, start the built host web, then from `apps/api` run `QA_FIXTURES=1 node test/qa-server.mjs`. It serves localhost:3100, creates its own test database and writes temporary credentials to ignored mode-600 `.env.qa-session.json`. Stop normally to remove both. These are explicit test fixtures, never an owner seed.

## Docker and data

After setting the root session secret:

```sh
docker compose up --build -d
docker compose ps
WEB_URL=http://localhost:8080 pnpm smoke
```

Open http://localhost:8080. Startup order is healthy database → successful migration → healthy API → web → Caddy. A migration container exiting 0 is expected. Database is exposed only on loopback for host development; API/web are reached through Caddy. Logs rotate at 10 MB × 3 files per service.

`docker compose down` preserves named volumes. **Do not use `down -v` or reset the database for routine troubleshooting.** PostgreSQL initialization variables do not rotate credentials in an existing volume. Rebuild images after source/dependency changes. Local images use `sarvin-planner-api:local` and `sarvin-planner-web:local`; deployment uses explicit release tags.

## Migrations, backup and deployment

Versioned migrations define the schema, ownership constraints, recurrence identities, interval checks, series audit/version fields and the music task category. Do not edit applied migrations.

```sh
pnpm db:generate
pnpm db:migrate --name change  # development only
pnpm db:deploy                # apply committed SQL
pnpm db:status
BACKUP_DIR="$PWD/.local/backups" scripts/ops/backup.sh
scripts/ops/restore-test.sh /private/path/to/sarvin.dump
```

Backups contain private data and password hashes; protect them and keep them out of Git/public assets. Restore testing creates and drops a separate generated database. It never overwrites the live database.

[Deployment instructions](docs/implementation/deployment.md) cover production env validation, Caddy HTTPS, immutable image tags, firewall/ports, secure owner bootstrap, encrypted off-server restic backups, retention, monitoring, restore and rollback. `compose.production.yaml` removes PostgreSQL's published port and publishes only Caddy 80/443; it requires Compose 2.24.4+. The current IP HTTPS deployment is verified below. A custom domain, automated off-server backups and remaining browser/reboot acceptance are pending.

Dates are displayed in Persian with Tehran timezone and Saturday week boundaries. API instants carry UTC/offsets and use PostgreSQL `timestamptz`; local dates remain separate. Recurrence and goal attribution are authoritative in Nest. Planning a reading task or checking it complete does not log actual reading.

## Server deployment

The live server app is **https://5.160.200.254** (no SSH tunnel required). It uses a valid IP HTTPS certificate, Secure session cookies and a fresh database on `amirhossein`; old/local schedules were not imported. New server credentials are stored privately in `.local/amirhossein-owner-login.json` (mode 600). The local Docker app remains separate at port 8080.

The host Nginx TLS listener forwards to loopback-only Caddy; `compose.public-proxy.yaml` adds the public HTTPS settings after the base/tunnel configs. Use `/opt/sarvin-planner/manage` on the server. See the [server runbook](docs/implementation/deployment.md) and [verification report](docs/implementation/qa-report.md) for rollout, certificate renewal, backup and remaining acceptance details.

## Automatic CI/CD

Pushes to `main` or `master` run verification and automatically deploy to
https://5.160.200.254 through GitHub Actions. Pull requests run tests only.
See [CI/CD operations](docs/implementation/ci-cd.md) for credentials, immutable
releases, backups, rollback limits and infrastructure updates. Workflow history:
[CI and deploy](https://github.com/maleki-amirhossein/sarvin-planner/actions/workflows/ci-cd.yml).

## PWA installation

The web app includes a Persian RTL install manifest, standalone mode, logo-derived
192/512px and maskable icons, an Apple touch icon, and installation guidance in
Settings. Supporting browsers show a native install button there when available.
On iPhone/iPad, open Safari → Share → Add to Home Screen. A custom domain is not
required: the public IP URL works with its trusted HTTPS certificate; localhost
is supported for development. HTTP on a non-loopback IP does not qualify.

The service worker is registered only in production on secure contexts. It caches
only a self-contained public offline page. API responses, authenticated pages, RSC
payloads and writes are never stored by the worker. The planner remains online;
this does not add offline editing or push notifications. Worker updates wait for
existing tabs to close and never force a reload over an unsaved draft. Increment
`CACHE` in `apps/web/public/sw.js` when changing the offline page. The original logo
is unchanged; installation icons are separate derived files.

Verify a built web instance with `WEB_URL=http://localhost:3000 node scripts/pwa-smoke.mjs`.
This checks HTTP metadata/assets/headers, not actual device installation.
