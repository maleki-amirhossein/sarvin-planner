"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Download, LockKeyhole, Plus } from "lucide-react";
import { api, resetCsrf, type DTO } from "@/lib/api";
import { useApi, useSession } from "@/lib/queries";
import {
  formatJalaliDate,
  fromLocalDate,
  localDate,
  startOfTehranWeek,
  shiftDate,
  latinDigits,
} from "@/lib/dates";
import { Button } from "./ui/button";
import { Modal } from "./ui/overlays";
import { useEditor } from "./editor-provider";
import { QueryState } from "./query-state";
import { Empty } from "./planner-parts";
import { FormFeedback, units, useFormAction } from "./form-support";
import { JalaliDatePicker } from "./jalali-date-picker";
import { PwaInstall } from "./pwa-provider";
export function SettingsPage() {
  const settings = useApi("getSettings"),
    session = useSession(),
    editor = useEditor(),
    client = useQueryClient(),
    router = useRouter(),
    action = useFormAction(),
    [notice, setNotice] = useState(""),
    [password, setPassword] = useState(false),
    [defaults, setDefaults] = useState(false),
    [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const fixed = useApi("listFixedSchedules", {
    query: { limit: 20, cursor: cursors.at(-1) },
  });
  async function signOut(all = false) {
    await action.run(async () => {
      await api(all ? "revokeAllSessions" : "logout");
      await client.cancelQueries();
      client.clear();
      resetCsrf();
      router.replace("/login");
    });
  }
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl">تنظیمات</h1>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          سروینِ عزیز، این فضا برای توست؛ آن را با ریتم زندگی خودت هماهنگ کن.
        </p>
      </div>
      <PwaInstall />
      <section className="surface space-y-4 p-5">
        <h2>زمان و هدف پیش‌فرض</h2>
        <QueryState query={settings} />
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt>منطقه زمانی</dt>
          <dd>
            تهران · <bdi>Asia/Tehran</bdi>
          </dd>
          <dt>شروع هفته</dt>
          <dd>شنبه</dd>
        </dl>
        <p className="text-xs leading-6 text-muted-foreground">
          منطقه زمانی در این نسخه ثابت است؛ زمان برنامه‌های تکراری با تنظیم
          دستگاه تغییر نمی‌کند.
        </p>
        <Button
          variant="outline"
          disabled={!settings.data}
          onClick={() => setDefaults(true)}
        >
          هدف پیش‌فرض هفته‌های آینده
        </Button>
        {settings.data?.defaultGoals.map((g) => (
          <p key={g.effectiveFromWeek} className="text-sm">
            از{" "}
            {formatJalaliDate(
              fromLocalDate(g.effectiveFromWeek),
              "d MMMM yyyy",
            )}
            :{" "}
            {g.goal
              ? `${g.goal.target.toLocaleString("fa-IR")} ${units[g.goal.unit]}`
              : "بدون هدف پیش‌فرض"}
          </p>
        ))}
      </section>
      <section className="surface space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2">
            <LockKeyhole size={20} />
            برنامه‌های ثابت
          </h2>
          <Button variant="outline" onClick={() => editor.fixed()}>
            <Plus size={17} />
            کار یا کلاس تازه
          </Button>
        </div>
        <QueryState query={fixed} />
        {(["work", "class"] as const).map((kind) => (
          <div key={kind}>
            <h3 className="mb-2 mt-5 text-sm text-muted-foreground">
              {kind === "work" ? "کار ثابت" : "کلاس‌های دانشگاه"}
            </h3>
            {fixed.data?.items
              .filter((s) => s.kind === kind)
              .map((s) => (
                <FixedRow key={s.id} series={s} />
              ))}
            {fixed.data && !fixed.data.items.some((s) => s.kind === kind) && (
              <Empty>
                {kind === "class"
                  ? "هنوز کلاسی ثبت نشده است. پس از آماده شدن برنامه ترم، اطلاعات واقعی را وارد کنید."
                  : "برنامه کاری در این صفحه وجود ندارد."}
              </Empty>
            )}
          </div>
        ))}
        <div className="flex gap-2">
          {cursors.length > 1 && (
            <Button
              variant="outline"
              onClick={() => setCursors(cursors.slice(0, -1))}
            >
              صفحه قبل
            </Button>
          )}
          {fixed.data?.nextCursor && (
            <Button
              variant="outline"
              onClick={() => setCursors([...cursors, fixed.data.nextCursor!])}
            >
              صفحه بعد
            </Button>
          )}
        </div>
      </section>
      <section className="surface space-y-4 p-5">
        <h2>حساب و حریم خصوصی</h2>
        <p className="break-all text-sm">
          <bdi>{session.data?.email}</bdi>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setPassword(true)}>
            تغییر رمز عبور
          </Button>
          <Button
            variant="outline"
            disabled={action.pending}
            onClick={() => {
              if (window.confirm("از همه دستگاه‌ها خارج شوید؟"))
                void signOut(true);
            }}
          >
            خروج از همه دستگاه‌ها
          </Button>
          <Button
            variant="outline"
            disabled={action.pending}
            onClick={() => void signOut()}
          >
            خروج
          </Button>
        </div>
        <p className="text-xs leading-6 text-muted-foreground">
          اگر رمز را فراموش کردید، مالک سرور می‌تواند آن را با فرمان امن مدیریت
          حساب بازیابی کند. ثبت‌نام عمومی وجود ندارد.
        </p>
      </section>
      <section className="surface space-y-4 p-5">
        <h2>نسخه‌ای از اطلاعاتت</h2>
        <p className="text-sm leading-7 text-muted-foreground">
          خروجی JSON شامل کارها، برنامه‌ها، استثناها، مطالعه، هدف‌ها و تنظیمات
          است. آن را در جای خصوصی نگه دارید.
        </p>
        <Button
          variant="outline"
          disabled={action.pending}
          onClick={() =>
            void action.run(async () => {
              const data = await api("exportData"),
                url = URL.createObjectURL(
                  new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                  }),
                );
              const a = document.createElement("a");
              a.href = url;
              a.download = `sarvin-export-${localDate(new Date())}.json`;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              setNotice("فایل اطلاعات آماده دانلود شد.");
            })
          }
        >
          <Download size={18} />
          دریافت اطلاعات
        </Button>
      </section>
      <p role="status" className="text-sm text-primary">
        {notice}
      </p>
      <FormFeedback action={action} />
      <details className="surface p-5">
        <summary className="cursor-pointer font-bold">راهنمای کوتاه</summary>
        <div className="mt-4 space-y-3 text-sm leading-7">
          <p>
            کار تازه را با یک عنوان ثبت کنید. بعد از جزئیات، روز و ساعت را
            انتخاب کنید. در تداخل زمانی، عنوان‌ها و ساعت‌ها نمایش داده می‌شوند؛
            زمان را تغییر دهید یا آگاهانه تأیید کنید.
          </p>
          <p>
            کار و کلاس قفل هستند. از جزئیات برنامه ثابت، دامنه «فقط این رخداد»
            یا «این تاریخ و آینده» را انتخاب کنید. برای مرخصی یا لغو یک کلاس از
            منوی رخداد استفاده کنید.
          </p>
          <p>
            تیک کار فقط وضعیت انجام را تغییر می‌دهد. برای پیشرفت هدف مطالعه،
            جلسه واقعی را با مدت خوانده‌شده ثبت کنید. هدف هر هفته مستقل است.
          </p>
        </div>
      </details>
      {password && (
        <PasswordForm
          close={() => setPassword(false)}
          onSuccess={() => {
            client.clear();
            resetCsrf();
            router.replace("/login");
          }}
        />
      )}
      {defaults && settings.data && (
        <DefaultGoalForm
          initial={settings.data}
          close={() => setDefaults(false)}
        />
      )}
    </div>
  );
}
function PasswordForm({
  close,
  onSuccess,
}: {
  close: () => void;
  onSuccess: () => void;
}) {
  const [current, setCurrent] = useState(""),
    [next, setNext] = useState(""),
    [repeat, setRepeat] = useState("");
  const action = useFormAction();
  return (
    <Modal
      open
      title="تغییر رمز عبور"
      description="پس از تغییر، همه نشست‌ها بسته می‌شوند و باید دوباره وارد شوید."
      onOpenChange={(v) => {
        if (!v && !action.pending) close();
      }}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(async () => {
            if (next !== repeat) throw new Error("تکرار رمز یکسان نیست.");
            await api("changePassword", {
              body: { currentPassword: current, newPassword: next },
            });
            setCurrent("");
            setNext("");
            setRepeat("");
            onSuccess();
          });
        }}
      >
        <label className="field">
          رمز فعلی
          <input
            type="password"
            dir="ltr"
            required
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        <label className="field">
          رمز جدید (حداقل ۱۲ نویسه)
          <input
            type="password"
            dir="ltr"
            required
            minLength={12}
            maxLength={1024}
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </label>
        <label className="field">
          تکرار رمز جدید
          <input
            type="password"
            dir="ltr"
            required
            autoComplete="new-password"
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
          />
        </label>
        <FormFeedback action={action} />
        <Button type="submit" disabled={action.pending}>
          تغییر رمز و خروج
        </Button>
      </form>
    </Modal>
  );
}
function DefaultGoalForm({
  initial,
  close,
}: {
  initial: DTO["Settings"];
  close: () => void;
}) {
  const [day, setDay] = useState(
      shiftDate(localDate(startOfTehranWeek(new Date())), 7),
    ),
    [enabled, setEnabled] = useState(true),
    [unit, setUnit] = useState<"minutes" | "pages" | "sessions">("minutes"),
    [target, setTarget] = useState("");
  const action = useFormAction(),
    client = useQueryClient();
  return (
    <Modal
      open
      title="هدف پیش‌فرض هفته‌های آینده"
      description="هدف‌های اختصاصی و هفته‌های گذشته حفظ می‌شوند. شنبه شروع را انتخاب کنید."
      onOpenChange={(v) => {
        if (!v && !action.pending) close();
      }}
    >
      <form
        className="space-y-4"
        onChange={() => action.reset()}
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(async () => {
            await api("updateSettings", {
              version: initial.version,
              body: {
                defaultGoal: {
                  effectiveFromWeek: day,
                  goal: enabled
                    ? { unit, target: Number(latinDigits(target)) }
                    : null,
                },
              },
            });
            await client.invalidateQueries({ queryKey: ["private"] });
            close();
          });
        }}
      >
        <JalaliDatePicker
          value={day}
          onChange={(v) => {
            setDay(localDate(startOfTehranWeek(fromLocalDate(v))));
            action.reset();
          }}
        />
        <label className="flex min-h-11 items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          فعال بودن هدف پیش‌فرض
        </label>
        {enabled && (
          <>
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
          </>
        )}
        <FormFeedback action={action} />
        <Button type="submit" disabled={action.pending}>
          ذخیره برای آینده
        </Button>
      </form>
    </Modal>
  );
}
function FixedRow({ series: s }: { series: DTO["FixedSeries"] }) {
  const editor = useEditor(),
    action = useFormAction(),
    client = useQueryClient(),
    [exceptionOpen, setExceptionOpen] = useState(false),
    [terminate, setTerminate] = useState(false),
    [day, setDay] = useState(localDate(new Date())),
    [key] = useState(() => crypto.randomUUID());
  return (
    <div className="mb-3 rounded-xl border p-4">
      <h3 className="break-words">{s.title}</h3>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        <bdi>
          {s.localStartTime.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}–
          {s.localEndTime.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])}
        </bdi>{" "}
        · {s.everyWeeks === 2 ? "یک هفته در میان" : "هفتگی"} · از{" "}
        {formatJalaliDate(fromLocalDate(s.effectiveFrom), "d MMMM yyyy")}
        {s.effectiveUntil
          ? ` تا ${formatJalaliDate(fromLocalDate(s.effectiveUntil), "d MMMM yyyy")}`
          : ""}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Button variant="ghost" onClick={() => editor.fixed(s)}>
          ویرایش
        </Button>
        <Button variant="ghost" onClick={() => setExceptionOpen(true)}>
          استثناها / بازگردانی
        </Button>
        <Button variant="ghost" onClick={() => setTerminate(true)}>
          پایان برنامه…
        </Button>
      </div>
      <FormFeedback action={action} />
      {exceptionOpen && (
        <Exceptions series={s} close={() => setExceptionOpen(false)} />
      )}
      <Modal
        open={terminate}
        title="پایان دادن به برنامه ثابت"
        description="رخدادهای از این تاریخ به بعد حذف می‌شوند؛ تاریخچه قبلی حفظ می‌شود."
        onOpenChange={(v) => {
          if (!action.pending) setTerminate(v);
        }}
      >
        <div className="space-y-4">
          <JalaliDatePicker value={day} onChange={setDay} />
          <FormFeedback action={action} />
          <Button
            variant="destructive"
            disabled={action.pending}
            onClick={() =>
              void action.run(async (confirmation) => {
                await api("deleteFixedSchedule", {
                  path: { id: s.id },
                  version: s.version,
                  idempotencyKey: key,
                  body: {
                    scope: "future",
                    originalLocalDate: day,
                    ...confirmation,
                  },
                });
                await client.invalidateQueries({ queryKey: ["private"] });
                setTerminate(false);
              })
            }
          >
            تأیید پایان از این تاریخ
          </Button>
        </div>
      </Modal>
    </div>
  );
}
function Exceptions({
  series,
  close,
}: {
  series: DTO["FixedSeries"];
  close: () => void;
}) {
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]),
    q = useApi("listExceptions", {
      path: { id: series.id },
      query: { limit: 20, cursor: cursors.at(-1) },
    }),
    action = useFormAction(),
    client = useQueryClient();
  return (
    <Modal
      open
      title={`استثناهای ${series.title}`}
      onOpenChange={(v) => {
        if (!v && !action.pending) close();
      }}
    >
      <QueryState query={q} />
      {q.data?.items.map((e) => (
        <div key={e.id} className="mb-3 rounded-lg border p-3 text-sm">
          <p>
            {formatJalaliDate(fromLocalDate(e.originalLocalDate))} ·{" "}
            {e.action === "cancel" ? "لغوشده" : "زمان ویرایش‌شده"}
          </p>
          <Button
            variant="outline"
            className="mt-2"
            disabled={action.pending}
            onClick={() => {
              if (window.confirm("استثنا حذف و قانون اصلی دوباره اجرا شود؟"))
                void action.run(async (confirmation) => {
                  await api("removeException", {
                    path: { id: series.id, exceptionId: e.id },
                    version: e.version,
                    body: confirmation,
                  });
                  await client.invalidateQueries({ queryKey: ["private"] });
                });
            }}
          >
            بازگردانی قانون اصلی
          </Button>
        </div>
      ))}
      {q.data && !q.data.items.length && <Empty>استثنایی ثبت نشده است.</Empty>}
      <FormFeedback action={action} />
      <div className="mt-3 flex gap-2">
        {cursors.length > 1 && (
          <Button
            variant="outline"
            onClick={() => setCursors(cursors.slice(0, -1))}
          >
            قبلی
          </Button>
        )}
        {q.data?.nextCursor && (
          <Button
            variant="outline"
            onClick={() => setCursors([...cursors, q.data.nextCursor!])}
          >
            بعدی
          </Button>
        )}
      </div>
    </Modal>
  );
}
