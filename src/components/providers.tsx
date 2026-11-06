"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { MotionConfig } from "framer-motion";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      {/* Respect OS "reduce motion": transforms finish instantly, markup unchanged. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      <Toaster richColors theme="dark" position="top-center" />
    </QueryClientProvider>
  );
}
