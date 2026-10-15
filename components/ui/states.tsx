import { AlertTriangle, RefreshCw, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./button";

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-line/10 bg-bg-raised text-ink-dim">
        {icon ?? <SearchX className="h-6 w-6" aria-hidden />}
      </div>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-prose text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title, message, hint, onRetry, extra }: { title?: string; message: string; hint?: string; onRetry?: () => void; extra?: ReactNode }) {
  return (
    <div role="alert" className="card flex flex-col items-center border-danger/20 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="font-display text-base font-semibold">{title ?? "Terjadi kendala"}</h3>
      <p className="mt-1 max-w-prose text-sm text-ink-muted">{message}</p>
      {hint && <p className="mt-2 max-w-prose text-xs text-ink-dim">{hint}</p>}
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button variant="outline" onClick={onRetry} icon={<RefreshCw className="h-4 w-4" aria-hidden />}>
            Coba lagi
          </Button>
        )}
        {extra}
      </div>
    </div>
  );
}
