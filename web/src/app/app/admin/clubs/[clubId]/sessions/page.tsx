// web/src/app/app/admin/clubs/[clubId]/sessions/page.tsx


"use client";

import { useParams } from "next/navigation";
import LiveHeader from "./_islands/LiveHeader";
import TodayKpis from "./_islands/TodayKpis";
import LiveSessionFocus from "./_islands/LiveSessionFocus";
import TodaySchedule from "./_islands/TodaySchedule";
import AiInsightPanel from "./_islands/AiInsightPanel";

export default function SessionsPage() {
  const { clubId } = useParams<{ clubId: string }>();

  return (
    <>
      <LiveHeader clubId={clubId} />

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Report frame */}
        <div className="rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl">
          {/* Top band */}
          <div className="border-b border-slate-200/70 bg-[radial-gradient(1000px_260px_at_10%_0%,rgba(99,102,241,0.16),transparent_60%),radial-gradient(900px_240px_at_90%_0%,rgba(34,211,238,0.12),transparent_55%)] px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">Today’s Live Analytics Report</div>
                <div className="mt-0.5 text-xs text-slate-600">
                  Operational signals, evidence momentum, and automated insight — optimized for low-friction delivery.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-indigo-500/70" />
                  Live pipeline active
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                  Scope: Today
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-7 space-y-6">
            <TodayKpis clubId={clubId} />

            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-6">
                <LiveSessionFocus clubId={clubId} />
                <TodaySchedule clubId={clubId} />
              </div>

              <div className="lg:col-span-4">
                <AiInsightPanel clubId={clubId} />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-700">System notes</div>
              <div className="text-slate-600">
                Live refresh: ~25s + realtime subscriptions (debounced). Keep the single RPC payload for consistency + scale.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
