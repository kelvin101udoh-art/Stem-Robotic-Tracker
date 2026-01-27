// web/src/app/app/admin/clubs/[clubId]/sessions/page.tsx
"use client";

import { useParams } from "next/navigation";
import LiveHeader from "./_islands/LiveHeader";
import TodayKpis from "./_islands/TodayKpis";
import LiveSessionFocus from "./_islands/LiveSessionFocus";
import TodaySchedule from "./_islands/TodaySchedule";
import AiInsightPanel from "./_islands/AiInsightPanel";

function Pill(props: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
      <span className="text-slate-500">{props.label}:</span>
      <span className="text-slate-900">{props.value}</span>
    </span>
  );
}

export default function SessionsPage() {
  const { clubId } = useParams<{ clubId: string }>();

  return (
    <>
      <LiveHeader clubId={clubId} />

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Executive frame */}
        <div className="rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
          {/* Top band */}
          <div className="border-b border-slate-200/70 bg-[radial-gradient(1000px_260px_at_10%_0%,rgba(99,102,241,0.16),transparent_60%),radial-gradient(900px_240px_at_90%_0%,rgba(34,211,238,0.12),transparent_55%)] px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">
                  Today’s Session Intelligence
                </div>
                <div className="mt-0.5 text-xs text-slate-600">
                  A business-owner view of delivery quality, proof captured, and
                  what to improve next.
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Pill label="Scope" value="Today" />
                  <Pill label="View" value="Sessions analytics (not attendance)" />
                  <Pill label="Mode" value="Live + auto-updating" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                  Live updates active
                </span>
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                  Built for reporting
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-7 space-y-6">
            {/* 1) KPI snapshot */}
            <div>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Performance snapshot
                  </div>
                  <div className="mt-0.5 text-xs text-slate-600">
                    Quick health indicators for today’s sessions.
                  </div>
                </div>
              </div>
              <TodayKpis clubId={clubId} />
            </div>

            {/* 2) Main grid */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left */}
              <div className="lg:col-span-8 space-y-6">
                <LiveSessionFocus clubId={clubId} />
                <TodaySchedule clubId={clubId} />
              </div>

              {/* Right */}
              <div className="lg:col-span-4">
                <AiInsightPanel clubId={clubId} />
              </div>
            </div>

            {/* 3) Bottom note (non-technical) */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white/60 px-4 py-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-700">How to use this</div>
              <div className="text-slate-600">
                Aim for: <span className="font-semibold text-slate-900">4–6</span> outcomes per
                session, <span className="font-semibold text-slate-900">2+</span> proof items (photo/note),
                and keep the session <span className="font-semibold text-slate-900">OPEN</span> during delivery.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
