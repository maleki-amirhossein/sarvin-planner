"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "./ui/button";

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const PwaContext = createContext<{
  prompt: InstallEvent | null;
  installed: boolean;
  clearPrompt: () => void;
}>({ prompt: null, installed: false, clearPrompt: () => {} });

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const display = window.matchMedia("(display-mode: standalone)");
    const syncDisplay = () =>
      setInstalled(
        display.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
      );
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    syncDisplay();
    display.addEventListener("change", syncDisplay);
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (
      process.env.NODE_ENV === "production" &&
      window.isSecureContext &&
      "serviceWorker" in navigator
    ) {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // Installation enhancements must not prevent normal online use.
          console.warn("Sarvin service worker registration failed.");
        });
    }
    return () => {
      display.removeEventListener("change", syncDisplay);
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return (
    <PwaContext.Provider
      value={{ prompt, installed, clearPrompt: () => setPrompt(null) }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function PwaInstall() {
  const { prompt, installed, clearPrompt } = useContext(PwaContext);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  async function install() {
    if (!prompt || pending) return;
    setPending(true);
    setNotice("");
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      setNotice(
        outcome === "accepted"
          ? "درخواست نصب پذیرفته شد؛ نصب را در دستگاه دنبال کنید."
          : "نصب انجام نشد؛ هر وقت خواستید از منوی مرورگر نصب کنید.",
      );
    } catch {
      setNotice("نصب از این دکمه ممکن نشد؛ از منوی مرورگر استفاده کنید.");
    } finally {
      clearPrompt();
      setPending(false);
    }
  }
  return (
    <section className="surface space-y-4 p-5" aria-labelledby="pwa-title">
      <h2 id="pwa-title">نصب سروین روی دستگاه</h2>
      {installed ? (
        <p className="text-sm text-muted-foreground">
          سروین روی دستگاه نصب شده یا در پنجرهٔ مستقل باز است.
        </p>
      ) : (
        <>
          <p className="text-sm leading-7 text-muted-foreground">
            سروین را به صفحهٔ اصلی اضافه کنید تا مثل یک برنامه باز شود. برای
            دیدن برنامه‌ها و ذخیرهٔ تغییرات به اینترنت نیاز دارید.
          </p>
          {prompt && (
            <Button onClick={() => void install()} disabled={pending}>
              <Download size={18} />
              نصب سروین
            </Button>
          )}
          <div className="space-y-2 text-sm leading-7 text-muted-foreground">
            <p>
              در آیفون و آیپد: سایت را در Safari باز کنید و از منوی
              اشتراک‌گذاری، «افزودن به صفحهٔ اصلی» (Add to Home Screen) را
              انتخاب کنید.
            </p>
            <p>
              در اندروید و رایانه: در مرورگرهای پشتیبان مانند Chrome یا Edge، از
              منوی مرورگر گزینهٔ «نصب برنامه» یا «افزودن به صفحهٔ اصلی» را
              انتخاب کنید.
            </p>
          </div>
        </>
      )}
      {notice && (
        <p role="status" className="text-sm leading-7">
          {notice}
        </p>
      )}
    </section>
  );
}
