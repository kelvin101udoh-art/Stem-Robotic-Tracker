// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/AiOpsCoachPanel.tsx


"use client";

import { useMemo } from "react";
import { useUpcomingSchedule } from "./useUpcomingSchedule";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export default function AiOpsCoachPanel({ clubId }: { clubId: string }) {
  const { rows, booting } = useUpcomingSchedule(clubId);

  const coach = useMemo(() => {
    const total = rows.length || 0;
    const open = rows.filter((r) => (r.status ?? "planned") === "open").length;
    const planned = rows.filter((r) => (r.status ?? "planned") === "planned").length;
    const withChecklist = rows.filter((r) => (r.activities_total ?? 0) > 0).length;
    const withEvidence = rows.filter((r) => (r.evidence_items ?? 0) > 0).length;

    const score = total
      ? clamp01(0.35 * (open / total) + 0.35 * (withChecklist / total) + 0.3 * (withEvidence / total))
      : 0;

    const readiness =
      score >= 0.75 ? "Ops-ready" : score >= 0.45 ? "Partial readiness" : "Low signal";

    const nextActions: string[] = [];
    if (planned > 0) nextActions.push("Mark sessions OPEN during delivery to unlock stronger live analytics.");
    if (withChecklist < total) nextActions.push("Attach 4–6 checklist outcomes for consistent execution tracking.");
    if (withEvidence < total) nextActions.push("Capture evidence early (photo + note) to stabilize AI insight.");
    if (!nextActions.length) nextActions.push("Keep delivery clean: update checklist + evidence as you go.");

    return {
      readiness,
      scorePct: `${Math.round(score * 100)}%`,
      nextActions: nextActions.slice(0, 3),
    };
  }, [rows]);

  if (booting) {
    return <div className="h-[220px] rounded-[26px] border border-slate-200/70 bg-white/60 animate-pulse" />;
  }

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-slate-900">AI Ops Coach</div>
            <div className="mt-0.5 text-xs text-slate-600">
              Automation-ready scheduling guidance (UI-only)
            </div>
          </div>
          <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            Pilot
          </span>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4">
          <div className="text-xs font-semibold tracking-widest text-slate-500">READINESS</div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">{coach.readiness}</div>
            <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-xs font-semibold text-slate-800">
              {coach.scorePct}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full border border-slate-200 bg-white/70">
            <div className="h-full bg-slate-900" style={{ width: coach.scorePct }} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
          <div className="text-xs font-semibold tracking-widest text-slate-500">NEXT BEST ACTIONS</div>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-800">
            {coach.nextActions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 text-xs text-slate-700">
          In production: this panel can be driven by your <span className="font-mono">session_ai_insights</span> rows and ops heuristics.
        </div>
      </div>
    </div>
  );
}
