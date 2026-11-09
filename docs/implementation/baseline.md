# STEP-00 baseline — 2026-11-08

Repository: `/Users/amirhossin/project/sarvin-planner`. Branch: `main`, with no initial commit. Existing foundation files were untracked at inspection. No existing user files were deleted or reset and no commit was created.

Canonical checklist: `docs/implementation/Sarvin-Planner-Implementation-Plan-EN.md`. The original Desktop Markdown is mirrored at checkpoints; the supplied ZIP is preserved. Four reference PNGs retain their relative `sarvin-planner-assets/` paths. Reference sample activities and counters are not real user data.

## Installed baseline

Node 24.3.0; pnpm 10.34.9; Next.js 16.4.5; React 19.3.1; TypeScript 5.9.3; NestJS 12.4.0; Prisma 7.10.1; Tailwind 4.3.5; TanStack Query 5.107.1; FullCalendar 7.1.4; date-fns-jalali 4.4.0-0. The workspace has `apps/web` and `apps/api`, with a committed-format pnpm lockfile (currently untracked because no initial commit exists).

## Observed verification

- `pnpm build`: web and API passed; the web has only `/` and the not-found route.
- `pnpm typecheck`: both applications passed.
- `pnpm test`: all three Jalali date tests passed.
- `docker compose ps`: database, API, and web healthy; Caddy running.
- `WEB_URL=http://localhost:8080 pnpm smoke`: web response, Persian/RTL markup, proxied health and database query passed.
- `pnpm db:status`: initial migration applied, no pending migrations.
- `pnpm --filter @sarvin/api exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code`: no difference.
- No lint script/config existed. Added root ESLint configuration for TypeScript, Next.js accessibility/hooks rules, and Node scripts. `pnpm lint` then passed with zero warnings; the anonymous PostCSS export warning was fixed.

## Environment review

Root `.env` controls Compose; API `.env` supplies runtime/Prisma credentials; web `.env.local` contains the server-only proxy destination. Example database values are public local-development placeholders, never production credentials. Real env files and generated/build artifacts are ignored. No application source references `NEXT_PUBLIC_*`, a database URL in web code, or browser-stored authentication tokens. No secret values were copied into this report.

## Known limits and continuation

Only the initial infrastructure and logo/status shell exist. There is no account, session implementation, task/reading schema, or business endpoint. Health currently includes a database status field; STEP-04 must replace that with a minimal public response and update the smoke assertion. The logo is already the approved no-checkmark PNG, but favicon and full UI foundations remain STEP-02 work.

Use `docker compose up -d` for existing images and `docker compose up --build -d` after changes. Local development remains `pnpm db:up`, `pnpm db:deploy`, `pnpm dev`. Preserve the existing database volume. Complete contracts in STEP-01 before implementing domain tables or application screens.
