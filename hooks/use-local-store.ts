"use client";
import { useSyncExternalStore } from "react";
import type { LocalStore } from "@/lib/storage/local-store";

export function useLocalStore<T>(store: LocalStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}
