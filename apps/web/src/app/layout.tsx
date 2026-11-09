import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "برنامه‌ریز سروین | Sarvin planner",
  icons: {
    icon: {
      url: "/sarvin-planner-logo.png",
      type: "image/png",
      sizes: "1254x1254",
    },
    apple: "/sarvin-planner-logo.png",
  },
  robots: { index: false, follow: false },
  description: "برنامه‌ریزی روزانه و هفتگی و پیگیری مطالعهٔ آزاد",
};
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
