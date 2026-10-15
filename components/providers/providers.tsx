"use client";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast";
import { AppUiProvider } from "./app-ui";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AppUiProvider>{children}</AppUiProvider>
      </ToastProvider>
    </MotionConfig>
  );
}
