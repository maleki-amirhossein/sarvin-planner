"use client";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  LockKeyhole,
  MoreHorizontal,
  Check,
  Circle,
} from "lucide-react";
import { api, type DTO } from "@/lib/api";
import { useApi } from "@/lib/queries";
import {
  formatJalaliDate,
  fromLocalDate,
  formatTime,
  localDate,
  shiftDate,
} from "@/lib/dates";
import { useSelectedDate } from "@/lib/use-selected-date";
import { Button } from "./ui/button";
import { Modal, ActionMenu } from "./ui/overlays";
import { JalaliDatePicker } from "./jalali-date-picker";
import { useEditor } from "./editor-provider";
import {
  categories,
  priorities,
  FormFeedback,
  units,
  useFormAction,
} from "./form-support";
import { QueryState } from "./query-state";
export const number = (v: number) =>
  v.toLocaleString("fa-IR", { maximumFractionDigits: 1 });
export function DateBar({
  title,
  weekly = true,
}: {
  title: string;
  weekly?: boolean;
}) {
  const { date, week, setDate } = useSelectedDate();
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {weekly
            ? `${formatJalaliDate(fromLocalDate(week), "d MMMM")} تا ${formatJalaliDate(fromLocalDate(shiftDate(week, 6)))}`
            : formatJalaliDate(fromLocalDate(date))}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          aria-label={weekly ? "هفته قبل" : "روز قبل"}
          onClick={() => setDate(shiftDate(date, weekly ? -7 : -1))}
        >
          <ChevronRight size={18} />
        </Button>
        <Button
          variant="outline"
          onClick={() => setDate(localDate(new Date()))}
        >
          {weekly ? "این هفته" : "امروز"}
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={weekly ? "هفته بعد" : "روز بعد"}
          onClick={() => setDate(shiftDate(date, weekly ? 7 : 1))}
        >
          <ChevronLeft size={18} />
        </Button>
        <JalaliDatePicker value={date} onChange={setDate} />
      </div>
    </div>
  );
}
export function GoalCard({ week }: { week: string }) {
  const goal = useApi("getWeeklyGoal", { path: { weekStart: week } }),
    editor = useEditor();
  return (
    <section className="surface space-y-4 p-5">
      <div className="flex items-center gap-2">
        <BookOpen className="text-reading-foreground" size={21} />
        <h2>مطالعه این هفته</h2>
      </div>
      <QueryState query={goal} />
      {goal.data && (
        <>
          <p className="text-xs text-muted-foreground">
            مطالعه واقعی · هفته{" "}
            {formatJalaliDate(fromLocalDate(week), "d MMMM")}
          </p>
          {goal.data.unit && goal.data.target ? (
            <>
              <div className="flex items-baseline gap-1">
                <strong className="text-3xl">{number(goal.data.actual)}</strong>
                <span className="text-sm text-muted-foreground">
                  از {number(goal.data.target)} {units[goal.data.unit]}
                </span>
              </div>
              <progress
                className="h-2 w-full accent-primary"
                value={Math.min(goal.data.percent ?? 0, 100)}
                max={100}
                aria-label="پیشرفت مطالعه"
              />
              <p className="text-xs text-primary">
                {number(goal.data.percent ?? 0)}٪ پیشرفت
              </p>
              <p className="text-sm">
                {goal.data.remaining === 0
                  ? `هدف محقق شد · ${number(goal.data.percent ?? 0)}٪`
                  : `${number(goal.data.remaining ?? 0)} ${units[goal.data.unit]} تا هدف باقی مانده`}
              </p>
            </>
          ) : (
            <p className="text-sm leading-7 text-muted-foreground">
              هنوز هدفی برای این هفته مشخص نشده است. با یک هدف کوچک شروع کنید.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => editor.reading()}>ثبت مطالعه</Button>
            <Button variant="outline" onClick={() => editor.goal(goal.data)}>
              {goal.data.target ? "ویرایش هدف" : "تعیین هدف"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
export function EventCard({
  event,
  date,
}: {
  event: DTO["ScheduleEvent"];
  date: string;
}) {
  const editor = useEditor(),
    client = useQueryClient(),
    action = useFormAction(),
    [deleting, setDeleting] = useState(false),
    [scope, setScope] = useState<"" | "this" | "future">(""),
    [key] = useState(() => crypto.randomUUID()),
    [optimistic, setOptimistic] = useState<boolean | null>(null);
  const completed = optimistic ?? event.status === "completed";
  const deletionSeries = useRef<DTO["TaskSeries"] | null>(null);
  async function refresh() {
    await client.invalidateQueries({ queryKey: ["private"] });
  }
  const actions: { label: string; action: () => void }[] = [
    { label: "جزئیات و ویرایش", action: () => void editor.event(event) },
  ];
  if (event.kind === "task")
    actions.push(
      {
        label: "بازگشت به کارهای بدون زمان",
        action: () =>
          void action.run(async () => {
            await api("updateTaskOccurrence", {
              path: { id: event.id },
              version: event.version,
              body: { scheduledStartAt: null, scheduledEndAt: null },
            });
            await refresh();
          }),
      },
      {
        label: "افزودن / حذف از سه اولویت روز",
        action: () =>
          void action.run(async () => {
            const p = await api("getDailyPriorities", { path: { date } });
            const ids = p.occurrenceIds.includes(event.id)
              ? p.occurrenceIds.filter((id) => id !== event.id)
              : [...p.occurrenceIds, event.id];
            await api("setDailyPriorities", {
              path: { date },
              version: p.version,
              body: { occurrenceIds: ids },
            });
            await refresh();
          }),
      },
      { label: "حذف…", action: () => setDeleting(true) },
    );
  else
    actions.push({
      label: "لغو فقط همین رخداد / مرخصی",
      action: () => {
        if (window.confirm("فقط این رخداد لغو شود؟"))
          void action.run(async () => {
            let cursor: string | undefined,
              exception: DTO["OccurrenceException"] | undefined;
            do {
              const page = await api("listExceptions", {
                path: { id: event.seriesId! },
                query: { limit: 100, cursor },
              });
              exception = page.items.find(
                (e) => e.originalLocalDate === event.originalLocalDate,
              );
              cursor = page.nextCursor ?? undefined;
            } while (!exception && cursor);
            if (exception)
              await api("updateException", {
                path: { id: event.seriesId!, exceptionId: exception.id },
                version: exception.version,
                body: {
                  action: "cancel",
                  replacementStartAt: null,
                  replacementEndAt: null,
                },
              });
            else
              await api("createException", {
                path: { id: event.seriesId! },
                idempotencyKey: key,
                body: {
                  originalLocalDate: event.originalLocalDate!,
                  action: "cancel",
                },
              });
            await refresh();
          });
      },
    });
  if (event.category === "reading")
    actions.push({
      label: "ثبت مطالعه واقعی",
      action: () => editor.reading(undefined, event.id),
    });
  const color =
    event.kind === "work"
      ? "border-s-primary bg-work/40"
      : event.kind === "class"
        ? "border-s-blue-500 bg-university/40"
        : event.category === "reading"
          ? "border-s-purple-500 bg-reading/40"
          : "border-s-amber-500 bg-personal/30";
  return (
    <article className={`rounded-xl border border-s-4 p-3 ${color}`}>
      <div className="flex items-start gap-2">
        {event.kind === "task" ? (
          <Button
            variant="ghost"
            size="icon"
            disabled={action.pending}
            aria-label={completed ? "بازگشایی کار" : "انجام کار"}
            aria-pressed={completed}
            onClick={() =>
              void action.run(async () => {
                setOptimistic(!completed);
                try {
                  await api("updateTaskOccurrence", {
                    path: { id: event.id },
                    version: event.version,
                    body: { status: completed ? "incomplete" : "completed" },
                  });
                  await refresh();
                } finally {
                  setOptimistic(null);
                }
              })
            }
          >
            {completed ? <Check size={20} /> : <Circle size={20} />}
          </Button>
        ) : (
          <LockKeyhole className="mt-3 shrink-0" size={17} />
        )}
        <button
          className="min-w-0 flex-1 py-1 text-start"
          onClick={() => void editor.event(event)}
        >
          <span
            className={`block break-words text-sm font-semibold leading-6 ${completed ? "text-muted-foreground line-through" : ""}`}
          >
            {event.title}
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            <bdi>
              {formatTime(event.startAt)}–{formatTime(event.endAt)}
            </bdi>{" "}
            ·{" "}
            {event.kind === "work"
              ? "کار ثابت"
              : event.kind === "class"
                ? "کلاس ثابت"
                : categories[event.category]}
            {event.priority && ` · اولویت ${priorities[event.priority]}`}
            {localDate(new Date(event.startAt)) !==
              localDate(new Date(event.endAt)) && " · عبور از نیمه‌شب"}
          </span>
        </button>
        <ActionMenu
          trigger={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`گزینه‌های ${event.title}`}
              disabled={action.pending}
            >
              <MoreHorizontal size={18} />
            </Button>
          }
          actions={actions}
        />
      </div>
      <FormFeedback action={action} reload={() => void refresh()} />
      <Modal
        open={deleting}
        onOpenChange={(v) => !action.pending && setDeleting(v)}
        title="حذف کار"
        description="مطالعه ثبت‌شده حفظ می‌شود. حذف قابل بازگشت نیست."
      >
        {event.seriesId && (
          <label className="field mb-4">
            دامنه حذف
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value as typeof scope)}
            >
              <option value="">انتخاب کنید…</option>
              <option value="this">فقط این رخداد</option>
              <option value="future">این رخداد و آینده</option>
            </select>
          </label>
        )}
        <FormFeedback action={action} />
        <Button
          variant="destructive"
          disabled={action.pending || Boolean(event.seriesId && !scope)}
          onClick={() =>
            void action.run(async (confirmation) => {
              if (event.seriesId && scope === "future") {
                let cursor: string | undefined,
                  series: DTO["TaskSeries"] | undefined =
                    deletionSeries.current ?? undefined;
                while (!series) {
                  const page = await api("listTaskSeries", {
                    query: { limit: 100, cursor },
                  });
                  series = page.items.find((s) => s.id === event.seriesId);
                  cursor = page.nextCursor ?? undefined;
                  if (!cursor) break;
                }
                if (!series) throw new Error("قانون تکرار پیدا نشد.");
                deletionSeries.current = series;
                await api("deleteTaskSeries", {
                  path: { id: series.id },
                  version: series.version,
                  idempotencyKey: key,
                  body: {
                    scope: "future",
                    originalLocalDate: event.originalLocalDate!,
                    ...confirmation,
                  },
                });
              } else
                await api("deleteTaskOccurrence", {
                  path: { id: event.id },
                  version: event.version,
                });
              await refresh();
              setDeleting(false);
            })
          }
        >
          حذف را تأیید می‌کنم
        </Button>
      </Modal>
    </article>
  );
}
export function TaskRow({
  task,
  view = "all",
}: {
  task: DTO["Task"];
  view?: "all" | "unscheduled" | "scheduled" | "overdue" | "completed";
}) {
  const editor = useEditor(),
    [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b py-3 last:border-0">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-medium">{task.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {categories[task.category]} · {priorities[task.priority]}
            {task.recurring
              ? " · تکرارشونده"
              : task.status === "completed"
                ? " · انجام‌شده"
                : ""}
            {task.dueDate
              ? ` · مهلت ${formatJalaliDate(fromLocalDate(task.dueDate), "d MMMM")}`
              : ""}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            task.recurring ? setExpanded(!expanded) : void editor.editTask(task)
          }
        >
          {task.recurring ? "رخدادها" : "جزئیات"}
        </Button>
      </div>
      {expanded && <TaskOccurrences task={task} view={view} />}
    </div>
  );
}
function TaskOccurrences({
  task,
  view,
}: {
  task: DTO["Task"];
  view: "all" | "unscheduled" | "scheduled" | "overdue" | "completed";
}) {
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]),
    q = useApi("listTaskOccurrences", {
      query: { taskId: task.id, view, limit: 10, cursor: cursors.at(-1) },
    }),
    editor = useEditor();
  return (
    <div className="mt-3 space-y-2 rounded-lg bg-muted/50 p-3">
      <QueryState query={q} />
      {q.data?.items.map((o) => (
        <button
          key={o.id}
          className="block min-h-11 w-full rounded-lg bg-card p-3 text-start text-xs"
          onClick={() => void editor.editTask(task, o.id)}
        >
          {o.originalLocalDate
            ? formatJalaliDate(fromLocalDate(o.originalLocalDate))
            : "رخداد"}{" "}
          ·{" "}
          {o.status === "completed"
            ? "انجام‌شده"
            : o.scheduledStartAt
              ? formatTime(o.scheduledStartAt)
              : "بدون زمان"}
        </button>
      ))}
      {q.data && !q.data.items.length && (
        <p className="text-xs leading-6">
          رخدادی در این فیلتر نیست. برای ایجاد رخدادهای آینده، هفته مربوط را در
          تقویم باز کنید.
        </p>
      )}
      <div className="flex gap-2">
        {cursors.length > 1 && (
          <Button
            variant="ghost"
            onClick={() => setCursors(cursors.slice(0, -1))}
          >
            قبلی
          </Button>
        )}
        {q.data?.nextCursor && (
          <Button
            variant="ghost"
            onClick={() => setCursors([...cursors, q.data.nextCursor!])}
          >
            بعدی
          </Button>
        )}
      </div>
    </div>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-dashed p-5 text-center text-sm leading-7 text-muted-foreground">
      {children}
    </p>
  );
}
