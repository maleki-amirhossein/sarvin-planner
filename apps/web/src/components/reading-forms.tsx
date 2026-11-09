"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, type DTO } from "@/lib/api";
import { useApi } from "@/lib/queries";
import {
  formatJalaliDate,
  fromLocalDate,
  inputInstant,
  latinDigits,
  localDate,
  localTime,
} from "@/lib/dates";
import { Button } from "./ui/button";
import { Modal } from "./ui/overlays";
import { JalaliDatePicker } from "./jalali-date-picker";
import {
  FormFeedback,
  TimeInput,
  units,
  useDirtyGuard,
  useFormAction,
} from "./form-support";
export function ReadingForm({
  initial,
  occurrenceId,
  active,
  close,
}: {
  initial?: DTO["ReadingSession"];
  occurrenceId?: string;
  active: boolean;
  close: () => void;
}) {
  const now = new Date(),
    start = initial
      ? new Date(initial.startedAt)
      : new Date(now.getTime() - 30 * 60000);
  const [day, setDay] = useState(localDate(start)),
    [time, setTime] = useState(localTime(start)),
    [duration, setDuration] = useState(String(initial?.durationMinutes ?? 30)),
    [pages, setPages] = useState(String(initial?.pages ?? "")),
    [bookId, setBook] = useState(initial?.bookId ?? ""),
    [topic, setTopic] = useState(initial?.topic ?? ""),
    [note, setNote] = useState(initial?.note ?? ""),
    [dirty, setDirty] = useState(false),
    [key] = useState(() => crypto.randomUUID());
  const books = useApi("listBooks", { query: { limit: 100 } }),
    action = useFormAction(),
    client = useQueryClient(),
    mayClose = useDirtyGuard(dirty);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await action.run(async () => {
      const startedAt = inputInstant(day, time),
        minutes = Number(latinDigits(duration));
      if (!(minutes > 0 && minutes <= 1440))
        throw new Error("مدت مطالعه باید بین ۱ و ۱۴۴۰ دقیقه باشد.");
      const body = {
        startedAt,
        endedAt: new Date(
          new Date(startedAt).getTime() + minutes * 60000,
        ).toISOString(),
        pages: pages ? Number(latinDigits(pages)) : null,
        bookId: bookId || null,
        topic: topic.trim() || null,
        note: note.trim() || null,
        occurrenceId: initial?.occurrenceId ?? occurrenceId ?? null,
      };
      if (initial)
        await api("updateReadingSession", {
          path: { id: initial.id },
          version: initial.version,
          body,
        });
      else await api("createReadingSession", { body, idempotencyKey: key });
      await client.invalidateQueries({ queryKey: ["private"] });
      setDirty(false);
      close();
    });
  }
  return (
    <Modal
      open={active}
      onOpenChange={(v) => {
        if (!v && !action.pending && mayClose()) close();
      }}
      title={initial ? "ویرایش مطالعه واقعی" : "ثبت مطالعه واقعی"}
      description="فقط زمانی را ثبت کنید که واقعاً مطالعه کرده‌اید؛ زمان رزروشده در تقویم جداست."
    >
      <form
        onSubmit={submit}
        onChange={() => {
          setDirty(true);
          action.reset();
        }}
        className="space-y-4"
      >
        <fieldset disabled={action.pending} className="space-y-4">
          <label className="field">
            روز شروع
            <JalaliDatePicker
              value={day}
              onChange={(v) => {
                setDay(v);
                setDirty(true);
                action.reset();
              }}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="field">
              ساعت شروع
              <TimeInput
                required
                value={time}
                onChange={(e) => setTime(latinDigits(e.target.value))}
              />
            </label>
            <label className="field">
              مدت واقعی (دقیقه)
              <input
                required
                inputMode="decimal"
                value={duration}
                onChange={(e) => setDuration(latinDigits(e.target.value))}
              />
            </label>
          </div>
          <label className="field">
            کتاب یا موضوع
            <select value={bookId} onChange={(e) => setBook(e.target.value)}>
              <option value="">بدون کتاب</option>
              {initial?.bookId &&
                !books.data?.items.some((b) => b.id === initial.bookId) && (
                  <option value={initial.bookId}>
                    {initial.bookTitleSnapshot ?? "کتاب بایگانی‌شده"}
                  </option>
                )}
              {books.data?.items.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            موضوع (اختیاری)
            <input
              maxLength={200}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </label>
          <label className="field">
            تعداد صفحه خوانده‌شده (اختیاری)
            <input
              inputMode="numeric"
              value={pages}
              onChange={(e) => setPages(latinDigits(e.target.value))}
            />
          </label>
          <label className="field">
            چه یاد گرفتم؟
            <textarea
              rows={3}
              maxLength={5000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </fieldset>
        <FormFeedback action={action} />
        <Button type="submit" disabled={action.pending} className="w-full">
          {action.pending ? "در حال ثبت…" : "ذخیره مطالعه"}
        </Button>
      </form>
    </Modal>
  );
}
export function GoalForm({
  initial,
  active,
  close,
}: {
  initial: DTO["GoalState"];
  active: boolean;
  close: () => void;
}) {
  const [target, setTarget] = useState(String(initial.target ?? "")),
    [unit, setUnit] = useState<"minutes" | "pages" | "sessions">(
      initial.unit ?? "minutes",
    ),
    [dirty, setDirty] = useState(false);
  const action = useFormAction(),
    client = useQueryClient(),
    mayClose = useDirtyGuard(dirty);
  return (
    <Modal
      open={active}
      onOpenChange={(v) => {
        if (!v && !action.pending && mayClose()) close();
      }}
      title="هدف مطالعه این هفته"
      description={`هفته ${formatJalaliDate(fromLocalDate(initial.weekStart))}؛ هفته‌های دیگر تغییر نمی‌کنند.`}
    >
      <form
        className="space-y-4"
        onChange={() => {
          setDirty(true);
          action.reset();
        }}
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(async () => {
            await api("setWeeklyGoal", {
              path: { weekStart: initial.weekStart },
              version: initial.version,
              body: { unit, target: Number(latinDigits(target)) },
            });
            await client.invalidateQueries({ queryKey: ["private"] });
            setDirty(false);
            close();
          });
        }}
      >
        <label className="field">
          مقدار هدف
          <input
            required
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(latinDigits(e.target.value))}
          />
        </label>
        <label className="field">
          واحد
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as typeof unit)}
          >
            {Object.entries(units).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <FormFeedback action={action} />
        <Button type="submit" disabled={action.pending} className="w-full">
          ذخیره هدف
        </Button>
      </form>
    </Modal>
  );
}
export function BookForm({
  initial,
  active,
  close,
}: {
  initial?: DTO["Book"];
  active: boolean;
  close: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? ""),
    [author, setAuthor] = useState(initial?.author ?? ""),
    [total, setTotal] = useState(String(initial?.totalPages ?? "")),
    [page, setPage] = useState(String(initial?.currentPage ?? "")),
    [status, setStatus] = useState(initial?.status ?? "reading"),
    [dirty, setDirty] = useState(false),
    [key] = useState(() => crypto.randomUUID());
  const action = useFormAction(),
    client = useQueryClient(),
    mayClose = useDirtyGuard(dirty);
  return (
    <Modal
      open={active}
      title={initial ? "ویرایش کتاب یا موضوع" : "کتاب یا موضوع تازه"}
      onOpenChange={(v) => {
        if (!v && !action.pending && mayClose()) close();
      }}
    >
      <form
        className="space-y-4"
        onChange={() => {
          setDirty(true);
          action.reset();
        }}
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(async () => {
            const body = {
              title: title.trim(),
              author: author.trim() || null,
              totalPages: total ? Number(latinDigits(total)) : null,
              currentPage: page ? Number(latinDigits(page)) : null,
              status,
            };
            if (initial)
              await api("updateBook", {
                path: { id: initial.id },
                version: initial.version,
                body,
              });
            else await api("createBook", { body, idempotencyKey: key });
            await client.invalidateQueries({ queryKey: ["private"] });
            setDirty(false);
            close();
          });
        }}
      >
        <label className="field">
          عنوان
          <input
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <label className="field">
          نویسنده
          <input
            maxLength={200}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="field">
            تعداد کل صفحات
            <input
              inputMode="numeric"
              value={total}
              onChange={(e) => setTotal(latinDigits(e.target.value))}
            />
          </label>
          <label className="field">
            صفحه فعلی
            <input
              inputMode="numeric"
              value={page}
              onChange={(e) => setPage(latinDigits(e.target.value))}
            />
          </label>
        </div>
        <label className="field">
          وضعیت
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
          >
            <option value="reading">در حال مطالعه</option>
            <option value="finished">تمام‌شده</option>
            <option value="archived">بایگانی‌شده</option>
          </select>
        </label>
        <FormFeedback action={action} />
        <Button type="submit" disabled={action.pending} className="w-full">
          ذخیره
        </Button>
      </form>
    </Modal>
  );
}
