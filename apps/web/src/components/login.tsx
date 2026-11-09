"use client";
import { useSyncExternalStore, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { api, resetCsrf } from "@/lib/api";
import { Button } from "./ui/button";
const subscribeReady = () => () => {};
const readyClient = () => true,
  readyServer = () => false;
export function Login({ expired = false }: { expired?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const ready = useSyncExternalStore(subscribeReady, readyClient, readyServer);
  const router = useRouter(),
    search = useSearchParams(),
    client = useQueryClient();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const session = await api("login", {
        body: { email: email.trim(), password },
      });
      resetCsrf();
      await client.cancelQueries({ queryKey: ["private"] });
      client.removeQueries({ queryKey: ["private"] });
      client.setQueryData(["session"], session);
      setPassword("");
      if (!expired) {
        const next = search.get("next") ?? "/today";
        router.replace(
          /^\/(today|week|tasks|reading|review|settings)(\?|$)/.test(next)
            ? next
            : "/today",
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "ورود انجام نشد.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div
      className={
        expired
          ? "fixed inset-0 z-[100] overflow-y-auto bg-background p-5"
          : "flex min-h-svh items-center justify-center p-5"
      }
    >
      <main className="surface mx-auto w-full max-w-md p-7 sm:p-9">
        <Image
          src="/sarvin-planner-logo.png"
          alt="نشان سروین"
          width={80}
          height={80}
          className="mx-auto mb-3"
          loading="eager"
        />
        <h1 className="text-center text-2xl">به پلنر سروین خوش آمدید</h1>
        <p className="mb-7 mt-2 text-center text-sm leading-7 text-muted-foreground">
          {expired
            ? "نشست شما پایان یافته است. دوباره وارد شوید؛ فرم باز شما حفظ شده است."
            : "جایی برای روزهای منظم‌تر و فرصت‌های بیشتر برای مطالعه."}
        </p>
        <form onSubmit={submit} className="space-y-4">
          <label className="field">
            ایمیل
            <input
              type="email"
              dir="ltr"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="field">
            رمز عبور
            <div className="relative">
              <input
                type={visible ? "text" : "password"}
                dir="ltr"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pe-12"
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label={visible ? "پنهان کردن رمز" : "نمایش رمز"}
                onClick={() => setVisible(!visible)}
                className="absolute start-0 top-0"
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>
          </label>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending || !ready} className="w-full">
            {pending ? "در حال ورود…" : "ورود به برنامه"}
            <ArrowLeft size={18} />
          </Button>
        </form>
      </main>
    </div>
  );
}
