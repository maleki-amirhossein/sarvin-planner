"use client";
import { useEffect, useState } from "react";
import { DirectionProvider } from "@radix-ui/react-direction";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
      }),
  );
  useEffect(() => {
    const expired = () => {
      client.removeQueries({ queryKey: ["private"] });
      void client.invalidateQueries({ queryKey: ["session"] });
    };
    window.addEventListener("sarvin:session-expired", expired);
    return () => window.removeEventListener("sarvin:session-expired", expired);
  }, [client]);
  return (
    <DirectionProvider dir="rtl">
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </DirectionProvider>
  );
}
