// web/src/app/app/admin/clubs/[clubId]/schedule/page.tsx

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import UpcomingSchedule from "./_islands/UpcomingSchedule";
import AiOpsCoachPanel from "./_islands/AiOpsCoachPanel";
import QualityChecklistPanel from "./_islands/QualityChecklistPanel";

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

function fmtDayHeader(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
}

function todayTomorrowLabel(d: Date) {
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((b.getTime() - a.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return null;
}

export default function ScheduleHomePage() {
  const { clubId } = useParams<{ clubId: string }>();
  const router = useRouter();

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/app/admin/clubs/${clubId}/schedule`;
  }, [clubId]);

  const now = useMemo(() => new Date(), []);
  const label = useMemo(() => todayTomorrowLabel(now), [now]);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header frame */}
      <div className="mb-6 rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
        {/* Top band */}
        <div className="border-b border-slate-200/70 bg-[radial-gradient(1000px_260px_at_10%_0%,rgba(99,102,241,0.14),transparent_60%),radial-gradient(900px_240px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  Planner
                </span>
                {label ? (
                  <span className="inline-flex items-center rounded-full border border-indigo-200/80 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-950">
                    {label}
                  </span>
                ) : null}
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  {fmtDayHeader(now)}
                </span>
              </div>

              <div className="mt-2 text-sm font-semibold text-slate-900">
                Schedule Sessions
              </div>

              <div className="mt-0.5 text-xs text-slate-600">
                Plan sessions fast • Standardize outcomes with templates • Improve evidence + analytics quality
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/app/admin/clubs/${clubId}`)}
                className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
              >
                Back
              </button>

              <Link
                href={`/app/admin/clubs/${clubId}/schedule/create`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                New session
              </Link>

              <span
                className={cx(
                  "hidden md:inline-flex items-center rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700",
                  "max-w-[460px]"
                )}
                title={shareUrl || "Shareable schedule link"}
              >
                Shareable link:
                <span className="ml-2 truncate font-mono text-slate-900">{shareUrl || "—"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Secondary strip */}
        <div className="px-5 py-4 sm:px-7">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
              <div className="text-xs font-semibold tracking-widest text-slate-500">SYSTEM</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">Ops-first scheduling</div>
              <div className="mt-1 text-xs text-slate-600">
                Designed for clubs: predictable delivery, clean evidence, and AI-ready analytics.
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
              <div className="text-xs font-semibold tracking-widest text-slate-500">AI AUTOMATION</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">Signal-driven insight</div>
              <div className="mt-1 text-xs text-slate-600">
                Attendance + checklist + evidence → stable insights (no extra clicks).
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
              <div className="text-xs font-semibold tracking-widest text-slate-500">ENTERPRISE FLOW</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">Fast creation</div>
              <div className="mt-1 text-xs text-slate-600">
                Templates apply instantly • Optimistic schedule updates • Low friction ops.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left */}
        <div className="lg:col-span-8 space-y-6">
          <UpcomingSchedule clubId={clubId} />
        </div>

        {/* Right */}
        <div className="lg:col-span-4 space-y-6">
          <AiOpsCoachPanel clubId={clubId} />
          <QualityChecklistPanel clubId={clubId} />
        </div>
      </div>
    </div>
  );
}
