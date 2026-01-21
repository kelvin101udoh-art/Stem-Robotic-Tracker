// web/src/app/app/admin/clubs/[clubId]/sessions/_islands/AiInsightPanel.tsx


// web/src/app/app/admin/clubs/[clubId]/sessions/_islands/AiInsightPanel.tsx
"use client";

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
  if (!thenIso) return 0;
  const t = new Date(thenIso).getTime();
  return Math.max(0, Math.round((now - t) / 60000));
}
function freshnessLabel(minutes: number) {
  if (minutes <= 2) return { label: "LIVE", cls: "border-emerald-200 bg-emerald-50 text-emerald-900" };
  if (minutes <= 10) return { label: "FRESH", cls: "border-indigo-200 bg-indigo-50 text-indigo-900" };
  return { label: "STALE", cls: "border-rose-200 bg-rose-50 text-rose-900" };
}

export default function AiInsightPanel({ clubId }: { clubId: string }) {
  const { latestAi, booting } = useLiveDashboard(clubId);

  const tag = useMemo(() => {
    if (!latestAi?.created_at) return null;
    const mins = minsBetween(Date.now(), latestAi.created_at);
    return { mins, ...freshnessLabel(mins) };
  }, [latestAi]);

  if (booting) {
    return <div className="h-[360px] rounded-[22px] border border-slate-200 bg-white animate-pulse" />;
  }

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
      <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900">Automated AI Insight</div>
          {tag ? (
            <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", tag.cls)}>{tag.label}</span>
          ) : (
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">WAITING</span>
          )}
        </div>

        <div className="mt-0.5 text-xs text-slate-600">
          No manual triggers • Azure writes to <span className="font-mono">session_ai_insights</span> automatically
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {latestAi ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold tracking-widest text-slate-500">LATEST AI OUTPUT</div>
            <div className="mt-2 text-sm font-semibold text-slate-900">{latestAi.summary}</div>

            <div className="mt-3 grid gap-2">
              {(latestAi.recommendations ?? []).slice(0, 4).map((r, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                  <div className="mt-1 text-xs text-slate-600">{r.why}</div>
                  <div className="mt-2 text-xs text-slate-700">{r.action}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-[11px] text-slate-500">
              Updated: {fmtDateTimeShort(latestAi.created_at)} {tag ? `• ${tag.mins} min ago` : ""}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No AI insight stored for today yet.
            <div className="mt-2 text-xs text-slate-600">Once automation writes an insight row, this panel updates automatically.</div>
          </div>
        )}

        <div className="mt-4 rounded-[18px] border border-slate-200 bg-white/70 p-4 text-sm text-slate-700">
          This page is strictly live analytics. A separate History Analytics page will cover older days and trends.
        </div>
      </div>
    </div>
  );
}
