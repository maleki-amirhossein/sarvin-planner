# Sarvin planner — implementation handoff

Checkpoint: 2026-11-09. Working-tree implementation, package version `0.0.0`; no new Git release tag or commit was created. **181 of 210 checklist tasks are Done; 29 remain open.** Features are implemented; acceptance is incomplete. The user explicitly requested continuing without browser control after the final browser tools became unreliable.

**Features implemented; three real weekly music schedules saved and API-verified.** A separate server instance is public at **https://87.107.160.160:8443**, with trusted IP TLS and Secure cookies. No SSH tunnel is needed.

Latest runtime verification: 2026-11-09 — Docker Desktop restarted, Compose startup completed and localhost:8080 smoke passed. Browser control remains deferred. Music schedule entry was subsequently verified through the API (SP-14-INPUT Done).

## Running app and first use

- Docker/Caddy: http://localhost:8080 — API/web/database healthy; updated images and four migrations applied. Same-origin health, login page, logo and anonymous-access smoke checks passed.
- Host production builds also run at http://localhost:3000 with Nest at localhost:3001. Host processes are session-lived; use `pnpm dev` or README production commands after they stop. Docker has restart policies.
- The real owner `malekii.dev@gmail.com` was created on 2026-11-09 at the user's request through the masked administrative CLI. A strong generated password is saved in an ignored mode-600 `.local/owner-login-*.txt` file. Login and authenticated account access were verified through localhost:8080, then the verification session was logged out.
- Account setup itself created no business records. On 2026-11-09 the existing work rule was observed as Saturday–Wednesday 08:00–13:00, effective 2026-11-09; it was left unchanged. The three music schedules below were entered at the user’s request. Set a reading target if desired.
- Initial provisioning is complete; do not run the owner-create command again. Password recovery remains available through the documented explicit `--recover` command when requested. Keep the login file private and move the password to a password manager.

## Actual music schedules — 2026-11-09

All recur every week in Asia/Tehran from the user-confirmed 1405-08-18 (2026-11-09), without an end date.

| Day | Title | Time |
|---|---|---|
| Monday | کلاس موسیقی | 17:30–18:40 |
| Thursday | گروه‌نوازی | 13:10–15:00 |
| Saturday | کارگاه موسیقی | 18:30–22:30 |

Authenticated API readback verified three persisted rules and nine occurrences over three weeks, no occurrences before the start, correct Tehran weekdays/times and locked drag/resize/completion. Preview and authoritative creates returned no conflicts. No browser control was used.

## Delivered implementation

Persian RTL responsive app with the original PNG, Jalali date input/navigation, Tehran time and Saturday weeks. Today/week/tasks/reading/review/settings routes use the real API. Shared forms support quick capture, scheduling, recurrence scopes, fixed classes/work and exceptions, actual reading, books/topics and goals. Conflict confirmation, version checks, idempotency, private cache clearing, expiry recovery and request timeouts are implemented. The backend owns recurrence, occupied-time calculations, reading attribution, authorization and database access.

The Nest API includes opaque PostgreSQL sessions, secure cookie configuration, CSRF/origin enforcement, rate limiting, one-owner provisioning/recovery, 50 documented operations and 61 contract schemas. Four SQL migrations include ownership, uniqueness and interval constraints. No public registration or client database access exists.

Deployment preparation includes non-root images, Compose health dependencies and persistent volumes, Caddy API routing, a production-only network/port override, configuration validation, private backups, populated restore testing, optional encrypted restic retention, a scheduling template and a rollback runbook. These do not substitute for real-host checks.

## Verification

Passed with locked dependencies:

- Web/API production builds, TypeScript, ESLint, 12 unit tests and OpenAPI synchronization.
- Auth HTTP and trusted HTTPS-proxy suites: rotation, expiry/revocation, cookies, CSRF/origin, recovery/password change and rate limits.
- Four real-HTTP domain suites: tasks, recurrence/exceptions, concurrency and reading/goals/export; actual responses validated against OpenAPI.
- Fresh/repeat migrations, database invariants and current migration status.
- Docker builds/startup and smoke checks at both localhost:3000 and localhost:8080.
- A populated disposable backup restored with four migrations, one test owner, four tasks and two reading sessions; cleanup left zero test databases.
- Production configuration accepted synthetic HTTPS values and rejected an unsafe secret. Public HTTPS remains untested; private echoa deployment is verified below.

Observed browser evidence includes Chromium conflict scheduling, ordinary in-grid drag/resize, locked work, completion, 90/150 reading progress, mobile agenda, offline draft retry, expired-session draft recovery, Tokyo browser timezone, fixed occurrence-only changes, alternating-class preview/conflict confirmation and goal editing. Safari covered login, Persian task creation, reload and weekly agenda. See [QA report](qa-report.md) for exact scope and limitations.

## Remaining 29 checklist items

| Group | Open tasks | Required next action |
|---|---|---|
| Browser acceptance — 19 | SP-11-05/06/07/GATE; SP-12-05/GATE; SP-13-04/09/GATE; SP-16-GATE; SP-17-02/03/04/07/GATE; SP-18-10/12/13/GATE | Resume native-browser checks when available: external inbox drop, offline move rollback, dense/midnight layouts, mobile day/back navigation, keyboard traps/zoom/mobile keyboard, full task scenario on both layouts, review/export UI, stale multi-tab recovery, broader WebKit and final captures. |
| Actual personal setup — 1 | SP-14-GATE | Owner and real music class entry are complete. Existing work rule is Saturday–Wednesday 08:00–13:00 from 2026-11-09; complete remaining actual-work acceptance. Test fixture work/classes already passed their recorded checks. |
| Actual deployment — 7 | SP-19-01/04/08/09/10/12/GATE | Private echoa deployment, port isolation, fresh owner, container restart/session persistence and one downloaded backup restore passed. Public IP HTTPS, Secure cookies and authenticated API checks now pass. Complete real-domain routing only if a domain is supplied, and finish off-server backup/retention, reboot, browser and monitoring acceptance. |
| Final handoff acceptance — 2 | SP-20-04/GATE | Replace checkpoint captures with final verified captures and close the report/project only after the required acceptance/input-dependent work passes. |

External inbox dragging remains specifically unverified: the earlier browser gesture did not give a reliable result. The implementation now uses FullCalendar's documented drop callback and a single versioned API write; it builds but requires a real drag acceptance check. Form-based scheduling is available. No unsupported Done label was added for that integration.

## Screenshot evidence

Actual captures, not mockups, are under `artifacts/qa`. They precede the last small ordering/time-label/drag changes; final recapture stays open.

- [Desktop week 1280](../../artifacts/qa/sarvin-qa-desktop-week-1280.png)
- [Desktop week 1440](../../artifacts/qa/sarvin-qa-desktop-week-1440.png)
- [Mobile today 390](../../artifacts/qa/sarvin-qa-mobile-today-390.png)
- [Mobile week 390](../../artifacts/qa/mobile-week-390.png)
- [Reading](../../artifacts/qa/sarvin-qa-reading-1440.png)
- [Task form 360/offline feedback](../../artifacts/qa/sarvin-qa-task-form-360.png)

Reference comparison is recorded in the QA report. Desktop preserves right navigation, central Saturday-first grid and left details; mobile uses seven day cards and safe-area-aware bottom navigation. No real-device mobile keyboard check is claimed.

## Documentation and safe continuation

[README](../../README.md) contains runnable setup/build/test/owner commands. [AGENTS.md](../../AGENTS.md) records architecture and invariants. [Persian guide](../user-guide-fa.md), [deployment runbook](deployment.md), [security contract](security.md), [domain contracts](domain-contracts.md) and [canonical checklist](Sarvin-Planner-Implementation-Plan-EN.md) are maintained together. The repository checklist is canonical. At the final checkpoint the supplied Desktop folder/path was no longer available, so the final mirror could not be written; no moved/deleted user file was recreated or overwritten. The original ZIP was not modified.

Keep all secrets, backups and QA credentials out of Git/public assets. Do not reset the real database, delete volumes, edit applied migrations or seed fixtures there. Resume browser QA with a fresh disposable database using the README command. Browser control is deferred by the user; do not resume it until that preference changes.

## Dashboard styling follow-up — 2026-11-09

The weekly dashboard and shared shell have been refreshed from the supplied visual reference and are served by the healthy Docker web service at http://localhost:8080/week. Changes include the botanical welcome banner, real API summaries, refined calendar/today treatment, reading/priorities cards and responsive detail rail. See the design-system notes and QA report. Host/Docker production builds, web types, repository lint, five date tests, HTTP smoke and served-asset checks passed. Browser visual/interaction verification remains deferred, and the existing captures predate this design. The current 179/210 task count and outstanding acceptance Gates are unchanged. Existing concurrent music-schedule documentation was preserved.

## Private server instance — 2026-11-09

Release `20261109-101631-c81a785606b2` is healthy on `echoa` under `/opt/sarvin-planner/current`; use `/opt/sarvin-planner/manage` for Compose operations. The owner explicitly requested a fresh server database: local work/music schedules were **not transferred**. A separate server owner is provisioned; credentials are in ignored mode-600 `.local/echoa-owner-login.json`. Do not rerun provisioning or recovery without a new request. Sign in and choose the server instance's work effective date.

Access is private via `ssh -N -L 127.0.0.1:18080:127.0.0.1:18080 echoa`, then http://localhost:18080. A tunnel was left connected for this session; reconnect it if the network/computer restarts. Local Docker remains separate at port 8080. Public HTTPS is not configured. Existing Nginx and Echoa containers were preserved.

Verified real login/logout, CSRF/Origin, empty onboarding/data, all four migrations, health/smoke and authenticated session survival across Sarvin container/database restart. Daily on-server backup runs at 03:30 Tehran. The initial off-server copy was downloaded privately and restored successfully in a temporary local database. Automated off-server backup, retention, notifications, server reboot, domain/TLS and browser checks remain open. Disk has approximately 4.3 GiB free; no unrelated cleanup was performed. Detailed evidence is in the QA report. SP-19-05 is Done; current checklist is 180/210.

## Public access follow-up — 2026-11-09

The private instance above was promoted, preserving the existing owner/password and database, to **https://87.107.160.160:8443** at the user's request. The existing IP certificate is trusted by normal curl/Node HTTPS verification; Nginx exposes a new TLS-only listener while existing 80/443 virtual-host files retain their hashes. Caddy remains internal and forwards validated proxy headers. API now issues `__Host-sarvin.sid` with Secure/HttpOnly/SameSite=Lax and rejects the former localhost HTTP Origin. Public smoke, login/private API access, CSRF/Origin checks, API restart/session persistence and logout passed. The old SSH forwarding was cancelled. Backup service was updated to public config and ran successfully. See QA for renewal-test status. SP-19-06 is Done; checklist is 181/210 with 29 open.

## CI/CD follow-up — 2026-11-09

Automatic main/master deployment is configured; details and recovery instructions
are in [CI/CD operations](ci-cd.md). Host gateway, dedicated restricted SSH key and
GitHub production environment are installed. Local boundary/recovery checks and
the existing backup service passed. [Production run 42582507446](https://github.com/maleki-amirhossein/sarvin-planner/actions/runs/42582507446)
completed successfully; public HTTPS, owner session continuity and unchanged task
data were verified afterward. The canonical 181/210 checklist is unchanged.

The deploy job runs on dedicated non-root `echoa-sarvin-deploy`; only verification
and builds use hosted runners. The server initiates its GitHub connection to avoid
the hosted-runner SSH timeout. The root-owned hook rejects PR/other-branch jobs,
and all external PR workflows require approval. Keep the runner binary maintained
as described in the CI/CD runbook; auto-update is disabled for its protected host
installation. No additional account provisioning is necessary.

## Login UI adjustment — 2026-11-09

**Done (source change):** password visibility icon moved to the right; explanatory sentence below the login button removed. Web typecheck and targeted ESLint passed. Changes are local and not deployed; browser verification remains deferred. Original checklist count remains 181/210.

## Calendar card border adjustment — 2026-11-09

**Done (source change):** removed the right-side accent border from shared calendar event cards. CSS formatting and diff checks passed. Changes remain local; browser verification and deployment are not claimed. Original checklist count remains 181/210.

## Current public-server schedule — 2026-11-09

**Done (real API persistence):** user confirmed changes from today, 2026-11-09. Work is now Saturday–Tuesday 08:00–13:00; Wednesday work is removed from this date forward. Tuesday work takes priority, so Simulation 08:00–10:30 was not registered. Human Factors was selected instead of Decision Making for Wednesday 13:30–16:00. The following eight fixed class series are weekly from 2026-11-09, without a term end (none supplied):

| Class | Day | Tehran time |
|---|---|---|
| طرح‌ریزی واحدهای صنعتی | Sunday | 13:30–16:00 |
| دانش خانواده و جمعیت | Tuesday | 13:30–15:10 |
| برنامه‌ریزی و مدیریت پروژه | Wednesday | 08:00–10:30 |
| سیستم‌های اطلاعات مدیریت | Wednesday | 10:30–12:00 |
| مهندسی عوامل انسانی | Wednesday | 13:30–16:00 |
| کلاس موسیقی | Monday | 17:30–18:40 |
| گروه‌نوازی | Thursday | 13:10–15:00 |
| کارگاه موسیقی | Saturday | 18:30–22:30 |

All were created on the public server through authenticated domain APIs, not transferred from the local database. Three-week readback verified 24 class and 12 work occurrences, fixed restrictions, correct dates/times, no duplicates/overlaps and no Wednesday work. See QA for evidence. Existing local schedules are separate and unchanged; original 181/210 acceptance checklist remains unchanged.

**Done (UI deployment):** login refinements and calendar card border removal are live in `bbfb887`, successful [run 42586421851](https://github.com/maleki-amirhossein/sarvin-planner/actions/runs/42586421851). HTTPS smoke, served assets, pre-existing session continuity and post-deployment schedule readback passed. This supersedes the earlier local-only status for those two changes. Concurrent calendar day-background edits remain outside this release.

## Calendar day backgrounds — 2026-11-09

**Done (source change):** set shared calendar day headers and time-grid lanes to solid white, including today, replacing the green today gradient. The date badge and event colors remain available for identification. CSS formatting and diff checks passed. Browser control remains deferred; no visual verification or deployment claimed. Original checklist remains 181/210.


## PWA installation follow-up — 2026-11-09

**Done (source and local HTTP verification):** added a Persian RTL manifest with
stable origin-relative identity/scope, standalone launch at `/today`, theme/Apple
metadata, 192/512px and maskable PNG icons derived from the unchanged approved logo,
and a settings installation button with Safari/manual browser instructions. The
root provider captures installation events across client navigation. The production
service worker caches only `/offline.html`; API requests, writes, RSC and external
requests pass through. Online documents are fetched without being stored. Updates
wait for existing tabs to close; no forced reload or draft loss is introduced.

Verification: web production build, typecheck, targeted ESLint, diff checks and all
9 web tests passed (4 new PWA tests cover icon dimensions, cache isolation/cleanup,
fresh online navigation, offline fallback and request bypass).
`WEB_URL=http://127.0.0.1:3105 node scripts/pwa-smoke.mjs` passed on a temporary
production web process: manifest link/content, all four PNG dimensions, worker MIME
and no-store headers, and Persian offline page. Full same-origin smoke initially
failed because the configured host API upstream was unavailable (readiness 500).
Separate web/API smoke passed with `API_URL=http://localhost:8080`; this is not a
claim of host proxy verification. Public HTTPS readiness returned 200 before edits.

No deployment or real-device installation is claimed. Browser control remains
deferred; Android/iOS standalone installation and browser-managed worker lifecycle
remain unchecked. Original checklist remains 181/210; this user-requested follow-up
is tracked separately. Concurrent task/category/calendar edits were preserved.
Desktop mirror remains unavailable; no moved document was recreated.


## PWA public release — 2026-11-09

**Done (deployment and public HTTP acceptance):** PWA commit `ded2685` is live at
https://87.107.160.160:8443 through successful [Actions run 42589608690](https://github.com/maleki-amirhossein/sarvin-planner/actions/runs/42589608690).
Release receipt reports `deployed` for sequence 6/1; API, web and PostgreSQL are
healthy. The existing on-server release backup was created by the deployment
pipeline. This PWA release contains no database migration or owner provisioning.

The exact committed source was independently checked in an isolated worktree:
frozen installation, contracts, full lint, web types, 9 web tests and production
web build passed. Actions then passed the full application/database/auth/domain
and deployment-boundary verification and built the release images.

Public `scripts/pwa-smoke.mjs` and `pnpm smoke` passed over trusted HTTPS without
disabling certificate verification. Checks cover manifest/link/theme/Apple metadata,
all four PNG dimensions, worker JavaScript MIME/no-store headers, Persian offline
fallback, login/RTL, API/database readiness and anonymous private-route denial.
SHA-256 comparison verified all six public PWA files match the committed assets;
served settings bundles contain the install UI and production worker registration.
An authenticated session established before rollout still worked afterward; its
Secure/HttpOnly cookie flags were verified, and the temporary verification session
was logged out and its mode-600 local cookie file removed. No business records
were created/edited. Concurrent task/category/calendar changes were excluded.

SP-PWA-02 is **Done**. SP-PWA-03 remains unchecked: no real Android/iOS installation
or browser-controlled offline/update test is claimed; browser control remains
deferred. This supersedes the earlier pending-publication note. Original checklist
remains 181/210; the separate PWA checklist is 2/3 Done. Desktop mirror unavailable.


## Sarvin personal UI — 2026-11-09

**Done (source/build verification):** the user identified Sarvin as the sole intended
recipient, an industrial-engineering student who loves Iranian music and plays tar
and setar, and requested affectionate, respectful address. Reworked login, today,
week, reading, tasks, review, settings, onboarding and empty-state copy around
«سروین جان» / «سروینِ عزیز». Added shared code-native tar/setar artwork, warm paper/wood
colors alongside the existing green, dedicated day/week welcome panels and a
personal sidebar note. Kept the approved logo, Persian/RTL dates, explicit action
labels and all domain/authentication behavior. Personalization CSS is separate from
the concurrently edited calendar CSS. The sidebar can scroll on short screens.

Web typecheck, production build, 9 existing web tests, targeted ESLint, formatting
and diff checks passed. The decorative SVG was rendered to PNG and visually
inspected; this is not browser/page-layout verification. No browser control was
used under the existing deferral, so mobile/desktop visual acceptance remains open.
Concurrent task cancellation, music-category migration/API edits and calendar-grid
changes are outside this release scope. Original 181/210 checklist unchanged.
