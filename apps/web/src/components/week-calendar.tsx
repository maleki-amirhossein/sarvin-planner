"use client";
import FullCalendar, { type CalendarOptions } from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import interactionPlugin from "@fullcalendar/react/interaction";
import themePlugin from "@fullcalendar/react/themes/monarch";
import faLocale from "@fullcalendar/react/locales/fa";
import { LockKeyhole } from "lucide-react";
import {
  APP_TIME_ZONE,
  formatJalaliDate,
  formatTime,
  localDate,
  startOfTehranWeek,
  fromLocalDate,
} from "@/lib/dates";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";
import "@fullcalendar/react/themes/monarch/palettes/green.css";

const plugins = [themePlugin, timeGridPlugin, interactionPlugin];
export function WeekCalendar({
  date,
  events,
  onSelect,
  onEventClick,
  onMove,
  onResize,
  onDrop,
  onDayClick,
}: {
  date: string;
  events: CalendarOptions["events"];
  onSelect?: CalendarOptions["select"];
  onEventClick?: CalendarOptions["eventClick"];
  onMove?: CalendarOptions["eventDrop"];
  onResize?: CalendarOptions["eventResize"];
  onDrop?: CalendarOptions["drop"];
  onDayClick?: (date: string) => void;
}) {
  const week = localDate(startOfTehranWeek(fromLocalDate(date)));
  return (
    <div className="calendar-grid surface overflow-hidden p-2">
      <FullCalendar
        key={week}
        plugins={plugins}
        initialView="timeGridWeek"
        initialDate={date}
        locale={faLocale}
        direction="rtl"
        timeZone={APP_TIME_ZONE}
        firstDay={6}
        headerToolbar={false}
        allDaySlot={false}
        timedText="زمان‌بندی‌شده"
        height={720}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        scrollTime="08:00:00"
        slotDuration="00:30:00"
        slotMinHeight={32}
        slotHeaderInterval="01:00:00"
        snapDuration="00:15:00"
        nowIndicator
        editable
        selectable
        droppable
        drop={onDrop}
        eventDurationEditable
        events={events}
        select={onSelect}
        eventClick={onEventClick}
        eventDrop={onMove}
        eventResize={onResize}
        dayHeaderClass={(info) =>
          `sarvin-day-heading ${info.isToday ? "sarvin-today" : ""}`
        }
        dayHeaderInnerClass="sarvin-day-heading-inner"
        dayLaneClass={(info) =>
          `sarvin-day-lane ${info.isToday ? "sarvin-today" : ""}`
        }
        columnEventClass="sarvin-calendar-event"
        dayHeaderContent={(info) => (
          <button
            type="button"
            className="calendar-day-button"
            aria-pressed={localDate(info.date) === date}
            aria-label={formatJalaliDate(info.date)}
            onClick={() => onDayClick?.(localDate(info.date))}
          >
            <span className="block text-sm">
              {formatJalaliDate(info.date, "EEEE")}
            </span>
            <strong
              className={`calendar-day-date ${info.isToday ? "calendar-day-current" : ""}`}
            >
              {formatJalaliDate(info.date, "d MMMM")}
            </strong>
            {info.isToday && (
              <span className="calendar-today-label">امروز</span>
            )}
          </button>
        )}
        eventContent={(info) => (
          <div className="calendar-event-content min-w-0 overflow-hidden text-xs">
            <div className="flex items-center justify-between gap-1 font-semibold">
              <span className="truncate">{info.event.title}</span>
              {info.event.extendedProps.fixed && (
                <LockKeyhole
                  size={13}
                  className="shrink-0"
                  aria-label="برنامه ثابت"
                />
              )}
            </div>
            <bdi dir="ltr" className="mt-1 block text-[11px]">
              {info.event.start && formatTime(info.event.start)}–
              {info.event.end && formatTime(info.event.end)}
            </bdi>
          </div>
        )}
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
        slotHeaderFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
      />
    </div>
  );
}
