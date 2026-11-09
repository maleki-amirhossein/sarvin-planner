import type { CalendarOptions } from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import faLocale from "@fullcalendar/react/locales/fa";
import { APP_TIME_ZONE, WEEK_STARTS_ON } from "./dates";

// Defaults for future daily/weekly screens; no calendar screen is mounted yet.
// FullCalendar's stock month navigation is Gregorian. Do not introduce a month
// view until a real Jalali range/navigation adapter has been implemented.
export const calendarDefaults = {
  plugins: [timeGridPlugin],
  locale: faLocale,
  direction: "rtl",
  timeZone: APP_TIME_ZONE,
  firstDay: WEEK_STARTS_ON,
  initialView: "timeGridWeek",
  editable: false,
  selectable: false,
} satisfies CalendarOptions;
