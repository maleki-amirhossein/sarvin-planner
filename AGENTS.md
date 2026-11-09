# Sarvin planner — agent notes

## Purpose and current scope

Single-user personal app for daily/weekly task scheduling and weekly non-academic reading goals. The UI must be Persian, RTL, responsive, and use Jalali dates.

The application now includes login/onboarding, today/week/tasks/reading/review/settings screens, recurring schedules and exceptions, actual reading/goals, export and deployment preparation. The user has now authorized the full implementation plan in `docs/implementation/Sarvin-Planner-Implementation-Plan-EN.md`. Follow its task order and dependencies; update each verified task to `- [x]` with an explicit **Done** label and execution-log evidence. Keep partial/blocked tasks unchecked. The repository checklist is canonical; mirror checkpoint updates to the originally supplied Desktop Markdown while it remains available. Never mark planned API contracts as implemented features.

Read `docs/implementation/domain-contracts.md` before implementing domain logic. `docs/contracts/openapi.json` is the implemented API contract (50 operations, 61 schemas), with generated DTOs, runtime schemas and browser route mappings. Authentication, recurrence, exceptions, reading, goals and export are implemented and exercised through HTTP acceptance. Consult `docs/implementation/qa-report.md` for evidence and unresolved acceptance checks.

Read `README.md` for setup details. These notes apply throughout the repository; also read `apps/web/AGENTS.md` before changing the web app. Its Next.js-generated instructions point to the installed framework documentation and should be preserved.

## Architecture and dependencies

- `apps/web`: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Radix direction context, TanStack Query, FullCalendar 7, and date-fns-jalali.
- `apps/api`: NestJS 12 REST API, Prisma 7 with `@prisma/adapter-pg`, and PostgreSQL 18.
- Keep **all business logic, authorization, and database access in NestJS**. Next.js owns presentation and API transport, not business API handlers or database access.
- Use Node.js 24 and the pinned pnpm 10.34.9 workspace package manager. Keep exact dependency versions and update `pnpm-lock.yaml` with dependency changes. Do not introduce npm/yarn lockfiles.
- Prisma 7 was deliberately chosen over the Prisma 8 release candidate available during setup. Verify stable releases and compatibility before upgrading; do not blindly follow `latest`.
- `date-fns-jalali` uses a `-0` suffix for its ordinary published releases; the foundation pins `4.4.0-0`. FullCalendar 7 React view plugins live inside `@fullcalendar/react`.

## Persian, RTL, and dates

- Preserve `<html lang="fa" dir="rtl">`, the RTL provider, and `rtl: true` in `apps/web/components.json`.
- Use logical CSS utilities such as `ms`, `me`, `start`, `end`, and `text-start`. Keep visible interface copy Persian and layouts usable on mobile.
- The user-provided logo is `apps/web/public/sarvin-planner-logo.png`, displayed beside the app title. Preserve the original artwork and transparency. The web Docker runtime must copy `public` so the logo and future static assets are served.
- Display timezone: `Asia/Tehran`. Weeks start on **Saturday**. Display dates in the Jalali calendar with Persian digits.
- Reuse `apps/web/src/lib/dates.ts` for display calculations. It combines date-fns-jalali with `@date-fns/tz` so results do not depend on the host timezone. Authoritative scheduling and weekly-goal calculations must live in NestJS.
- Future API timestamps should use ISO 8601 with an offset/UTC and PostgreSQL `timestamptz`. Treat date-only values separately from instants.
- `apps/web/src/components/week-calendar.tsx` is the shared weekly grid; `/dev/calendar` is a development-only feasibility prototype with non-persistent fixtures. FullCalendar v7 uses `slotHeaderFormat`, `color`, and `contrastColor`; do not use older option names.
- **Persian locale and RTL do not make FullCalendar's month navigation Jalali.** Implement and verify Jalali labels/ranges for day/week views, and a proper Jalali range/navigation adapter before introducing a month view. Do not claim calendar-system support based solely on localization.
- Add shadcn primitives from `apps/web` with `pnpm exec shadcn add <component>`; extend theme tokens as needed.

## Running locally

No domain is required. Run commands from the repository root unless stated otherwise.

### Full Docker stack

```sh
docker compose up -d           # existing images
docker compose up --build -d   # first run or after code/dependency changes
docker compose ps
WEB_URL=http://localhost:8080 pnpm smoke
```

Open `http://localhost:8080`. If the daemon is unavailable on this macOS machine, start Docker Desktop (`docker desktop start`) and retry. Check health before saying the app is running; previous runtime state is not a guarantee.

### Host development

Create missing env files from their examples without overwriting existing values:

- `.env.example` → `.env`: Docker Compose configuration.
- `apps/api/.env.example` → `apps/api/.env`: host API and Prisma configuration.
- `apps/web/.env.example` → `apps/web/.env.local`: host Next.js proxy configuration.

```sh
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:deploy
pnpm dev
```

Web: `http://localhost:3000`; direct API: `http://localhost:3001/api`. The root development command runs both watch processes. After building, production host processes can be started separately with `pnpm --filter @sarvin/api start` and `pnpm --filter @sarvin/web start`.

## Routing, configuration, and persistence

- Browser API requests use relative `/api` URLs and same-origin cookies. Next.js rewrites proxy to NestJS during host development; Caddy routes `/api` and `/api/*` directly to NestJS in Docker. Preserve the `/api` prefix—do not use Caddy `handle_path` to strip it.
- `API_INTERNAL_URL` is server-only and captured at Next.js build time. Rebuild when it changes. Docker enables standalone output with `NEXT_STANDALONE=1`; normal host builds support `next start`.
- Keep database credentials and future session secrets out of Next.js and `NEXT_PUBLIC_*` variables. Real env files and generated Prisma code are ignored by Git and Docker contexts.
- Root Compose env and app env files are separate. Keep the host API `DATABASE_URL` synchronized when changing the Compose database port/credentials. Example credentials are local development defaults only.
- Compose startup order: healthy PostgreSQL → successful migration job → healthy API → healthy web → Caddy. A migration container exiting with code 0 is expected.
- PostgreSQL is exposed on loopback for host development; containerized web/API are accessed through Caddy. Database and Caddy state use named volumes.
- `docker compose down` preserves data. **Do not use `docker compose down -v` or reset the database as routine troubleshooting:** that deletes persistent data. Changing initialization env variables does not rotate credentials in an existing PostgreSQL volume.
- Future own-server deployment uses a real `CADDY_SITE_ADDRESS` and ports 80/443 for automatic HTTPS. Local defaults use HTTP at port 8080. Production override, secure configuration validation, backup/restore and release runbooks are implemented; actual server/DNS/HTTPS/off-server verification remains pending.

## Prisma and health endpoints

- Schema: `apps/api/prisma/schema.prisma`; config: `apps/api/prisma.config.ts`; migrations: `apps/api/prisma/migrations`.
- Initial migration `20261108000000_init` creates `public`; subsequent domain migrations add models, SQL checks and audit columns. Do not edit already-applied migrations. Local-date columns use PostgreSQL date; `dbDate` maps them to Prisma without treating them as display instants.
- Use `pnpm db:migrate --name <change>` to create development migrations, `pnpm db:deploy` to apply committed migrations, and `pnpm db:status` to inspect state. Never run `migrate dev` against a deployed database or rewrite already-applied migrations.
- `pnpm db:generate` regenerates the ignored client under `apps/api/src/generated`. Build/typecheck generate it automatically and need no running database.
- The Prisma CLI has a local development URL fallback for generation. Explicitly configure `DATABASE_URL` before operating on another database; the API requires it at runtime.
- `GET /api/health` executes a database query: 200 when ready, 503 when the database is unavailable. `GET /api/health/live` checks process liveness and remains 200 during a database outage.

## Authentication contract

Implemented in NestJS; see `docs/implementation/security.md`:

- Exactly one administratively pre-created account, a hashed password, and **no public registration**.
- Opaque server-side sessions stored in PostgreSQL, with expiry, revocation, cleanup, and rotation at login. Do not substitute localStorage tokens or JWT-only sessions.
- Host-only cookies with `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure=true` on deployed HTTPS. Allow `Secure=false` only for explicit local HTTP development; a `__Host-` cookie name requires Secure cookies.
- Configure trusted proxies for the actual Caddy topology and add CSRF/origin checks, login rate limits, and authorization before exposing private features.

The real owner `malekii.dev@gmail.com` was provisioned on 2026-11-09 at the user’s explicit request using the masked administrative CLI. A generated password was saved only in an ignored mode-600 `.local/owner-login-*.txt` file. Local API login and logout were verified; never print that file or the password. Do not rerun initial provisioning or reset the password without a new user request. `pnpm owner <email>` uses a masked terminal prompt after building the API. Never put a password in chat, command arguments, examples or logs. Server/domain/backup inputs remain deferred. Three weekly music classes were supplied, saved and API-verified on 2026-11-09; see handoff. Work effective date is chosen through onboarding.

## Verification and handoff

```sh
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm contracts:check
pnpm smoke                                 # host apps at port 3000
WEB_URL=http://localhost:8080 pnpm smoke     # Docker/Caddy
```

Run checks appropriate to the change; documentation-only edits do not require rebuilding the apps. Update README/these notes when architecture or commands change.

After editing OpenAPI, run `pnpm contracts:generate`, then `pnpm contracts:check`. Keep generated declarations synchronized. The contract checker also checks route authentication, CSRF, and version-precondition declarations; it does not prove runtime enforcement. ESLint 9 is pinned for compatibility with the installed Next.js lint plugins; ESLint 10 currently fails their peer ranges. Revisit together with those plugins rather than suppressing peer checks.

Foundation verification completed on 2026-11-08: both production builds and development watch processes, type checks, migration application/status with no schema drift, full Docker/Caddy startup, and HTTP smoke checks passed. Jalali tests cover Nowruz, Tehran midnight, and Saturday week boundaries; they also passed with a different host timezone. A controlled database outage confirmed readiness 503 and liveness 200.

Browser QA uses a disposable database at localhost:3100. Native Chromium verified task scheduling/drag/resize, reading totals, offline draft retry and session expiry/re-login preserving an open draft. Responsive 360/390/430 and desktop 1280/1440 views were inspected and screenshots are in `artifacts/qa`. Tokyo browser emulation retained Tehran dates/times. Safari verified login, Persian task creation and the weekly agenda. These checks do not claim real-device mobile keyboard coverage or real deployment. Keep all test credentials and dumps ignored; never seed the owner's database.

Use the full Docker stack at http://localhost:8080 for the durable local run. Host app process IDs are ephemeral; check health before claiming they run. The actual owner is provisioned; credentials are in the private local file described above. Three real music schedules now recur weekly from the user-confirmed 2026-11-09 without an end date. Existing work is Saturday–Wednesday 08:00–13:00 from 2026-11-09; actual-work acceptance and server/backup details remain pending.

## Current implementation safeguards

- `apps/api/src/time` owns IANA time conversion (Temporal compatible DST disambiguation), bounded recurrence, stable identities, half-open overlaps and occupied-time union. Tests run under alternate host timezones; this does not replace browser-timezone QA.
- All domain writes use the owner transaction lock in `domain/mutations.ts`. Version and idempotency checks run inside the lock; replay is checked before stale versions. Conflict confirmations bind the mutation and current schedule revision. Never bypass this path from a new controller.
- Runtime input schemas are generated from OpenAPI into `apps/api/src/http/contract-schemas.json`; `pnpm contracts:generate/check` keeps both runtime schemas and DTO declarations synchronized. Mark route implementation status only after actual verification.
- `pnpm test:database`, `pnpm test:auth`, and domain tests create uniquely named disposable PostgreSQL databases and clean up only those databases. Never run fixtures against the real Sarvin database. Test startup uses abortOnError=false so cleanup can execute.
- Local HTTP requires COOKIE_SECURE=false plus ALLOW_INSECURE_LOCAL_HTTP=true and only localhost origins. `.env.example` contains an intentionally rejected SESSION_SECRET placeholder; generate a random secret before startup. Existing local ignored env files were configured with random secrets without printing them.

## UI and operational follow-up rules

- Shared editor state survives an expired session; clear private query caches and reauthenticate without silently discarding the draft. Writes use version preconditions and stable idempotency keys. Do not automatically retry non-idempotent mutations.
- Scope every recurring edit explicitly: one occurrence uses an exception/snapshot; future scope splits the series and preserves past/completed/overridden history. Never drag fixed work/classes.
- Actual reading is independent of planned calendar time. Allocate duration across Tehran week boundaries; pages/sessions belong to the start week.
- Production uses `compose.production.yaml`; only Caddy publishes ports, database network is internal, and Secure cookies are mandatory. Local Docker Desktop needs a non-internal database network for its loopback published port.
- `scripts/ops/check-production.mjs` validates resolved Compose configuration without printing secrets. Run with `COMPOSE_FILE` and `COMPOSE_ENV_FILES` selecting the intended production config. Passing a synthetic config does not verify real DNS/HTTPS.
- Backups and QA credentials stay ignored/mode 600. Never run production fixtures, expose raw dumps, rewrite applied migrations, or use `down -v` as a fix.
- Update the QA report, handoff and task checklist together. Input-dependent real-server and real-class tasks stay unchecked; label verified task completion **Done**. Preserve the supplied ZIP and mirror the canonical Markdown to its original Desktop path when available.

Final checkpoint: **181/210 tasks Done; 29 open**, grouped in `docs/implementation/handoff.md`. On 2026-11-08 the user said to continue **without browser control for now**; respect that deferral. The disposable QA server/database/credential file were cleaned up; restarting QA must create a new isolated database. Docker and host production builds were left running, but verify health on the next turn.

The originally supplied Desktop handoff path was no longer present at the final checkpoint (the Desktop files were changing during the session). Final checklist changes are saved in the repository; do not recreate or overwrite a moved user document blindly.

## Domainless server deployment follow-up

On 2026-11-09 the user supplied `ssh echoa`, requested no domain for now and explicitly chose a fresh database with no local data transfer. Use `compose.tunnel.yaml` for localhost-only SSH access at port 18080, with independent secrets and server-architecture release images. This is a separate private access mode; never weaken the public HTTPS override or expose the tunnel HTTP port publicly. `scripts/ops/check-tunnel.mjs` validates its binding/origin/isolation configuration without printing secrets. Preserve existing Nginx/Echoa services. See the deployment runbook/QA report for release state. VPN routing prevented SSH until disconnected. Public HTTPS and scheduled off-server backup requirements remain open.

Private echoa release `20261109-101631-c81a785606b2` is healthy under `/opt/sarvin-planner/current`; `/opt/sarvin-planner/manage` wraps its explicit tunnel config. A separate server owner was provisioned through the masked CLI; private credentials are in ignored mode-600 `.local/echoa-owner-login.json`. Do not re-provision/reset it. No local business data was transferred. Daily on-server backup at 03:30 Tehran and one downloaded backup restore passed; automated off-server storage/retention remains pending. Never confuse the remote tunnel URL at localhost:18080 with local Docker at localhost:8080.

## Public HTTPS promotion — 2026-11-09

The user subsequently requested public access. Current URL: **https://87.107.160.160:8443**, using the existing valid Let's Encrypt IP certificate through a dedicated host Nginx listener. Existing Nginx 80/443 virtual hosts are unchanged. `compose.public-proxy.yaml` follows base+tunnel configs, forces Secure cookies, disables insecure-local mode and permits only the public HTTPS origin. Caddy stays on server loopback 18080 and trusts only the host edge gateway via `infra/caddy/Caddyfile.nginx`. `/opt/sarvin-planner/manage` and the backup service now use mode-600 `shared/.env.server` plus the public overlay. Do not run the private-only wrapper/settings under an enabled public listener. The owner, password, DB and images were preserved; local private credential record URL was updated. SSH forwarding was cancelled because it is no longer needed. SP-19-06 is Done; detailed verification and remaining checks are in the QA report.

## CI/CD follow-up — 2026-11-09

`.github/workflows/ci-cd.yml` verifies pushes/PRs and deploys successful main/master
pushes to public echoa. See `docs/implementation/ci-cd.md`. Both branches share the
same deployment/database. Never expose deployment secrets to PR jobs. The runner
uses disposable PostgreSQL; production must never receive fixtures or provisioning.
Host-managed Compose/backup files live under `shared/runtime`; `manage` reads the
current release's `images.env`. Application releases do not execute repository
shell scripts as root. Gateway changes require administrator review/installation.
No-migration failures can roll back images; attempted schema changes require forward
repair and must never trigger automatic data restore. Preserve current/previous
images, all backups and unrelated Echoa services. Twelve deployment boundary/recovery
tests passed; actual workflow verification is recorded in QA and handoff.

Deployment uses the dedicated non-root echoa runner because GitHub-hosted SSH
connections timed out. Only its deploy job may use the server runner: preserve
the host-owned pre-job guard and all-external-contributor approval setting.
GitHub build/tests stay hosted. The dedicated SSH key accepts loopback only.
First complete Actions deployment 42582507446, public smoke and owner-session
continuity passed. Runner maintenance and artifact retry behavior are documented
in the CI/CD runbook; production failure injection was not performed.

## Public server schedule update — 2026-11-09

User confirmed university/work changes effective today, 2026-11-09, and requested
the three music schedules on the server too. Public server work is now
Saturday–Tuesday 08:00–13:00; Wednesday work is removed. Tuesday work has priority,
so Simulation is not registered. Wednesday 13:30 uses Human Factors, not Decision
Making. Five university and three music fixed weekly series are persisted with no
end date (none supplied); exact titles/times are in the handoff. Authenticated
three-week readback verified 24 class and 12 work occurrences, no duplicates or
overlaps. Local Docker data is separate and unchanged. Do not re-create these
server rules; inspect existing records before future edits.

Login icon/text and calendar card border refinements were deployed in `bbfb887`
through successful Actions run 42586421851. Public smoke, served assets, session
continuity and post-deployment class/work schedule readback passed. Concurrent
uncommitted calendar day-background styling was not part of that release.

## PWA follow-up — 2026-11-09

Source now includes a Persian install manifest, derived install icons and settings
install guidance. The production-only service worker caches only the static public
`/offline.html`; never add API, authenticated HTML, RSC or mutation caching without
an explicit offline-data design. Bump its cache version when changing the fallback.
Do not force activation/reloads that discard editor drafts. The original logo is
unchanged. `scripts/pwa-smoke.mjs` checks a built web instance's metadata/assets and
worker headers. Local build/HTTP checks and 9 web tests passed. PWA commit
`ded2685` is live via successful Actions run `42589608690`; public PWA/general
smoke, exact served assets and pre-release session continuity passed. Actual
device installation remains pending. No domain is required when
the IP address has trusted HTTPS. Browser control remains deferred.

## Personal UI voice — 2026-11-09

The user explicitly says this app is exclusively for Sarvin, who studies industrial
engineering, loves Iranian music and plays tar and setar. Address her warmly and
respectfully as «سروین جان» or «سروینِ عزیز» in welcoming/supportive copy. Keep action
labels and error/confirmation semantics clear. Use subtle Iranian instrument
artwork and warm paper/wood tones alongside the existing green; preserve the
approved logo. Shared art/welcome lives in `sarvin-welcome.tsx`; presentation-only
styles live in `personalization.css`. Avoid generic productivity pressure, invented
quotes, fake progress or adding personal schedules without explicit input.

Personal UI commit `4aae047` is publicly deployed via successful Actions run
`42593323279`; served-copy/style, API/PWA smoke and session-continuity checks passed.
Full browser visual acceptance remains deferred.
