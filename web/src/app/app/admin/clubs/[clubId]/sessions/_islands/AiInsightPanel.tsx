// web/src/app/app/admin/clubs/[clubId]/sessions/_islands/AiInsightPanel.tsx
"use client";

import { useMemo } from "react";
import { useLiveDashboard } from "./useLiveDashboard";
import { EvidenceCoveragePanel, SkeletonMicroCharts, cx } from "./_ui";

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
  if (minutes <= 2)
    return {
      label: "LIVE",
      cls: "border-emerald-200/80 bg-emerald-50/80 text-emerald-950",
    };
  if (minutes <= 10)
    return {
      label: "FRESH",
      cls: "border-indigo-200/80 bg-indigo-50/80 text-indigo-950",
    };
  return {
    label: "NEEDS UPDATE",
    cls: "border-rose-200/80 bg-rose-50/80 text-rose-950",
  };
}

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="text-xs font-semibold tracking-widest text-slate-500">
      {label}
    </div>
  );
}

export default function AiInsightPanel({ clubId }: { clubId: string }) {
  const { latestAi, booting, sessions } = useLiveDashboard(clubId);

  const tag = useMemo(() => {
    if (!latestAi?.created_at) return null;
    const mins = minsBetween(Date.now(), latestAi.created_at);
    return { mins, ...freshnessLabel(mins) };
  }, [latestAi]);

  const coverage = useMemo(() => {
    const sessionsCount = sessions.length;
    const openCount = sessions.filter(
      (s) => (s.status ?? "planned") === "open"
    ).length;

    // NOTE: This view is not the attendance module.
    // We treat “participants” here as a high-level engagement signal only.
    const withParticipantsCount = sessions.filter(
      (s) => (s.participants ?? 0) > 0
    ).length;

    const withEvidenceCount = sessions.filter(
      (s) => (s.evidence_items ?? 0) > 0
    ).length;

    const withChecklistCount = sessions.filter(
      (s) => (s.activities_total ?? 0) > 0
    ).length;

    return {
      sessionsCount,
      openCount,
      withParticipantsCount,
      withEvidenceCount,
      withChecklistCount,
    };
  }, [sessions]);

  if (booting) {
    return (
      <div className="h-[520px] rounded-[22px] border border-slate-200 bg-white/60 animate-pulse" />
    );
  }

  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900">
            Executive insight (auto)
          </div>

          {tag ? (
            <span
              className={cx(
                "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                tag.cls
              )}
            >
              {tag.label}{" "}
              <span className="text-slate-500 font-semibold">•</span>{" "}
              {tag.mins}m
            </span>
          ) : (
            <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              WAITING
            </span>
          )}
        </div>

        <div className="mt-0.5 text-xs text-slate-600">
          Automatically updates as today’s sessions progress (proof + outcomes).
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-5 sm:px-6 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <SectionTitle label="TODAY’S WINDOW" />
          <div className="mt-2 text-sm text-slate-800">
            This is a business summary: what’s going well, what’s missing, and
            what to do next.
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-700">
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold">
              Updated:{" "}
              <span className="text-slate-900">
                {latestAi?.created_at ? fmtDateTimeShort(latestAi.created_at) : "—"}
              </span>
            </span>
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold">
              Source:{" "}
              <span className="text-slate-900">
                {latestAi?.source?.toUpperCase?.() ?? "—"}
              </span>
            </span>
          </div>
        </div>

        {latestAi ? (
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <SectionTitle label="SUMMARY" />
              <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                {latestAi.source.toUpperCase()}
              </span>
            </div>

            <div className="mt-2 text-sm font-semibold text-slate-900">
              {latestAi.summary}
            </div>

            <div className="mt-4">
              <SectionTitle label="NEXT BEST ACTIONS" />
              <div className="mt-2 grid gap-2">
                {(latestAi.recommendations ?? []).slice(0, 4).map((r, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <div className="text-sm font-semibold text-slate-900">
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-xs font-bold text-slate-800">
                        {idx + 1}
                      </span>
                      {r.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">{r.why}</div>
                    <div className="mt-2 text-xs text-slate-800">{r.action}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[11px] text-slate-500">
                Updated: {fmtDateTimeShort(latestAi.created_at)}{" "}
                {tag ? `• ${tag.mins} min ago` : ""}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <SectionTitle label="WAITING FOR FIRST INSIGHT" />
              <div className="mt-2 text-sm text-slate-800">
                No insight stored for today yet.
              </div>
              <div className="mt-2 text-xs text-slate-600">
                Once the system receives enough proof + outcomes signals, an
                insight appears automatically.
              </div>

              <div className="mt-4 grid gap-2">
                <div className="rounded-xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-700">
                  Tip: capture <span className="font-semibold text-slate-900">photo + note</span>{" "}
                  early to create proof and strengthen summaries.
                </div>
                <div className="rounded-xl border border-slate-200 bg-white/70 p-3 text-xs text-slate-700">
                  Tip: keep <span className="font-semibold text-slate-900">4–6 outcomes</span>{" "}
                  per session to track delivery quality.
                </div>
              </div>
            </div>

            <SkeletonMicroCharts />

            <EvidenceCoveragePanel
              title="Health check (why insight is empty)"
              sessionsCount={coverage.sessionsCount}
              openCount={coverage.openCount}
              withParticipantsCount={coverage.withParticipantsCount}
              withEvidenceCount={coverage.withEvidenceCount}
              withChecklistCount={coverage.withChecklistCount}
            />
          </>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 text-sm text-slate-700">
          This panel is designed for{" "}
          <span className="font-semibold text-slate-900">business decisions</span>{" "}
          (quality + proof + next actions). Detailed attendance lives in its own
          module.
        </div>
      </div>
    </div>
  );
}
