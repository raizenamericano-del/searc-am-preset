import { cn } from "@/lib/utils/format";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative overflow-hidden rounded-md bg-white/[0.05]", className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}

export function VideoCardSkeleton({ view }: { view: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div className="card flex gap-3 p-3">
        <Skeleton className="h-28 w-20 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2 py-1">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="mt-4 h-3 w-1/2" />
        </div>
      </div>
    );
  }
  return (
    <div className="card overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}
