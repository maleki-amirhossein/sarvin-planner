import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";
import "./personalization.css";

export const metadata: Metadata = {
  title: "برنامه‌ریز سروین | Sarvin planner",
  applicationName: "برنامه‌ریز سروین",
  appleWebApp: { capable: true, title: "سروین", statusBarStyle: "default" },
  icons: {
    icon: {
      url: "/sarvin-planner-logo.png",
      type: "image/png",
      sizes: "1254x1254",
    },
    apple: "/icons/apple-touch-icon.png",
  },
  robots: { index: false, follow: false },
  description: "برنامه‌ریزی روزانه و هفتگی و پیگیری مطالعهٔ آزاد",
};
export const viewport: Viewport = { themeColor: "#00796e" };
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
