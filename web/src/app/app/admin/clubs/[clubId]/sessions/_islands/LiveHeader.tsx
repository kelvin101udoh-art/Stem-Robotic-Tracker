// web/src/app/app/admin/clubs/[clubId]/sessions/_islands/LiveHeader.tsx


"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLiveDashboard } from "./useLiveDashboard";

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

function fmtDateTimeShort(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function minsBetween(now: number, thenIso?: string | null) {
  if (!thenIso) return null;
  const t = new Date(thenIso).getTime();
  return Math.max(0, Math.round((now - t) / 60000));
}

function freshnessLabel(minutes: number) {
  if (minutes <= 2) return { label: "LIVE", cls: "border-emerald-200 bg-emerald-50 text-emerald-900" };
  if (minutes <= 10) return { label: "FRESH", cls: "border-indigo-200 bg-indigo-50 text-indigo-900" };
  return { label: "STALE", cls: "border-rose-200 bg-rose-50 text-rose-900" };
}

export default function LiveHeader({ clubId }: { clubId: string }) {
  const { lastUpdatedAt, refreshing } = useLiveDashboard(clubId);

  const tag = useMemo(() => {
    const mins = minsBetween(Date.now(), lastUpdatedAt);
    if (mins === null) return null;
    return freshnessLabel(mins);
  }, [lastUpdatedAt]);

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 relative">
        <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">Live Sessions Analytics</div>

            {tag ? (
              <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", tag.cls)}>{tag.label}</span>
            ) : (
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">—</span>
            )}

            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              Today
            </span>

            {refreshing ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                Syncing…
              </span>
            ) : null}
          </div>

          <div className="mt-0.5 text-xs text-slate-600">
            Real-time dashboard for today’s sessions • Single RPC payload + realtime
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/app/admin/clubs/${clubId}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
          >
            Back
          </Link>

          <span className="hidden sm:inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
            Last updated: <span className="ml-2 text-slate-900">{fmtDateTimeShort(lastUpdatedAt)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
