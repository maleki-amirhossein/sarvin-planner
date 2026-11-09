"use client";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, type DTO } from "@/lib/api";
import {
  formatJalaliDate,
  fromLocalDate,
  inputInstant,
  latinDigits,
  localDate,
  localTime,
  shiftDate,
} from "@/lib/dates";
import { JalaliDatePicker } from "./jalali-date-picker";
import { Modal } from "./ui/overlays";
import { Button } from "./ui/button";
import {
  categories,
  priorities,
  TimeInput,
  Weekdays,
  FormFeedback,
  useDirtyGuard,
  useFormAction,
} from "./form-support";
export type TaskDraft = {
  task?: DTO["Task"];
  occurrence?: DTO["ScheduledTaskOccurrence"];
  series?: DTO["TaskSeries"];
  date?: string;
  startAt?: string;
  endAt?: string;
  category?: DTO["Task"]["category"];
  scheduled?: boolean;
};
export function TaskForm({
  initial,
  active,
  close,
  reload,
}: {
  initial: TaskDraft;
  active: boolean;
  close: () => void;
  reload: () => void;
}) {
  const recurring = Boolean(initial.occurrence?.seriesId);
  const definition = recurring ? initial.occurrence!.snapshot : initial.task;
  const start = initial.startAt ?? initial.occurrence?.scheduledStartAt;
  const end = initial.endAt ?? initial.occurrence?.scheduledEndAt;
  const [title, setTitle] = useState(definition?.title ?? ""),
    [description, setDescription] = useState(definition?.description ?? ""),
    [category, setCategory] = useState<DTO["Task"]["category"]>(
      definition?.category ?? initial.category ?? "personal",
    ),
    [priority, setPriority] = useState<DTO["Task"]["priority"]>(
      definition?.priority ?? "normal",
    );
  const [estimate, setEstimate] = useState(
      String(definition?.estimateMinutes ?? ""),
    ),
    [due, setDue] = useState(
      definition?.dueDate ?? initial.date ?? localDate(new Date()),
    ),
    [useDue, setUseDue] = useState(Boolean(definition?.dueDate));
  const [day, setDay] = useState(
      start
        ? localDate(new Date(start))
        : (initial.date ?? localDate(new Date())),
    ),
    [startTime, setStartTime] = useState(
      start ? localTime(new Date(start)) : "14:00",
    ),
    [endTime, setEndTime] = useState(end ? localTime(new Date(end)) : "15:00"),
    [nextDay, setNextDay] = useState(
      Boolean(
        start && end && localDate(new Date(start)) !== localDate(new Date(end)),
      ),
    );
  const [scheduled, setScheduled] = useState(
      Boolean(start || initial.scheduled),
    ),
    [repeat, setRepeat] = useState(false),
    [weekdays, setWeekdays] = useState(
      initial.series?.weekdays ?? [6, 7, 1, 2, 3, 4, 5],
    );
  const [until, setUntil] = useState(
      initial.series?.effectiveUntil ?? shiftDate(day, 90),
    ),
    [hasUntil, setHasUntil] = useState(Boolean(initial.series?.effectiveUntil)),
    [scope, setScope] = useState<"" | "this" | "future">("");
  const [preview, setPreview] = useState<DTO["RecurrencePreview"] | null>(null),
    [dirty, setDirty] = useState(false),
    [savedCapture, setSavedCapture] = useState(false);
  const [key] = useState(() => crypto.randomUUID()),
    [seriesKey] = useState(() => crypto.randomUUID()),
    [scheduleKey] = useState(() => crypto.randomUUID());
  const task = useRef(initial.task),
    occurrence = useRef<
      | {
          id: string;
          version: number;
          scheduledStartAt: string | null;
          scheduledEndAt: string | null;
        }
      | undefined
    >(initial.occurrence);
  const metadata = useRef(
    JSON.stringify(
      definition
        ? {
            title: definition.title,
            description: definition.description ?? null,
            category: definition.category ?? "personal",
            priority: definition.priority ?? "normal",
            estimateMinutes: definition.estimateMinutes ?? null,
            dueDate: definition.dueDate ?? null,
          }
        : null,
    ),
  );
  const action = useFormAction(),
    mayClose = useDirtyGuard(dirty),
    client = useQueryClient();
  const changed = () => {
    setDirty(true);
    action.reset();
    setPreview(null);
  };
  function values(): DTO["TaskCreate"] {
    return {
      title: title.trim(),
      description: description.trim() || null,
      category,
      priority,
      estimateMinutes: estimate ? Number(latinDigits(estimate)) : null,
      dueDate: useDue ? due : null,
    };
  }
  function interval() {
    const startAt = inputInstant(day, startTime),
      endAt = inputInstant(nextDay ? shiftDate(day, 1) : day, endTime);
    if (new Date(endAt) <= new Date(startAt))
      throw new Error(
        "پایان باید بعد از شروع باشد؛ برای عبور از نیمه‌شب، روز بعد را انتخاب کنید.",
      );
    return {
      scheduledStartAt: startAt,
      scheduledEndAt: endAt,
      durationMinutes:
        (new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000,
    };
  }
  async function previewRule() {
    await action.run(async () => {
      const times = interval();
      setPreview(
        await api("previewRecurrence", {
          body: {
            rule: {
              template: values(),
              weekdays,
              timezone: "Asia/Tehran",
              effectiveFrom: day,
              effectiveUntil: hasUntil ? until : null,
              localStartTime: latinDigits(startTime),
              durationMinutes: times.durationMinutes,
            },
            from: inputInstant(day, "00:00"),
            to: inputInstant(shiftDate(day, 21), "00:00"),
          },
        }),
      );
    });
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    await action.run(async (confirmation) => {
      const data = values();
      if (!data.title) throw new Error("عنوان کار را وارد کنید.");
      if (recurring) {
        if (!scope)
          throw new Error(
            "مشخص کنید تغییر فقط برای این رخداد است یا رخدادهای آینده.",
          );
        if (scope === "future") {
          if (
            !initial.series ||
            !initial.occurrence?.originalLocalDate ||
            !scheduled
          )
            throw new Error(
              "برای تغییر آینده، یک برنامه فعال با زمان مشخص انتخاب کنید.",
            );
          const times = interval();
          await api("updateTaskSeries", {
            path: { id: initial.series.id },
            version: initial.series.version,
            idempotencyKey: seriesKey,
            body: {
              scope: "future",
              originalLocalDate: initial.occurrence.originalLocalDate,
              template: data,
              weekdays,
              localStartTime: latinDigits(startTime),
              durationMinutes: times.durationMinutes,
              effectiveUntil: hasUntil ? until : null,
              ...confirmation,
            },
          });
        } else {
          const times = scheduled ? interval() : null;
          await api("updateTaskOccurrence", {
            path: { id: initial.occurrence!.id },
            version: initial.occurrence!.version,
            idempotencyKey: scheduleKey,
            body: {
              snapshot: data,
              scheduledStartAt: times?.scheduledStartAt ?? null,
              scheduledEndAt: times?.scheduledEndAt ?? null,
              ...confirmation,
            },
          });
        }
      } else {
        if (!task.current) {
          task.current = await api("createTask", {
            body: data,
            idempotencyKey: key,
          });
          occurrence.current = {
            id: task.current.oneOffOccurrenceId!,
            version: 1,
            scheduledStartAt: null,
            scheduledEndAt: null,
          };
          metadata.current = JSON.stringify(data);
          setSavedCapture(true);
        } else if (metadata.current !== JSON.stringify(data)) {
          task.current = await api("updateTask", {
            path: { id: task.current.id },
            version: task.current.version,
            body: data,
          });
          metadata.current = JSON.stringify(data);
          if (occurrence.current) occurrence.current.version++;
        }
        if (repeat) {
          const times = interval();
          await api("createTaskSeries", {
            idempotencyKey: seriesKey,
            body: {
              taskId: task.current.id,
              template: data,
              weekdays,
              timezone: "Asia/Tehran",
              effectiveFrom: day,
              effectiveUntil: hasUntil ? until : null,
              localStartTime: latinDigits(startTime),
              durationMinutes: times.durationMinutes,
              ...confirmation,
            },
          });
        } else {
          const times = scheduled ? interval() : null;
          if (times || occurrence.current?.scheduledStartAt) {
            const current = occurrence.current!;
            const result = await api("updateTaskOccurrence", {
              path: { id: current.id },
              version: current.version,
              idempotencyKey: scheduleKey,
              body: {
                scheduledStartAt: times?.scheduledStartAt ?? null,
                scheduledEndAt: times?.scheduledEndAt ?? null,
                ...confirmation,
              },
            });
            occurrence.current = result;
          }
        }
      }
      await client.invalidateQueries({ queryKey: ["private"] });
      setDirty(false);
      close();
    });
  }
  async function occurrenceAction(remove = false) {
    if (!initial.occurrence || !mayClose()) return;
    if (
      remove &&
      !window.confirm(
        recurring
          ? "فقط همین رخداد حذف شود؟ مطالعه ثبت‌شده حفظ می‌شود."
          : "این کار حذف شود؟ مطالعه ثبت‌شده حفظ می‌شود.",
      )
    )
      return;
    await action.run(async () => {
      if (remove) {
        if (recurring)
          await api("deleteTaskOccurrence", {
            path: { id: initial.occurrence!.id },
            version: initial.occurrence!.version,
          });
        else
          await api("deleteTask", {
            path: { id: initial.task!.id },
            version: initial.task!.version,
          });
      } else
        await api("updateTaskOccurrence", {
          path: { id: initial.occurrence!.id },
          version: initial.occurrence!.version,
          body: {
            status:
              initial.occurrence!.status === "completed"
                ? "incomplete"
                : "completed",
          },
        });
      await client.invalidateQueries({ queryKey: ["private"] });
      setDirty(false);
      close();
    });
  }
  const recurrenceControls = repeat || (recurring && scope === "future");
  return (
    <Modal
      open={active}
      onOpenChange={(open) => {
        if (!open && !action.pending && mayClose()) close();
      }}
      title={initial.task ? "جزئیات و ویرایش کار" : "یک کار تازه"}
      description="فقط عنوان کافی است. زمان، تکرار و جزئیات را هر وقت خواستید اضافه کنید."
    >
      <form onSubmit={submit} onChange={changed} className="space-y-4">
        <fieldset disabled={action.pending} className="space-y-4">
          <label className="field">
            عنوان
            <input
              required
              maxLength={200}
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="field">
            یادداشت
            <textarea
              rows={3}
              maxLength={5000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="field">
              دسته
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as typeof category)}
              >
                {Object.entries(categories).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              اولویت
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as typeof priority)}
              >
                {Object.entries(priorities).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            زمان تخمینی (دقیقه، اختیاری)
            <input
              inputMode="numeric"
              value={estimate}
              onChange={(e) => setEstimate(latinDigits(e.target.value))}
            />
          </label>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={useDue}
              onChange={(e) => setUseDue(e.target.checked)}
            />
            مهلت انجام
          </label>
          {useDue && (
            <JalaliDatePicker
              value={due}
              onChange={(v) => {
                setDue(v);
                changed();
              }}
            />
          )}
          {recurring && (
            <label className="field">
              دامنه تغییر
              <select
                required
                value={scope}
                onChange={(e) => setScope(e.target.value as typeof scope)}
              >
                <option value="">انتخاب کنید…</option>
                <option value="this">فقط این رخداد</option>
                {initial.series && (
                  <option value="future">
                    این رخداد و آینده؛ گذشته حفظ می‌شود
                  </option>
                )}
              </select>
            </label>
          )}
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={scheduled || repeat}
              onChange={(e) => {
                setScheduled(e.target.checked);
                if (!e.target.checked) setRepeat(false);
              }}
            />
            قرار دادن در تقویم
          </label>
          {(scheduled || repeat) && (
            <div className="space-y-3 rounded-lg bg-muted/60 p-3">
              <label className="field">
                روز
                <JalaliDatePicker
                  value={day}
                  onChange={(v) => {
                    setDay(v);
                    changed();
                  }}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="field">
                  شروع
                  <TimeInput
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(latinDigits(e.target.value))}
                  />
                </label>
                <label className="field">
                  پایان
                  <TimeInput
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(latinDigits(e.target.value))}
                  />
                </label>
              </div>
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={nextDay}
                  onChange={(e) => setNextDay(e.target.checked)}
                />
                پایان در روز بعد
              </label>
              {!recurring && (
                <label className="flex min-h-11 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={repeat}
                    onChange={(e) => setRepeat(e.target.checked)}
                  />
                  تکرار هفتگی
                </label>
              )}
            </div>
          )}
          {recurrenceControls && (
            <div className="space-y-3">
              <Weekdays
                value={weekdays}
                onChange={(v) => {
                  setWeekdays(v);
                  changed();
                }}
              />
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasUntil}
                  onChange={(e) => setHasUntil(e.target.checked)}
                />
                تاریخ پایان تکرار
              </label>
              {hasUntil && (
                <JalaliDatePicker
                  value={until}
                  onChange={(v) => {
                    setUntil(v);
                    changed();
                  }}
                />
              )}
              <Button variant="outline" onClick={previewRule}>
                پیش‌نمایش سه هفته آینده
              </Button>
              {preview && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p>
                    {preview.events.length.toLocaleString("fa-IR")} رخداد ·{" "}
                    {preview.conflicts.length.toLocaleString("fa-IR")} تداخل در
                    بازه پیش‌نمایش
                  </p>
                  <ul>
                    {preview.events.slice(0, 7).map((e) => (
                      <li key={e.id}>
                        {formatJalaliDate(new Date(e.startAt), "EEEE d MMMM")} ·{" "}
                        {localTime(new Date(e.startAt))}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {recurring && (
            <p className="text-xs leading-6 text-muted-foreground">
              رخدادهای انجام‌شده یا جداگانه ویرایش‌شده با تغییر قانون آینده
              بازنویسی نمی‌شوند. مبدأ رخداد:{" "}
              {formatJalaliDate(
                fromLocalDate(initial.occurrence!.originalLocalDate!),
                "d MMMM yyyy",
              )}
            </p>
          )}
        </fieldset>
        {savedCapture && action.error && (
          <p role="status" className="text-sm">
            کار در فهرست ثبت شده است؛ تنظیم زمان هنوز تکمیل نشده است.
          </p>
        )}
        <FormFeedback action={action} reload={reload} />
        {initial.occurrence && (
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button
              variant="outline"
              disabled={action.pending}
              onClick={() => void occurrenceAction()}
            >
              {initial.occurrence.status === "completed"
                ? "بازگشایی"
                : "انجام شد"}
              {recurring ? " · فقط این رخداد" : ""}
            </Button>
            <Button
              variant="ghost"
              disabled={action.pending}
              onClick={() => void occurrenceAction(true)}
            >
              {recurring ? "حذف فقط این رخداد" : "حذف کار"}
            </Button>
          </div>
        )}
        <div className="sticky bottom-0 flex gap-2 border-t bg-card pt-3 pb-[env(safe-area-inset-bottom)]">
          <Button type="submit" disabled={action.pending} className="flex-1">
            {action.pending ? "در حال ذخیره…" : "ذخیره کار"}
          </Button>
          <Button
            variant="outline"
            disabled={action.pending}
            onClick={() => {
              if (mayClose()) close();
            }}
          >
            انصراف
          </Button>
        </div>
      </form>
    </Modal>
  );
}
