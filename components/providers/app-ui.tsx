"use client";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { PresetPlatform, SearchMode, VideoItem } from "@/types";

export interface OpenRequest {
  url: string;
  platform: PresetPlatform | null;
  reason: "in_app" | "unknown_domain" | "help";
}

interface AppUi {
  libraryTab: "saved" | "history" | null;
  openLibrary: (tab?: "saved" | "history") => void;
  closeLibrary: () => void;
  scannerOpen: boolean;
  setScannerOpen: (v: boolean) => void;
  qrUrl: string | null;
  openQr: (url: string) => void;
  closeQr: () => void;
  video: VideoItem | null;
  openVideo: (v: VideoItem) => void;
  closeVideo: () => void;
  openRequest: OpenRequest | null;
  setOpenRequest: (r: OpenRequest | null) => void;
  requestSearch: (mode: SearchMode, query: string) => void;
  /** The search panel registers itself so other UI (history drawer) can trigger a search. */
  registerSearchHandler: (fn: ((mode: SearchMode, query: string) => void) | null) => void;
}

const Ctx = createContext<AppUi | null>(null);

export function AppUiProvider({ children }: { children: ReactNode }) {
  const [libraryTab, setLibraryTab] = useState<AppUi["libraryTab"]>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [openRequest, setOpenRequest] = useState<OpenRequest | null>(null);
  const searchHandler = useRef<((mode: SearchMode, query: string) => void) | null>(null);

  const requestSearch = useCallback((mode: SearchMode, query: string) => {
    setLibraryTab(null);
    searchHandler.current?.(mode, query);
  }, []);
  const registerSearchHandler = useCallback((fn: ((mode: SearchMode, query: string) => void) | null) => {
    searchHandler.current = fn;
  }, []);

  const value = useMemo<AppUi>(
    () => ({
      libraryTab,
      openLibrary: (tab = "saved") => setLibraryTab(tab),
      closeLibrary: () => setLibraryTab(null),
      scannerOpen,
      setScannerOpen,
      qrUrl,
      openQr: setQrUrl,
      closeQr: () => setQrUrl(null),
      video,
      openVideo: setVideo,
      closeVideo: () => setVideo(null),
      openRequest,
      setOpenRequest,
      requestSearch,
      registerSearchHandler,
    }),
    [libraryTab, scannerOpen, qrUrl, video, openRequest, requestSearch, registerSearchHandler],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppUi(): AppUi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppUi must be used inside AppUiProvider");
  return v;
}
