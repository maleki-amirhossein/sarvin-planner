"use client";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export function ApiStatus() {
  const { isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => apiGet<{ status: "ok" }>("/health", signal),
  });
  return (
    <p role="status" className="text-sm text-muted-foreground">
      {isPending
        ? "در حال بررسی ارتباط…"
        : isError
          ? "ارتباط با سرور برقرار نیست."
          : "ارتباط با سرور و پایگاه داده برقرار است."}
    </p>
  );
}
