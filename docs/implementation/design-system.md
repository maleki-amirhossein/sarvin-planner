# STEP-02 design foundations

References were inspected: desktop-week.png, mobile-today.png, mobile-week.png. They guide hierarchy and density only; sample activities/counters are not user data.

| Component | Responsibility |
|---|---|
| AppShell, Sidebar, BottomNav | Desktop right navigation; mobile four-tab bottom navigation with safe-area padding; tablet collapsible navigation |
| WeekPicker, JalaliDatePicker | Saturday-first navigation, actual Jalali input/month grids, Gregorian Local Date output |
| DayCard, EventCard | Mobile week agenda and selected-day detail; fixed labels/lock; explicit status; cross-midnight continuation |
| GoalCard | Actual versus planned reading, no-goal state, uncapped textual percentage and capped visual bar |
| TaskForm | One shared mutation path for quick capture, metadata, scheduling and recurrence; keyboard alternative to drag |
| Modal, ConfirmDialog, ActionMenu, Hint | Radix focus management, escape/restore behavior, portaled RTL content, explicit confirmation |

Tokens live in globals.css: warm white, teal actions, lavender reading, amber personal, pale teal work and blue classes. Semantic error/focus/loading/disabled styles, a 44px control minimum, consistent radii and spacing, and reduced-motion support are centralized. Vazirmatn Variable is self-hosted through a pinned Fontsource package (SIL Open Font License). No external font requests.

Approved original PNG is preserved in public and used in the header, favicon and Apple icon metadata. No checkmark variant is used.

Prototype: `/dev/calendar`, development-only; production returns 404. Contains clearly labeled local test fixtures, never writes to API/database. FullCalendar React/timegrid/interaction and Monarch are MIT; no premium plugins. All 24 hours remain available. Ordinary events drag/resize, while fixed fixtures set editable=false. Timezone is explicitly Asia/Tehran. Dates/column headings come from date-fns-jalali, not merely locale=fa. The dedicated date picker navigates actual Jalali months and validates typed Persian dates.

The chosen renderer remains FullCalendar for daily/weekly time grids. Gregorian FullCalendar month view is deliberately not enabled. A custom Jalali month picker controls the week/day view, avoiding reliance on a nonexistent calendar-system flag. Native Date instants are formatted in Tehran explicitly. Tests and observed browser evidence are recorded in the execution log before tasks are marked Done.
