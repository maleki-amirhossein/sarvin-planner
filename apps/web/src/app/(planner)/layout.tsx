import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <p className="p-8" role="status">
          در حال بارگیری…
        </p>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
