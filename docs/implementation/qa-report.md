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
