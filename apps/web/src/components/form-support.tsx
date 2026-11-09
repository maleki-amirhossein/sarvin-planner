"use client";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { formatJalaliDate, formatTime } from "@/lib/dates";
import { Button } from "./ui/button";
export type Confirmation = {
  conflictSnapshot?: string;
  acknowledgeAffectedOccurrenceIds?: string[];
};
export function useFormAction() {
  const [pending, setPending] = useState(false),
    [error, setError] = useState<Error | null>(null);
  const busy = useRef(false);
  const job = useRef<((confirmation: Confirmation) => Promise<void>) | null>(
    null,
  );
  async function run(
    action: (confirmation: Confirmation) => Promise<void>,
    confirmation: Confirmation = {},
  ) {
    if (busy.current) return;
    busy.current = true;
    job.current = action;
    setPending(true);
    setError(null);
    try {
      await action(confirmation);
    } catch (value) {
      setError(
        value instanceof Error ? value : new Error("درخواست انجام نشد."),
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return {
    pending,
    error,
    run,
    reset: () => setError(null),
    confirm: () => {
      if (!job.current || !(error instanceof ApiError)) return;
      const details = error.payload.details;
      return run(job.current, {
        conflictSnapshot: details?.conflictSnapshot,
        acknowledgeAffectedOccurrenceIds: details?.affectedOccurrences?.map(
          (o) => o.id,
        ),
      });
    },
  };
}
export function FormFeedback({
  action,
  reload,
}: {
  action: ReturnType<typeof useFormAction>;
  reload?: () => void;
}) {
  if (!action.error) return null;
  const details =
    action.error instanceof ApiError ? action.error.payload.details : undefined;
  const errors =
    action.error instanceof ApiError
      ? action.error.payload.fieldErrors
      : undefined;
  const names: Record<string, string> = {
    title: "عنوان",
    description: "یادداشت",
    estimateMinutes: "زمان تخمینی",
    dueDate: "مهلت",
    target: "مقدار هدف",
    pages: "صفحات",
    weekdays: "روزهای تکرار",
    startedAt: "شروع مطالعه",
    endedAt: "پایان مطالعه",
    localStartTime: "ساعت شروع",
    localEndTime: "ساعت پایان",
    effectiveFrom: "شروع برنامه",
    effectiveUntil: "پایان برنامه",
    totalPages: "کل صفحات",
    currentPage: "صفحه فعلی",
    durationMinutes: "مدت",
    email: "ایمیل",
    password: "رمز عبور",
  };
  return (
    <div
      role="alert"
      className="space-y-3 rounded-lg border border-destructive/30 bg-red-50 p-3 text-sm"
    >
      <p className="text-destructive">{action.error.message}</p>
      {errors && (
        <ul>
          {Object.entries(errors).map(([field, messages]) => (
            <li key={field}>
              {names[field.split(".").at(-1)!] ?? "اطلاعات فرم"}:{" "}
              {messages.join(" ")}
            </li>
          ))}
        </ul>
      )}
      {details?.conflicts && (
        <ul className="space-y-2">
          {details.conflicts.map((c) => (
            <li key={c.occurrenceKey}>
              <strong>{c.title}</strong>
              <span className="block text-xs">
                {formatJalaliDate(new Date(c.startAt), "EEEE d MMMM")} ·{" "}
                <bdi>
                  {formatTime(new Date(c.startAt))}–
                  {formatTime(new Date(c.endAt))}
                </bdi>
              </span>
            </li>
          ))}
        </ul>
      )}
      {details?.affectedOccurrences && (
        <ul>
          {details.affectedOccurrences.map((o) => (
            <li key={o.id}>
              {o.snapshot.title} ·{" "}
              {o.scheduledStartAt
                ? formatJalaliDate(new Date(o.scheduledStartAt))
                : "بدون زمان"}
            </li>
          ))}
        </ul>
      )}
      {(details?.conflictSnapshot || details?.affectedOccurrences) && (
        <Button
          variant="destructive"
          disabled={action.pending}
          onClick={() => void action.confirm()}
        >
          بررسی کردم؛ تأیید تغییر
        </Button>
      )}
      {action.error instanceof ApiError &&
        action.error.payload.code === "STALE_VERSION" &&
        !details?.affectedOccurrences && (
          <Button
            variant="outline"
            onClick={
              reload ??
              (() => {
                if (
                  window.confirm(
                    "برای بارگیری اطلاعات تازه، صفحه بازخوانی می‌شود و پیش‌نویس این فرم کنار گذاشته خواهد شد. ادامه می‌دهید؟",
                  )
                )
                  window.location.reload();
              })
            }
          >
            بارگیری نسخه تازه
          </Button>
        )}
    </div>
  );
}
export function useDirtyGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  return () => !dirty || window.confirm("تغییرات ذخیره‌نشده کنار گذاشته شوند؟");
}
export const categories = {
  personal: "شخصی",
  reading: "مطالعه",
  work: "کار",
  university: "دانشگاه",
  music: "موسیقی",
  other: "سایر",
};
export const priorities = { low: "کم", normal: "معمولی", high: "زیاد" };
export const units = { minutes: "دقیقه", pages: "صفحه", sessions: "جلسه" };
export function TimeInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      dir="ltr"
      pattern="([01۰-۱][0-9۰-۹]|2[0-3]|۲[۰-۳]):[0-5۰-۵][0-9۰-۹]"
      placeholder="14:30"
    />
  );
}
export function Weekdays({
  value,
  onChange,
}: {
  value: number[];
  onChange: (value: number[]) => void;
}) {
  const days = [
    [6, "شنبه"],
    [7, "یکشنبه"],
    [1, "دوشنبه"],
    [2, "سه‌شنبه"],
    [3, "چهارشنبه"],
    [4, "پنجشنبه"],
    [5, "جمعه"],
  ] as const;
  return (
    <fieldset>
      <legend className="mb-2 text-sm">روزهای تکرار</legend>
      <div className="flex flex-wrap gap-1">
        {days.map(([id, label]) => (
          <Button
            key={id}
            variant={value.includes(id) ? "default" : "outline"}
            aria-pressed={value.includes(id)}
            onClick={() =>
              onChange(
                value.includes(id)
                  ? value.filter((d) => d !== id)
                  : [...value, id],
              )
            }
          >
            {label}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}
