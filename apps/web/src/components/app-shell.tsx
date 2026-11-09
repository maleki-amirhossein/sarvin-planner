"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  House,
  BookOpen,
  ListTodo,
  ChartNoAxesCombined,
  Settings,
  Plus,
  Ellipsis,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { useApi, useSession } from "@/lib/queries";
import { localDate, startOfTehranWeek, latinDigits } from "@/lib/dates";
import { Login } from "./login";
import { EditorProvider, useEditor } from "./editor-provider";
import { Button } from "./ui/button";
import { ActionMenu } from "./ui/overlays";
import { JalaliDatePicker } from "./jalali-date-picker";
import { FormFeedback, units, useFormAction } from "./form-support";
import { QueryState } from "./query-state";
import { BotanicalArt } from "./botanical-art";
const navigation = [
  { href: "/today", label: "امروز", icon: House },
  { href: "/week", label: "هفته", icon: CalendarDays },
  { href: "/reading", label: "مطالعه", icon: BookOpen },
  { href: "/tasks", label: "کارها", icon: ListTodo },
  { href: "/review", label: "مرور هفته", icon: ChartNoAxesCombined },
  { href: "/settings", label: "تنظیمات", icon: Settings },
];
export function AppShell({ children }: { children: React.ReactNode }) {
  const session = useSession(),
    router = useRouter(),
    path = usePathname(),
    search = useSearchParams();
  const expired =
    session.error instanceof ApiError && session.error.status === 401;
  useEffect(() => {
    if (expired && !session.data)
      router.replace(
        `/login?next=${encodeURIComponent(path + (search.size ? `?${search}` : ""))}`,
      );
  }, [expired, session.data, router, path, search]);
  if (!session.data)
    return (
      <div className="mx-auto max-w-lg p-8">
        <QueryState query={session} />
      </div>
    );
  return (
    <EditorProvider active={!expired}>
      <div hidden={expired}>
        <ShellContent>{children}</ShellContent>
      </div>
      {expired && <Login expired />}
    </EditorProvider>
  );
}
function ShellContent({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    router = useRouter(),
    editor = useEditor(),
    settings = useApi("getSettings");
  const nav = (mobile = false) => (
    <nav
      aria-label={mobile ? "ناوبری پایین" : "ناوبری اصلی"}
      className={mobile ? "grid grid-cols-4" : "space-y-2"}
    >
      {navigation
        .slice(0, mobile ? 4 : 6)
        .map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={path === href ? "page" : undefined}
            className={`shell-nav-link flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${mobile ? "flex-col gap-1 px-1 text-xs" : ""} ${path === href ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Icon size={mobile ? 21 : 20} />
            {label}
          </Link>
        ))}
    </nav>
  );
  return (
    <>
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-2 focus:z-[100] focus:bg-card focus:p-3"
        href="#main"
      >
        رفتن به محتوای اصلی
      </a>
      <aside className="shell-sidebar fixed inset-y-0 start-0 z-20 hidden w-52 border-e p-5 lg:flex lg:flex-col">
        <Link href="/today" className="mb-10 mt-2 flex items-center gap-2">
          <Image src="/sarvin-planner-logo.png" alt="" width={44} height={44} />
          <span className="text-xl font-bold">
            سروین
            <span
              className="block text-[10px] font-normal tracking-widest text-muted-foreground"
              dir="ltr"
            >
              SARVIN PLANNER
            </span>
          </span>
        </Link>
        {nav()}
        <div className="sidebar-note mt-auto text-center text-primary">
          <BotanicalArt className="sidebar-sprig" />
          <p className="text-lg font-bold leading-8">هر روز، یک قدم کوچک</p>
          <span className="note-underline" aria-hidden="true" />
        </div>
      </aside>
      <div
        className={`shell-content relative lg:ms-52 ${path === "/week" && settings.data?.onboardingComplete ? "shell-week" : ""}`}
      >
        <header className="shell-header flex min-h-20 items-center justify-between gap-3 px-4 sm:px-7">
          <Link href="/today" className="flex items-center gap-2 lg:hidden">
            <Image
              src="/sarvin-planner-logo.png"
              alt=""
              width={36}
              height={36}
            />
            <strong>سروین</strong>
          </Link>
          <p className="shell-caption hidden text-sm text-muted-foreground lg:block">
            برنامه‌ریز شخصی تو
          </p>
          <div className="flex items-center gap-2">
            <Button onClick={() => editor.task()}>
              <Plus size={18} />
              <span>کار تازه</span>
            </Button>
            <ActionMenu
              trigger={
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="گزینه‌های بیشتر"
                >
                  <Ellipsis size={20} />
                </Button>
              }
              actions={[
                { label: "مرور هفته", action: () => router.push("/review") },
                {
                  label: "تنظیمات و حساب",
                  action: () => router.push("/settings"),
                },
                { label: "ثبت مطالعه واقعی", action: () => editor.reading() },
              ]}
            />
          </div>
        </header>
        <main
          id="main"
          tabIndex={-1}
          className="shell-main mx-auto max-w-[1800px] px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-7 lg:pb-8"
        >
          {settings.data && !settings.data.onboardingComplete ? (
            <Onboarding />
          ) : settings.data ? (
            children
          ) : (
            <QueryState query={settings} />
          )}
        </main>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-2 pt-1 pb-[max(.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        {nav(true)}
      </div>
    </>
  );
}
function Onboarding() {
  const [date, setDate] = useState(localDate(new Date())),
    [confirmed, setConfirmed] = useState(false),
    [target, setTarget] = useState(""),
    [unit, setUnit] = useState<"minutes" | "pages" | "sessions">("minutes"),
    [key] = useState(() => crypto.randomUUID());
  const action = useFormAction(),
    client = useQueryClient();
  return (
    <section className="surface mx-auto max-w-xl space-y-5 p-6">
      <p className="text-sm text-primary">شروع آرام با سروین</p>
      <h1 className="text-2xl">برنامه‌ات از چه روزی شروع شود؟</h1>
      <p className="text-sm leading-7 text-muted-foreground">
        زمان محلی تهران و شروع هفته از شنبه است. برنامه ثابت کار، شنبه تا
        چهارشنبه ساعت ۰۸:۰۰ تا ۱۳:۰۰، از تاریخ انتخابی شما ثبت می‌شود. کلاس‌ها
        را بعداً اضافه کنید.
      </p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(async (confirmation) => {
            await api("completeOnboarding", {
              idempotencyKey: key,
              body: {
                timezone: "Asia/Tehran",
                workEffectiveFrom: date,
                ...(target
                  ? {
                      readingGoal: {
                        unit,
                        target: Number(latinDigits(target)),
                      },
                      readingGoalWeekStart: localDate(
                        startOfTehranWeek(new Date()),
                      ),
                    }
                  : {}),
                ...confirmation,
              },
            });
            await client.invalidateQueries({ queryKey: ["private"] });
          });
        }}
        onChange={() => action.reset()}
      >
        <label className="field">
          شروع برنامه کار
          <JalaliDatePicker
            value={date}
            onChange={(v) => {
              setDate(v);
              setConfirmed(false);
              action.reset();
            }}
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            required
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          تاریخ شروع و ساعت کار را تأیید می‌کنم.
        </label>
        <div className="border-t pt-4">
          <p className="mb-3 text-sm">هدف مطالعه این هفته (اختیاری)</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="field">
              مقدار
              <input
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
          </div>
        </div>
        <FormFeedback action={action} />
        <Button
          type="submit"
          disabled={action.pending || !confirmed}
          className="w-full"
        >
          {action.pending ? "در حال آماده‌سازی…" : "شروع برنامه‌ریزی"}
        </Button>
      </form>
    </section>
  );
}
