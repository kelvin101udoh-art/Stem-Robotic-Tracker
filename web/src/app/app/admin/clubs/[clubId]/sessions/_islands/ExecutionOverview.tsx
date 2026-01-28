// web/src/app/app/admin/clubs/[clubId]/sessions/_islands/ExecutionOverview.tsx

"use client";

import { useMemo } from "react";
import { useLiveDashboard } from "./useLiveDashboard";
import { cx } from "./_ui";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
function pct(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 100)}%`;
}

function StatCard(props: {
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "good" | "warn";
  bar?: number;
}) {
  const tone =
    props.tone === "good"
      ? "border-emerald-200/70 bg-emerald-50/60 text-emerald-950"
      : props.tone === "warn"
      ? "border-rose-200/70 bg-rose-50/60 text-rose-950"
      : "border-slate-200 bg-white/70 text-slate-800";

  return (
    <div className="rounded-[22px] border border-slate-200/80 bg-white/70 shadow-[0_18px_56px_-48px_rgba(2,6,23,0.55)] backdrop-blur p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-widest text-slate-500">
            {props.label.toUpperCase()}
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {props.value}
          </div>
          <div className="mt-1 text-xs text-slate-600">{props.hint}</div>
        </div>

        <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", tone)}>
          {props.tone === "good" ? "STRONG" : props.tone === "warn" ? "RISK" : "OK"}
        </span>
      </div>

      {typeof props.bar === "number" ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
          <div
            className="h-full bg-slate-900"
            style={{ width: `${Math.round(clamp01(props.bar) * 100)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

export default function ExecutionOverview({ clubId }: { clubId: string }) {
  const { sessions, booting } = useLiveDashboard(clubId);

  const model = useMemo(() => {
    const total = sessions.length;

    const open = sessions.filter((s) => (s.status ?? "planned") === "open").length;
    const planned = sessions.filter((s) => (s.status ?? "planned") === "planned").length;
    const closed = sessions.filter((s) => (s.status ?? "planned") === "closed").length;

    const evidenceTotal = sessions.reduce((sum, s) => sum + (s.evidence_items ?? 0), 0);
    const evidenceCoverage = total > 0 ? sessions.filter((s) => (s.evidence_items ?? 0) > 0).length / total : 0;

    const aTotal = sessions.reduce((sum, s) => sum + (s.activities_total ?? 0), 0);
    const aDone = sessions.reduce((sum, s) => sum + (s.activities_done ?? 0), 0);
    const completion = aTotal > 0 ? aDone / aTotal : 0;
    const checklistCoverage = total > 0 ? sessions.filter((s) => (s.activities_total ?? 0) > 0).length / total : 0;

    // Business-friendly “Delivery Health” (no attendance)
    const health = clamp01(0.55 * completion + 0.25 * evidenceCoverage + 0.20 * checklistCoverage);

    const headline =
      total === 0
        ? "No sessions scheduled today"
        : health >= 0.75
        ? "Strong delivery signals today"
        : health >= 0.45
        ? "Delivery is happening — improve proof & execution"
        : "Low signal quality — missing checklist/evidence";

    const note =
      total === 0
        ? "Add a session for today to activate live analytics."
        : "This view focuses on what owners care about: execution + proof. Attendance has its own module.";

    return {
      total,
      open,
      planned,
      closed,
      evidenceTotal,
      evidenceCoverage,
      completion,
      checklistCoverage,
      health,
      headline,
      note,
    };
  }, [sessions]);

  if (booting) {
    return <div className="h-[120px] rounded-[22px] border border-slate-200 bg-white/60 animate-pulse" />;
  }

  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Executive overview</div>
            <div className="mt-0.5 text-xs text-slate-600">{model.headline}</div>
          </div>
          <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
            Sessions today: <span className="text-slate-900">{model.total}</span>
          </span>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-800">
          <div className="font-semibold text-slate-900">What this dashboard measures</div>
          <div className="mt-1 text-sm text-slate-700">
            Checklist execution + evidence proof + session state.{" "}
            <span className="text-slate-600">Attendance is intentionally excluded here.</span>
          </div>
          <div className="mt-2 text-xs text-slate-600">{model.note}</div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Delivery health"
            value={pct(model.health)}
            hint="Weighted execution + evidence coverage"
            tone={model.health >= 0.75 ? "good" : model.health >= 0.45 ? "neutral" : "warn"}
            bar={model.health}
          />
          <StatCard
            label="Checklist completion"
            value={pct(model.completion)}
            hint="Done / total checklist items (today)"
            tone={model.completion >= 0.7 ? "good" : model.completion >= 0.35 ? "neutral" : "warn"}
            bar={model.completion}
          />
          <StatCard
            label="Evidence coverage"
            value={pct(model.evidenceCoverage)}
            hint="Sessions with ≥ 1 proof item"
            tone={model.evidenceCoverage >= 0.7 ? "good" : model.evidenceCoverage >= 0.35 ? "neutral" : "warn"}
            bar={model.evidenceCoverage}
          />
          <StatCard
            label="Evidence items"
            value={`${model.evidenceTotal}`}
            hint="Total proof captured today"
            tone={model.evidenceTotal >= Math.max(2, model.total * 2) ? "good" : model.evidenceTotal >= 1 ? "neutral" : "warn"}
            bar={model.total > 0 ? clamp01(model.evidenceTotal / (model.total * 2)) : 0}
          />
        </div>
      </div>
    </div>
  );
}
