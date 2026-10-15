"use client";
import dynamic from "next/dynamic";
import { useAppUi } from "@/components/providers/app-ui";

// Heavy / rarely used UI is code-split and only loaded when first opened.
const QrScannerModal = dynamic(() => import("@/components/qr/qr-scanner-modal"), { ssr: false });
const QrGeneratorModal = dynamic(() => import("@/components/qr/qr-generator-modal"), { ssr: false });
const LibraryDrawer = dynamic(() => import("@/components/bookmark/library-drawer"), { ssr: false });
const VideoDetailModal = dynamic(() => import("@/components/video/video-detail-modal"), { ssr: false });
const OpenGuideModal = dynamic(() => import("@/components/preset/open-guide-modal"), { ssr: false });

export function ModalsHost() {
  const ui = useAppUi();
  return (
    <>
      {ui.scannerOpen && <QrScannerModal />}
      {ui.qrUrl && <QrGeneratorModal />}
      {ui.libraryTab && <LibraryDrawer />}
      {ui.video && <VideoDetailModal />}
      {ui.openRequest && <OpenGuideModal />}
    </>
  );
}
