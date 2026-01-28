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

function riskLabel(evidence: number, checklistTotal: number, status: string) {
  // Owner-facing triage: where to intervene
  if (status === "closed") return { label: "DONE", cls: "border-slate-200/80 bg-slate-50/80 text-slate-800" };
  if (checklistTotal === 0 && evidence === 0)
    return { label: "HIGH RISK", cls: "border-rose-200/80 bg-rose-50/80 text-rose-950" };
  if (checklistTotal === 0 || evidence === 0)
    return { label: "MED RISK", cls: "border-amber-200/80 bg-amber-50/80 text-amber-950" };
  return { label: "ON TRACK", cls: "border-emerald-200/80 bg-emerald-50/80 text-emerald-950" };
}

function nextAction(evidence: number, checklistTotal: number, status: string) {
  if (status === "closed") return "No action needed.";
  if (checklistTotal === 0 && evidence === 0) return "Attach 4–6 outcomes and capture photo + note immediately.";
  if (checklistTotal === 0) return "Attach a checklist (4–6 outcomes) to measure delivery.";
  if (evidence === 0) return "Capture evidence (photo + note) to create proof and stabilize AI insight.";
  return "Maintain updates during delivery.";
}

export default function SessionTable({ clubId }: { clubId: string }) {
  const { sessions, booting } = useLiveDashboard(clubId);

  const model = useMemo(() => {
    const rows = (sessions ?? []).map((s) => {
      const total = s.activities_total ?? 0;
      const done = s.activities_done ?? 0;
      const completion = total > 0 ? done / total : 0;
      const evidence = s.evidence_items ?? 0;
      const status = (s.status ?? "planned") as string;

      const risk = riskLabel(evidence, total, status);

      const riskScore =
        risk.label === "HIGH RISK" ? 3 : risk.label === "MED RISK" ? 2 : risk.label === "ON TRACK" ? 1 : 0;

      return {
        id: s.id,
        title: s.title || "Untitled session",
        time: `${fmtTime(s.starts_at)} • ${s.duration_minutes ?? 60}m`,
        status,
        checklist: { done, total, completion },
        evidence,
        risk,
        riskScore,
        action: nextAction(evidence, total, status),
      };
    });

    // Sort by risk severity first, then earliest start time feel (keep stable)
    rows.sort((a, b) => b.riskScore - a.riskScore);

    const total = rows.length;
    const high = rows.filter((r) => r.risk.label === "HIGH RISK").length;
    const med = rows.filter((r) => r.risk.label === "MED RISK").length;
    const ok = rows.filter((r) => r.risk.label === "ON TRACK").length;

    // Exceptions are what the owner should look at first
    const exceptions = rows.filter((r) => r.risk.label === "HIGH RISK" || r.risk.label === "MED RISK");

    return { rows, total, high, med, ok, exceptions };
  }, [sessions]);

  if (booting) {
    return <div className="h-[360px] rounded-[22px] border border-slate-200 bg-white/60 animate-pulse" />;
  }

  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
      {/* Compact owner header */}
      <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Operational exceptions</div>
            <div className="mt-0.5 text-xs text-slate-600">
              Where to intervene now (risk-first). Execution + proof only.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
              High: <span className="text-slate-900">{model.high}</span>
            </span>
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
              Med: <span className="text-slate-900">{model.med}</span>
            </span>
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
              On track: <span className="text-slate-900">{model.ok}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      {model.total === 0 ? (
        <div className="px-6 py-10">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
            <div className="text-sm font-semibold text-slate-900">No sessions scheduled today</div>
            <div className="mt-1 text-sm text-slate-700">
              Create a session dated today to open a live analytics window.
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">OWNER KPI</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Execution</div>
                <div className="mt-1 text-xs text-slate-600">Checklist completion drives delivery quality.</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">OWNER KPI</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Proof</div>
                <div className="mt-1 text-xs text-slate-600">Evidence builds trust + stabilizes AI insight.</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">OWNER KPI</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Risk</div>
                <div className="mt-1 text-xs text-slate-600">Exceptions tell you where to intervene.</div>
              </div>
            </div>
          </div>
        </div>
      ) : model.exceptions.length ? (
        <div className="divide-y divide-slate-200/70">
          {model.exceptions.map((r) => (
            <div key={r.id} className="px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate text-sm font-semibold text-slate-900">{r.title}</div>

                    <span className={cx("rounded-full border px-3 py-1 text-xs font-semibold", statusChip(r.status))}>
                      {r.status.toUpperCase()}
                    </span>

                    <span className={cx("rounded-full border px-3 py-1 text-xs font-semibold", r.risk.cls)}>
                      {r.risk.label}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
                      {r.time}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                      <div className="text-[11px] font-semibold tracking-widest text-slate-500">CHECKLIST</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        {r.checklist.done}/{r.checklist.total}{" "}
                        <span className="text-slate-600">({pct(r.checklist.completion)})</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full border border-slate-200 bg-white/70">
                        <div
                          className="h-full bg-slate-900"
                          style={{ width: `${Math.round((r.checklist.total ? r.checklist.completion : 0) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                      <div className="text-[11px] font-semibold tracking-widest text-slate-500">EVIDENCE</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{r.evidence}</div>
                      <div className="text-xs text-slate-600">Proof items captured</div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
                      <div className="text-[11px] font-semibold tracking-widest text-slate-500">NEXT ACTION</div>
                      <div className="mt-1 text-sm font-semibold text-slate-900">{r.action}</div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 lg:max-w-[220px]">
                  Owners should reduce <span className="font-semibold text-slate-900">HIGH/MED risk</span> first to improve weekly quality metrics.
                </div>
              </div>
            </div>
          ))}

          <div className="px-5 py-4 text-xs text-slate-600">
            Showing only sessions needing intervention. On-track sessions are intentionally hidden to reduce noise.
          </div>
        </div>
      ) : (
        <div className="px-6 py-10">
          <div className="rounded-2xl border border-slate-200 bg-emerald-50/60 p-6">
            <div className="text-sm font-semibold text-emerald-950">No operational exceptions</div>
            <div className="mt-1 text-sm text-emerald-900">
              Checklist + evidence signals are present across today’s sessions. Keep capturing proof to maintain AI freshness.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
