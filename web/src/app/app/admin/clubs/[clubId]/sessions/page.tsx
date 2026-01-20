// web/src/app/app/admin/clubs/[clubId]/sessions/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

function statusChip(s?: SessionStatus | null) {
  const k = s ?? "planned";
  if (k === "open") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (k === "closed") return "border-slate-200 bg-slate-50 text-slate-700";
  return "border-indigo-200 bg-indigo-50 text-indigo-900";
}

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfTodayIso() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function safeDiv(a: number, b: number) {
  return b === 0 ? 0 : a / b;
}

function minsBetween(now: number, thenIso?: string | null) {
  if (!thenIso) return 0;
  const t = new Date(thenIso).getTime();
  return Math.max(0, Math.round((now - t) / 60000));
}

function freshnessLabel(minutes: number) {
  if (minutes <= 2) return { label: "LIVE", cls: "border-emerald-200 bg-emerald-50 text-emerald-900" };
  if (minutes <= 10) return { label: "FRESH", cls: "border-indigo-200 bg-indigo-50 text-indigo-900" };
  return { label: "STALE", cls: "border-rose-200 bg-rose-50 text-rose-900" };
}

export default function SessionsAnalyticsHomePage() {
  const params = useParams<{ clubId: string }>();
  const clubId = params.clubId;

  const { checking, supabase } = useAdminGuard({ idleMinutes: 20 });

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [sessionsToday, setSessionsToday] = useState<SessionRow[]>([]);
  const [participantsToday, setParticipantsToday] = useState<ParticipantRow[]>([]);
  const [evidenceToday, setEvidenceToday] = useState<EvidenceRow[]>([]);
  const [activitiesToday, setActivitiesToday] = useState<ActivityRow[]>([]);

  const [latestAiToday, setLatestAiToday] = useState<SessionAiInsight | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);

  function flash(text: string, ms = 1800) {
    setMsg(text);
    window.setTimeout(() => setMsg(""), ms);
  }

  const todayStart = startOfTodayIso();
  const todayEnd = endOfTodayIso();

  async function loadToday() {
    setLoading(true);
    setMsg("");

    try {
      // 1) Sessions scheduled today
      const sRes = await supabase
        .from("sessions")
        .select("id, club_id, title, starts_at, duration_minutes, status, term_id, created_at")
        .eq("club_id", clubId)
        .gte("starts_at", todayStart)
        .lte("starts_at", todayEnd)
        .order("starts_at", { ascending: true })
        .limit(200);

      if (sRes.error) throw sRes.error;

      const sToday = (sRes.data ?? []) as SessionRow[];
      const sessionIds = new Set(sToday.map((s) => s.id));

      // If no sessions today, we still show an enterprise empty state
      if (!sToday.length) {
        setSessionsToday([]);
        setParticipantsToday([]);
        setEvidenceToday([]);
        setActivitiesToday([]);

        // AI: still attempt to show latest insight covering today window (optional)
        const aiRes = await supabase
          .from("session_ai_insights")
          .select("id, club_id, period_start, period_end, source, summary, recommendations, created_at")
          .eq("club_id", clubId)
          .lte("period_start", todayEnd)
          .gte("period_end", todayStart)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setLatestAiToday((aiRes.data ?? null) as any);
        setLastUpdatedAt(new Date().toISOString());
        setLoading(false);
        return;
      }

      // 2) Participants (today sessions only)
      const pRes = await supabase
        .from("session_participants")
        .select("session_id, student_id")
        .eq("club_id", clubId)
        .limit(12000);

      if (pRes.error) throw pRes.error;

      const pFiltered = ((pRes.data ?? []) as ParticipantRow[]).filter((p) => sessionIds.has(p.session_id));

      // 3) Evidence (today sessions only)
      const eRes = await supabase
        .from("session_evidence")
        .select("id, club_id, session_id, type, created_at")
        .eq("club_id", clubId)
        .order("created_at", { ascending: false })
        .limit(6000);

      if (eRes.error) throw eRes.error;

      const eFiltered = ((eRes.data ?? []) as EvidenceRow[]).filter((e) => sessionIds.has(e.session_id));

      // 4) Activities (today sessions only)
      const aRes = await supabase
        .from("session_activities")
        .select("id, club_id, session_id, is_completed")
        .eq("club_id", clubId)
        .limit(12000);

      if (aRes.error) throw aRes.error;

      const aFiltered = ((aRes.data ?? []) as ActivityRow[]).filter((a) => sessionIds.has(a.session_id));

      // 5) AI: latest insight covering today window (automated, no buttons)
      const aiRes = await supabase
        .from("session_ai_insights")
        .select("id, club_id, period_start, period_end, source, summary, recommendations, created_at")
        .eq("club_id", clubId)
        .lte("period_start", todayEnd)
        .gte("period_end", todayStart)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setSessionsToday(sToday);
      setParticipantsToday(pFiltered);
      setEvidenceToday(eFiltered);
      setActivitiesToday(aFiltered);
      setLatestAiToday((aiRes.data ?? null) as any);

      setLastUpdatedAt(new Date().toISOString());
    } catch (e: any) {
      flash(e?.message ? `Load failed: ${e.message}` : "Load failed.", 2400);
    } finally {
      setLoading(false);
    }
  }

  // Auto-refresh: production-grade “real-time” feel
  useEffect(() => {
    if (checking) return;

    loadToday();

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      loadToday();
    }, 25000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, clubId]);

  // Optional: Realtime subscriptions (if enabled)
  useEffect(() => {
    if (checking) return;

    const ch = supabase.channel(`rt:sessions_today:${clubId}`);

    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "sessions", filter: `club_id=eq.${clubId}` },
      () => loadToday()
    );
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "session_participants", filter: `club_id=eq.${clubId}` },
      () => loadToday()
    );
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "session_evidence", filter: `club_id=eq.${clubId}` },
      () => loadToday()
    );
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "session_activities", filter: `club_id=eq.${clubId}` },
      () => loadToday()
    );
    ch.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "session_ai_insights", filter: `club_id=eq.${clubId}` },
      () => loadToday()
    );

    ch.subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, clubId]);

  // Derived maps
  const participantsBySession = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of participantsToday) m.set(p.session_id, (m.get(p.session_id) ?? 0) + 1);
    return m;
  }, [participantsToday]);

  const evidenceBySession = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of evidenceToday) m.set(e.session_id, (m.get(e.session_id) ?? 0) + 1);
    return m;
  }, [evidenceToday]);

  const lastEvidenceAtBySession = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of evidenceToday) {
      const cur = m.get(e.session_id);
      if (!cur || new Date(e.created_at).getTime() > new Date(cur).getTime()) {
        m.set(e.session_id, e.created_at);
      }
    }
    return m;
  }, [evidenceToday]);

  const activitiesBySession = useMemo(() => {
    const m = new Map<string, { total: number; done: number }>();
    for (const a of activitiesToday) {
      const cur = m.get(a.session_id) ?? { total: 0, done: 0 };
      cur.total += 1;
      if (a.is_completed) cur.done += 1;
      m.set(a.session_id, cur);
    }
    return m;
  }, [activitiesToday]);

  // Live session focus:
  const liveSession = useMemo(() => {
    const open = sessionsToday.find((s) => (s.status ?? "planned") === "open");
    if (open) return open;
    return sessionsToday.find((s) => (s.status ?? "planned") !== "closed") ?? sessionsToday[0] ?? null;
  }, [sessionsToday]);

  // Today aggregated KPIs
  const todayKpis = useMemo(() => {
    const totalSessions = sessionsToday.length;
    const open = sessionsToday.filter((s) => (s.status ?? "planned") === "open").length;
    const planned = sessionsToday.filter((s) => (s.status ?? "planned") === "planned").length;
    const closed = sessionsToday.filter((s) => (s.status ?? "planned") === "closed").length;

    const learners = sessionsToday.reduce((sum, s) => sum + (participantsBySession.get(s.id) ?? 0), 0);
    const evidence = sessionsToday.reduce((sum, s) => sum + (evidenceBySession.get(s.id) ?? 0), 0);

    const aTotal = sessionsToday.reduce((sum, s) => sum + (activitiesBySession.get(s.id)?.total ?? 0), 0);
    const aDone = sessionsToday.reduce((sum, s) => sum + (activitiesBySession.get(s.id)?.done ?? 0), 0);

    const completion = safeDiv(aDone, aTotal);

    const evidenceCoverage =
      totalSessions > 0
        ? sessionsToday.filter((s) => (evidenceBySession.get(s.id) ?? 0) > 0).length / totalSessions
        : 0;
    const checklistCoverage =
      totalSessions > 0
        ? sessionsToday.filter((s) => (activitiesBySession.get(s.id)?.total ?? 0) > 0).length / totalSessions
        : 0;

    const quality = clamp01(
      0.5 * clamp01(completion) + 0.3 * clamp01(evidenceCoverage) + 0.2 * clamp01(checklistCoverage)
    );

    return {
      totalSessions,
      open,
      planned,
      closed,
      learners,
      evidence,
      completion,
      quality,
    };
  }, [sessionsToday, participantsBySession, evidenceBySession, activitiesBySession]);

  // Live session KPIs
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
    const participants = participantsBySession.get(liveSession.id) ?? 0;
    const evidence = evidenceBySession.get(liveSession.id) ?? 0;
    const a = activitiesBySession.get(liveSession.id) ?? { total: 0, done: 0 };
    const completion = a.total > 0 ? a.done / a.total : 0;
    const lastEvidenceAt = lastEvidenceAtBySession.get(liveSession.id) ?? null;

    return {
      participants,
      evidence,
      checklistTotal: a.total,
      checklistDone: a.done,
      completion,
      lastEvidenceAt,
    };
  }, [liveSession, participantsBySession, evidenceBySession, activitiesBySession, lastEvidenceAtBySession]);

  // Live rules insight
  const liveRulesInsight = useMemo(() => {
    if (!liveSession) {
      return {
        headline: "No live session detected",
        bullets: [{ title: "No sessions today", detail: "Schedule a session for today to activate live analytics." }],
        actions: ["Add a session scheduled for today.", "Mark it OPEN during delivery.", "Capture evidence early."],
      };
    }

    const bullets: Array<{ title: string; detail: string }> = [];
    const actions: string[] = [];

    const p = liveKpis.participants;
    const ev = liveKpis.evidence;
    const total = liveKpis.checklistTotal;
    const done = liveKpis.checklistDone;

    const completion = liveKpis.completion;

    if ((liveSession.status ?? "planned") !== "open") {
      bullets.push({ title: "Session not OPEN", detail: "Live analytics is strongest when status is OPEN." });
      actions.push("Mark the session OPEN to improve signal quality.");
    } else {
      bullets.push({ title: "Session is live", detail: "Monitoring participants, evidence and checklist progress." });
    }

    if (total === 0) {
      bullets.push({ title: "Checklist missing", detail: "No checklist items detected for this session." });
      actions.push("Attach a checklist (4–6 core outcomes) for execution tracking.");
    } else if (completion < 0.5 && total >= 4) {
      bullets.push({ title: "Execution lag", detail: `Completion is ${pct(completion)} (${done}/${total}).` });
      actions.push("Reduce to 4–6 core tasks and mark progress live.");
    } else {
      bullets.push({ title: "Execution tracking", detail: `Completion is ${pct(completion)} (${done}/${total}).` });
    }

    if (ev === 0) {
      bullets.push({ title: "Evidence is zero", detail: "No evidence logged yet for this session." });
      actions.push("Capture at least 2 items (photo + note) to stabilize insight.");
    } else {
      const mins = minsBetween(Date.now(), liveKpis.lastEvidenceAt);
      const f = freshnessLabel(mins);
      bullets.push({ title: "Evidence active", detail: `${ev} item(s). Last update: ${mins} min ago (${f.label}).` });
      if (mins > 10) actions.push("Capture a quick update to keep insight fresh.");
    }

    if (p === 0) {
      bullets.push({ title: "Participants not recorded", detail: "No participants linked to this session yet." });
      actions.push("Record participants early for accurate attendance analytics.");
    } else {
      bullets.push({ title: "Participants tracked", detail: `${p} participant(s) recorded.` });
    }

    return {
      headline: liveSession.title || "Live Session",
      bullets,
      actions: actions.length ? actions.slice(0, 3) : ["Continue delivery and keep evidence/checklist updated."],
    };
  }, [liveSession, liveKpis]);

  const aiFreshness = useMemo(() => {
    if (!latestAiToday?.created_at) return null;
    const mins = minsBetween(Date.now(), latestAiToday.created_at);
    return { mins, ...freshnessLabel(mins) };
  }, [latestAiToday]);

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

  const lastUpdatedMins = lastUpdatedAt ? minsBetween(Date.now(), lastUpdatedAt) : null;
  const liveTag = lastUpdatedMins !== null ? freshnessLabel(lastUpdatedMins) : null;

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
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-sm font-semibold text-slate-900">Live Sessions Analytics</div>

              {liveTag ? (
                <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", liveTag.cls)}>
                  {liveTag.label}
                </span>
              ) : null}

              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                Today
              </span>
            </div>

            <div className="mt-0.5 text-xs text-slate-600">
              Real-time dashboard for today’s sessions • Automated Azure insights from session signals
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/admin/clubs/${clubId}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
            >
              Back
            </Link>

            <span className="hidden sm:inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
              Last updated: <span className="ml-2 text-slate-900">{fmtDateTimeShort(lastUpdatedAt)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {msg ? (
          <div className="mb-4 rounded-[18px] border border-slate-200 bg-white/70 p-3 text-sm text-slate-700">
            {msg}
          </div>
        ) : null}

        {/* Today KPI Strip */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard
            label="Today sessions"
            value={`${todayKpis.totalSessions}`}
            hint={`${todayKpis.open} open • ${todayKpis.planned} planned • ${todayKpis.closed} closed`}
          />
          <KpiCard label="Live quality index" value={pct(todayKpis.quality)} hint="Coverage + completion blend" />
          <KpiCard label="Checklist completion" value={pct(todayKpis.completion)} hint="Across today" />
          <KpiCard label="Participants tracked" value={`${todayKpis.learners}`} hint="Across today" />
          <KpiCard label="Evidence captured" value={`${todayKpis.evidence}`} hint="Across today" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* LEFT */}
          <div className="lg:col-span-8">
            {/* Live Session Focus */}
            <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">Live session focus</div>
                    <div className="mt-0.5 text-xs text-slate-600">
                      Real-time operational signals for the active session (or the next session today)
                    </div>
                  </div>
                  {liveSession ? (
                    <span className={cx("rounded-full border px-3 py-1 text-xs font-semibold", statusChip(liveSession.status))}>
                      {(liveSession.status ?? "planned").toUpperCase()}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="px-5 py-5 sm:px-6">
                {!liveSession ? (
                  <EnterpriseEmptyState
                    title="Live session focus is on standby"
                    subtitle="No sessions are scheduled for today yet. This view is designed for in-session operations, not history."
                    accent="indigo"
                    right={
                      <div className="space-y-3">
                        <StatusTile label="Data readiness" value="Not ready" hint="Create a session for today" tone="risk" />
                        <StatusTile label="Realtime feed" value="Active" hint="Auto-refresh + realtime (if enabled)" tone="good" />
                        <StatusTile
                          label="SessionAI pipeline"
                          value={latestAiToday ? "Receiving" : "Waiting"}
                          hint="Azure writes insights automatically"
                          tone={latestAiToday ? "good" : "neutral"}
                        />
                      </div>
                    }
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <InfoCard
                        kicker="WHAT THIS PAGE DOES"
                        title="Operational signals for today"
                        desc="Tracks checklist progress, evidence cadence, and participation signals for the active session (or next scheduled)."
                        bullets={[
                          "Live quality index (coverage + completion)",
                          "Evidence momentum and freshness",
                          "Checklist execution tracking",
                        ]}
                      />
                      <InfoCard
                        kicker="HOW TO ACTIVATE"
                        title="Schedule at least one session today"
                        desc="Once a session exists for today, the dashboard auto-populates and the live focus locks to OPEN (or next upcoming)."
                        bullets={[
                          "Add today’s session in Plan",
                          "Mark it OPEN during delivery",
                          "Capture at least 2 evidence items",
                        ]}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">System readiness checklist</div>
                          <div className="mt-1 text-xs text-slate-600">
                            Enterprise dashboards explain what is missing and what becomes available next.
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            Live-only
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            Auto-refresh
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            No manual triggers
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <CheckRow ok={false} label="Session scheduled today" />
                        <CheckRow ok={false} label="Session marked OPEN" />
                        <CheckRow ok={true} label="Realtime refresh running" />
                      </div>
                    </div>
                  </EnterpriseEmptyState>
                ) : (
                  <>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-lg font-semibold text-slate-900">
                          {liveSession.title || "Untitled session"}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          Start: <span className="font-semibold text-slate-900">{fmtTime(liveSession.starts_at)}</span> • Duration:{" "}
                          <span className="font-semibold text-slate-900">{liveSession.duration_minutes ?? 60}m</span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Pill label="Participants" value={`${liveKpis.participants}`} />
                          <Pill label="Evidence" value={`${liveKpis.evidence}`} />
                          <Pill label="Checklist" value={`${liveKpis.checklistDone}/${liveKpis.checklistTotal}`} />
                          <Pill label="Completion" value={pct(liveKpis.completion)} />
                          {liveKpis.lastEvidenceAt ? (
                            <Pill label="Last evidence" value={fmtDateTimeShort(liveKpis.lastEvidenceAt)} />
                          ) : (
                            <Pill label="Last evidence" value="—" />
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-semibold tracking-widest text-slate-500">LIVE SIGNALS</div>
                        <div className="mt-2 space-y-1 text-sm">
                          <SignalRow label="Participants tracked" ok={liveKpis.participants > 0} />
                          <SignalRow label="Evidence active" ok={liveKpis.evidence > 0} />
                          <SignalRow label="Checklist attached" ok={liveKpis.checklistTotal > 0} />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-3">
                      <BarCard
                        title="Checklist completion"
                        value={pct(liveKpis.completion)}
                        score={liveKpis.completion}
                        desc="Done / Total checklist items"
                      />
                      <BarCard
                        title="Evidence momentum"
                        value={`${liveKpis.evidence}`}
                        score={clamp01(liveKpis.evidence >= 2 ? 1 : liveKpis.evidence / 2)}
                        desc="Target: ≥ 2 items per live session"
                      />
                      <BarCard
                        title="Participation signal"
                        value={`${liveKpis.participants}`}
                        score={clamp01(liveKpis.participants >= 6 ? 1 : liveKpis.participants / 6)}
                        desc="Target: ≥ 6 tracked participants"
                      />
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold tracking-widest text-slate-500">LIVE INSIGHT (AUTO)</div>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          Updates automatically
                        </span>
                      </div>

                      <div className="mt-2 text-sm font-semibold text-slate-900">{liveRulesInsight.headline}</div>

                      <div className="mt-3 grid gap-2">
                        {liveRulesInsight.bullets.slice(0, 3).map((b, idx) => (
                          <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <div className="text-sm font-semibold text-slate-900">{b.title}</div>
                            <div className="mt-1 text-xs text-slate-700">{b.detail}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold tracking-widest text-slate-500">NEXT BEST ACTIONS</div>
                        <ul className="mt-2 list-disc pl-5 text-sm text-slate-800">
                          {liveRulesInsight.actions.slice(0, 3).map((a, idx) => (
                            <li key={idx}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Today Schedule */}
            <div className="mt-6 rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                <div className="text-sm font-semibold text-slate-900">Today schedule</div>
                <div className="mt-0.5 text-xs text-slate-600">Sessions planned for today (analytics view only)</div>
              </div>

              <div className="divide-y divide-slate-200">
                {sessionsToday.length ? (
                  sessionsToday.map((s) => {
                    const p = participantsBySession.get(s.id) ?? 0;
                    const ev = evidenceBySession.get(s.id) ?? 0;
                    const a = activitiesBySession.get(s.id) ?? { total: 0, done: 0 };
                    const cr = a.total > 0 ? a.done / a.total : 0;

                    return (
                      <div key={s.id} className="px-5 py-4 sm:px-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{s.title || "Untitled session"}</div>
                            <div className="mt-1 text-xs text-slate-600">
                              {fmtTime(s.starts_at)} • {s.duration_minutes ?? 60}m
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className={cx("rounded-full border px-3 py-1 text-xs font-semibold", statusChip(s.status))}>
                                {(s.status ?? "planned").toUpperCase()}
                              </span>

                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                Participants: <span className="ml-1 text-slate-900">{p}</span>
                              </span>

                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                Evidence: <span className="ml-1 text-slate-900">{ev}</span>
                              </span>

                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                Checklist:{" "}
                                <span className="ml-1 text-slate-900">
                                  {a.done}/{a.total} ({pct(cr)})
                                </span>
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-600">
                            Live analytics is centered above. History analytics will be a separate page.
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-6 py-8 sm:px-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">No sessions scheduled today</div>
                        <div className="mt-1 text-sm text-slate-600">
                          This table becomes a live operational ledger once a session exists for today.
                        </div>
                      </div>

                      <div className="grid w-full gap-2 md:w-[420px]">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs font-semibold tracking-widest text-slate-500">WHAT YOU’LL SEE HERE</div>
                          <div className="mt-2 grid gap-1 text-sm text-slate-800">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Participants</span>
                              <span className="font-semibold text-slate-900">count per session</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Evidence</span>
                              <span className="font-semibold text-slate-900">items + freshness</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Checklist</span>
                              <span className="font-semibold text-slate-900">done / total</span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="text-xs font-semibold tracking-widest text-slate-500">ENTERPRISE NOTE</div>
                          <div className="mt-2 text-sm text-slate-700">
                            History analytics is intentionally separated to keep the live view fast, focused, and operational.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="lg:col-span-4">
            <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900">Automated AI Insight</div>

                  {aiFreshness ? (
                    <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", aiFreshness.cls)}>
                      {aiFreshness.label}
                    </span>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      WAITING
                    </span>
                  )}
                </div>

                <div className="mt-0.5 text-xs text-slate-600">
                  No manual triggers • Azure writes to <span className="font-mono">session_ai_insights</span> automatically
                </div>
              </div>

              <div className="px-5 py-5 sm:px-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold tracking-widest text-slate-500">TODAY’S AI WINDOW</div>
                  <div className="mt-2 text-sm text-slate-800">
                    Period: <span className="font-semibold text-slate-900">{fmtDateTimeShort(todayStart)}</span> →{" "}
                    <span className="font-semibold text-slate-900">{fmtDateTimeShort(todayEnd)}</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    If Azure is connected, it should refresh insight continuously as session logs update.
                  </div>
                </div>

                {latestAiToday ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold tracking-widest text-slate-500">LATEST AI OUTPUT</div>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {latestAiToday.source.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-2 text-sm font-semibold text-slate-900">{latestAiToday.summary}</div>

                    <div className="mt-3 grid gap-2">
                      {(latestAiToday.recommendations ?? []).slice(0, 4).map((r, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                          <div className="mt-1 text-xs text-slate-600">{r.why}</div>
                          <div className="mt-2 text-xs text-slate-700">{r.action}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 text-[11px] text-slate-500">
                      Updated: {fmtDateTimeShort(latestAiToday.created_at)} • Freshness:{" "}
                      {aiFreshness ? `${aiFreshness.mins} min ago` : "—"}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold tracking-widest text-slate-500">PIPELINE STATUS</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">Waiting for today’s first insight</div>
                        <div className="mt-1 text-xs text-slate-600">
                          Azure will write into <span className="font-mono">session_ai_insights</span> automatically once session signals exist.
                        </div>
                      </div>

                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {aiFreshness ? `${aiFreshness.label} • ${aiFreshness.mins}m` : "WAITING"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2">
                      <PipelineStep ok={sessionsToday.length > 0} label="Session exists for today" />
                      <PipelineStep
                        ok={sessionsToday.some((s) => (s.status ?? "planned") === "open")}
                        label="Session is OPEN (best signal quality)"
                      />
                      <PipelineStep ok={evidenceToday.length > 0} label="Evidence stream has started" />
                      <PipelineStep ok={!!latestAiToday} label="Azure wrote latest insight row" />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-xs font-semibold tracking-widest text-slate-500">NEXT</div>
                      <div className="mt-2 text-sm text-slate-700">
                        When the first session starts, this panel will show a summary + operational recommendations and keep updating automatically.
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-[18px] border border-slate-200 bg-white/70 p-4 text-sm text-slate-700">
                  This page is strictly live analytics. A separate History Analytics page will cover older days and trends.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-xs text-slate-600">
          Live refresh: every ~25s + realtime subscriptions (if enabled). For enterprise scale, move aggregates into{" "}
          <span className="font-mono">v_session_metrics</span> and create a dedicated “today_live_metrics” RPC.
        </div>
      </div>
    </main>
  );
}

/* ---------------- UI Components ---------------- */

function KpiCard(props: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] p-4">
      <div className="text-xs font-semibold tracking-widest text-slate-500">{props.label.toUpperCase()}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</div>
      <div className="mt-1 text-xs text-slate-600">{props.hint}</div>
    </div>
  );
}

function Pill(props: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
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
          props.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"
        )}
      >
        {props.ok ? "OK" : "MISSING"}
      </span>
    </div>
  );
}

function BarCard(props: { title: string; value: string; score: number; desc: string }) {
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

/* ---------------- Enterprise-grade Empty State Components ---------------- */

function EnterpriseEmptyState(props: {
  title: string;
  subtitle: string;
  accent?: "indigo" | "cyan" | "emerald";
  right?: ReactNode;
  children?: ReactNode;
}) {
  const accent =
    props.accent === "cyan"
      ? "from-cyan-500/15 via-cyan-400/0 to-transparent"
      : props.accent === "emerald"
      ? "from-emerald-500/15 via-emerald-400/0 to-transparent"
      : "from-indigo-500/15 via-indigo-400/0 to-transparent";

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-slate-200 bg-white">
      <div className={cx("absolute inset-x-0 top-0 h-24 bg-gradient-to-b", accent)} />
      <div className="relative px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{props.title}</div>
            <div className="mt-1 text-sm text-slate-600">{props.subtitle}</div>
          </div>

          {props.right ? <div className="w-full lg:w-[340px]">{props.right}</div> : null}
        </div>

        <div className="mt-5">{props.children}</div>
      </div>
    </div>
  );
}

function StatusTile(props: { label: string; value: string; hint: string; tone: "good" | "risk" | "neutral" }) {
  const toneCls =
    props.tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : props.tone === "risk"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-widest text-slate-500">{props.label.toUpperCase()}</div>
          <div className="mt-2 text-sm font-semibold text-slate-900">{props.value}</div>
          <div className="mt-1 text-xs text-slate-600">{props.hint}</div>
        </div>
        <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", toneCls)}>
          {props.tone === "good" ? "OK" : props.tone === "risk" ? "NEEDS" : "INFO"}
        </span>
      </div>
    </div>
  );
}

function InfoCard(props: { kicker: string; title: string; desc: string; bullets: string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold tracking-widest text-slate-500">{props.kicker}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{props.title}</div>
      <div className="mt-1 text-sm text-slate-700">{props.desc}</div>
      <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
        {props.bullets.map((b, idx) => (
          <li key={idx}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

function CheckRow(props: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-sm text-slate-700">{props.label}</div>
      <span
        className={cx(
          "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
          props.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"
        )}
      >
        {props.ok ? "READY" : "MISSING"}
      </span>
    </div>
  );
}

function PipelineStep(props: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-sm text-slate-700">{props.label}</div>
      <span
        className={cx(
          "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
          props.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-slate-200 bg-white text-slate-700"
        )}
      >
        {props.ok ? "DONE" : "PENDING"}
      </span>
    </div>
  );
}
