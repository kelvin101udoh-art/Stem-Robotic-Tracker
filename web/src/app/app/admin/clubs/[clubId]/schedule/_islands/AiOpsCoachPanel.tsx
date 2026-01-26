// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/AiOpsCoachPanel.tsx

"use client";

import { useMemo } from "react";
import { useUpcomingSchedule } from "./useUpcomingSchedule";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function tone(score: number) {
  if (score >= 0.75) return "border-emerald-200/80 bg-emerald-50/70 text-emerald-950";
  if (score >= 0.45) return "border-indigo-200/80 bg-indigo-50/70 text-indigo-950";
  return "border-rose-200/80 bg-rose-50/70 text-rose-950";
}

export default function AiOpsCoachPanel({ clubId }: { clubId: string }) {
  const { rows, booting } = useUpcomingSchedule(clubId);

  const coach = useMemo(() => {
    const total = rows.length || 0;

    const planned = rows.filter((r: any) => (r.status ?? "planned") === "planned").length;
    const inProgress = rows.filter((r: any) => (r.status ?? "planned") === "open").length;

    const withChecklist = rows.filter((r: any) => (r.activities_total ?? 0) > 0).length;
    const withEvidence = rows.filter((r: any) => (r.evidence_items ?? 0) > 0).length;

    // Simple operational confidence score
    const score = total
      ? clamp01(0.40 * (withChecklist / total) + 0.35 * (withEvidence / total) + 0.25 * (inProgress / total))
      : 0;

    const status =
      score >= 0.75 ? "Running smoothly" : score >= 0.45 ? "Good, but improve consistency" : "Needs setup";

    const nextSteps: string[] = [];
    if (planned > 0) nextSteps.push("Before the session: add a short checklist (4–6 items) so delivery is consistent.");
    if (withChecklist < total) nextSteps.push("Add checklist items to all upcoming sessions (helps reporting and outcomes).");
    if (withEvidence < total) nextSteps.push("Capture 1 photo + 1 note early in the session (improves proof for parents).");
    if (total > 0 && nextSteps.length === 0) nextSteps.push("Keep doing what you’re doing — your schedule is well prepared.");

    return {
      status,
      scorePct: Math.round(score * 100),
      nextSteps: nextSteps.slice(0, 3),
      planned,
      total,
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
            <div className="text-sm font-semibold text-slate-900">Operations coach</div>
            <div className="mt-0.5 text-xs text-slate-600">
              Simple guidance to keep sessions consistent and easy to report.
            </div>
          </div>
          <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            Guidance
          </span>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4">
          <div className="text-xs font-semibold tracking-widest text-slate-500">STATUS</div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">{coach.status}</div>
            <span className={cx("rounded-full border px-2.5 py-1 text-xs font-semibold", tone(coach.scorePct / 100))}>
              {coach.scorePct}%
            </span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full border border-slate-200 bg-white/70">
            <div className="h-full bg-slate-900" style={{ width: `${coach.scorePct}%` }} />
          </div>

          <div className="mt-3 text-xs text-slate-600">
            Planned sessions:{" "}
            <span className="font-semibold text-slate-900">
              {coach.planned}/{coach.total}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
          <div className="text-xs font-semibold tracking-widest text-slate-500">NEXT STEPS</div>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-800">
            {coach.nextSteps.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 text-xs text-slate-700">
          This panel becomes even smarter once you consistently track checklist + evidence for every session.
        </div>
      </div>
    </div>
  );
}

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}
