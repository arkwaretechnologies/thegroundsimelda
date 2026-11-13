"use client";

import { Toaster } from "sonner";
import { MotionConfig } from "framer-motion";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Respect OS "reduce motion": transforms finish instantly, markup unchanged. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
      <Toaster richColors theme="dark" position="top-center" />
    </>
  );
}
