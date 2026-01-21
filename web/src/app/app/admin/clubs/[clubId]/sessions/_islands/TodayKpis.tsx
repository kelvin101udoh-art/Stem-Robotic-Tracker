// web/src/app/app/admin/clubs/[clubId]/sessions/_islands/TodayKpis.tsx

"use client";

import { useMemo } from "react";
import { useLiveDashboard } from "./useLiveDashboard";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
function safeDiv(a: number, b: number) {
  return b === 0 ? 0 : a / b;
}
function pct(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 100)}%`;
}

function KpiCard(props: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] p-4">
      <div className="text-xs font-semibold tracking-widest text-slate-500">{props.label.toUpperCase()}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</div>
      <div className="mt-1 text-xs text-slate-600">{props.hint}</div>
    </div>
  );
}

export default function TodayKpis({ clubId }: { clubId: string }) {
  const { sessions, booting } = useLiveDashboard(clubId);

  const kpis = useMemo(() => {
    const totalSessions = sessions.length;
    const open = sessions.filter((s) => (s.status ?? "planned") === "open").length;
    const planned = sessions.filter((s) => (s.status ?? "planned") === "planned").length;
    const closed = sessions.filter((s) => (s.status ?? "planned") === "closed").length;

    const learners = sessions.reduce((sum, s) => sum + (s.participants ?? 0), 0);
    const evidence = sessions.reduce((sum, s) => sum + (s.evidence_items ?? 0), 0);

    const aTotal = sessions.reduce((sum, s) => sum + (s.activities_total ?? 0), 0);
    const aDone = sessions.reduce((sum, s) => sum + (s.activities_done ?? 0), 0);
    const completion = safeDiv(aDone, aTotal);

    const evidenceCoverage = totalSessions > 0 ? sessions.filter((s) => (s.evidence_items ?? 0) > 0).length / totalSessions : 0;
    const checklistCoverage = totalSessions > 0 ? sessions.filter((s) => (s.activities_total ?? 0) > 0).length / totalSessions : 0;

    const quality = clamp01(0.5 * clamp01(completion) + 0.3 * clamp01(evidenceCoverage) + 0.2 * clamp01(checklistCoverage));

    return { totalSessions, open, planned, closed, learners, evidence, completion, quality };
  }, [sessions]);

  if (booting) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[92px] rounded-[22px] border border-slate-200 bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard label="Today sessions" value={`${kpis.totalSessions}`} hint={`${kpis.open} open • ${kpis.planned} planned • ${kpis.closed} closed`} />
      <KpiCard label="Live quality index" value={pct(kpis.quality)} hint="Coverage + completion blend" />
      <KpiCard label="Checklist completion" value={pct(kpis.completion)} hint="Across today" />
      <KpiCard label="Participants tracked" value={`${kpis.learners}`} hint="Across today" />
      <KpiCard label="Evidence captured" value={`${kpis.evidence}`} hint="Across today" />
    </div>
  );
}
