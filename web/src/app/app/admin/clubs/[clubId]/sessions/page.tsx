// web/src/app/app/admin/clubs/[clubId]/sessions/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAdminGuard } from "@/lib/admin/admin-guard";

type SessionStatus = "planned" | "open" | "closed";

type SessionRow = {
  id: string;
  club_id: string;
  title: string | null;
  starts_at: string | null;
  duration_minutes: number | null;
  status?: SessionStatus | null;
  term_id?: string | null;
  created_at?: string | null;
};

type ParticipantRow = {
  session_id: string;
  student_id: string;
};

type EvidenceRow = {
  id: string;
  club_id: string;
  session_id: string;
  type: "note" | "image" | "video" | "ai_summary";
  created_at: string;
};

type ActivityRow = {
  id: string;
  club_id: string;
  session_id: string;
  is_completed: boolean;
};

type SessionAiInsight = {
  id: string;
  club_id: string;
  period_start: string;
  period_end: string;
  source: "rules" | "azure";
  summary: string;
  recommendations: Array<{ title: string; why: string; action: string }>;
  created_at: string;
};

type RangeKey = "7" | "30" | "90";

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function pct(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 100)}%`;
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

function fmtDateShort(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
}

function statusChip(s?: SessionStatus | null) {
  const k = s ?? "planned";
  if (k === "open") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (k === "closed") return "border-slate-200 bg-slate-50 text-slate-700";
  return "border-indigo-200 bg-indigo-50 text-indigo-900";
}

function daysAgoIso(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function median(values: number[]) {
  const v = values.filter((x) => Number.isFinite(x)).slice().sort((a, b) => a - b);
  if (!v.length) return 0;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

function safeDiv(a: number, b: number) {
  return b === 0 ? 0 : a / b;
}

export default function SessionsAnalyticsHomePage() {
  const params = useParams<{ clubId: string }>();
  const clubId = params.clubId;

  const { checking, supabase } = useAdminGuard({ idleMinutes: 20 });

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [range, setRange] = useState<RangeKey>("30");

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);

  const [latestAi, setLatestAi] = useState<SessionAiInsight | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  function flash(text: string, ms = 1800) {
    setMsg(text);
    window.setTimeout(() => setMsg(""), ms);
  }

  const windowDays = Number(range);

  async function loadAnalytics() {
    setLoading(true);
    setMsg("");

    try {
      // We fetch enough rows then do all analytics client-side for now.
      // (Later you can shift heavy aggregations to v_session_metrics + RPC.)
      const sRes = await supabase
        .from("sessions")
        .select("id, club_id, title, starts_at, duration_minutes, status, term_id, created_at")
        .eq("club_id", clubId)
        .order("starts_at", { ascending: false })
        .limit(700);

      const pRes = await supabase
        .from("session_participants")
        .select("session_id, student_id")
        .eq("club_id", clubId)
        .limit(12000);

      const eRes = await supabase
        .from("session_evidence")
        .select("id, club_id, session_id, type, created_at")
        .eq("club_id", clubId)
        .order("created_at", { ascending: false })
        .limit(6000);

      const aRes = await supabase
        .from("session_activities")
        .select("id, club_id, session_id, is_completed")
        .eq("club_id", clubId)
        .limit(12000);

      const aiRes = await supabase
        .from("session_ai_insights")
        .select("id, club_id, period_start, period_end, source, summary, recommendations, created_at")
        .eq("club_id", clubId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sRes.error) throw sRes.error;
      if (pRes.error) throw pRes.error;
      if (eRes.error) throw eRes.error;
      if (aRes.error) throw aRes.error;

      setSessions((sRes.data ?? []) as SessionRow[]);
      setParticipants((pRes.data ?? []) as ParticipantRow[]);
      setEvidence((eRes.data ?? []) as EvidenceRow[]);
      setActivities((aRes.data ?? []) as ActivityRow[]);
      setLatestAi((aiRes.data ?? null) as any);
    } catch (e: any) {
      flash(e?.message ? `Load failed: ${e.message}` : "Load failed.", 2400);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (checking) return;
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, clubId]);

  // ---- Derived structures ----
  const participantsBySession = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of participants) m.set(p.session_id, (m.get(p.session_id) ?? 0) + 1);
    return m;
  }, [participants]);

  const evidenceBySession = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of evidence) m.set(e.session_id, (m.get(e.session_id) ?? 0) + 1);
    return m;
  }, [evidence]);

  const activitiesBySession = useMemo(() => {
    const m = new Map<string, { total: number; done: number }>();
    for (const a of activities) {
      const cur = m.get(a.session_id) ?? { total: 0, done: 0 };
      cur.total += 1;
      if (a.is_completed) cur.done += 1;
      m.set(a.session_id, cur);
    }
    return m;
  }, [activities]);

  const sessionsInRange = useMemo(() => {
    const cutoff = daysAgoIso(windowDays);
    return sessions.filter((s) => (s.starts_at ?? "") >= cutoff);
  }, [sessions, windowDays]);

  // ---- KPI set (range-based) ----
  const kpis = useMemo(() => {
    const total = sessionsInRange.length;

    const byStatus = {
      planned: sessionsInRange.filter((s) => (s.status ?? "planned") === "planned").length,
      open: sessionsInRange.filter((s) => (s.status ?? "planned") === "open").length,
      closed: sessionsInRange.filter((s) => (s.status ?? "planned") === "closed").length,
    };

    const learners = sessionsInRange.reduce((sum, s) => sum + (participantsBySession.get(s.id) ?? 0), 0);
    const evItems = sessionsInRange.reduce((sum, s) => sum + (evidenceBySession.get(s.id) ?? 0), 0);

    const activityTotal = sessionsInRange.reduce((sum, s) => sum + (activitiesBySession.get(s.id)?.total ?? 0), 0);
    const activityDone = sessionsInRange.reduce((sum, s) => sum + (activitiesBySession.get(s.id)?.done ?? 0), 0);

    const avgLearners = safeDiv(learners, total);
    const avgEvidence = safeDiv(evItems, total);
    const completion = safeDiv(activityDone, activityTotal);

    // Coverage signals
    const scheduledCoverage = total > 0 ? sessionsInRange.filter((s) => !!s.starts_at).length / total : 0;
    const checklistCoverage = total > 0 ? sessionsInRange.filter((s) => (activitiesBySession.get(s.id)?.total ?? 0) > 0).length / total : 0;
    const evidenceCoverage = total > 0 ? sessionsInRange.filter((s) => (evidenceBySession.get(s.id) ?? 0) > 0).length / total : 0;

    // Consistency signal: % sessions meeting minimum operational footprint
    // (enterprise-style: minimum checklist + minimum evidence + minimum learners)
    const minEvidence = 2;
    const minChecklist = 4;
    const minLearners = 4;

    const healthy = total > 0
      ? sessionsInRange.filter((s) => {
          const p = participantsBySession.get(s.id) ?? 0;
          const ev = evidenceBySession.get(s.id) ?? 0;
          const a = activitiesBySession.get(s.id)?.total ?? 0;
          return p >= minLearners && ev >= minEvidence && a >= minChecklist;
        }).length / total
      : 0;

    // Composite “Delivery Quality Index” (0..1)
    // weights tuned for operations: completion + consistency + coverage
    const qualityIndex = clamp01(
      0.45 * clamp01(completion) +
        0.30 * clamp01(healthy) +
        0.15 * clamp01(evidenceCoverage) +
        0.10 * clamp01(checklistCoverage)
    );

    return {
      total,
      byStatus,
      learners,
      evItems,
      activityTotal,
      activityDone,
      avgLearners,
      avgEvidence,
      completion,
      scheduledCoverage,
      checklistCoverage,
      evidenceCoverage,
      healthy,
      qualityIndex,
    };
  }, [sessionsInRange, participantsBySession, evidenceBySession, activitiesBySession]);

  // ---- Trend tiles (last N weeks) ----
  const trend = useMemo(() => {
    // 8 buckets by week (most recent first)
    const buckets = 8;
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;

    const points = Array.from({ length: buckets }, (_, i) => {
      const end = now - i * weekMs;
      const start = end - weekMs;
      const rows = sessions.filter((s) => {
        const t = s.starts_at ? new Date(s.starts_at).getTime() : 0;
        return t > start && t <= end;
      });

      const sessionsCount = rows.length;
      const learners = rows.reduce((sum, s) => sum + (participantsBySession.get(s.id) ?? 0), 0);
      const ev = rows.reduce((sum, s) => sum + (evidenceBySession.get(s.id) ?? 0), 0);
      const aTotal = rows.reduce((sum, s) => sum + (activitiesBySession.get(s.id)?.total ?? 0), 0);
      const aDone = rows.reduce((sum, s) => sum + (activitiesBySession.get(s.id)?.done ?? 0), 0);

      const completion = safeDiv(aDone, aTotal);
      const avgLearners = safeDiv(learners, sessionsCount);
      const avgEvidence = safeDiv(ev, sessionsCount);

      return {
        label: i === 0 ? "This week" : `${i}w ago`,
        sessions: sessionsCount,
        avgLearners,
        avgEvidence,
        completion,
      };
    });

    return points.reverse();
  }, [sessions, participantsBySession, evidenceBySession, activitiesBySession]);

  const distribution = useMemo(() => {
    const rows = sessionsInRange.map((s) => {
      const p = participantsBySession.get(s.id) ?? 0;
      const ev = evidenceBySession.get(s.id) ?? 0;
      const a = activitiesBySession.get(s.id) ?? { total: 0, done: 0 };
      const completion = a.total > 0 ? a.done / a.total : 0;

      // A per-session “score” 0..100
      const score =
        35 * clamp01(completion) +
        25 * clamp01(ev >= 2 ? 1 : ev / 2) +
        20 * clamp01(p >= 6 ? 1 : p / 6) +
        20 * clamp01(a.total >= 4 ? 1 : a.total / 4);

      return {
        id: s.id,
        title: s.title || "Untitled session",
        starts_at: s.starts_at,
        status: (s.status ?? "planned") as SessionStatus,
        participants: p,
        evidence: ev,
        checklist_total: a.total,
        checklist_done: a.done,
        completion,
        score,
      };
    });

    const scores = rows.map((r) => r.score);
    const med = median(scores);

    const sorted = rows.slice().sort((a, b) => b.score - a.score);
    const top = sorted.slice(0, 5);
    const bottom = sorted.slice(-5).reverse();

    // Anomalies: outliers vs median
    const anomalies = rows
      .filter((r) => Math.abs(r.score - med) >= 25)
      .sort((a, b) => Math.abs(b.score - med) - Math.abs(a.score - med))
      .slice(0, 6);

    return { rows, top, bottom, medianScore: med, anomalies };
  }, [sessionsInRange, participantsBySession, evidenceBySession, activitiesBySession]);

  // ---- Session-only rule recommendations (no parent, no attendance ops) ----
  const ruleAdvice = useMemo(() => {
    const recs: Array<{ title: string; why: string; action: string }> = [];

    if (kpis.scheduledCoverage < 0.95 && kpis.total >= 5) {
      recs.push({
        title: "Improve schedule completeness",
        why: `Only ${pct(kpis.scheduledCoverage)} of sessions in this window have a defined start time.`,
        action: "Enforce starts_at for all planned sessions. Add a validation gate in Plan workflow.",
      });
    }

    if (kpis.checklistCoverage < 0.85 && kpis.total >= 5) {
      recs.push({
        title: "Standardize checklist usage",
        why: `Only ${pct(kpis.checklistCoverage)} of sessions have a checklist defined.`,
        action: "Introduce 4–6 standardized checklist templates. Auto-apply a template at session creation.",
      });
    }

    if (kpis.completion < 0.7 && kpis.activityTotal >= 20) {
      recs.push({
        title: "Reduce checklist overload to raise completion",
        why: `Checklist completion is ${pct(kpis.completion)} across ${kpis.activityTotal} checklist items.`,
        action: "Cap checklists at 6 core outcomes. Move optional items into stretch goals.",
      });
    }

    if (kpis.avgEvidence < 2 && kpis.total >= 3) {
      recs.push({
        title: "Raise evidence baseline to strengthen analytics accuracy",
        why: `Average evidence is ${kpis.avgEvidence.toFixed(1)} items per session. Sparse evidence reduces signal quality.`,
        action: "Set a minimum evidence target per session (e.g., 2). Add an end-of-session prompt in Run workflow.",
      });
    }

    if (kpis.healthy < 0.6 && kpis.total >= 6) {
      recs.push({
        title: "Increase delivery consistency",
        why: `Only ${pct(kpis.healthy)} of sessions meet the minimum operational footprint (learners + checklist + evidence).`,
        action: "Adopt a session SOP: start-time set → checklist attached → evidence captured → close.",
      });
    }

    if (!recs.length) {
      recs.push({
        title: "Analytics baseline looks stable",
        why: "No high-risk signals detected in the selected window.",
        action: "Next: connect Azure to generate root-cause narratives and auto-create operational tasks.",
      });
    }

    return recs;
  }, [kpis]);

  async function saveRuleInsight() {
    const now = new Date();
    const end = now.toISOString();
    const start = new Date(now.getTime() - 1000 * 60 * 60 * 24 * windowDays).toISOString();

    try {
      const payload = {
        club_id: clubId,
        period_start: start,
        period_end: end,
        source: "rules",
        summary: `Sessions analytics (${windowDays}d): ${kpis.total} sessions • Quality Index ${pct(kpis.qualityIndex)} • Completion ${pct(
          kpis.completion
        )} • Coverage (checklist ${pct(kpis.checklistCoverage)}, evidence ${pct(kpis.evidenceCoverage)}).`,
        recommendations: ruleAdvice,
        metrics: {
          windowDays,
          totalSessions: kpis.total,
          byStatus: kpis.byStatus,
          avgLearners: kpis.avgLearners,
          avgEvidence: kpis.avgEvidence,
          completionRate: kpis.completion,
          scheduledCoverage: kpis.scheduledCoverage,
          checklistCoverage: kpis.checklistCoverage,
          evidenceCoverage: kpis.evidenceCoverage,
          consistencyRate: kpis.healthy,
          qualityIndex: kpis.qualityIndex,
          medianSessionScore: distribution.medianScore,
        },
      };

      const res = await supabase.from("session_ai_insights").insert(payload as any).select("*").single();
      if (res.error) throw res.error;

      setLatestAi(res.data as any);
      flash("Rules insight saved ✓");
    } catch (e: any) {
      flash(e?.message ? `Save failed: ${e.message}` : "Save failed.", 2400);
    }
  }

  async function generateAzureAdvice() {
    setAiBusy(true);
    try {
      const res = await fetch(`/api/ai/session-advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clubId, windowDays }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "AI request failed.");

      setLatestAi(json.data as any);
      flash("Azure insight generated ✓", 1900);
    } catch (e: any) {
      flash(e?.message ?? "Azure AI failed.", 2400);
    } finally {
      setAiBusy(false);
    }
  }

  if (checking || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-100">
        <div className="mx-auto max-w-[1200px] px-4 py-10">
          <div className="h-10 w-80 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="mt-6 h-[680px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-clip text-slate-900">
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-100" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute -left-56 top-[-220px] h-[640px] w-[640px] rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -right-72 top-[60px] h-[700px] w-[700px] rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 relative">
          <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Sessions Analytics</div>
            <div className="text-xs text-slate-600">
              Enterprise dashboard • Session performance, consistency, quality index • AI insights from session data
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/admin/clubs/${clubId}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
            >
              Back
            </Link>

            <button
              type="button"
              onClick={loadAnalytics}
              className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {msg ? (
          <div className="mb-4 rounded-[18px] border border-slate-200 bg-white/70 p-3 text-sm text-slate-700">
            {msg}
          </div>
        ) : null}

        {/* Controls row */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">Window</div>

            <SegButton active={range === "7"} onClick={() => setRange("7")}>7 days</SegButton>
            <SegButton active={range === "30"} onClick={() => setRange("30")}>30 days</SegButton>
            <SegButton active={range === "90"} onClick={() => setRange("90")}>90 days</SegButton>

            <div className="ml-2 text-xs text-slate-600">
              Sessions in window: <span className="font-semibold text-slate-900">{kpis.total}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveRuleInsight}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
            >
              Save rules insight
            </button>

            <button
              type="button"
              disabled={aiBusy}
              onClick={generateAzureAdvice}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {aiBusy ? "Generating…" : "Generate Azure insight"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT: Dashboard */}
          <div className="lg:col-span-8">
            {/* KPI strip */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Sessions" value={`${kpis.total}`} hint={`Last ${windowDays} days`} />
              <KpiCard label="Quality Index" value={pct(kpis.qualityIndex)} hint="Composite performance" />
              <KpiCard label="Completion" value={pct(kpis.completion)} hint="Checklist execution" />
              <KpiCard label="Consistency" value={pct(kpis.healthy)} hint="Meets baseline" />
            </div>

            {/* Coverage + Ops health */}
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <GaugeCard title="Schedule coverage" value={pct(kpis.scheduledCoverage)} score={kpis.scheduledCoverage} desc="Sessions with start time set" />
              <GaugeCard title="Checklist coverage" value={pct(kpis.checklistCoverage)} score={kpis.checklistCoverage} desc="Sessions with checklist defined" />
              <GaugeCard title="Evidence coverage" value={pct(kpis.evidenceCoverage)} score={kpis.evidenceCoverage} desc="Sessions with evidence logged" />
            </div>

            {/* Trends */}
            <div className="mt-4 rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                <div className="text-sm font-semibold text-slate-900">Trends (weekly)</div>
                <div className="mt-0.5 text-xs text-slate-600">Operational stability signals over time</div>
              </div>

              <div className="px-5 py-5 sm:px-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {trend.slice(-4).map((t) => (
                    <MiniTrend
                      key={t.label}
                      label={t.label}
                      sessions={t.sessions}
                      avgLearners={t.avgLearners}
                      avgEvidence={t.avgEvidence}
                      completion={t.completion}
                    />
                  ))}
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-12 gap-2 bg-slate-50 px-4 py-2 text-[11px] font-semibold tracking-widest text-slate-500">
                    <div className="col-span-3">WEEK</div>
                    <div className="col-span-3">SESSIONS</div>
                    <div className="col-span-3">AVG EVIDENCE</div>
                    <div className="col-span-3">COMPLETION</div>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {trend.map((t, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm">
                        <div className="col-span-3 font-semibold text-slate-900">{t.label}</div>
                        <div className="col-span-3 text-slate-700">{t.sessions}</div>
                        <div className="col-span-3 text-slate-700">{t.avgEvidence.toFixed(1)}</div>
                        <div className="col-span-3 text-slate-700">{pct(t.completion)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  Tip: long-term stability improves forecast quality when Azure analytics runs on top of these signals.
                </div>
              </div>
            </div>

            {/* Top/Bottom + anomalies */}
            <div className="mt-4 grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <TableCard
                  title="Top sessions"
                  subtitle="Best-performing sessions by score (0–100)"
                  rows={distribution.top}
                  tone="good"
                />
              </div>
              <div className="lg:col-span-6">
                <TableCard
                  title="Sessions needing attention"
                  subtitle="Lowest-performing sessions by score (0–100)"
                  rows={distribution.bottom}
                  tone="risk"
                />
              </div>

              <div className="lg:col-span-12">
                <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
                  <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                    <div className="text-sm font-semibold text-slate-900">Anomalies & outliers</div>
                    <div className="mt-0.5 text-xs text-slate-600">
                      Sessions significantly above/below the median score ({Math.round(distribution.medianScore)}).
                    </div>
                  </div>

                  <div className="px-5 py-5 sm:px-6">
                    {!distribution.anomalies.length ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        No strong outliers detected in this window.
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {distribution.anomalies.map((r) => (
                          <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-900">{r.title}</div>
                                <div className="mt-1 text-xs text-slate-600">{fmtDateTimeShort(r.starts_at)}</div>
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusChip(r.status))}>
                                    {r.status.toUpperCase()}
                                  </span>
                                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                    Score: <span className="text-slate-900">{Math.round(r.score)}</span>
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs text-slate-600">Completion</div>
                                <div className="text-sm font-semibold text-slate-900">{pct(r.completion)}</div>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-2">
                              <SmallStat label="Learners" value={`${r.participants}`} />
                              <SmallStat label="Evidence" value={`${r.evidence}`} />
                              <SmallStat label="Checklist" value={`${r.checklist_done}/${r.checklist_total}`} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: AI control center */}
          <div className="lg:col-span-4">
            <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                <div className="text-sm font-semibold text-slate-900">AI Insights</div>
                <div className="mt-0.5 text-xs text-slate-600">
                  Azure is scoped to session data → analytics → operational recommendations
                </div>
              </div>

              <div className="px-5 py-5 sm:px-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold tracking-widest text-slate-500">RULE INSIGHTS (LOCAL)</div>
                  <div className="mt-2 text-sm text-slate-800">
                    Generated from session metrics. Save to the AI log for auditability and trend tracking.
                  </div>

                  <div className="mt-3 grid gap-2">
                    {ruleAdvice.slice(0, 3).map((r, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                        <div className="mt-1 text-xs text-slate-600">{r.why}</div>
                        <div className="mt-2 text-xs font-semibold text-slate-900">Action</div>
                        <div className="text-xs text-slate-700">{r.action}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={saveRuleInsight}
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
                  >
                    Save rules insight to log
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold tracking-widest text-slate-500">AZURE INSIGHT</div>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      Window: {windowDays}d
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={aiBusy}
                    onClick={generateAzureAdvice}
                    className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {aiBusy ? "Generating…" : "Generate Azure insight"}
                  </button>

                  <div className="mt-3 text-xs text-slate-600">
                    Azure output is stored in <span className="font-mono">session_ai_insights</span> for traceability.
                  </div>
                </div>

                {latestAi ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold tracking-widest text-slate-500">LATEST INSIGHT</div>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {latestAi.source.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-2 text-sm font-semibold text-slate-900">{latestAi.summary}</div>

                    <div className="mt-3 grid gap-2">
                      {(latestAi.recommendations ?? []).slice(0, 4).map((r, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                          <div className="mt-1 text-xs text-slate-600">{r.why}</div>
                          <div className="mt-2 text-xs text-slate-700">{r.action}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 text-[11px] text-slate-500">
                      Saved: {fmtDateShort(latestAi.created_at)} • Period: {fmtDateShort(latestAi.period_start)} →{" "}
                      {fmtDateShort(latestAi.period_end)}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    No stored AI insight yet. Generate Azure insight or save a rules insight.
                  </div>
                )}

                <div className="mt-4 rounded-[18px] border border-slate-200 bg-white/70 p-4 text-sm text-slate-700">
                  This page is intentionally analytics-only. Execution workflows live in Plan/Run/Evidence.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 text-xs text-slate-600">
          Metrics are computed from sessions, activities, evidence, and participants. For enterprise scaling, move heavy aggregates into{" "}
          <span className="font-mono">v_session_metrics</span> and/or Supabase RPC for faster dashboards.
        </div>
      </div>
    </main>
  );
}

/* ---------------- UI Components ---------------- */

function SegButton(props: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={cx(
        "inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-sm font-semibold transition",
        props.active
          ? "bg-slate-900 text-white"
          : "border border-slate-200 bg-white text-slate-900 hover:bg-indigo-50/60"
      )}
    >
      {props.children}
    </button>
  );
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

function GaugeCard(props: { title: string; value: string; score: number; desc: string }) {
  const s = clamp01(props.score);
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] p-4">
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

function MiniTrend(props: { label: string; sessions: number; avgLearners: number; avgEvidence: number; completion: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold tracking-widest text-slate-500">{props.label.toUpperCase()}</div>
      <div className="mt-2 grid gap-1 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Sessions</span>
          <span className="font-semibold text-slate-900">{props.sessions}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Avg evidence</span>
          <span className="font-semibold text-slate-900">{props.avgEvidence.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Completion</span>
          <span className="font-semibold text-slate-900">{pct(props.completion)}</span>
        </div>
      </div>
    </div>
  );
}

function SmallStat(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-semibold tracking-widest text-slate-500">{props.label.toUpperCase()}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{props.value}</div>
    </div>
  );
}

function TableCard(props: {
  title: string;
  subtitle: string;
  rows: Array<{
    id: string;
    title: string;
    starts_at: string | null;
    status: SessionStatus;
    participants: number;
    evidence: number;
    checklist_total: number;
    checklist_done: number;
    completion: number;
    score: number;
  }>;
  tone: "good" | "risk";
}) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
      <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{props.title}</div>
            <div className="mt-0.5 text-xs text-slate-600">{props.subtitle}</div>
          </div>
          <span
            className={cx(
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              props.tone === "good"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            )}
          >
            {props.tone === "good" ? "TOP" : "RISK"}
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-200">
        {props.rows.length ? (
          props.rows.map((r) => (
            <div key={r.id} className="px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">{r.title}</div>
                  <div className="mt-1 text-xs text-slate-600">{fmtDateTimeShort(r.starts_at)}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusChip(r.status))}>
                      {r.status.toUpperCase()}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      Score: <span className="text-slate-900">{Math.round(r.score)}</span>
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      Completion: <span className="text-slate-900">{pct(r.completion)}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-600">Evidence</div>
                  <div className="text-sm font-semibold text-slate-900">{r.evidence}</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <SmallStat label="Learners" value={`${r.participants}`} />
                <SmallStat label="Checklist" value={`${r.checklist_done}/${r.checklist_total}`} />
                <SmallStat label="Score" value={`${Math.round(r.score)}`} />
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-10 text-center text-sm text-slate-600">No sessions in this window.</div>
        )}
      </div>
    </div>
  );
}
