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
function MiniBar({ value }: { value: number }) {
  const v = clamp01(value);
  return (
    <div className="mt-3 h-1.5 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
      <div className="h-full bg-slate-900" style={{ width: `${Math.round(v * 100)}%` }} />
    </div>
  );
}
function KpiCard(props: {
  label: string;
  value: string;
  hint: string;
  sub?: string;
  score?: number;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-white/70 shadow-[0_18px_56px_-48px_rgba(2,6,23,0.55)] backdrop-blur p-4 hover:shadow-lg transition duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-widest text-slate-500">{props.label.toUpperCase()}</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</div>
          <div className="mt-1 text-xs text-slate-600">{props.hint}</div>
        </div>
        <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700">
          {props.sub ?? "Today"}
        </div>
      </div>
      {typeof props.score === "number" ? <MiniBar value={props.score} /> : null}
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
    const evidenceCoverage =
      totalSessions > 0 ? sessions.filter((s) => (s.evidence_items ?? 0) > 0).length / totalSessions : 0;
    const checklistCoverage =
      totalSessions > 0 ? sessions.filter((s) => (s.activities_total ?? 0) > 0).length / totalSessions : 0;
    const quality = clamp01(0.5 * clamp01(completion) + 0.3 * clamp01(evidenceCoverage) + 0.2 * clamp01(checklistCoverage));
    return { totalSessions, open, planned, closed, learners, evidence, completion, quality, evidenceCoverage, checklistCoverage };
  }, [sessions]);
  if (booting) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[110px] rounded-[22px] border border-slate-200 bg-white/60 animate-pulse" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        label="Sessions"
        value={`${kpis.totalSessions}`}
        hint={`${kpis.open} open • ${kpis.planned} planned • ${kpis.closed} closed`}
        sub="Volume"
      />
      <KpiCard
        label="Quality index"
        value={pct(kpis.quality)}
        hint={`Blend of completion + coverage`}
        sub={`Evidence ${pct(kpis.evidenceCoverage)} • Checklist ${pct(kpis.checklistCoverage)}`}
        score={kpis.quality}
      />
      <KpiCard
        label="Checklist completion"
        value={pct(kpis.completion)}
        hint="Across today’s sessions"
        sub="Execution"
        score={kpis.completion}
      />
      <KpiCard
        label="Participants tracked"
        value={`${kpis.learners}`}
        hint="Attendance signals captured"
        sub="People"
        score={clamp01(kpis.learners >= 24 ? 1 : kpis.learners / 24)}
      />
      <KpiCard
        label="Evidence captured"
        value={`${kpis.evidence}`}
        hint="Photos • notes • uploads"
        sub="Proof"
        score={clamp01(kpis.evidence >= 10 ? 1 : kpis.evidence / 10)}
      />
    </div>
  );
}
