// web/src/app/app/admin/clubs/[clubId]/sessions/_islands/_ui.tsx


"use client";

import React from "react";

export function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

/**
 * Soft animated skeleton micro-charts (pure CSS)
 * - Works in empty states without charts libs
 * - Looks enterprise, not "blank"
 */
export function SkeletonMicroCharts() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-[0_10px_30px_-26px_rgba(2,6,23,0.45)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold tracking-widest text-slate-500">LIVE PREVIEW</div>
        <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
          Waiting for signals
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {/* Sparkline skeleton */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold tracking-widest text-slate-500">EVIDENCE</div>
            <div className="h-2 w-16 rounded-full bg-slate-200/70 animate-pulse" />
          </div>

          <div className="mt-3 flex h-12 items-end gap-1">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className="w-full rounded-sm bg-slate-200/70 animate-[pulse_1.6s_ease-in-out_infinite]"
                style={{
                  height: `${20 + ((i * 13) % 28)}%`,
                  animationDelay: `${i * 70}ms`,
                }}
              />
            ))}
          </div>

          <div className="mt-2 text-xs text-slate-600">
            Micro-trend appears once evidence is captured.
          </div>
        </div>

        {/* Gauge skeleton */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold tracking-widest text-slate-500">CHECKLIST</div>
            <div className="h-2 w-16 rounded-full bg-slate-200/70 animate-pulse" />
          </div>

          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full border border-slate-200 bg-white/70">
              <div className="h-full w-[48%] bg-slate-300/60 animate-[pulse_1.8s_ease-in-out_infinite]" />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-slate-200 bg-white/70 p-2">
                  <div className="h-2 w-12 rounded bg-slate-200/70 animate-pulse" />
                  <div className="mt-2 h-5 w-16 rounded bg-slate-200/70 animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 text-xs text-slate-600">
            Completion bars render once checklist items exist.
          </div>
        </div>
      </div>

      {/* Tiny “card shimmer” row */}
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-white/70 p-3"
          >
            <div className="h-2 w-20 rounded bg-slate-200/70 animate-pulse" />
            <div className="mt-2 h-6 w-16 rounded bg-slate-200/70 animate-pulse" />
            <div className="mt-2 h-2 w-28 rounded bg-slate-200/70 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Data Coverage Panel
 * Explains what’s missing & why, based on existing session metrics only.
 */
export function DataCoveragePanel(props: {
  title?: string;
  sessionsCount: number;
  openCount: number;
  withParticipantsCount: number;
  withEvidenceCount: number;
  withChecklistCount: number;
}) {
  const {
    title = "Data Coverage",
    sessionsCount,
    openCount,
    withParticipantsCount,
    withEvidenceCount,
    withChecklistCount,
  } = props;

  const pct = (n: number) => {
    if (sessionsCount <= 0) return "0%";
    return `${Math.round((n / sessionsCount) * 100)}%`;
  };

  const rows = [
    {
      label: "Sessions marked OPEN",
      value: `${openCount}/${sessionsCount} (${pct(openCount)})`,
      ok: sessionsCount > 0 && openCount > 0,
      why:
        "OPEN status increases live signal quality and makes the dashboard reflect real delivery.",
      fix: "Mark today’s session OPEN while teaching.",
    },
    {
      label: "Participants recorded",
      value: `${withParticipantsCount}/${sessionsCount} (${pct(withParticipantsCount)})`,
      ok: sessionsCount > 0 && withParticipantsCount > 0,
      why:
        "Attendance is the foundation for accurate analytics and reporting across sessions.",
      fix: "Add participants early (even rough count) to activate attendance insights.",
    },
    {
      label: "Evidence captured",
      value: `${withEvidenceCount}/${sessionsCount} (${pct(withEvidenceCount)})`,
      ok: sessionsCount > 0 && withEvidenceCount > 0,
      why:
        "Evidence items (photo/note) stabilize AI insight and create verifiable learning proof.",
      fix: "Capture at least 2 items: 1 photo + 1 note.",
    },
    {
      label: "Checklist attached",
      value: `${withChecklistCount}/${sessionsCount} (${pct(withChecklistCount)})`,
      ok: sessionsCount > 0 && withChecklistCount > 0,
      why:
        "Checklists measure execution: what was planned vs what was delivered.",
      fix: "Attach 4–6 outcomes and tick progress live.",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-[0_10px_30px_-26px_rgba(2,6,23,0.45)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold tracking-widest text-slate-500">
          {title.toUpperCase()}
        </div>
        <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
          Sessions: <span className="text-slate-900">{sessionsCount}</span>
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">
                  {r.label}
                </div>
                <div className="mt-1 text-xs text-slate-600">{r.why}</div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-xs font-semibold text-slate-900">
                  {r.value}
                </div>
                <span
                  className={cx(
                    "mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                    r.ok
                      ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-950"
                      : "border-rose-200/80 bg-rose-50/80 text-rose-950"
                  )}
                >
                  {r.ok ? "OK" : "MISSING"}
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-white/70 p-2 text-xs text-slate-700">
              <span className="font-semibold text-slate-900">Fix:</span>{" "}
              {r.fix}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
