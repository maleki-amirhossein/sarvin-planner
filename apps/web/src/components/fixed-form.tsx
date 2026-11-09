"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, type DTO } from "@/lib/api";
import {
  formatJalaliDate,
  inputInstant,
  latinDigits,
  localDate,
  localTime,
  shiftDate,
  startOfTehranWeek,
  fromLocalDate,
} from "@/lib/dates";
import { Button } from "./ui/button";
import { Modal } from "./ui/overlays";
import { JalaliDatePicker } from "./jalali-date-picker";
import {
  FormFeedback,
  TimeInput,
  Weekdays,
  useDirtyGuard,
  useFormAction,
} from "./form-support";
export function FixedForm({
  initial,
  exception,
  occurrenceDate,
  active,
  close,
}: {
  initial?: DTO["FixedSeries"];
  exception?: DTO["OccurrenceException"];
  occurrenceDate?: string;
  active: boolean;
  close: () => void;
}) {
  const [kind, setKind] = useState<"work" | "class">(initial?.kind ?? "class"),
    [title, setTitle] = useState(
      exception?.replacementTitle ?? initial?.title ?? "",
    ),
    [location, setLocation] = useState(initial?.location ?? ""),
    [notes, setNotes] = useState(initial?.notes ?? ""),
    [days, setDays] = useState(initial?.weekdays ?? [6]),
    [start, setStart] = useState(
      exception?.replacementStartAt
        ? localTime(new Date(exception.replacementStartAt))
        : (initial?.localStartTime ?? "08:00"),
    ),
    [end, setEnd] = useState(
      exception?.replacementEndAt
        ? localTime(new Date(exception.replacementEndAt))
        : (initial?.localEndTime ?? "09:00"),
    ),
    [next, setNext] = useState(
      exception?.replacementStartAt && exception?.replacementEndAt
        ? localDate(new Date(exception.replacementStartAt)) !==
            localDate(new Date(exception.replacementEndAt))
        : (initial?.endsNextDay ?? false),
    ),
    [from, setFrom] = useState(
      occurrenceDate ?? initial?.effectiveFrom ?? localDate(new Date()),
    ),
    [until, setUntil] = useState(
      initial?.effectiveUntil ?? shiftDate(localDate(new Date()), 90),
    ),
    [hasEnd, setHasEnd] = useState(initial?.effectiveUntil != null || !initial),
    [every, setEvery] = useState(initial?.everyWeeks ?? 1),
    [anchor, setAnchor] = useState(
      initial?.anchorWeekStart ?? localDate(startOfTehranWeek(new Date())),
    ),
    [parity, setParity] = useState(initial?.parity ?? 0),
    [scope, setScope] = useState<"" | "this" | "future">(""),
    [preview, setPreview] = useState<DTO["RecurrencePreview"] | null>(null),
    [dirty, setDirty] = useState(false),
    [key] = useState(() => crypto.randomUUID());
  const [replacementDay, setReplacementDay] = useState(
    exception?.replacementStartAt
      ? localDate(new Date(exception.replacementStartAt))
      : (occurrenceDate ?? localDate(new Date())),
  );
  const action = useFormAction(),
    client = useQueryClient(),
    mayClose = useDirtyGuard(dirty);
  function values(): DTO["FixedSeriesCreate"] {
    return {
      kind,
      title: title.trim(),
      location: location.trim() || null,
      notes: notes.trim() || null,
      weekdays: days,
      timezone: "Asia/Tehran",
      effectiveFrom: from,
      effectiveUntil: hasEnd ? until : null,
      localStartTime: latinDigits(start),
      localEndTime: latinDigits(end),
      endsNextDay: next,
      everyWeeks: every,
      anchorWeekStart: every === 2 ? anchor : null,
      parity: every === 2 ? parity : null,
    };
  }
  const changed = () => {
    setDirty(true);
    setPreview(null);
    action.reset();
  };
  return (
    <Modal
      open={active}
      title={initial ? "ویرایش برنامه ثابت" : "برنامه ثابت تازه"}
      description="کار و کلاس قفل هستند و فقط از این فرم تغییر می‌کنند."
      onOpenChange={(v) => {
        if (!v && !action.pending && mayClose()) close();
      }}
    >
      <form
        className="space-y-4"
        onChange={changed}
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(async (confirmation) => {
            if (initial && !scope)
              throw new Error("دامنه تغییر را انتخاب کنید.");
            if (every === 2 && scope !== "this" && !preview)
              throw new Error(
                "پیش از ذخیره برنامه یک‌هفته‌درمیان، پیش‌نمایش را بررسی کنید.",
              );
            const body = values();
            if (initial) {
              if (scope === "this") {
                const replacement = {
                  action: "override" as const,
                  replacementTitle: body.title,
                  replacementStartAt: inputInstant(
                    replacementDay,
                    body.localStartTime,
                  ),
                  replacementEndAt: inputInstant(
                    next ? shiftDate(replacementDay, 1) : replacementDay,
                    body.localEndTime,
                  ),
                  ...confirmation,
                };
                if (exception)
                  await api("updateException", {
                    path: { id: initial.id, exceptionId: exception.id },
                    version: exception.version,
                    body: replacement,
                  });
                else
                  await api("createException", {
                    path: { id: initial.id },
                    idempotencyKey: key,
                    body: { originalLocalDate: from, ...replacement },
                  });
              } else {
                const { kind: _kind, effectiveFrom: _from, ...patch } = body;
                void _kind;
                void _from;
                await api("updateFixedSchedule", {
                  path: { id: initial.id },
                  version: initial.version,
                  idempotencyKey: key,
                  body: {
                    ...patch,
                    scope: "future",
                    originalLocalDate: from,
                    ...confirmation,
                  },
                });
              }
            } else
              await api("createFixedSchedule", {
                body: { ...body, ...confirmation },
                idempotencyKey: key,
              });
            await client.invalidateQueries({ queryKey: ["private"] });
            setDirty(false);
            close();
          });
        }}
      >
        <fieldset disabled={action.pending} className="space-y-4">
          {!initial && (
            <label className="field">
              نوع
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as typeof kind)}
              >
                <option value="class">کلاس دانشگاه</option>
                <option value="work">کار ثابت</option>
              </select>
            </label>
          )}
          <label className="field">
            نام
            <input
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          {initial && (
            <label className="field">
              دامنه تغییر
              <select
                required
                value={scope}
                onChange={(e) => setScope(e.target.value as typeof scope)}
              >
                <option value="">انتخاب کنید…</option>
                <option value="this">فقط این رخداد</option>
                <option value="future">این تاریخ و آینده</option>
              </select>
            </label>
          )}
          <label className="field">
            {initial ? "تاریخ رخداد / شروع تغییر" : "شروع برنامه یا ترم"}
            {exception && scope === "this" ? (
              <span>
                {formatJalaliDate(fromLocalDate(exception.originalLocalDate))}
              </span>
            ) : (
              <JalaliDatePicker
                value={from}
                onChange={(v) => {
                  setFrom(v);
                  changed();
                }}
              />
            )}
            {initial && (
              <span className="text-xs text-muted-foreground">
                تاریخی را انتخاب کنید که در برنامه اصلی رخداد دارد.
              </span>
            )}
          </label>
          {scope === "this" && (
            <label className="field">
              روز اجرای همین رخداد
              <JalaliDatePicker
                value={replacementDay}
                onChange={(v) => {
                  setReplacementDay(v);
                  changed();
                }}
              />
            </label>
          )}
          {scope !== "this" && (
            <Weekdays
              value={days}
              onChange={(v) => {
                setDays(v);
                changed();
              }}
            />
          )}
          <div className="grid grid-cols-2 gap-3">
            <label className="field">
              شروع
              <TimeInput
                required
                value={start}
                onChange={(e) => setStart(latinDigits(e.target.value))}
              />
            </label>
            <label className="field">
              پایان
              <TimeInput
                required
                value={end}
                onChange={(e) => setEnd(latinDigits(e.target.value))}
              />
            </label>
          </div>
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={next}
              onChange={(e) => setNext(e.target.checked)}
            />
            پایان در روز بعد
          </label>
          {scope !== "this" && (
            <>
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasEnd}
                  onChange={(e) => setHasEnd(e.target.checked)}
                />
                پایان برنامه یا ترم
              </label>
              {hasEnd && (
                <JalaliDatePicker
                  value={until}
                  onChange={(v) => {
                    setUntil(v);
                    changed();
                  }}
                />
              )}
              <label className="field">
                تکرار
                <select
                  value={every}
                  onChange={(e) => setEvery(Number(e.target.value))}
                >
                  <option value={1}>هر هفته</option>
                  <option value={2}>یک هفته در میان</option>
                </select>
              </label>
              {every === 2 && (
                <div className="space-y-3 rounded-lg bg-muted p-3">
                  <label className="field">
                    شنبه مرجع
                    <JalaliDatePicker
                      value={anchor}
                      onChange={(v) => {
                        setAnchor(
                          localDate(startOfTehranWeek(fromLocalDate(v))),
                        );
                        changed();
                      }}
                    />
                  </label>
                  <label className="field">
                    هفته‌های برگزاری
                    <select
                      value={parity}
                      onChange={(e) => setParity(Number(e.target.value))}
                    >
                      <option value={0}>هفته مرجع و هر دو هفته پس از آن</option>
                      <option value={1}>
                        هفته بعد از مرجع و هر دو هفته پس از آن
                      </option>
                    </select>
                  </label>
                  <p className="text-xs leading-6">
                    تعریف زوج/فرد بر اساس این شنبه است، نه شماره هفته سال.
                    تاریخ‌های پیش‌نمایش را بررسی کنید.
                  </p>
                </div>
              )}
              <label className="field">
                مکان (اختیاری)
                <input
                  maxLength={300}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </label>
              <label className="field">
                یادداشت
                <textarea
                  maxLength={5000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              <Button
                variant="outline"
                onClick={() =>
                  void action.run(async () => {
                    setPreview(
                      await api("previewRecurrence", {
                        body: {
                          rule: values(),
                          from: inputInstant(from, "00:00"),
                          to: inputInstant(shiftDate(from, 28), "00:00"),
                        },
                      }),
                    );
                  })
                }
              >
                پیش‌نمایش چهار هفته
              </Button>
              {preview && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  <p>
                    {preview.events.length.toLocaleString("fa-IR")} رخداد ·{" "}
                    {preview.conflicts.length.toLocaleString("fa-IR")} تداخل
                  </p>
                  <ul>
                    {preview.events.map((e) => (
                      <li key={e.id}>
                        {formatJalaliDate(new Date(e.startAt), "EEEE d MMMM")} ·{" "}
                        {e.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </fieldset>
        <FormFeedback action={action} />
        <Button type="submit" disabled={action.pending} className="w-full">
          ذخیره برنامه ثابت
        </Button>
      </form>
    </Modal>
  );
}
