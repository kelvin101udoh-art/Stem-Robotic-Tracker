// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/_ui/ActionDrawer.tsx

"use client";

import { useEffect } from "react";
import { cx } from "./page";

export function ActionDrawer(props: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!props.open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open, props.onClose]);

  return (
    <div
      className={cx(
        "fixed inset-0 z-[60]",
        props.open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!props.open}
    >
      {/* Backdrop */}
      <div
        onClick={props.onClose}
        className={cx(
          "absolute inset-0 bg-slate-900/30 backdrop-blur-[2px] transition-opacity",
          props.open ? "opacity-100" : "opacity-0"
        )}
      />

      {/* Panel */}
      <aside
        className={cx(
          "absolute right-0 top-0 h-full w-full sm:w-[520px] translate-x-full",
          "transition-transform duration-300 ease-out",
          props.open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-full border-l border-slate-200/70 bg-white/75 backdrop-blur shadow-[0_40px_120px_-60px_rgba(2,6,23,0.6)]">
          {/* Header */}
          <div className="border-b border-slate-200/70 px-5 py-4 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.08),transparent_55%)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">{props.title}</div>
                {props.subtitle ? (
                  <div className="mt-1 text-xs text-slate-600">{props.subtitle}</div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={props.onClose}
                className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-5 overflow-auto h-[calc(100%-72px-84px)]">
            {props.children}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200/70 px-5 py-4 bg-white/60">
            {props.footer ?? (
              <div className="text-xs text-slate-600">
                Tip: Press <span className="font-semibold text-slate-900">Esc</span> to close.
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
