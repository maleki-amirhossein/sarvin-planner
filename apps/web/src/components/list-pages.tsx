"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, BookOpen } from "lucide-react";
import { api, type DTO } from "@/lib/api";
import { useApi } from "@/lib/queries";
import { formatJalaliDate, formatTime } from "@/lib/dates";
import { useSelectedDate } from "@/lib/use-selected-date";
import { useEditor } from "./editor-provider";
import { Button } from "./ui/button";
import {
  categories,
  priorities,
  FormFeedback,
  useFormAction,
} from "./form-support";
import {
  DateBar,
  Empty,
  GoalCard,
  number,
  TaskRow,
  EventCard,
} from "./planner-parts";
import { QueryState } from "./query-state";
function Pager({
  next,
  previous,
  onNext,
  onPrevious,
}: {
  next: string | null | undefined;
  previous: boolean;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <div className="mt-4 flex gap-2">
      {previous && (
        <Button variant="outline" onClick={onPrevious}>
          صفحه قبل
        </Button>
      )}
      {next && (
        <Button variant="outline" onClick={onNext}>
          صفحه بعد
        </Button>
      )}
    </div>
  );
}
export function TasksPage() {
  const search = useSearchParams(),
    editor = useEditor();
  type View = "all" | "unscheduled" | "scheduled" | "overdue" | "completed";
  const [view, setView] = useState<View>(
      (["all", "unscheduled", "scheduled", "overdue", "completed"].includes(
        search.get("view") ?? "",
      )
        ? search.get("view")
        : "unscheduled") as View,
    ),
    [q, setQ] = useState(""),
    [category, setCategory] = useState<DTO["Task"]["category"] | "">(""),
    [priority, setPriority] = useState<DTO["Task"]["priority"] | "">(""),
    [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const query = useApi("listTasks", {
    query: {
      view,
      q: q || undefined,
      category: category || undefined,
      priority: priority || undefined,
      limit: 25,
      cursor: cursors.at(-1),
    },
  });
  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl">کارها و ایده‌ها</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            اول ثبت کن، بعد برایش زمان پیدا کن.
          </p>
        </div>
        <Button onClick={() => editor.task()}>
          <Plus size={18} />
          کار تازه
        </Button>
      </div>
      <section className="surface p-4 sm:p-6">
        <div className="mb-5 flex flex-wrap gap-2">
          {Object.entries({
            unscheduled: "بدون زمان",
            scheduled: "برنامه‌ریزی‌شده",
            overdue: "عقب‌افتاده",
            completed: "انجام‌شده",
            all: "همه",
          }).map(([v, l]) => (
            <Button
              key={v}
              variant={view === v ? "default" : "outline"}
              aria-pressed={view === v}
              onClick={() => {
                setView(v as View);
                setCursors([undefined]);
              }}
            >
              {l}
            </Button>
          ))}
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <label className="field">
            جست‌وجو
            <input
              type="search"
              maxLength={200}
              placeholder="عنوان کار…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCursors([undefined]);
              }}
            />
          </label>
          <label className="field">
            دسته
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value as typeof category);
                setCursors([undefined]);
              }}
            >
              <option value="">همه دسته‌ها</option>
              {Object.entries(categories).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            اولویت
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as typeof priority);
                setCursors([undefined]);
              }}
            >
              <option value="">همه اولویت‌ها</option>
              {Object.entries(priorities).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        <QueryState query={query} />
        {query.data?.items.map((t) => (
          <TaskRow key={t.id} task={t} view={view} />
        ))}
        {query.data && !query.data.items.length && (
          <Empty>
            {q || category || priority
              ? "کاری با این فیلترها پیدا نشد."
              : "اینجا هنوز کاری نیست؛ با یک عنوان ساده شروع کن."}
          </Empty>
        )}
        <Pager
          next={query.data?.nextCursor}
          previous={cursors.length > 1}
          onNext={() =>
            setCursors([...cursors, query.data?.nextCursor ?? undefined])
          }
          onPrevious={() => setCursors(cursors.slice(0, -1))}
        />
      </section>
    </>
  );
}
export function ReadingPage() {
  const { week } = useSelectedDate();
  return <ReadingContent key={week} />;
}
function ReadingContent() {
  const { week, from, to, date } = useSelectedDate(),
    editor = useEditor(),
    [bookFilter, setBookFilter] = useState(""),
    [q, setQ] = useState(""),
    [bookCursors, setBookCursors] = useState<(string | undefined)[]>([
      undefined,
    ]),
    [sessionCursors, setSessionCursors] = useState<(string | undefined)[]>([
      undefined,
    ]);
  const books = useApi("listBooks", {
      query: { limit: 12, q: q || undefined, cursor: bookCursors.at(-1) },
    }),
    sessions = useApi("listReadingSessions", {
      query: {
        from,
        to,
        bookId: bookFilter || undefined,
        limit: 20,
        cursor: sessionCursors.at(-1),
      },
    }),
    report = useApi("getWeeklyReport", { query: { weekStart: week } });
  return (
    <>
      <DateBar title="زمانی برای خواندن" />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="surface p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2">
                <BookOpen size={20} />
                کتاب‌ها و موضوع‌ها
              </h2>
              <Button variant="outline" onClick={() => editor.book()}>
                <Plus size={17} />
                کتاب تازه
              </Button>
            </div>
            <label className="field mb-4">
              جست‌وجوی کتاب
              <input
                type="search"
                maxLength={200}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setBookCursors([undefined]);
                }}
              />
            </label>
            <QueryState query={books} />
            <div className="grid gap-3 sm:grid-cols-2">
              {books.data?.items.map((b) => (
                <div key={b.id} className="rounded-xl border bg-reading/20 p-4">
                  <p className="break-words font-semibold">{b.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {b.author ?? "موضوع مطالعه"} ·{" "}
                    {b.status === "reading"
                      ? "در حال مطالعه"
                      : b.status === "finished"
                        ? "تمام‌شده"
                        : "بایگانی‌شده"}
                  </p>
                  {b.currentPage && (
                    <p className="mt-2 text-xs">
                      صفحه {number(b.currentPage)}
                      {b.totalPages ? ` از ${number(b.totalPages)}` : ""}
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    className="mt-2"
                    onClick={() => editor.book(b)}
                  >
                    ویرایش / بایگانی
                  </Button>
                </div>
              ))}
            </div>
            {books.data && !books.data.items.length && (
              <Empty>
                کتاب یا موضوعی اضافه کن. بدون کتاب هم می‌توانی مطالعه ثبت کنی.
              </Empty>
            )}
            <Pager
              next={books.data?.nextCursor}
              previous={bookCursors.length > 1}
              onNext={() =>
                setBookCursors([
                  ...bookCursors,
                  books.data?.nextCursor ?? undefined,
                ])
              }
              onPrevious={() => setBookCursors(bookCursors.slice(0, -1))}
            />
          </section>
          <section className="surface p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2>تاریخچه مطالعه واقعی</h2>
              <Button onClick={() => editor.reading()}>ثبت مطالعه</Button>
            </div>
            <label className="field mb-4">
              کتاب
              <select
                value={bookFilter}
                onChange={(e) => {
                  setBookFilter(e.target.value);
                  setSessionCursors([undefined]);
                }}
              >
                <option value="">همه کتاب‌ها و موضوع‌ها</option>
                {books.data?.items.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </label>
            <QueryState query={sessions} />
            <div className="space-y-3">
              {sessions.data?.items.map((s) => (
                <ReadingRow key={s.id} session={s} />
              ))}
            </div>
            {sessions.data && !sessions.data.items.length && (
              <Empty>
                این هفته هنوز مطالعه‌ای ثبت نشده است. چند دقیقه خواندن هم ارزش
                ثبت کردن دارد.
              </Empty>
            )}
            <Pager
              next={sessions.data?.nextCursor}
              previous={sessionCursors.length > 1}
              onNext={() =>
                setSessionCursors([
                  ...sessionCursors,
                  sessions.data?.nextCursor ?? undefined,
                ])
              }
              onPrevious={() => setSessionCursors(sessionCursors.slice(0, -1))}
            />
          </section>
        </div>
        <aside className="order-first space-y-5 xl:order-last">
          <GoalCard week={week} />
          <section className="surface space-y-3 p-5">
            <h2>برنامه و واقعیت</h2>
            <QueryState query={report} />
            {report.data && (
              <>
                <p className="text-sm">
                  {number(report.data.plannedReadingMinutes)} دقیقه زمان رزروشده
                </p>
                <p className="text-sm">
                  {number(report.data.actualReading.minutes)} دقیقه مطالعه واقعی
                </p>
              </>
            )}
            <p className="text-xs leading-6 text-muted-foreground">
              انجام دادن یک کار مطالعاتی، مطالعه واقعی ثبت نمی‌کند. مدت واقعی
              می‌تواند با زمان برنامه متفاوت باشد.
            </p>
            <Button
              variant="outline"
              onClick={() =>
                editor.task({ date, category: "reading", scheduled: true })
              }
            >
              برنامه جلسه بعد
            </Button>
          </section>
        </aside>
      </div>
    </>
  );
}
function ReadingRow({ session: s }: { session: DTO["ReadingSession"] }) {
  const editor = useEditor(),
    action = useFormAction(),
    client = useQueryClient();
  return (
    <article className="rounded-xl border p-4">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h3 className="break-words text-sm">
            {s.bookTitleSnapshot ?? s.topic ?? "مطالعه آزاد"}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatJalaliDate(new Date(s.startedAt), "EEEE d MMMM")} ·{" "}
            {formatTime(s.startedAt)} · {number(s.durationMinutes)} دقیقه
            {s.pages ? ` · ${number(s.pages)} صفحه` : ""}
          </p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" onClick={() => editor.reading(s)}>
            ویرایش
          </Button>
          <Button
            variant="ghost"
            disabled={action.pending}
            onClick={() => {
              if (
                window.confirm(
                  "این جلسه مطالعه حذف شود؟ آمار مطالعه دوباره محاسبه می‌شود.",
                )
              )
                void action.run(async () => {
                  await api("deleteReadingSession", {
                    path: { id: s.id },
                    version: s.version,
                  });
                  await client.invalidateQueries({ queryKey: ["private"] });
                });
            }}
          >
            حذف
          </Button>
        </div>
      </div>
      {s.note && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer py-2 text-primary">
            چه یاد گرفتم؟
          </summary>
          <p className="whitespace-pre-wrap break-words leading-7">{s.note}</p>
        </details>
      )}
      <FormFeedback action={action} />
    </article>
  );
}
export function ReviewPage() {
  const { week, from, to, date } = useSelectedDate(),
    report = useApi("getWeeklyReport", { query: { weekStart: week } }),
    schedule = useApi("getSchedule", { query: { from, to } });
  return (
    <>
      <DateBar title="نگاهی به هفته" />
      <QueryState query={report} />
      {report.data && (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {report.data.inProgress
              ? "این هفته هنوز در جریان است؛ فرصت ادامه دادن هست."
              : "مرور کارها و زمانی که برای خودت گذاشتی."}
          </p>
          <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              ["کار انجام‌شده", report.data.completedTaskCount, "کار"],
              ["کار باقی‌مانده", report.data.remainingTaskCount, "کار"],
              ["مطالعه واقعی", report.data.actualReading.minutes, "دقیقه"],
              ["زمان اشغال‌شده", report.data.occupiedMinutes, "دقیقه"],
            ].map(([label, value, unit]) => (
              <section key={label} className="surface p-5">
                <p className="text-xs text-muted-foreground">{label}</p>
                <strong className="my-2 block text-3xl">
                  {number(Number(value))}
                </strong>
                <span className="text-xs">{unit}</span>
              </section>
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <section className="surface p-5">
                <h2 className="mb-4">مطالعه روزانه (دقیقه واقعی)</h2>
                <div className="space-y-3">
                  {report.data.dailyReading.map((d) => (
                    <div
                      key={d.localDate}
                      className="grid grid-cols-[70px_minmax(0,1fr)_50px] items-center gap-3 text-xs"
                    >
                      <span>
                        {formatJalaliDate(
                          new Date(inputDate(d.localDate)),
                          "EEEE",
                        )}
                      </span>
                      <div className="h-3 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${(d.minutes / Math.max(1, ...report.data.dailyReading.map((i) => i.minutes))) * 100}%`,
                          }}
                        />
                      </div>
                      <span>{number(d.minutes)}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  {number(report.data.plannedReadingMinutes)} دقیقه مطالعه
                  برنامه‌ریزی‌شده ·{" "}
                  {number(report.data.unscheduledCompletedTaskCount)} کار بدون
                  زمان انجام‌شده، جدا از کارهای برنامه
                </p>
              </section>
              <section className="surface space-y-3 p-5">
                <h2>کارهای ناتمام برنامه</h2>
                <QueryState query={schedule} />
                {schedule.data?.events
                  .filter((e) => e.kind === "task" && e.status !== "completed")
                  .map((e) => (
                    <EventCard key={e.id} event={e} date={date} />
                  ))}
                {schedule.data &&
                  !schedule.data.events.some(
                    (e) => e.kind === "task" && e.status !== "completed",
                  ) && <Empty>کاری از برنامه این هفته باقی نمانده است.</Empty>}
                <p className="text-xs leading-6 text-muted-foreground">
                  از جزئیات کار زمان تازه انتخاب کنید؛ تداخل بررسی می‌شود. از
                  منوی کار می‌توانید آن را به فهرست بدون زمان برگردانید یا حذف
                  کنید.
                </p>
              </section>
            </div>
            <GoalCard week={week} />
          </div>
        </>
      )}
    </>
  );
}
function inputDate(day: string) {
  return `${day}T12:00:00+03:30`;
}
