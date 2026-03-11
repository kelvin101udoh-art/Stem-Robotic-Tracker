// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/ScheduleHeader.tsx

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { cx } from "./_ui/page";

function todayLabel() {
  const d = new Date();
  return d.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short" });
}

export default function ScheduleHeader({ clubId }: { clubId: string }) {
  const label = useMemo(() => todayLabel(), []);

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 relative">
        <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">Schedule Sessions</div>

            <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              {label}
            </span>

            <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", "border-indigo-200/80 bg-indigo-50/80 text-indigo-950")}>
              Planner
            </span>
          </div>

          <div className="mt-0.5 text-xs text-slate-600">
            Create sessions fast • Standardize outcomes • Improve evidence & analytics quality
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/app/admin/clubs/${clubId}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
          >
            Back
          </Link>

          <a
            href="#composer"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            New session
          </a>
        </div>
      </div>
    </div>
  );
}
