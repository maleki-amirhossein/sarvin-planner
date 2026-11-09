"use client";
import { Button } from "./ui/button";
export function QueryState({
  query,
  pending = query?.isPending,
  error = query?.error,
  retry = query
    ? () => {
        void query.refetch();
      }
    : undefined,
}: {
  query?: { isPending: boolean; error: Error | null; refetch: () => unknown };
  pending?: boolean;
  error?: Error | null;
  retry?: () => void;
}) {
  if (error)
    return (
      <div role="alert" className="surface space-y-3 p-5">
        <p className="error-text">{error.message}</p>
        {retry && (
          <Button variant="outline" onClick={retry}>
            تلاش دوباره
          </Button>
        )}
      </div>
    );
  if (pending)
    return (
      <div role="status" className="space-y-3 p-4">
        <span className="text-sm text-muted-foreground">
          در حال دریافت اطلاعات…
        </span>
        <div className="loading-skeleton h-24" />
      </div>
    );
  return null;
}
