import { NextResponse } from "next/server";
import type { HealthResponse } from "@/types";
import { getFeatureStatus, getProvider } from "@/lib/api";
import { APP_VERSION } from "@/lib/config/app";
import { getGoogleAuthStatus } from "@/lib/auth/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let lastProbe: { reachable: boolean; at: number } | null = null;
let probing: Promise<boolean> | null = null;
const PROBE_TTL = 60_000;

async function probe(): Promise<boolean> {
  if (lastProbe && Date.now() - lastProbe.at < PROBE_TTL) return lastProbe.reachable;
  probing ??= getProvider()
    .ping()
    .then((reachable) => {
      lastProbe = { reachable, at: Date.now() };
      return reachable;
    })
    .finally(() => {
      probing = null;
    });
  return probing;
}

export async function GET() {
  const provider = getProvider();
  const reachable = await probe();
  const vd = getFeatureStatus("videoDetails");
  const body: HealthResponse = {
    status: reachable ? (vd === "blocked" ? "degraded" : "ok") : "degraded",
    version: APP_VERSION,
    provider: { name: provider.name, reachable },
    features: {
      videoDetails: reachable ? (vd === "unknown" ? "available" : vd) : "unknown",
      comments: getFeatureStatus("comments"),
      keywordSearch: getFeatureStatus("keywordSearch"),
      creatorVideos: getFeatureStatus("creatorVideos"),
    },
    auth: { google: getGoogleAuthStatus() },
    checkedAt: new Date().toISOString(),
  };
  return NextResponse.json(body, { headers: { "cache-control": "no-store" } });
}
