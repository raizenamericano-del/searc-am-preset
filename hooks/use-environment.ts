"use client";
import { useSyncExternalStore } from "react";
import { detectInAppBrowser, detectOs, type InAppBrowser } from "@/lib/client/open-link";

const noop = () => () => {};

export function useEnvironment(): { inApp: InAppBrowser; os: "android" | "ios" | "other" } {
  const ua = useSyncExternalStore(noop, () => navigator.userAgent, () => "");
  return { inApp: detectInAppBrowser(ua), os: detectOs(ua) };
}
