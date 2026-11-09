import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "برنامه‌ریز سروین",
    short_name: "سروین",
    description: "برنامه‌ریزی روزانه و هفتگی و پیگیری مطالعهٔ آزاد",
    lang: "fa",
    dir: "rtl",
    start_url: "/today",
    scope: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#00796e",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
