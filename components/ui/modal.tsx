"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/format";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Render as a side drawer on desktop (bottom sheet on mobile either way). */
  variant?: "dialog" | "drawer";
  footer?: ReactNode;
}

const SIZES = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-5xl" };
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal: bottom sheet on phones, centered dialog / drawer on larger
 * screens. Focus trap, Escape to close, scroll lock, focus restore.
 */
export function Modal({ open, onClose, title, description, children, size = "md", variant = "dialog", footer }: ModalProps) {
  const titleId = useId();
  const descId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current;
      first?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === "Tab" && panel.current) {
        const nodes = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
        if (!nodes.length) return;
        const first = nodes[0]!;
        const last = nodes[nodes.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [open]);

  if (typeof document === "undefined") return null;

  const drawer = variant === "drawer";
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            initial={reduce ? { opacity: 0 } : { y: "100%", opacity: 0.6 }}
            animate={{ y: 0, x: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: "100%", opacity: 0 }}
            transition={{ type: "tween", ease: [0.22, 1, 0.36, 1], duration: reduce ? 0 : 0.32 }}
            className={cn(
              "glass relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl shadow-sheet outline-none",
              drawer
                ? "sm:fixed sm:right-0 sm:top-0 sm:h-dvh sm:max-h-dvh sm:max-w-md sm:rounded-none sm:rounded-l-2xl"
                : cn("sm:max-h-[88dvh] sm:rounded-2xl", SIZES[size]),
            )}
          >
            <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-white/15 sm:hidden" aria-hidden />
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line/10 px-5 pb-3 pt-3 sm:pt-5">
              <div className="min-w-0">
                <h2 id={titleId} className="font-display text-lg font-semibold leading-tight">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="mt-0.5 text-sm text-ink-muted">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="-mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-white/5 hover:text-ink"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
            {footer && <footer className="shrink-0 border-t border-line/10 px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
