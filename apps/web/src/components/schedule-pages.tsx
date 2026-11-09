"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type {
  EventDropInfo,
  EventResizeDoneInfo,
  DropInfo,
} from "@fullcalendar/react";
import { Draggable } from "@fullcalendar/react/interaction";
import { Plus, ArrowLeft, LockKeyhole } from "lucide-react";
import { api, type DTO } from "@/lib/api";
import { useApi } from "@/lib/queries";
import {
  formatJalaliDate,
  fromLocalDate,
  inputInstant,
  localDate,
  formatTime,
  shiftDate,
} from "@/lib/dates";
import { useSelectedDate } from "@/lib/use-selected-date";
import { Button } from "./ui/button";
import { Modal } from "./ui/overlays";
import { WeekCalendar } from "./week-calendar";
import { useEditor } from "./editor-provider";
import {
  DateBar,
  Empty,
  EventCard,
  GoalCard,
  number,
  TaskRow,
} from "./planner-parts";
import { QueryState } from "./query-state";
import { FormFeedback, useFormAction } from "./form-support";
function onDay(events: DTO["ScheduleEvent"][], day: string) {
  const start = inputInstant(day, "00:00"),
    end = inputInstant(shiftDate(day, 1), "00:00");
  return events.filter(
    (e) =>
      new Date(e.startAt) < new Date(end) &&
      new Date(e.endAt) > new Date(start),
  );
}
function ClockLine({ date }: { date: string }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return date === localDate(now) ? (
    <div className="my-4 flex items-center gap-2 text-xs text-primary">
      <span className="size-2 rounded-full bg-primary" />
      <span>اکنون {formatTime(now)}</span>
      <span className="h-px flex-1 bg-primary/40" />
    </div>
  ) : null;
}
function Priorities({ date }: { date: string }) {
  const p = useApi("getDailyPriorities", { path: { date } });
  return (
    <section className="surface space-y-3 p-5">
      <h2>سه اولویت روز</h2>
      <p className="text-xs leading-6 text-muted-foreground">
        از گزینه‌های هر رخداد، آن را به اولویت‌های این روز اضافه کنید.
      </p>
      <QueryState query={p} />
      {p.data?.occurrenceIds.map((id, i) => (
        <PriorityItem key={id} id={id} index={i} />
      ))}
      {p.data && !p.data.occurrenceIds.length && (
        <Empty>مهم‌ترین قدم امروزت را انتخاب کن.</Empty>
      )}
    </section>
  );
}
function PriorityItem({ id, index }: { id: string; index: number }) {
  const q = useApi("getTaskOccurrence", { path: { id } }),
    editor = useEditor(),
    action = useFormAction();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/60 p-3">
      <span className="text-primary">{number(index + 1)}</span>
      {q.data ? (
        <button
          className={`text-start text-sm ${q.data.status === "completed" ? "line-through" : ""}`}
          onClick={() =>
            void action.run(async () =>
              editor.editTask(
                await api("getTask", { path: { id: q.data.taskId } }),
                id,
              ),
            )
          }
        >
          {q.data.snapshot.title}
        </button>
      ) : (
        <QueryState query={q} />
      )}
      <FormFeedback action={action} />
    </div>
  );
}
export function TodayPage() {
  const { date, week, from, to, setDate } = useSelectedDate(),
    schedule = useApi("getSchedule", { query: { from, to } }),
    inbox = useApi("listTasks", {
      query: { view: "unscheduled", limit: 5, status: "incomplete" },
    }),
    editor = useEditor();
  const events = onDay(schedule.data?.events ?? [], date),
    summary = schedule.data?.days.find((d) => d.localDate === date);
  return (
    <>
      <DateBar
        title={date === localDate(new Date()) ? "امروزت را بساز" : "برنامه روز"}
        weekly={false}
      />
      <div className="mb-6 grid grid-cols-7 gap-1 sm:gap-2">
        {Array.from({ length: 7 }, (_, i) => shiftDate(week, i)).map((day) => (
          <button
            key={day}
            aria-pressed={day === date}
            onClick={() => setDate(day)}
            className={`min-h-20 rounded-xl border px-1 py-3 text-xs ${day === date ? "border-primary bg-primary text-white" : "bg-card"}`}
          >
            <span className="block">
              {formatJalaliDate(fromLocalDate(day), "EEE")}
            </span>
            <strong className="my-1 block text-lg">
              {formatJalaliDate(fromLocalDate(day), "d")}
            </strong>
            {day === localDate(new Date()) && (
              <span className="block">امروز</span>
            )}
          </button>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="surface p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-2">
            <div>
              <h2>برنامه {formatJalaliDate(fromLocalDate(date), "EEEE")}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {number(summary?.completedTaskCount ?? 0)} از{" "}
                {number(summary?.plannedTaskCount ?? 0)} کار انجام شده ·{" "}
                {number(summary?.occupiedMinutes ?? 0)} دقیقه اشغال‌شده
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              aria-label="افزودن به این روز"
              onClick={() => editor.task({ date, scheduled: true })}
            >
              <Plus size={18} />
            </Button>
          </div>
          <QueryState query={schedule} />
          {schedule.data && (
            <>
              <div className="space-y-3">
                <DayTimeline events={events} date={date} />
                {!events.length && (
                  <Empty>
                    این روز هنوز برنامه‌ای ندارد. زمانی برای کارهای مهمت کنار
                    بگذار.
                  </Empty>
                )}
              </div>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => editor.task({ date, scheduled: true })}
              >
                <Plus size={18} />
                افزودن برنامه
              </Button>
            </>
          )}
        </section>
        <aside className="space-y-5">
          <GoalCard week={week} />
          <Priorities date={date} />
          <section className="surface p-5">
            <div className="flex items-center justify-between">
              <h2>کارهای بدون زمان</h2>
              <Link
                href="/tasks?view=unscheduled"
                className="p-3 text-xs text-primary"
              >
                همه کارها
              </Link>
            </div>
            <QueryState query={inbox} />
            {inbox.data?.items.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
            {inbox.data && !inbox.data.items.length && (
              <Empty>فهرستت سبک است؛ هر ایده تازه را اینجا ثبت کن.</Empty>
            )}
            <Link
              href="/tasks?view=overdue"
              className="mt-3 inline-block p-2 text-sm text-primary"
            >
              کارهای عقب‌افتاده ←
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
export function WeekPage() {
  const { date, week, from, to, setDate } = useSelectedDate(),
    schedule = useApi("getSchedule", { query: { from, to } }),
    editor = useEditor(),
    router = useRouter(),
    client = useQueryClient(),
    action = useFormAction(),
    [notice, setNotice] = useState(""),
    [saving, setSaving] = useState(false);
  const events = schedule.data?.events ?? [],
    selected = onDay(events, date);
  async function move(info: EventDropInfo | EventResizeDoneInfo) {
    if (saving) {
      info.revert();
      return;
    }
    const original = events.find((e) => e.id === info.event.id);
    if (
      !original ||
      original.kind !== "task" ||
      !info.event.start ||
      !info.event.end
    ) {
      info.revert();
      return;
    }
    const body = {
      scheduledStartAt: info.event.start.toISOString(),
      scheduledEndAt: info.event.end.toISOString(),
    };
    setSaving(true);
    let first = true;
    await action.run(async (confirmation) => {
      try {
        await api("updateTaskOccurrence", {
          path: { id: original.id },
          version: original.version,
          body: { ...body, ...confirmation },
        });
        await client.invalidateQueries({ queryKey: ["private"] });
        setNotice("زمان کار ذخیره شد.");
      } catch (e) {
        if (first) {
          info.revert();
          first = false;
        }
        throw e;
      } finally {
        setSaving(false);
      }
    });
  }
  async function receive(info: DropInfo) {
    const version = Number(info.draggedEl.dataset.version);
    const id = info.draggedEl.dataset.occurrenceId;
    const minutes = Number(info.draggedEl.dataset.minutes);
    if (saving || !id || !version || !Number.isFinite(minutes) || minutes <= 0)
      return;
    const body = {
      scheduledStartAt: info.date.toISOString(),
      scheduledEndAt: new Date(
        info.date.getTime() + minutes * 60000,
      ).toISOString(),
    };
    setSaving(true);
    await action.run(async (confirmation) => {
      try {
        await api("updateTaskOccurrence", {
          path: { id },
          version,
          body: { ...body, ...confirmation },
        });
        await client.invalidateQueries({ queryKey: ["private"] });
        setNotice("کار در تقویم قرار گرفت.");
      } finally {
        setSaving(false);
      }
    });
  }
  const calendarEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startAt,
    end: e.endAt,
    editable: e.editable && !saving,
    durationEditable: e.resizable && !saving,
    extendedProps: { fixed: e.kind !== "task" },
    color:
      e.kind === "work"
        ? "#dff3f0"
        : e.kind === "class"
          ? "#e4efff"
          : e.category === "reading"
            ? "#f0e8ff"
            : "#fff0da",
    contrastColor:
      e.kind === "work"
        ? "#00594f"
        : e.kind === "class"
          ? "#234d83"
          : e.category === "reading"
            ? "#553680"
            : "#795013",
  }));
  return (
    <>
      <DateBar title="هفته‌ای با فرصت‌های تازه" />
      <p className="mb-5 text-sm text-muted-foreground">
        {number(events.length)} رویداد ·{" "}
        {number(events.filter((e) => e.category === "reading").length)} برنامه
        مطالعه · زمان تهران
      </p>
      <QueryState query={schedule} />
      <p role="status" className="text-sm text-primary">
        {saving ? "در حال ذخیره زمان…" : notice}
      </p>
      {schedule.data && (
        <>
          <div className="hidden gap-5 lg:grid xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0">
              <WeekCalendar
                date={date}
                events={calendarEvents}
                onDayClick={setDate}
                onSelect={(info) =>
                  editor.task({
                    date: localDate(info.start),
                    startAt: info.start.toISOString(),
                    endAt: info.end.toISOString(),
                    scheduled: true,
                  })
                }
                onEventClick={(info) => {
                  const event = events.find((e) => e.id === info.event.id);
                  if (event) {
                    setDate(localDate(new Date(event.startAt)));
                    void editor.event(event);
                  }
                }}
                onMove={move}
                onResize={move}
                onDrop={receive}
              />
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                جابجایی و تغییر طول کارها با گام ۱۵ دقیقه انجام می‌شود. برای
                تغییر دقیق یا استفاده با صفحه‌کلید، جزئیات کار را باز کنید. کار
                ثابت و کلاس قفل‌اند.
              </p>
            </div>
            <aside className="space-y-4">
              <section className="surface space-y-3 p-4">
                <h2>{formatJalaliDate(fromLocalDate(date), "EEEE d MMMM")}</h2>
                {selected.map((e) => (
                  <EventCard key={e.id} event={e} date={date} />
                ))}
                {!selected.length && <Empty>روز آزاد برای برنامه‌ریزی</Empty>}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => editor.task({ date, scheduled: true })}
                >
                  افزودن به این روز
                </Button>
              </section>
              <GoalCard week={week} />
              <Priorities date={date} />
              <UnscheduledDragList />
            </aside>
          </div>
          <div className="space-y-4 lg:hidden">
            {schedule.data.days.map((day) => {
              const items = onDay(events, day.localDate);
              return (
                <section
                  key={day.localDate}
                  className={`surface p-4 ${day.localDate === localDate(new Date()) ? "border-primary" : ""}`}
                >
                  <button
                    className="flex w-full items-center justify-between text-start"
                    onClick={() => router.push(`/today?date=${day.localDate}`)}
                  >
                    <div>
                      <h2>
                        {formatJalaliDate(
                          fromLocalDate(day.localDate),
                          "EEEE d MMMM",
                        )}
                        {day.localDate === localDate(new Date()) && (
                          <span className="ms-2 text-xs text-primary">
                            امروز
                          </span>
                        )}
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {number(day.eventCount)} رویداد ·{" "}
                        {number(day.occupiedMinutes)} دقیقه
                      </p>
                    </div>
                    <ArrowLeft size={18} />
                  </button>
                  <div className="mt-3 space-y-2">
                    {items.slice(0, 3).map((e) => (
                      <button
                        key={e.id}
                        className="flex w-full items-start gap-2 rounded-lg bg-muted/60 p-3 text-start text-sm"
                        onClick={() => void editor.event(e)}
                      >
                        {e.kind !== "task" && (
                          <LockKeyhole size={15} className="mt-1 shrink-0" />
                        )}
                        <span className="min-w-0 flex-1 break-words">
                          {e.title}
                          <bdi className="mt-1 block text-xs text-muted-foreground">
                            {formatTime(e.startAt)}–{formatTime(e.endAt)}
                          </bdi>
                        </span>
                      </button>
                    ))}
                    {items.length > 3 && (
                      <Link
                        href={`/today?date=${day.localDate}`}
                        className="block p-2 text-xs text-primary"
                      >
                        +{number(items.length - 3)} رویداد دیگر
                      </Link>
                    )}
                    {!items.length && (
                      <p className="py-2 text-sm text-muted-foreground">
                        هنوز برنامه‌ای ندارد.
                      </p>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() =>
                        editor.task({ date: day.localDate, scheduled: true })
                      }
                    >
                      <Plus size={16} />
                      افزودن برنامه
                    </Button>
                  </div>
                </section>
              );
            })}
            <GoalCard week={week} />
          </div>
        </>
      )}
      <Modal
        open={Boolean(action.error)}
        onOpenChange={(open) => {
          if (!open) action.reset();
        }}
        title="تغییر زمان ذخیره نشد"
        description="زمان قبلی حفظ شده است. تداخل را بررسی کنید یا از فرم زمان دیگری انتخاب کنید."
      >
        <FormFeedback
          action={action}
          reload={() => {
            action.reset();
            void schedule.refetch();
          }}
        />
      </Modal>
    </>
  );
}

function UnscheduledDragList() {
  const q = useApi("listTasks", {
    query: { view: "unscheduled", status: "incomplete", limit: 10 },
  });
  return (
    <section className="surface space-y-3 p-4">
      <h2>کارهای بدون زمان</h2>
      <p className="text-xs leading-6 text-muted-foreground">
        کار را به تقویم بکشید یا با دکمه جزئیات زمان بدهید.
      </p>
      <QueryState query={q} />
      {q.data?.items
        .filter((t) => t.oneOffOccurrenceId)
        .map((t) => (
          <DraggableTask key={t.id} task={t} />
        ))}
      {q.data && !q.data.items.length && (
        <Empty>کاری منتظر زمان‌بندی نیست.</Empty>
      )}
      <Link
        href="/tasks?view=unscheduled"
        className="inline-block p-2 text-sm text-primary"
      >
        همه کارها
      </Link>
    </section>
  );
}
function DraggableTask({ task }: { task: DTO["Task"] }) {
  const ref = useRef<HTMLDivElement>(null),
    q = useApi("getTaskOccurrence", { path: { id: task.oneOffOccurrenceId! } });
  useEffect(() => {
    if (!ref.current || !q.data) return;
    const drag = new Draggable(ref.current, {
      eventData: {
        create: false,
        id: q.data.id,
        title: task.title,
        duration: { minutes: task.estimateMinutes ?? 60 },
        extendedProps: { version: q.data.version },
      },
      itemSelector: ".external-task",
      minDistance: 8,
      longPressDelay: 300,
    });
    return () => drag.destroy();
  }, [q.data, task.title, task.estimateMinutes]);
  return (
    <div ref={ref}>
      <div
        data-occurrence-id={q.data?.id}
        data-version={q.data?.version}
        data-minutes={task.estimateMinutes ?? 60}
        className="external-task cursor-grab select-none rounded-lg border px-2"
        title="برای زمان‌بندی به تقویم بکشید"
      >
        <TaskRow task={task} />
      </div>
    </div>
  );
}

function DayTimeline({
  events,
  date,
}: {
  events: DTO["ScheduleEvent"][];
  date: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const split = events.findIndex((e) => new Date(e.startAt).getTime() > now),
    position = split < 0 ? events.length : split;
  return (
    <>
      {events.slice(0, position).map((e) => (
        <EventCard key={e.id} event={e} date={date} />
      ))}
      <ClockLine date={date} />
      {events.slice(position).map((e) => (
        <EventCard key={e.id} event={e} date={date} />
      ))}
    </>
  );
}
