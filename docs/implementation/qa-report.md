# Verification record — 2026-11-08

## Isolation and scope

Automated acceptance creates and drops uniquely named disposable PostgreSQL databases. The browser QA server (`apps/api/test/qa-server.mjs`) also creates a separate `sarvin_browser_test_*` database, serves through localhost:3100, and stores temporary credentials only in an ignored mode-600 file. `QA_FIXTURES=1` enables explicitly labeled browser fixtures in that database only. The actual owner database has no sample tasks, books, classes, goals or account.

## Completed automated checks

- Both production apps build; strict TypeScript checks and ESLint pass at the current checkpoint.
- OpenAPI generates runtime validation, browser route mapping and TypeScript DTOs. 50 operations and 61 schemas. The HTTP acceptance harness validates actual responses against the contract.
- Fresh migrations, repeat migration deployment, singleton-owner constraints, account recovery, and idempotent default work bootstrap pass.
- Authentication passes in explicit local HTTP and simulated trusted HTTPS-proxy configurations: session rotation, PostgreSQL persistence, expiry, CSRF/origin rejection, logout/revoke, password change and rate limiting.
- Task CRUD, occurrence scheduling, conflicts, informed confirmation, stale writes, independent recurring completion, preserved overrides/history, series splits/deletion, alternating-week anchors, distant symbolic conflicts and concurrency pass.
- Recurring unscheduled occurrences can be listed and edited independently through the paginated occurrence endpoint; ownership and anonymous access are checked.
- Actual reading checks include 150-minute goal → 30 + 60 = 90 minutes, 60%, 60 remaining; deletion leaves 60. Page/session goals, overachievement, cross-week duration attribution, future defaults, preserved reading history, and secret-free export pass.
- Weekly schedule sample: 32 ms, 3,843 bytes for five fixed work events on the local test database. This is a small local fixture, not a production capacity claim.
- Jalali unit tests include Nowruz, month ends, Tehran midnight and Saturday boundaries. Alternate host timezone tests pass; the later Tokyo browser check is recorded below.
- Local Docker build and Caddy smoke checks passed after integrating the real app. Migration container exits successfully; API/web/database health checks pass.
- A custom-format backup of the current owner database restored successfully into a temporary database and was cleaned up. It contained four migrations and no owner/tasks/reading sessions. A later populated local restore is recorded below; off-server restore remains required before deployment acceptance.

## Observed Chromium workflows

Using native Chrome through the computer-use tool against the isolated QA server:

1. Persian RTL login renders with the approved logo; authentication opens onboarding.
2. Jalali picker selected Saturday 16 Aban 1405 (2026-11-07). Onboarding produced exactly five 08:00–13:00 work blocks, none Thursday/Friday.
3. Title-only Persian quick capture appeared in the inbox. Scheduling at 12:30–13:30 showed the work title/time conflict; explicit confirmation persisted the overlap. Occupied duration was 330 minutes, not a double-counted 360.
4. Completion changed the day counter to 1/1 while reading remained separate.
5. Actual 30- and 60-minute sessions displayed 90/150, progress 60%, and 60 minutes remaining.
6. Mobile-style weekly agenda showed all seven days, correct counts, locks on work, empty Thursday/Friday and selected-week reading progress.
7. Expanded desktop view showed right sidebar, central Saturday–Friday grid and left day panel. A task dragged to Monday 13:00–14:00 saved successfully at the work boundary. Resizing extended it to 14:30. Work stayed 08:00–13:00 and opened its explicit form instead of moving.
8. Empty-interval selection opened a prefilled task form. Calendar scrolling exposed later hours. Long task text remained accessible in the day panel/form.

## Issues found and fixed during verification

- Added a paginated occurrence endpoint and inbox selector so a deliberately unscheduled recurring occurrence does not become inaccessible.
- Added missing complete/reopen and delete actions to the shared task editor.
- Fixed single fixed-occurrence edits to use exception operations, including editing an existing exception and moving its replacement date. Future rule editing remains separate.
- Added explicit focus restoration for programmatically opened Radix dialogs, Persian field feedback, and a synchronous duplicate-submit lock.
- Disabled login submission until hydration, preventing native form fallback during startup.
- Added the shared DTO file to both Docker build contexts.
- Kept the database network internal only in the production override: Docker Desktop did not expose the host-development database port while that network was internal.
- The user's Grammarly extension caused an attribute-only hydration warning in the development browser. Production rendering and interaction were tested separately. No application warning was suppressed to hide this.

## Final verification checkpoint

- Locked install succeeded; final web/API builds, full typecheck, lint, all 12 time/Jalali unit tests, contract generation checks, auth HTTP/HTTPS-proxy suites, four domain suites, fresh/repeat database migration checks and migration status passed. Four migrations are applied. The earlier pg concurrent-query warning was removed by making reads sequential within interactive transactions.
- A populated **disposable QA** backup restored into a new generated database: four migrations, one test owner, four test tasks and two reading sessions. The restore script removed only its temporary database. The dump remains private/ignored. Off-server upload/download verification is still pending a destination.
- Production Compose validator accepted a synthetic HTTPS configuration and rejected a placeholder secret, without printing secrets or creating deployment configuration. This is configuration testing, not a real deployment.
- Approved public logo is byte-for-byte identical to the supplied Desktop PNG. No public/demo seeds, notification placeholders or extra business APIs were added to Next.
- Client requests now time out after 15 seconds, retain form values on failure, and provide Persian feedback. A stale-version response offers explicit fresh-data loading; reloading warns before discarding a draft.

### Additional browser evidence

9. Expired only the QA database sessions while a Persian task draft was open. Saving showed the session-expired login. Reauthentication restored the exact title; retry saved it into the inbox once.
10. DevTools Offline mode made task save fail with a Persian message and retained title. After restoring networking, retry saved the task. No false success appeared.
11. Inspected 360×844 task form, 390×844 today/week, 430×844 reading, 844×430 landscape and 1280/1440 desktop week. Bottom navigation remained separate from scrolling content; forms scroll inside their viewport. These are desktop browser emulations, not real mobile keyboard/safe-area certification.
12. Chrome Sensors set `Asia/Tokyo`/`ja-JP`, then reloaded the app. Jalali week remained 16–22 Aban, fixed work remained 08:00–13:00, and actual reading retained Tehran 13:30/14:30. Restored No override afterward.
13. Native Safari/WebKit logged in, saved a Persian/English task, loaded persisted data after reload, and rendered seven weekly agenda cards with five workdays and empty Thursday/Friday. Password-save prompt was declined. Real iPhone/Android browser testing was not performed.
14. Weekly goal changed from 150 to 180 using the real UI: 90 actual minutes became 50% with 90 remaining. Focus returned to the goal-edit trigger on save. Empty task dialog accepted Tab/Escape and returned to the main content fallback.
15. Fixed work's explicit “this occurrence” form changed Sunday to 09:00–13:00 with a test title; the other four workdays stayed 08:00–13:00. Recurrence/location/term fields are hidden for occurrence-only scope; an existing exception retains its original identity.
16. A test class used explicit Saturday anchor, alternating parity and term end. Backend preview returned 30 Aban and 14 Azar. Save listed the work conflict and its hours; explicit confirmation persisted the test class. This class exists only in the disposable QA database.

### Screenshots and reference comparison

Actual browser captures are in `artifacts/qa`:

- `sarvin-qa-desktop-week-1280.png` and `sarvin-qa-desktop-week-1440.png`
- `sarvin-qa-mobile-today-390.png`
- `mobile-week-390.png`
- `sarvin-qa-reading-1440.png`
- `sarvin-qa-task-form-360.png`

The desktop reference's right navigation, central Saturday-first grid, left details, teal/amber/lavender colors and warm card surfaces are present. Mobile week uses seven vertical cards rather than shrinking the grid. Approved branding replaces the reference's illustrative brand. Test content differs intentionally; the real database is empty. Review moved reading progress before books on mobile and ahead of the inbox in the desktop week panel, added the selected-day priorities panel, and made calendar time ranges explicit LTR isolates. Captures precede those last small layout fixes; final recapture is still open.

### Remaining acceptance limitations

The native browser tool later reported concurrent user activity, produced unusable transition captures and failed Safari capture with ScreenCaptureKit error -3812; browser host inventory is unavailable. External inbox dragging did not produce a reliable observed result. It now uses FullCalendar's documented `drop` callback with `create:false`, one authoritative API write and explicit duration instead of relying on a temporary received event's end. This integration builds but **needs browser verification**. Ordinary in-grid move/resize were observed earlier.

Still open: external-drop success/rollback; offline move rollback; comprehensive keyboard trap/zoom/mobile-keyboard checks; all filter and reschedule/reopen paths across both layouts; final screenshots after the latest fixes. These limitations keep the relevant checklist tasks and acceptance Gates open. Do not call all 210 tasks complete. See [FullCalendar external dragging](https://fullcalendar.io/docs/external-dragging) for the integration contract.

Final runtime check: updated Docker API/web/database healthy; Caddy and host smoke passed. The real database still has zero owners/tasks/reading sessions. The disposable QA server was stopped, its database dropped and credential file removed; zero test databases remain. User explicitly deferred further browser control.

## Runtime recovery — 2026-11-09

Docker Desktop was stopped after the previous checkpoint. Started it with `docker desktop start`, completed `docker compose up -d`, and waited for startup dependencies. PostgreSQL, API and web reported healthy; the migration job exited successfully and Caddy started. `WEB_URL=http://localhost:8080 pnpm smoke` passed after startup, including database readiness, login/RTL markup, logo delivery and anonymous-access rejection. No volumes were deleted, account provisioned or browser control resumed. Checklist remains 178/210 Done.

## Real owner provisioning — 2026-11-09

At the user's explicit request, checked the local owner table (zero owners), generated a strong random password without displaying it, and supplied it to the existing masked administrative CLI through a private terminal. Creation succeeded. Credentials were saved only to an ignored mode-600 `.local/owner-login-*.txt` file. Verified CSRF-protected login, authenticated `/auth/me`, and logout through localhost:8080. No password, token, cookie or hash was printed. No onboarding work date or business fixtures were created. The real account now exists; historical empty-database statements above describe earlier checkpoints. Checklist remains 178/210 because actual work-date and real deployment Gates remain open.


## Real music schedule entry — 2026-11-09

The user supplied three fixed weekly music commitments and explicitly confirmed an effective date of 1405-08-18 (2026-11-09), with no end date. Docker API/web/database were healthy and `/api/health` returned 200. Used the existing owner credentials privately for CSRF-protected HTTP requests through localhost:8080; no credential/token/cookie was printed, and the verification session was logged out afterward.

- Persisted `class` series: کلاس موسیقی, ISO Monday=1, 17:30–18:40; گروه‌نوازی, Thursday=4, 13:10–15:00; کارگاه موسیقی, Saturday=6, 18:30–22:30. All use Asia/Tehran, everyWeeks=1, effectiveFrom=2026-11-09, effectiveUntil=null, endsNextDay=false, and no parity/anchor.
- Previews returned three occurrences per rule and no conflicts. Each create used an idempotency UUID and passed the backend’s authoritative recurring conflict check without a confirmation override.
- Paginated readback verified exactly one matching persisted rule per title and every submitted recurrence field. Schedule readback for November 7–30 verified Monday November 9/16/23, Thursday November 12/19/26, and Saturday November 14/21/28, with exact Tehran times and no occurrences before November 9. All nine events had editable=false, resizable=false and completionAllowed=false.
- Existing work was observed as Saturday–Wednesday 08:00–13:00 from November 9 and left unchanged. No fixtures were seeded and no source/runtime configuration changed. Browser acceptance remains deferred; this is HTTP persistence/recurrence evidence, not browser evidence.

SP-14-INPUT is **Done**. Checklist is **179/210 Done; 31 open**; SP-14-GATE remains open for remaining actual-work acceptance. The original Desktop Markdown was not found, so only the canonical repository checklist was updated.

## Dashboard reference refresh — 2026-11-09

Implemented the user-requested reference styling on the weekly dashboard and shared shell: botanical mint banner, real-data summary pills, warm surfaces, soft card shadows, right navigation, left detail rail, lavender reading card and decorative book/leaf SVGs. The original logo is unchanged. The calendar uses the installed FullCalendar v7 class hooks for teal today highlighting, category accents, hourly labels and an 08:00 initial scroll; all 24 hours, 15-minute snaps and existing mutation handlers remain available. Mobile keeps the vertical agenda; desktop date navigation remains available while schedule data loads or fails. Summaries use API event counts, API occupied minutes converted to hours and actual reading-goal progress, without sample data.

Verification: host web production build, final web typecheck, repository ESLint, all five existing web date tests and `git diff --check` passed. ESLint now ignores the already-private `.local/` directory, preventing local administrative scratch scripts from entering source lint checks. Docker web production build passed, the web service was recreated healthy, and `WEB_URL=http://localhost:8080 pnpm smoke` passed. An HTTP asset check confirmed `/week` and its served CSS/JS contain the new dashboard/calendar styles. Docker Desktop's credential helper stalled the first public-image lookup; the successful build used a temporary ignored Docker config with no credentials, leaving the user's Docker configuration unchanged.

No browser control, screenshots or visual/interaction acceptance was performed, respecting the user's existing deferral. Earlier screenshots are historical and do not show this refresh. Outstanding browser Gates remain unchecked; this styling follow-up does not change the current 179/210 checklist count. API/domain code and owner data were not modified by this refresh.

## Private echoa deployment — 2026-11-09

The user supplied `ssh echoa`, explicitly chose **no domain for now** and a **fresh database**, and explained that VPN routing prevented SSH. Connection succeeded once VPN was disconnected. Inventory: Ubuntu 24.04, x86_64, 3.8 GiB RAM, Docker 29.1.3, Compose 2.40.3, initially 5.8 GiB free disk. Existing Nginx serves ports 80/443; four existing Echoa containers were healthy. No existing Nginx configuration, containers, databases or volumes were replaced or restarted.

Release `20261109-101631-c81a785606b2` was built locally for linux/amd64 and transferred over SSH, avoiding builds on the constrained server. The 163-file source archive and every source checksum were verified. Both app image manifests, layer hashes, normalized runtime configuration, architecture and non-root user matched the build. The source snapshot includes the latest dashboard and tunnel configuration; later handoff/QA text is operational evidence, not part of that immutable source snapshot. Server layout: `/opt/sarvin-planner/releases/<release>`, `current` symlink, `shared/.env.tunnel` and `manage` wrapper. Secrets are independent random values in mode-600 files. No local owner data was transferred.

`compose.tunnel.yaml` binds only `127.0.0.1:18080`; PostgreSQL/API/web have no published host ports, and the database network is internal. Actual resolved server config passed secret-safe checks. The local validator also rejected synthetic public-proxy binding, published database and non-local origin configurations. The public IP's port 18080 was unreachable from the client. SSH forwards client loopback 18080 to server loopback 18080; the resulting URL is http://localhost:18080. This intentionally uses the existing explicit localhost HTTP cookie mode over SSH, not public HTTP or real HTTPS.

All four migrations applied successfully to the fresh database. Before provisioning, owner count was zero. The administrative masked CLI created a new server owner for the existing owner email; a unique generated password is saved only in ignored mode-600 `.local/echoa-owner-login.json`. No passwords, sessions, CSRF values, hashes or dumps were printed. Authenticated checks confirmed login, session rotation, host-only HttpOnly/SameSite=Lax cookies, rejection of non-local Origin and missing CSRF, empty tasks/schedule and onboarding incomplete. Restarted only Sarvin's database/API/web/proxy; the owner and authenticated session survived, and logout revoked access. No task/class/reading fixtures or work date were created on the server. Browser control remained deferred.

All services are healthy/running, use restart policies and bounded 10 MB × 3 Docker logs. Memory/CPU limits are configured; observed app use was approximately API 84 MiB, web 42 MiB, database 31 MiB and Caddy 11 MiB. Existing Echoa container IDs were unchanged and Nginx remained active. About 4.3 GiB disk remains (89% used): leave unrelated images/data alone and plan storage/backup retention before substantial growth.

Enabled `sarvin-backup.timer` at 03:30 Asia/Tehran daily, with protected on-server dumps. Its first manual service run succeeded. Downloaded that real backup over SSH to ignored mode-600 `.local/backups/echoa`, restored it into a generated disposable local database, verified four migrations/one owner/zero tasks/zero reading sessions, and removed the temporary database. This is one verified off-server recovery copy; automated off-server upload, encrypted repository/retention and failure-notification destination remain pending. No automatic pruning of local backups was installed.

Preflight passed: full build/typecheck/lint, 12 unit tests, OpenAPI sync, disposable database/migration suite, HTTP and simulated HTTPS auth suites, and all four domain HTTP suites. Server tunnel smoke passed before and after restart. No server reboot, public DNS/TLS, certificate issuance/renewal, real HTTPS cookies, external monitoring delivery or browser visual acceptance is claimed. SP-19-05 is **Done**; other partially verified deployment items remain unchecked. Checklist: **180/210 Done; 30 open**. Original Desktop checklist remains unavailable; no moved user file was recreated.

## Public HTTPS access — 2026-11-09

The user explicitly requested public access after the private deployment. Current URL: **https://87.107.160.160:8443**. Inspected the existing Nginx IP virtual host/certificate and found a valid Let's Encrypt IP SAN certificate (issuer YE2, expiry 2026-11-12 23:54:31 UTC), an existing six-hourly certbot timer with jitter and a deploy hook that validates/reloads Nginx. Reused that certificate on a dedicated 8443 listener, preserving the existing 80/443 virtual-host file hashes and services. No domain registration, certificate-key transfer, owner reset or data migration occurred.

Created `compose.public-proxy.yaml`, `infra/caddy/Caddyfile.nginx`, `infra/nginx/sarvin-echoa.conf` and `scripts/ops/check-public-proxy.mjs`. Server operational overlay lives under `/opt/sarvin-planner/shared/public-proxy`; mode-600 `.env.server` preserves the same database/session secrets and app image release while setting the exact public HTTPS origin. Nginx overwrites forwarded Host/protocol/client headers. Caddy trusts only the actual edge host gateway `172.19.0.1`, preserves `/api`, and stays on loopback 18080. Nest's Secure cookies are enabled and the insecure localhost exception is disabled. Database/API/web remain unpublished. Validator accepted actual config and rejected synthetic insecure-cookie, HTTP-origin and public-upstream variants. Nginx/Caddy config validation passed before activation. A protected database backup and rollback config copies were made before switching.

Public verification with normal certificate validation (no TLS bypass): login page HTTP 200; root/login/logo/API health smoke passed; real owner login and session rotation passed; cookie is `__Host-sarvin.sid`, Secure, HttpOnly, SameSite=Lax, Path=/, no Domain attribute. A deliberately spoofed forwarded protocol did not defeat Secure cookies. Private account/settings/tasks/schedule reads passed; old localhost HTTP Origin, public HTTP Origin and missing CSRF were rejected. Restarted only Sarvin API and verified authenticated HTTPS session survival; logout revoked access. Account/password and existing data were preserved; no task/reading fixtures were created. Plain HTTP mistakenly sent to port 8443 redirects 308 to canonical HTTPS. Prior local SSH forwarding was cancelled, and the private login record now contains the public URL.

Renewal verification: the first manual command resolved to Ubuntu's older `/usr/bin/certbot` 2.9, which cannot process this IP certificate. Inspection showed the existing timer correctly uses `/opt/echoa-certbot/bin/certbot` 5.8. Re-ran `renew --cert-name echoa-api-ip --dry-run --run-deploy-hooks --no-random-sleep-on-renew` with that configured executable: all simulated renewals succeeded, including successful Nginx validation/reload. The active production certificate was not replaced by the dry-run; the existing timer/hook were left unchanged. Always use the service's executable for manual renewal checks.

Updated the management wrapper and daily backup service to include public config; the backup service ran successfully. App health and unchanged healthy Echoa containers were confirmed. Nginx site access logs are disabled; its error log is covered by the existing daily rotated/compressed 14-file nginx policy. App Docker logs remain bounded. Configuration hashes are recorded in the private deployment receipt; app images remain release `20261109-101631-c81a785606b2`. Lint/diff checks passed. Browser control, real server reboot, actual reading-write acceptance and automatic off-server retention/notifications remain deferred/unverified. SP-19-06 is **Done**; checklist is **181/210 Done, 29 open**.

## CI/CD setup — 2026-11-09

Added main/master push deployment and PR verification in GitHub Actions, pinned
actions, Node 24/pnpm 10.34.9, disposable PostgreSQL acceptance, immutable amd64
packages, checksums, restricted SSH and host-owned runtime configuration. Ten
local boundary/recovery tests passed, including unsafe archive rejection, applied
migration immutability, no-schema rollback and migration forward-repair behavior.
Repository lint, shell syntax and workflow lint passed (installed actionlint does
not yet recognize GitHub's documented `concurrency.queue`, so that diagnostic was
excluded). Production environment restricts deployments to main/master. The actual
restricted key rejected `whoami`; fixed Compose validated and scheduled backup
service reran successfully. The successful GitHub deployment verification is recorded below.
No browser control, owner reset, production fixtures or unrelated service changes.

The first workflow run 42580722367 passed hosted verification/build but could not
reach echoa:22 (timeout; no deployment started). The deployment job now uses a
dedicated non-root outbound runner and loopback restricted SSH. Ten local tests
include streaming package integrity and rejection of untrusted runner contexts.
External PR workflow approval is required for all outside contributors.

### Verified automatic production deployment

[Run 42582507446](https://github.com/maleki-amirhossein/sarvin-planner/actions/runs/42582507446) completed successfully on push to main (`9b9439c`):
all hosted application checks and ten deployment tests passed, amd64 images were
built, and the guarded echoa runner downloaded and deployed the bundle. Actual
pre-job context guard, host pin, loopback forced SSH command, source/image migration
checksum match, private pre-release backup, atomic release selection and HTTPS
smoke all passed. API/web were replaced; database/Caddy and all four Echoa container
IDs remained unchanged. The owner session created before deployment survived it;
private task response was unchanged and logout succeeded. External client smoke
also passed. Daily backup ran successfully with the new release layout; pre-release
dump permissions are 600. No new migrations or production fixtures were introduced.

Follow-up recovery hardening adds stable artifact names and accepts the original
verified build on a deployment-only rerun. Twelve local tests pass, including that
retry, failed migration and unhealthy rollout cases. Older Sarvin images are pruned
before the next import while the current image remains the rollback target. Real
production failure injection was intentionally not performed; recovery branches
are covered with isolated mocked runtime tests. Browser/reboot/off-server-backup
acceptance remains deferred; the checklist remains 181/210.

## Login UI adjustment — 2026-11-09

Moved the password visibility button to logical `start` (right in the RTL form), matching the LTR input's existing right-side `pe-12` padding. Removed the account-provisioning sentence below the submit button. Web typecheck, targeted ESLint and diff checks passed. Browser control remains deferred; no visual verification or deployment is claimed.

## Calendar card border adjustment — 2026-11-09

Removed the shared calendar event's 4px inline-start accent border (right side in RTL), retaining `border: 0`. CSS formatting and diff checks passed. Browser verification remains deferred; changes are local, not deployed.

## Server university/music schedules — 2026-11-09

At the user's request, applied real schedules to the public echoa instance through authenticated NestJS APIs, using CSRF, version preconditions and stable idempotency keys. User confirmed effective date today (2026-11-09), selected Human Factors instead of Decision Making for Wednesday 13:30, and prioritized Tuesday work over Simulation. No term end was supplied; weekly rules have no end date, as communicated. Removed Wednesday from work via `scope=future`; Saturday–Tuesday work remains 08:00–13:00. Added five university and three explicitly requested music series; exact table is in the handoff. No local database copy, fixtures, owner reset or direct SQL writes.

Authenticated readback verified one rule per title, all eight class series, 24 class occurrences and 12 work occurrences across three weeks, exact Tehran weekdays/times, fixed-event restrictions, no occurrences before the effective date, no overlaps, no Wednesday work, and no Simulation/Decision Making rules. Verification sessions logged out. Private operation receipt and stable keys remain ignored/mode 600 in `.local/university-20261109-receipt.json`. Original 181/210 checklist and browser acceptance remain unchanged.

UI deployment: [Actions run 42586421851](https://github.com/maleki-amirhossein/sarvin-planner/actions/runs/42586421851) succeeded for `bbfb887`, release `ci-bbfb887430f2c50291c3f9d91841217ca1b8d31f-4-1`; host receipt confirms deployed with a private pre-release backup. This publishes the earlier login and calendar-card-border changes. Public HTTPS smoke and served JS/CSS checks confirmed the right-side password toggle, removed login sentence and removed calendar event accent border. A pre-deployment owner session survived; task data was unchanged and logout succeeded. All eight class schedules and Tuesday/Wednesday work decisions were reverified after deployment. No browser visual acceptance claimed. Concurrent uncommitted day-background styling is outside this release.

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
