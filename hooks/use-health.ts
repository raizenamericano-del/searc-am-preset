"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { HealthResponse } from "@/types";
import { apiGet } from "@/lib/client/api";

export type HealthState = { phase: "connecting" } | { phase: "ready" | "degraded"; data: HealthResponse } | { phase: "down" };

function fetchHealth(): Promise<HealthState> {
  return apiGet<HealthResponse>("/api/health").then(
    (data): HealthState => ({ phase: data.status === "ok" ? "ready" : "degraded", data }),
    (): HealthState => ({ phase: "down" }),
  );
}

/** Real health check: on mount, when the tab regains focus (≥60 s apart) and when going online. No polling interval. */
export function useHealth() {
  const [state, setState] = useState<HealthState>({ phase: "connecting" });
  const last = useRef(0);

  const check = useCallback((force = false) => {
    if (!force && Date.now() - last.current < 60_000) return Promise.resolve();
    last.current = Date.now();
    return fetchHealth().then(setState);
  }, []);

  useEffect(() => {
    let alive = true;
    last.current = Date.now();
    fetchHealth().then((s) => {
      if (alive) setState(s);
    });
    const onFocus = () => void check();
    const onOnline = () => void check(true);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    return () => {
      alive = false;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
    };
  }, [check]);

  return { state, recheck: () => check(true) };
}
