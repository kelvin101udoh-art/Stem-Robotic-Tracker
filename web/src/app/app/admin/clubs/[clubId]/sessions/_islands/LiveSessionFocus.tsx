// web/src/app/app/admin/clubs/[clubId]/sessions/_islands/LiveSessionFocus.tsx


"use client";

import { useMemo } from "react";
import { useLiveDashboard, SessionRow } from "./useLiveDashboard";
import { DataCoveragePanel, SkeletonMicroCharts, cx } from "./_ui";

function pct(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 100)}%`;
}
function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}
function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
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
function statusChip(s?: string | null) {
  const k = s ?? "planned";
  if (k === "open") return "border-emerald-200/80 bg-emerald-50/80 text-emerald-950";
  if (k === "closed") return "border-slate-200/80 bg-slate-50/80 text-slate-800";
  return "border-indigo-200/80 bg-indigo-50/80 text-indigo-950";
}
function minsBetween(now: number, thenIso?: string | null) {
  if (!thenIso) return 0;
  const t = new Date(thenIso).getTime();
  return Math.max(0, Math.round((now - t) / 60000));
}
function freshnessLabel(minutes: number) {
  if (minutes <= 2) return { label: "LIVE", cls: "border-emerald-200/80 bg-emerald-50/80 text-emerald-950" };
  if (minutes <= 10) return { label: "FRESH", cls: "border-indigo-200/80 bg-indigo-50/80 text-indigo-950" };
  return { label: "STALE", cls: "border-rose-200/80 bg-rose-50/80 text-rose-950" };
}

function Pill(props: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
      {props.label}: <span className="ml-1 text-slate-900">{props.value}</span>
    </span>
  );
}

function SignalRow(props: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-slate-700">{props.label}</div>
      <span
        className={cx(
          "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
          props.ok ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-950" : "border-rose-200/80 bg-rose-50/80 text-rose-950"
        )}
      >
        {props.ok ? "OK" : "MISSING"}
      </span>
    </div>
  );
}

function MetricCard(props: { title: string; value: string; score: number; desc: string }) {
  const s = clamp01(props.score);
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 shadow-[0_16px_52px_-52px_rgba(2,6,23,0.55)] backdrop-blur p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{props.title}</div>
          <div className="mt-1 text-xs text-slate-600">{props.desc}</div>
        </div>
        <div className="text-lg font-semibold text-slate-900">{props.value}</div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
        <div className="h-full bg-slate-900" style={{ width: `${Math.round(s * 100)}%` }} />
      </div>
    </div>
  );
}

export default function LiveSessionFocus({ clubId }: { clubId: string }) {
  const { sessions, booting } = useLiveDashboard(clubId);

  const liveSession = useMemo<SessionRow | null>(() => {
    const open = sessions.find((s) => (s.status ?? "planned") === "open");
    if (open) return open;
    return sessions.find((s) => (s.status ?? "planned") !== "closed") ?? sessions[0] ?? null;
  }, [sessions]);

  const liveKpis = useMemo(() => {
    if (!liveSession) {
      return {
        participants: 0,
        evidence: 0,
        checklistTotal: 0,
        checklistDone: 0,
        completion: 0,
        lastEvidenceAt: null as string | null,
      };
    }
    const total = liveSession.activities_total ?? 0;
    const done = liveSession.activities_done ?? 0;
    const completion = total > 0 ? done / total : 0;

    return {
      participants: liveSession.participants ?? 0,
      evidence: liveSession.evidence_items ?? 0,
      checklistTotal: total,
      checklistDone: done,
      completion,
      lastEvidenceAt: liveSession.last_evidence_at ?? null,
    };
  }, [liveSession]);

  const coverage = useMemo(() => {
    const sessionsCount = sessions.length;
    const openCount = sessions.filter((s) => (s.status ?? "planned") === "open").length;
    const withParticipantsCount = sessions.filter((s) => (s.participants ?? 0) > 0).length;
    const withEvidenceCount = sessions.filter((s) => (s.evidence_items ?? 0) > 0).length;
    const withChecklistCount = sessions.filter((s) => (s.activities_total ?? 0) > 0).length;

    return { sessionsCount, openCount, withParticipantsCount, withEvidenceCount, withChecklistCount };
  }, [sessions]);

  const insight = useMemo(() => {
    if (!liveSession) {
      return {
        headline: "No live session detected",
        bullets: [
          { title: "Nothing scheduled for today", detail: "Create a session dated today to activate live analytics and AI output." },
          { title: "What populates this view?", detail: "Attendance, checklist execution, and evidence capture drive signal quality." },
        ],
        actions: ["Add a session scheduled for today.", "Mark it OPEN during delivery.", "Capture evidence early (photo + note)."],
      };
    }

    const bullets: Array<{ title: string; detail: string }> = [];
    const actions: string[] = [];

    const total = liveKpis.checklistTotal;
    const done = liveKpis.checklistDone;
    const completion = liveKpis.completion;

    if ((liveSession.status ?? "planned") !== "open") {
      bullets.push({ title: "Session not OPEN", detail: "Signal quality improves when the session is marked OPEN during delivery." });
      actions.push("Mark the session OPEN to improve real-time quality.");
    } else {
      bullets.push({ title: "Session is live", detail: "Monitoring participants, evidence and checklist progress in real time." });
    }

    if (total === 0) {
      bullets.push({ title: "Checklist missing", detail: "Attach 4–6 outcomes to track delivery execution." });
      actions.push("Attach a checklist (4–6 core outcomes).");
    } else {
      bullets.push({ title: "Execution tracking", detail: `Completion is ${pct(completion)} (${done}/${total}).` });
      if (completion < 0.5 && total >= 4) actions.push("Trim checklist to core outcomes and update during session.");
    }

    if ((liveSession.evidence_items ?? 0) === 0) {
      bullets.push({ title: "Evidence is zero", detail: "Add at least 2 items to stabilize AI insights and proof logs." });
      actions.push("Capture at least 2 items (photo + note).");
    } else {
      const mins = minsBetween(Date.now(), liveSession.last_evidence_at);
      const f = freshnessLabel(mins);
      bullets.push({ title: "Evidence momentum", detail: `${liveSession.evidence_items} item(s). Last update: ${mins} min ago (${f.label}).` });
      if (mins > 10) actions.push("Capture a quick update to keep insights fresh.");
    }

    if ((liveSession.participants ?? 0) === 0) {
      bullets.push({ title: "Participants not recorded", detail: "Attendance improves analytics accuracy and reporting." });
      actions.push("Record participants early for accurate attendance analytics.");
    } else {
      bullets.push({ title: "Attendance tracked", detail: `${liveSession.participants} participant(s) recorded.` });
    }

    return {
      headline: liveSession.title || "Live Session",
      bullets,
      actions: actions.length ? actions.slice(0, 3) : ["Continue delivery and keep evidence/checklist updated."],
    };
  }, [liveSession, liveKpis]);

  if (booting) {
    return <div className="h-[380px] rounded-[22px] border border-slate-200 bg-white/60 animate-pulse" />;
  }

  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.14),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Live session focus</div>
            <div className="mt-0.5 text-xs text-slate-600">
              Operational signals + actionable insight for the active session (or next scheduled today)
            </div>
          </div>

          {liveSession ? (
            <span className={cx("rounded-full border px-3 py-1 text-xs font-semibold", statusChip(liveSession.status))}>
              {(liveSession.status ?? "planned").toUpperCase()}
            </span>
          ) : (
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
              NO SESSION
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-5 sm:px-6 space-y-4">
        {!liveSession ? (
          <>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
              <div className="text-sm font-semibold text-slate-900">No sessions scheduled for today</div>
              <div className="mt-1 text-sm text-slate-700">
                Create a session dated today to activate real-time analytics and AI insight.
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3 text-left">
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <div className="text-xs font-semibold tracking-widest text-slate-500">SIGNAL 1</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">Attendance</div>
                  <div className="mt-1 text-xs text-slate-600">Participants recorded → better accuracy</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <div className="text-xs font-semibold tracking-widest text-slate-500">SIGNAL 2</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">Checklist</div>
                  <div className="mt-1 text-xs text-slate-600">4–6 outcomes → execution tracking</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <div className="text-xs font-semibold tracking-widest text-slate-500">SIGNAL 3</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">Evidence</div>
                  <div className="mt-1 text-xs text-slate-600">Photo + note → proof & AI stability</div>
                </div>
              </div>
            </div>

            <SkeletonMicroCharts />

            <DataCoveragePanel
              title="Data Coverage (Today)"
              sessionsCount={0}
              openCount={0}
              withParticipantsCount={0}
              withEvidenceCount={0}
              withChecklistCount={0}
            />
          </>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold text-slate-900">{liveSession.title || "Untitled session"}</div>
                <div className="mt-1 text-sm text-slate-600">
                  Start: <span className="font-semibold text-slate-900">{fmtTime(liveSession.starts_at)}</span> • Duration:{" "}
                  <span className="font-semibold text-slate-900">{liveSession.duration_minutes ?? 60}m</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Pill label="Participants" value={`${liveKpis.participants}`} />
                  <Pill label="Evidence" value={`${liveKpis.evidence}`} />
                  <Pill label="Checklist" value={`${liveKpis.checklistDone}/${liveKpis.checklistTotal}`} />
                  <Pill label="Completion" value={pct(liveKpis.completion)} />
                  <Pill label="Last evidence" value={liveKpis.lastEvidenceAt ? fmtDateTimeShort(liveKpis.lastEvidenceAt) : "—"} />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-[0_10px_30px_-26px_rgba(2,6,23,0.45)]">
                <div className="text-xs font-semibold tracking-widest text-slate-500">LIVE SIGNALS</div>
                <div className="mt-2 space-y-1 text-sm">
                  <SignalRow label="Participants tracked" ok={liveKpis.participants > 0} />
                  <SignalRow label="Evidence active" ok={liveKpis.evidence > 0} />
                  <SignalRow label="Checklist attached" ok={liveKpis.checklistTotal > 0} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard title="Checklist completion" value={pct(liveKpis.completion)} score={liveKpis.completion} desc="Done / total checklist items" />
              <MetricCard title="Evidence momentum" value={`${liveKpis.evidence}`} score={clamp01(liveKpis.evidence >= 2 ? 1 : liveKpis.evidence / 2)} desc="Target: ≥ 2 items per live session" />
              <MetricCard title="Participation signal" value={`${liveKpis.participants}`} score={clamp01(liveKpis.participants >= 6 ? 1 : liveKpis.participants / 6)} desc="Target: ≥ 6 tracked participants" />
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold tracking-widest text-slate-500">EXECUTIVE INSIGHT</div>
                <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  Auto-updating
                </span>
              </div>

              <div className="mt-2 text-sm font-semibold text-slate-900">{insight.headline}</div>

              <div className="mt-3 grid gap-2">
                {insight.bullets.slice(0, 3).map((b, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="text-sm font-semibold text-slate-900">{b.title}</div>
                    <div className="mt-1 text-xs text-slate-700">{b.detail}</div>
                  </div>
                ))}
              </div>

              <div className="mt-3 rounded-xl border border-slate-200 bg-white/70 p-3">
                <div className="text-xs font-semibold tracking-widest text-slate-500">NEXT BEST ACTIONS</div>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-800">
                  {insight.actions.slice(0, 3).map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Always show coverage when sessions exist (enterprise monitoring vibe) */}
            <DataCoveragePanel
              title="Data Coverage (Today)"
              sessionsCount={coverage.sessionsCount}
              openCount={coverage.openCount}
              withParticipantsCount={coverage.withParticipantsCount}
              withEvidenceCount={coverage.withEvidenceCount}
              withChecklistCount={coverage.withChecklistCount}
            />
          </>
        )}
      </div>
    </div>
  );
}
