# Domain and API implementation contracts

Status: design contract for STEP-01, not a claim that feature endpoints exist. The only implemented endpoints at this checkpoint are health and liveness. The canonical machine-readable contract is `../contracts/openapi.json`; `../contracts/api.d.ts` is generated from it. Do not expose a feature route until its authorization, validation, and persistence exist.

## Decisions and ownership

Sarvin is a single-owner Persian/RTL planner. All authoritative scheduling, recurrence, conflict, authorization, and aggregation logic belongs in NestJS. The browser converts display/input representations and renders results. Keep PostgreSQL models and credentials out of the frontend contract package.

An owner has a server-generated UUID, normalized login email, password hash, session generation, and timestamps. A database singleton constraint plus transactional bootstrap must enforce at most one owner. Provisioning is an explicit administrative command, never public signup. No real account, work start date, class, book, or reading target is inferred from reference images.

Every domain record is owner-scoped. Ownership comes from the authenticated session, never a request body. Look up identifiers using both ID and owner; another owner's or a missing identifier returns the same 404. Public endpoints are login, a CSRF-token bootstrap endpoint, and minimal health/liveness. Authentication and CSRF implementation follow STEP-04; do not introduce home-grown cryptography.

## Types and lifecycle

| Type | Identity, fields, and behavior |
|---|---|
| Task | UUID, owner, title (1–200 trimmed characters), nullable description (max 5000), category (`personal`, `reading`, `work`, `university`, `other`; default personal), priority (`low`, `normal`, `high`; default normal), nullable positive integer estimateMinutes (max 1440), nullable dueDate, version, timestamps, nullable deletedAt. Task status in responses is derived from its occurrence(s); do not maintain a second mutable completion flag. |
| ScheduledTaskOccurrence | UUID; taskId; nullable series segment ID; stable occurrenceKey; nullable originalLocalDate for recurrence; nullable scheduledStartAt/scheduledEndAt (both present or both absent); independent incomplete/completed status; nullable completedAt; version. Every one-off task gets one occurrence even while unscheduled. Store a presentation snapshot so historical series occurrences do not inherit future template edits. |
| TaskSeries | UUID segment, stable rootSeriesId, taskId, template snapshot, selected ISO weekdays, localStartTime, durationMinutes, timezone, inclusive effectiveFrom/Until, version. Daily recurrence means all seven weekdays. At most one generated occurrence per local start date in version one. |
| FixedSeries | UUID segment and rootSeriesId; work/class kind; title, nullable notes/location; ISO weekdays; localStartTime/localEndTime; endsNextDay; timezone; inclusive effective dates; everyWeeks (1 or 2); nullable anchorWeekStart and parity (0 or 1); version. No task completion control. |
| OccurrenceException | UUID; owner; rootSeriesId and originalLocalDate unique together; cancel or override; replacement title/start/end as appropriate; version. Preserve the original identity when moved to another date. Never delete an exception merely because its replacement time lies outside the original date's range. |
| Book | UUID, title, optional author/topic description, optional positive totalPages/currentPage, status reading/finished/archived, version, timestamps. currentPage is explicitly entered, not derived from read/reread page totals. A nullable bookTitleSnapshot preserves the session label after removal. |
| ReadingSession | UUID, actual UTC start/end instants (positive elapsed duration, max 24 hours), optional positive integer pages, nullable bookId and occurrenceId, optional topic/note, version, timestamps. Duration is derived from end minus start, not independently editable. Future actual reading is rejected. |
| WeeklyGoal | UUID, owner, unique Gregorian local Saturday weekStart, minutes/pages/sessions unit, positive integer target, version, timestamps. Absence means no goal, not zero. Defaults are versioned separately and cannot rewrite historical weekly goals. |
| DailyPriority | Owner, localDate, occurrenceId, position 1–3. Unique owner/date/position and owner/date/occurrence; replacement is transactional. References can include unscheduled occurrences. |
| UserSettings | Owner, timezone (Asia/Tehran for v1), weekStartsOn=6, nullable workEffectiveFrom, nullable default goal rule, version. Initial setup requires explicit work start date, but reading goal is optional. |
| Session | Public session/account view contains only owner ID/email and expiry. Internal storage holds the maintained session library's opaque identifier, session data/owner linkage, expiry, and last-use metadata. Password hashes, cookie values, session identifiers, and CSRF secrets are excluded from all export/API DTOs. |
| IdempotencyRecord | Owner, operation, key, canonical request digest, response status/body, creation/expiry; unique owner/operation/key. Retain successful write results for at least 24 hours. Do not store authentication secrets or login responses here. |

The OpenAPI schemas define the transport shapes, including explicit nullable fields, create/update DTOs, and errors. Storage precision is milliseconds (`timestamptz(3)`); generated public IDs are UUIDs. Internal session identifiers follow the selected session library's format and are not constrained to UUIDs.

## Time, dates, and recurrence

1. API instants are RFC 3339 strings with an explicit offset; normalize responses to UTC `Z`. Reject offset-free timestamps. Use half-open `[start,end)` intervals, requiring end > start. Adjacent intervals do not overlap.
2. API Local Dates use **Gregorian** `YYYY-MM-DD` with Latin digits. Store with PostgreSQL `date`, or an equivalent explicit local-date mapping. A local date is not an instant and must never be passed through midnight-UTC conversion. Jalali year/month/day is a presentation/input representation converted at the UI boundary.
3. API wall-clock times use `HH:mm`, 00:00–23:59. Input accepts Persian/Arabic digits only after frontend normalization; APIs receive Latin digits. Display uses Persian digits and 24-hour time.
4. ISO weekday numbering is Monday=1 through Sunday=7; Saturday=6. Display order is `[6,7,1,2,3,4,5]`. RTL never renumbers weekdays.
5. A reporting week is Saturday 00:00 in Asia/Tehran through the following Saturday 00:00, exclusive. Convert both boundaries independently through an IANA timezone implementation, never by adding seven UTC days. Test historical DST as well as current offsets.
6. Expand only a requested range of at most 93 local days. effectiveFrom and effectiveUntil constrain original occurrence start dates, inclusively. Expand the preceding local date when an interval can cross midnight and include moved-in exceptions whose original dates are outside the requested range. An event spanning midnight remains one record and appears in each intersecting day with continuation flags.
7. Generate wall-clock occurrences in their rule's timezone. DST policy: ambiguous local times use the earlier occurrence; nonexistent local times shift forward by the gap. This must be explicit in the timezone utility and tested. Do not increment UTC instants by 24 hours to implement recurrence.
8. For alternate weeks, require a confirmed Saturday anchor and parity 0 (anchor/each second week) or 1 (intervening weeks). Compute the difference in local calendar weeks, not milliseconds or ISO week-of-year. Permit negative offsets with normalized modulo. UI wording must explain the chosen anchor; never guess university odd/even semantics.
9. Occurrence identity is `rootSeriesId:originalLocalDate`, unique per owner and root. A one-off occurrence uses its own UUID identity. Moving an occurrence, changing the future series start time, or splitting a segment must not change an already-materialized occurrence's identity.
10. Materialize task occurrences on demand with a database uniqueness constraint and upsert inside a transaction. A persisted completion, cancellation, reschedule, or explicit unscheduling takes precedence over expansion. GET refresh cannot recreate an unscheduled block. Fixed occurrences may be virtual with stable keys and persistent exceptions.
11. Fixed work defaults are exactly weekdays `[6,7,1,2,3]`, 08:00–13:00, Asia/Tehran. There are no Thursday/Friday work occurrences or occurrences before the user-confirmed effectiveFrom. Bootstrap uses an owner-scoped unique bootstrap key; retries cannot duplicate the rule. Class data remains empty until supplied.
12. Day views cover all 24 hours and cannot hide early/late events. Defaults may scroll to 07:00. Public holidays require explicit cancellation exceptions.

## Editing, conflicts, and history

- A title alone creates a Task and its unscheduled one-off occurrence atomically. Schedule, move, resize, complete, reopen, unschedule, and delete operate on a specific occurrence. Fixed occurrences reject ordinary task-move operations in the API, regardless of UI capabilities.
- Unscheduling clears both scheduled instants but keeps the task, occurrence identity, status, and reading links. Recurring occurrence unscheduling is persisted as an explicit override; it does not regenerate at the next fetch. Due dates remain unchanged unless explicitly edited.
- Completion is an idempotent state assignment, not a toggle endpoint. Transition incomplete→completed sets completedAt once; repeated completed requests do not move it. Reopening clears it. Conflicting stale changes return 409. Actual reading never changes implicitly.
- A series edit/delete requires `scope=this` or `scope=future` and an original local occurrence date. `this` creates an exception/occurrence override. `future` terminates the prior segment the day before the cutover and creates a new segment with the same root identity. Do not mutate prior occurrence snapshots or completion history. Preserve exceptions and completed occurrences; the UI must resolve an explicitly listed affected future occurrence before a rule change can overwrite it. All edits are atomic.
- Deletion is soft deletion/archive for tasks, series, and books. Preserve reading rows and snapshot labels; nullable references may be cleared on later hard deletion. A single occurrence deletion is a cancellation tombstone; a future-series deletion terminates expansion at the chosen cutoff and cancels only eligible unfinished future occurrences with explicit confirmation. Export includes tombstones/history needed to reconstruct state.
- Overdue means incomplete with dueDate before today, or a scheduled end before now. No automatic migration to today, deletion, or recurring completion occurs. Offer an explicit new interval, inbox return, or confirmed deletion.
- Before any schedule write, compare against scheduled task occurrences and fixed/class occurrences using `[start,end)`. Return titles, types, UTC intervals, IDs/keys, and versions. Store no write on the first conflict response.
- On HTTP 409 `SCHEDULE_CONFLICT`, return a `conflictSnapshot` opaque digest bound to the owner, normalized proposed mutation, target version, schedule revision, and sorted conflict identities/versions/intervals. Resubmission with that snapshot means explicit informed confirmation of those exact conflicts, not unrestricted overlap permission.
- Serialize writes that affect a given owner's schedule (row lock or serializable transaction with bounded retries). Within that transaction recheck target version, expand relevant rules, recompute conflict snapshot, persist, and increment scheduleRevision. A concurrent change requires a fresh warning; a reviewed snapshot cannot authorize a different payload. Check idempotent replays before stale-version validation, so a successful retry returns its original result.
- Recurring rule conflicts must be checked symbolically over intersecting effective ranges and weekday/parity patterns (14-day periodic cycle), including cross-midnight adjacency and finite exceptions. Do not declare an unbounded rule conflict-free based only on the visible week. Explicit future occurrence overrides must be included.

## KPI definitions

| Metric | Exact definition |
|---|---|
| Event count | Distinct, non-canceled task/fixed occurrence identities intersecting the range. A midnight-spanning event is counted once in a weekly total; it can appear in both daily cards. |
| Occupied minutes | Clip all visible task/work/class intervals to the range, merge their union, and divide elapsed milliseconds by 60000. Adjacent intervals may merge; overlaps never double-count. |
| Planned task count | Distinct task occurrences whose scheduled start falls in the period, plus occurrences explicitly assigned as a daily priority within it; deduplicate. Fixed work/classes are excluded. Cross-midnight tasks belong to their start day for completion statistics. |
| Completed/remaining planned tasks | From that same planned set: completed status versus incomplete status. Completion on a later day does not move the planned-day denominator. An empty set shows “no planned tasks”, not a fabricated percentage. |
| Unscheduled completed tasks | Separate count of currently unscheduled non-priority occurrences with completedAt in the period. Do not silently mix these into the planned-task completion fraction. |
| Planned reading | Count/duration of scheduled reading-category task occurrences. It remains a plan even when the task is checked complete. |
| Actual reading minutes | Sum each actual reading session's elapsed overlap with the requested week. Keep fractional minutes in calculation; round only presentation (one decimal). |
| Actual pages / sessions | Attribute all supplied pages and a count of one to the week containing the session's actual start. Missing pages contribute zero to page totals, never an estimated value. |
| Goal progress | Actual amount for the selected unit, target, remaining=max(target−actual,0), percent=100×actual/target. Text may exceed 100%; cap only bar width. No goal returns null progress/target, while actual activity remains visible. |

A session crossing a Saturday midnight contributes minutes to both weeks and pages/session count only to its start week. Explain this briefly near logging/progress. Reread pages count but do not imply book completion. Editing/deleting a session recomputes affected weeks from source records.

Default goals use an explicit `effectiveFromWeek` and create no past goals. An explicit weekly goal overrides the applicable default. Reads may derive a suggested default with `source=default`; they must not persist hidden goals. Changing a default only affects weeks on/after its specified effective week and never overwrites explicit weekly goals.

## HTTP and write protocol

- Base path `/api`, UTF-8 JSON; request bodies max 64 KiB. Do not log bodies containing private notes, credentials, or cookies. Assign and return a requestId; preserve only validated incoming request IDs.
- UUID path IDs, ISO Local Dates, UTC/offset instants, and bounded strings are validated. Reject unknown input fields, invalid calendar dates, inconsistent interval pairs, empty patches, invalid weekdays, non-Saturday week starts, and offset-free instants. Transport schemas express individual fields; cross-field semantic checks are described on operations and enforced by NestJS.
- Lists use opaque cursor pagination sorted by `(createdAt,id)` or an explicitly documented time sort, default limit 50, max 100. Cursor includes relevant filters; changing filters invalidates it. Return `{items,nextCursor}`. Schedule/report ranges are bounded, not silently truncated. Schedule over 1000 expanded occurrences returns `RANGE_TOO_LARGE` and asks for a smaller range.
- `If-Match: "<version>"` is required for patch/delete and replaces a version body field. Missing precondition returns 428; stale version returns 409 with a safe current record. Read resources include numeric version; writes increment it. Collection settings (priorities/defaults) have their own revision. For weekly-goal upsert, version 0 means absent; simultaneous creates conflict instead of last-write-wins.
- `Idempotency-Key` is required for creates and multi-record scope/initial-setup mutations. It is a client-generated UUID scoped by owner+operation. Reuse with different normalized payload/target is 409 `IDEMPOTENCY_KEY_REUSED`. First success returns its original status/body on replay; rejected/rolled-back attempts do not consume the key. Disable double submission in the UI as an additional safeguard.
- Errors use `{code,message,fieldErrors?,requestId,details?}`. Messages are safe Persian text. Codes distinguish validation, unauthorized, forbidden/CSRF, not found, stale version, schedule conflict, idempotency misuse, invalid series scope, rate limit, range too large, and unavailable service. Do not return stack traces or raw SQL.
- GET/HEAD never change user settings or log reading. Bounded task materialization is an internal idempotent cache/persistence step, not a new user-created task. No private response may be publicly cached (`Cache-Control: private, no-store`).
- Mutating browser requests require an allowed Origin and the maintained CSRF mechanism's header token. The OpenAPI security schemes represent the session cookie and CSRF token; production cookie is host-only HttpOnly/Secure/SameSite=Lax. Local HTTP configuration explicitly disables Secure. No token is stored in localStorage.
- On logout, clear client private-query caches. Mutations invalidate day/week schedules, task lists, priorities, reading goals/history, and reports as appropriate. Refetch on focus/reconnect; revert optimistic updates on errors. A 409 never silently overwrites fresh data.

## Pending inputs and non-goals

Real class names/times/term/parity, the work effective start date, real reading target/unit, owner identity/credential bootstrap, server/DNS details, and an off-server backup destination remain pending. Preserve the plan's Pending Inputs table. Credentials must be entered through a local secure bootstrap mechanism later, not this document or chat logs.

No notifications, offline writes, PWA, AI scheduling, multiple owners, payments, or calendar integrations are authorized by this plan. Reference samples are test fixtures only. Initial tests may create isolated test owners and test events in disposable databases; never seed them into the user's database.
