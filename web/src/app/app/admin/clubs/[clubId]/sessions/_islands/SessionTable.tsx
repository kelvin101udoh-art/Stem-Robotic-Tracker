//web/src/app/app/admin/clubs/[clubId]/sessions/_islands/SessionTable.tsx

"use client";

import { useMemo } from "react";
import { useLiveDashboard } from "./useLiveDashboard";
import { cx } from "./_ui";

function pct(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 100)}%`;
}
function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function statusChip(s?: string | null) {
  const k = s ?? "planned";
  if (k === "open") return "border-emerald-200/80 bg-emerald-50/80 text-emerald-950";
  if (k === "closed") return "border-slate-200/80 bg-slate-50/80 text-slate-800";
  return "border-indigo-200/80 bg-indigo-50/80 text-indigo-950";
}
function riskLabel(evidence: number, totalChecklist: number) {
  // simple, business-facing signal
  if (totalChecklist === 0 && evidence === 0) return { label: "HIGH RISK", cls: "border-rose-200/80 bg-rose-50/80 text-rose-950" };
  if (totalChecklist === 0 || evidence === 0) return { label: "MED RISK", cls: "border-amber-200/80 bg-amber-50/80 text-amber-950" };
  return { label: "ON TRACK", cls: "border-emerald-200/80 bg-emerald-50/80 text-emerald-950" };
}

export default function SessionTable({ clubId }: { clubId: string }) {
  const { sessions, booting } = useLiveDashboard(clubId);

  const rows = useMemo(() => {
    return (sessions ?? []).map((s) => {
      const total = s.activities_total ?? 0;
      const done = s.activities_done ?? 0;
      const completion = total > 0 ? done / total : 0;
      const evidence = s.evidence_items ?? 0;
      const risk = riskLabel(evidence, total);

      return {
        id: s.id,
        title: s.title || "Untitled session",
        time: `${fmtTime(s.starts_at)} • ${s.duration_minutes ?? 60}m`,
        status: s.status ?? "planned",
        checklist: { done, total, completion },
        evidence,
        risk,
      };
    });
  }, [sessions]);

  if (booting) {
    return <div className="h-[360px] rounded-[22px] border border-slate-200 bg-white/60 animate-pulse" />;
  }

  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-4 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Today sessions</div>
            <div className="mt-0.5 text-xs text-slate-600">
              Analytics view: execution + proof (no attendance)
            </div>
          </div>

          <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
            Rows: <span className="text-slate-900">{rows.length}</span>
          </span>
        </div>
      </div>

      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-white/60">
              <tr className="border-b border-slate-200/70">
                <th className="px-5 py-3 text-[11px] font-semibold tracking-widest text-slate-500">SESSION</th>
                <th className="px-5 py-3 text-[11px] font-semibold tracking-widest text-slate-500">STATUS</th>
                <th className="px-5 py-3 text-[11px] font-semibold tracking-widest text-slate-500">CHECKLIST</th>
                <th className="px-5 py-3 text-[11px] font-semibold tracking-widest text-slate-500">EVIDENCE</th>
                <th className="px-5 py-3 text-[11px] font-semibold tracking-widest text-slate-500">RISK</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/70">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                    <div className="mt-1 text-xs text-slate-600">{r.time}</div>
                  </td>

                  <td className="px-5 py-4">
                    <span className={cx("rounded-full border px-3 py-1 text-xs font-semibold", statusChip(r.status))}>
                      {r.status.toUpperCase()}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-slate-900">
                      {r.checklist.done}/{r.checklist.total}{" "}
                      <span className="text-slate-600">({pct(r.checklist.completion)})</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                      <div className="h-full bg-slate-900" style={{ width: `${Math.round((r.checklist.total ? r.checklist.completion : 0) * 100)}%` }} />
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-slate-900">{r.evidence}</div>
                    <div className="mt-1 text-xs text-slate-600">Proof items</div>
                  </td>

                  <td className="px-5 py-4">
                    <span className={cx("rounded-full border px-3 py-1 text-xs font-semibold", r.risk.cls)}>
                      {r.risk.label}
                    </span>
                    <div className="mt-1 text-xs text-slate-600">
                      {r.evidence === 0 ? "Add photo + note." : r.checklist.total === 0 ? "Attach 4–6 outcomes." : "Maintain updates."}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-5 py-4 text-xs text-slate-600">
            Tip: Owners love “risk labels” because it tells them where to intervene immediately.
          </div>
        </div>
      ) : (
        <div className="px-6 py-10">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-center">
            <div className="text-sm font-semibold text-slate-900">No sessions scheduled today</div>
            <div className="mt-1 text-sm text-slate-700">
              Create a session dated today to activate live analytics and AI insight.
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 text-left">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <div className="text-xs font-semibold tracking-widest text-slate-500">STEP 1</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Schedule today</div>
                <div className="mt-1 text-xs text-slate-600">Creates an analytics window.</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <div className="text-xs font-semibold tracking-widest text-slate-500">STEP 2</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Attach checklist</div>
                <div className="mt-1 text-xs text-slate-600">4–6 outcomes → execution tracking.</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <div className="text-xs font-semibold tracking-widest text-slate-500">STEP 3</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Capture evidence</div>
                <div className="mt-1 text-xs text-slate-600">Photo + note → proof & AI stability.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
