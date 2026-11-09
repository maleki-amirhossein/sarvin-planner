"use client";
import { useState } from "react";
import type {
  EventInput,
  EventDropInfo,
  EventResizeDoneInfo,
} from "@fullcalendar/react";
import { WeekCalendar } from "./week-calendar";
import { JalaliDatePicker } from "./jalali-date-picker";
import { Button } from "./ui/button";
import { Modal, ActionMenu, Hint } from "./ui/overlays";
import {
  formatJalaliDate,
  fromLocalDate,
  shiftDate,
  localDate,
} from "@/lib/dates";

const fixtures: EventInput[] = [
  {
    id: "fixed",
    title: "کار ثابت — آزمایشی",
    start: "2025-03-22T08:00:00+03:30",
    end: "2025-03-22T13:00:00+03:30",
    editable: false,
    extendedProps: { fixed: true },
    color: "#dff3f0",
    contrastColor: "#00594f",
  },
  {
    id: "movable",
    title: "مطالعه — قابل جابه‌جایی",
    start: "2025-03-22T14:00:00+03:30",
    end: "2025-03-22T15:00:00+03:30",
    color: "#f0e8ff",
    contrastColor: "#553680",
  },
  {
    id: "midnight",
    title: "نمونه عبور از نیمه‌شب",
    start: "2025-03-22T23:30:00+03:30",
    end: "2025-03-23T00:30:00+03:30",
  },
];
export function CalendarPrototype() {
  const [date, setDate] = useState("2025-03-22");
  const [events, setEvents] = useState(fixtures);
  const [message, setMessage] = useState(
    "با انتخاب تاریخ یا جابه‌جایی نمونه، رفتار تقویم را بررسی کنید.",
  );
  const [modal, setModal] = useState(false);
  function move(info: EventDropInfo | EventResizeDoneInfo) {
    setEvents((all) =>
      all.map((event) =>
        event.id === info.event.id
          ? {
              ...event,
              start: info.event.start!.toISOString(),
              end: info.event.end!.toISOString(),
            }
          : event,
      ),
    );
    setMessage(`زمان نمونه تغییر کرد: ${info.event.start!.toISOString()}`);
  }
  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4">
      <h1 className="text-2xl">آزمایش تقویم شمسی سروین</h1>
      <p className="text-sm text-muted-foreground">
        این صفحه فقط برای بررسی فنی است؛ نمونه‌ها دادهٔ واقعی نیستند و ذخیره
        نمی‌شوند.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => setDate(shiftDate(date, -7))}>
          هفته قبل
        </Button>
        <JalaliDatePicker value={date} onChange={setDate} />
        <Button variant="outline" onClick={() => setDate(shiftDate(date, 7))}>
          هفته بعد
        </Button>
        <Button
          variant="outline"
          onClick={() => setDate(localDate(new Date()))}
        >
          امروز
        </Button>
        <Hint text="بررسی جهت راست‌به‌چپ">
          <Button onClick={() => setModal(true)}>فرم آزمایشی</Button>
        </Hint>
        <ActionMenu
          trigger={<Button variant="outline">گزینه‌ها</Button>}
          actions={[
            { label: "بازگشت به نوروز", action: () => setDate("2025-03-22") },
          ]}
        />
      </div>
      <h2>{formatJalaliDate(fromLocalDate(date))}</h2>
      <p role="status" className="surface p-3 text-sm" dir="auto">
        {message}
      </p>
      <WeekCalendar
        date={date}
        events={events}
        onMove={move}
        onResize={move}
        onDayClick={setDate}
        onSelect={(info) =>
          setMessage(
            `بازه انتخاب شد: ${info.start.toISOString()} — ${info.end.toISOString()}`,
          )
        }
        onEventClick={(info) => setMessage(info.event.title)}
      />
      <Modal open={modal} onOpenChange={setModal} title="فرم آزمایشی">
        <div className="space-y-3">
          <label className="field">
            عنوان
            <input placeholder="عنوان فارسی" />
          </label>
          <label className="field">
            ساعت
            <input
              type="text"
              inputMode="numeric"
              pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
              dir="ltr"
              defaultValue="13:00"
            />
          </label>
          <label className="field">
            ایمیل
            <input type="email" dir="ltr" placeholder="name@example.com" />
          </label>
          <Button onClick={() => setModal(false)}>بستن فرم</Button>
        </div>
      </Modal>
    </main>
  );
}
