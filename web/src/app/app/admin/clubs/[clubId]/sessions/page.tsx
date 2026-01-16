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

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short" });
}

function pct(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 100)}%`;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function statusChip(s?: SessionStatus | null) {
  const k = s ?? "planned";
  if (k === "open") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (k === "closed") return "border-slate-200 bg-slate-50 text-slate-700";
  return "border-indigo-200 bg-indigo-50 text-indigo-900";
}

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

export default function SessionsAnalyticsHomePage() {
  const params = useParams<{ clubId: string }>();
  const clubId = params.clubId;

  const { checking, supabase } = useAdminGuard({ idleMinutes: 20 });

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [latestAi, setLatestAi] = useState<SessionAiInsight | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  function flash(text: string, ms = 1600) {
    setMsg(text);
    window.setTimeout(() => setMsg(""), ms);
  }

  async function loadAnalytics() {
    setLoading(true);
    setMsg("");

    try {
      const sRes = await supabase
        .from("sessions")
        .select("id, club_id, title, starts_at, duration_minutes, status, term_id, created_at")
        .eq("club_id", clubId)
        .order("starts_at", { ascending: false })
        .limit(400);

      const pRes = await supabase
        .from("session_participants")
        .select("session_id, student_id")
        .eq("club_id", clubId)
        .limit(8000);

      const eRes = await supabase
        .from("session_evidence")
        .select("id, club_id, session_id, type, created_at")
        .eq("club_id", clubId)
        .order("created_at", { ascending: false })
        .limit(3000);

      const aRes = await supabase
        .from("session_activities")
        .select("id, club_id, session_id, is_completed")
        .eq("club_id", clubId)
        .limit(6000);

      // ✅ renamed table
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
      flash(e?.message ? `Load failed: ${e.message}` : "Load failed.", 2200);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (checking) return;
    loadAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, clubId]);

  // ---- Derived metrics ----
  const totalSessions = sessions.length;
  const openSessions = sessions.filter((s) => (s.status ?? "planned") === "open").length;
  const plannedSessions = sessions.filter((s) => (s.status ?? "planned") === "planned").length;
  const closedSessions = sessions.filter((s) => (s.status ?? "planned") === "closed").length;

  const participantsBySession = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of participants) {
      m.set(p.session_id, (m.get(p.session_id) ?? 0) + 1);
    }
    return m;
  }, [participants]);

  const evidenceBySession = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of evidence) {
      m.set(e.session_id, (m.get(e.session_id) ?? 0) + 1);
    }
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

  const avgParticipants = totalSessions > 0 ? participants.length / totalSessions : 0;
  const avgEvidence = totalSessions > 0 ? evidence.length / totalSessions : 0;

  const totalActivities = activities.length;
  const doneActivities = activities.filter((a) => a.is_completed).length;
  const completionRate = totalActivities > 0 ? doneActivities / totalActivities : 0;

  const sessionsWithMinEvidence = sessions.filter((s) => (evidenceBySession.get(s.id) ?? 0) >= 2).length;
  const evidenceHealth = totalSessions > 0 ? sessionsWithMinEvidence / totalSessions : 0;

  const scheduledRate = totalSessions > 0 ? sessions.filter((s) => !!s.starts_at).length / totalSessions : 0;

  // ---- Rule-based Advice (AI feel now, Azure later) ----
  const ruleAdvice = useMemo(() => {
    const recs: Array<{ title: string; why: string; action: string }> = [];

    if (avgParticipants < 6 && totalSessions >= 3) {
      recs.push({
        title: "Boost retention with a parent-facing showcase",
        why: `Average attendance is ${avgParticipants.toFixed(1)} learners/session, which suggests weak word-of-mouth momentum.`,
        action: "Add a 5-minute demo moment + take 3 photos per session. Post a weekly highlight to parents/WhatsApp.",
      });
    }

    if (avgEvidence < 2) {
      recs.push({
        title: "Evidence is too light for ‘Proof Engine’ differentiation",
        why: `You average ${avgEvidence.toFixed(1)} evidence items/session. Strong clubs typically capture 2–5.`,
        action: "Make evidence routine: 1 photo during build + 1 photo during demo + 1 coach note at the end.",
      });
    }

    if (completionRate < 0.7 && totalActivities >= 10) {
      recs.push({
        title: "Checklist overload detected",
        why: `Activity completion is ${pct(completionRate)}. Too many checklist items can reduce delivery quality.`,
        action: "Reduce checklist to 4–6 core outcomes. Move optional tasks to ‘stretch goals’.",
      });
    }

    if (plannedSessions > 0 && scheduledRate < 0.9) {
      recs.push({
        title: "Scheduling discipline can improve operations",
        why: "Some planned sessions don’t have a proper start time.",
        action: "Require a start date/time for every planned session and auto-create reminders.",
      });
    }

    if (!recs.length) {
      recs.push({
        title: "Delivery health looks strong",
        why: "Your current KPIs don’t show obvious risk signals.",
        action: "Next optimization: add AI summaries per session to convert evidence into parent-friendly stories.",
      });
    }

    return recs;
  }, [avgParticipants, avgEvidence, completionRate, plannedSessions, scheduledRate, totalActivities, totalSessions]);

  async function saveRuleInsight() {
    const now = new Date();
    const end = now.toISOString();
    const start = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30).toISOString();

    try {
      const payload = {
        club_id: clubId,
        period_start: start,
        period_end: end,
        source: "rules",
        summary: `Last 30 days snapshot: ${totalSessions} sessions, avg ${avgParticipants.toFixed(
          1
        )} learners/session, evidence health ${pct(evidenceHealth)}.`,
        recommendations: ruleAdvice,
        metrics: {
          totalSessions,
          openSessions,
          plannedSessions,
          closedSessions,
          avgParticipants,
          avgEvidence,
          completionRate,
          evidenceHealth,
          scheduledRate,
        },
      };

      // ✅ renamed table
      const res = await supabase.from("session_ai_insights").insert(payload as any).select("*").single();
      if (res.error) throw res.error;

      setLatestAi(res.data as any);
      flash("AI advice saved ✓");
    } catch (e: any) {
      flash(e?.message ? `Save failed: ${e.message}` : "Save failed.", 2200);
    }
  }

  async function generateAzureAdvice() {
    setAiBusy(true);
    try {
      // ✅ renamed route
      const res = await fetch(`/api/ai/session-advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId,
          windowDays: 30,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "AI request failed.");

      setLatestAi(json.data as any);
      flash("Azure AI advice generated ✓", 1800);
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
              AI-powered delivery intelligence • Insights → Recommendations → Automation
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/admin/clubs/${clubId}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
            >
              Back
            </Link>

            <Link
              href={`/app/admin/clubs/${clubId}/sessions/plan`}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Plan sessions
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

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard label="Total sessions" value={`${totalSessions}`} hint="All time" />
              <KpiCard label="Open now" value={`${openSessions}`} hint="Live delivery" />
              <KpiCard label="Avg learners/session" value={avgParticipants.toFixed(1)} hint="Attendance signal" />
              <KpiCard label="Evidence/session" value={avgEvidence.toFixed(1)} hint="Proof Engine signal" />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <MetricCard
                title="Evidence Health"
                value={pct(evidenceHealth)}
                desc="% sessions with ≥ 2 evidence items"
                score={evidenceHealth}
              />
              <MetricCard
                title="Delivery Completion"
                value={pct(completionRate)}
                desc="Completed activities across sessions"
                score={completionRate}
              />
            </div>

            <div className="mt-4 rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                <div className="text-sm font-semibold text-slate-900">Recent sessions</div>
                <div className="mt-0.5 text-xs text-slate-600">
                  Quick pulse check (participants • evidence • checklist)
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {sessions.slice(0, 8).map((s) => {
                  const p = participantsBySession.get(s.id) ?? 0;
                  const ev = evidenceBySession.get(s.id) ?? 0;
                  const a = activitiesBySession.get(s.id) ?? { total: 0, done: 0 };
                  const cr = a.total > 0 ? a.done / a.total : 0;

                  return (
                    <div key={s.id} className="px-5 py-4 sm:px-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">
                            {s.title || "Untitled session"}
                          </div>
                          <div className="mt-1 text-xs text-slate-600">
                            {fmtDate(s.starts_at)} • {s.duration_minutes ?? 60} mins
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className={cx("rounded-full border px-3 py-1 text-xs font-semibold", statusChip(s.status))}>
                              {(s.status ?? "planned").toUpperCase()}
                            </span>

                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                              Learners: <span className="ml-1 text-slate-900">{p}</span>
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

                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/app/admin/clubs/${clubId}/sessions/${s.id}/run`}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
                          >
                            Run
                          </Link>
                          <Link
                            href={`/app/admin/clubs/${clubId}/sessions/${s.id}/evidence`}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
                          >
                            Evidence
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!sessions.length ? (
                  <div className="px-6 py-10 text-center">
                    <div className="text-sm font-semibold text-slate-900">No sessions yet</div>
                    <div className="mt-1 text-sm text-slate-600">Create your first planned session in Plan.</div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                <div className="text-sm font-semibold text-slate-900">AI Advice & Automation</div>
                <div className="mt-0.5 text-xs text-slate-600">
                  This is the differentiator: analytics → insight → action
                </div>
              </div>

              <div className="px-5 py-5 sm:px-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold tracking-widest text-slate-500">RULE-BASED INSIGHTS (NOW)</div>
                  <div className="mt-2 text-sm text-slate-800">
                    These are generated from your real session data so the platform already “feels AI-powered”, even before Azure is connected.
                  </div>

                  <div className="mt-3 grid gap-2">
                    {ruleAdvice.slice(0, 3).map((r, idx) => (
                      <div key={idx} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                        <div className="mt-1 text-xs text-slate-600">{r.why}</div>
                        <div className="mt-2 text-xs font-semibold text-slate-900">Action:</div>
                        <div className="text-xs text-slate-700">{r.action}</div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={saveRuleInsight}
                    className="mt-3 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Save advice to AI log
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                  <div className="text-xs font-semibold tracking-widest text-indigo-700">AZURE AI (NEXT)</div>
                  <div className="mt-2 text-sm text-indigo-900">
                    Generate a narrative insight (parent-friendly + admin business advice) using Azure OpenAI, and store it for reporting + automation triggers.
                  </div>

                  <button
                    type="button"
                    disabled={aiBusy}
                    onClick={generateAzureAdvice}
                    className="mt-3 w-full rounded-xl bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
                  >
                    {aiBusy ? "Generating..." : "Generate Azure AI advice"}
                  </button>
                </div>

                {latestAi ? (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold tracking-widest text-slate-500">LATEST AI INSIGHT</div>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {latestAi.source.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-2 text-sm font-semibold text-slate-900">{latestAi.summary}</div>

                    <div className="mt-3 grid gap-2">
                      {(latestAi.recommendations ?? []).slice(0, 3).map((r, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <div className="text-sm font-semibold text-slate-900">{r.title}</div>
                          <div className="mt-1 text-xs text-slate-600">{r.why}</div>
                          <div className="mt-2 text-xs text-slate-700">{r.action}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 text-[11px] text-slate-500">
                      Saved: {fmtDate(latestAi.created_at)} • Window: 30 days
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 text-xs text-slate-600">
                    No AI insight saved yet. Save rule-based advice or generate Azure advice.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-[18px] border border-slate-200 bg-white/70 p-4 text-sm text-slate-700">
              Next pages: <span className="font-semibold text-slate-900">Plan</span> (create + participants) →{" "}
              <span className="font-semibold text-slate-900">Run</span> (open/close + checklist) →{" "}
              <span className="font-semibold text-slate-900">Evidence</span> (proof engine + AI summaries).
            </div>
          </div>
        </div>
      </div>
    </main>
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

function MetricCard(props: { title: string; value: string; desc: string; score: number }) {
  const s = clamp01(props.score);
  return (
    <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
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
