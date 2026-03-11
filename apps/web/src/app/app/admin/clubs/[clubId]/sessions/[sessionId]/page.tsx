// web/src/app/app/admin/clubs/[clubId]/sessions/[sessionId]/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useAdminGuard } from "@/lib/admin/admin-guard";

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

function fmtDay(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${fmtDay(d)} • ${fmtTime(iso)}`;
}

function safeNum(x: any, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

type SessionRow = {
  id: string;
  club_id: string;
  title: string | null;
  starts_at: string | null;
  duration_minutes: number | null;
  status: "planned" | "open" | "closed" | null;
  term_id?: string | null;

  // from v_session_metrics (may exist)
  participants?: number | null;
  evidence_items?: number | null;
  activities_total?: number | null;
  activities_completed?: number | null;

  // legacy fields (ignored here by design)
  present_count?: number | null;
  late_count?: number | null;
  absent_count?: number | null;
};

type EvidenceRow = {
  id: string;
  club_id: string;
  session_id: string;
  type: "note" | "image" | "video" | "ai_summary" | string;
  content: string;
  meta: any;
  created_at: string;
  created_by?: string | null;
};

type ActivityRow = {
  id: string;
  club_id: string;
  session_id: string;
  title: string;
  description?: string | null;
  activity_type: "build" | "challenge" | "demo" | "teamwork" | string;
  expected_outcome?: string | null;
  sort_order?: number | null;
  is_completed?: boolean | null;
  completed_at?: string | null;
};

type AiInsight = {
  id: string;
  club_id: string;
  period_start: string;
  period_end: string;
  source: "rules" | "azure" | string;
  summary: string;
  recommendations?: any;
  metrics?: any;
  created_at: string;
};

function statusChip(status?: string | null) {
  const k = status ?? "planned";
  if (k === "open") return "border-emerald-200/80 bg-emerald-50/70 text-emerald-950";
  if (k === "closed") return "border-slate-200/80 bg-slate-50/70 text-slate-800";
  return "border-indigo-200/80 bg-indigo-50/70 text-indigo-950";
}

function healthTone(score: number) {
  if (score >= 0.78) return "border-emerald-200/80 bg-emerald-50/70 text-emerald-950";
  if (score >= 0.48) return "border-indigo-200/80 bg-indigo-50/70 text-indigo-950";
  return "border-rose-200/80 bg-rose-50/70 text-rose-950";
}

/**
 * Session Health (business-friendly):
 * uses only session signals that belong to this module:
 * - participants
 * - evidence captured
 * - checklist present + completion
 *
 * Attendance reporting is intentionally excluded (attendance has its own area).
 */
function computeSessionHealth(s: SessionRow, activities: ActivityRow[], evidenceCountFallback: number) {
  const participants = safeNum(s.participants, 0);
  const evidenceItems = safeNum(s.evidence_items, evidenceCountFallback);

  const aT = safeNum(s.activities_total, activities.length);
  const aC = safeNum(s.activities_completed, 0) || activities.filter((a) => a.is_completed).length;

  const hasPeople = participants > 0 ? 1 : 0;
  const hasEvidence = evidenceItems > 0 ? 1 : 0;
  const hasChecklist = aT > 0 ? 1 : 0;
  const completionRate = aT > 0 ? Math.min(1, aC / aT) : 0;

  const score = Math.max(
    0,
    Math.min(1, 0.25 * hasPeople + 0.40 * hasEvidence + 0.15 * hasChecklist + 0.20 * completionRate)
  );

  const label =
    score >= 0.78 ? "Healthy" : score >= 0.48 ? "Needs attention" : "At risk";

  const checklistPct = aT > 0 ? Math.round((aC / aT) * 100) : null;

  const actions: string[] = [];
  if (!hasPeople) actions.push("Add participants (so progress is measurable).");
  if (!hasEvidence) actions.push("Capture at least 1 photo/video/note as proof of learning.");
  if (!hasChecklist) actions.push("Attach a short checklist to guide the session.");
  if (hasChecklist && completionRate < 0.6) actions.push("Increase checklist completion (aim for 60%+).");

  return {
    score,
    label,
    actions,
    participants,
    evidenceItems,
    aT,
    aC,
    checklistPct,
    completionRate,
  };
}

function Chip(props: { text: string; cls: string; title?: string }) {
  return (
    <span
      title={props.title}
      className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", props.cls)}
    >
      {props.text}
    </span>
  );
}

function Panel(props: { title: string; subtitle?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-[26px] border border-slate-200/70 bg-white/60 shadow-[0_22px_70px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
      <div className="border-b border-slate-200/70 px-5 py-4 sm:px-7 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{props.title}</div>
          {props.subtitle ? <div className="mt-0.5 text-xs text-slate-600">{props.subtitle}</div> : null}
        </div>
        {props.right ? <div className="shrink-0">{props.right}</div> : null}
      </div>
      <div className="px-5 py-5 sm:px-7">{props.children}</div>
    </div>
  );
}

function StatCard(props: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4">
      <div className="text-xs font-semibold text-slate-600">{props.label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs text-slate-600">{props.hint}</div> : null}
    </div>
  );
}

async function fetchSessionBestEffort(supabase: any, clubId: string, sessionId: string): Promise<SessionRow> {
  try {
    const v = await supabase
      .from("v_session_metrics")
      .select("*")
      .eq("club_id", clubId)
      .eq("id", sessionId)
      .limit(1);

    if (!v.error && v.data?.[0]) {
      const x: any = v.data[0];
      return {
        id: x.id ?? sessionId,
        club_id: x.club_id,
        title: x.title ?? null,
        starts_at: x.starts_at ?? null,
        duration_minutes: x.duration_minutes ?? null,
        status: x.status ?? null,
        term_id: x.term_id ?? null,

        participants: x.participants ?? x.participants_count ?? null,
        evidence_items: x.evidence_items ?? x.evidence_count ?? null,
        activities_total: x.activities_total ?? x.activities_count ?? null,
        activities_completed: x.activities_completed ?? x.activities_done ?? null,

        // legacy (ignored)
        present_count: x.present_count ?? x.present ?? null,
        late_count: x.late_count ?? x.late ?? null,
        absent_count: x.absent_count ?? x.absent ?? null,
      };
    }
  } catch {
    // ignore
  }

  const s = await supabase
    .from("sessions")
    .select("id, club_id, title, starts_at, duration_minutes, status, term_id")
    .eq("club_id", clubId)
    .eq("id", sessionId)
    .limit(1);

  if (s.error || !s.data?.[0]) throw new Error(s.error?.message ?? "Session not found or blocked by RLS.");
  return s.data[0] as SessionRow;
}

async function fetchEvidence(supabase: any, clubId: string, sessionId: string): Promise<EvidenceRow[]> {
  const res = await supabase
    .from("session_evidence")
    .select("id, club_id, session_id, type, content, meta, created_at, created_by")
    .eq("club_id", clubId)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });

  if (res.error) throw res.error;
  return (res.data ?? []) as EvidenceRow[];
}

async function fetchActivities(supabase: any, clubId: string, sessionId: string): Promise<ActivityRow[]> {
  const res = await supabase
    .from("session_activities")
    .select(
      "id, club_id, session_id, title, description, activity_type, expected_outcome, sort_order, is_completed, completed_at"
    )
    .eq("club_id", clubId)
    .eq("session_id", sessionId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (res.error) throw res.error;
  return (res.data ?? []) as ActivityRow[];
}

async function fetchSessionAiInsightForTime(
  supabase: any,
  clubId: string,
  startsAtIso?: string | null
): Promise<AiInsight | null> {
  if (!startsAtIso) return null;
  const res = await supabase
    .from("session_ai_insights")
    .select("id, club_id, period_start, period_end, source, summary, recommendations, metrics, created_at")
    .eq("club_id", clubId)
    .lte("period_start", startsAtIso)
    .gte("period_end", startsAtIso)
    .order("created_at", { ascending: false })
    .limit(1);

  if (res.error) return null;
  return (res.data?.[0] as AiInsight) ?? null;
}

function EmptyState(props: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4">
      <div className="text-sm font-semibold text-slate-900">{props.title}</div>
      <div className="mt-1 text-sm text-slate-700">{props.body}</div>
    </div>
  );
}

export default function SessionDetailsPage() {
  const { clubId, sessionId } = useParams<{ clubId: string; sessionId: string }>();
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  const [booting, setBooting] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [session, setSession] = useState<SessionRow | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [insightNote, setInsightNote] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId || !sessionId) return;
    if (!supabase) return;
    if (checking) return;

    let cancelled = false;

    (async () => {
      setBooting(true);
      setErr(null);

      try {
        const s = await fetchSessionBestEffort(supabase, clubId, sessionId);
        if (cancelled) return;
        setSession(s);

        const [ev, act, ai] = await Promise.allSettled([
          fetchEvidence(supabase, clubId, sessionId),
          fetchActivities(supabase, clubId, sessionId),
          fetchSessionAiInsightForTime(supabase, clubId, s.starts_at),
        ]);

        if (cancelled) return;

        if (ev.status === "fulfilled") setEvidence(ev.value);
        if (act.status === "fulfilled") setActivities(act.value);

        if (ai.status === "fulfilled") {
          if (ai.value) {
            setInsight(ai.value);
            setInsightNote(null);
          } else {
            setInsight(null);
            setInsightNote("No insight has been generated for this session window yet.");
          }
        } else {
          setInsight(null);
          setInsightNote("Insight is unavailable (permissions may be required).");
        }
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load session details.");
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, sessionId, supabase, checking]);

  const derived = useMemo(() => {
    if (!session) return null;
    return computeSessionHealth(session, activities, evidence.length);
  }, [session, activities, evidence.length]);

  const checklistDisplay = useMemo(() => {
    if (!derived) return "—";
    return derived.checklistPct === null ? "—" : `${derived.checklistPct}%`;
  }, [derived]);

  const header = (
    <div className="mb-6 rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(1000px_260px_at_10%_0%,rgba(99,102,241,0.14),transparent_60%),radial-gradient(900px_240px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Chip text="Session Report" cls="border-slate-200 bg-white/70 text-slate-700" />
              {session ? (
                <Chip text={(session.status ?? "planned").toUpperCase()} cls={statusChip(session.status)} />
              ) : null}
              {derived ? (
                <Chip
                  text={`HEALTH: ${derived.label.toUpperCase()} • ${Math.round(derived.score * 100)}%`}
                  cls={healthTone(derived.score)}
                  title={derived.actions.length ? derived.actions.join(" ") : "No actions suggested"}
                />
              ) : null}
            </div>

            <div className="mt-2 text-lg font-semibold text-slate-900">
              {session?.title || "Untitled session"}
            </div>
            <div className="mt-1 text-sm text-slate-700">
              {session ? fmtDateTime(session.starts_at) : "Loading…"}{" "}
              <span className="mx-2 text-slate-300">•</span>
              {session?.duration_minutes ?? 60} minutes
            </div>
            <div className="mt-1 text-xs text-slate-600">
              Simple business view: participants, evidence, checklist, and session notes (attendance is handled elsewhere).
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/admin/clubs/${clubId}/schedule/history`}
              className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
            >
              History
            </Link>
            <Link
              href={`/app/admin/clubs/${clubId}/schedule`}
              className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
            >
              Schedule
            </Link>
            <Link
              href={`/app/admin/clubs/${clubId}/sessions`}
              className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
            >
              Sessions
            </Link>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 sm:px-7">
        <div className="grid gap-3 md:grid-cols-4">
          <StatCard label="Participants" value={derived ? derived.participants : "—"} hint="Who took part (count)" />
          <StatCard label="Evidence captured" value={derived ? derived.evidenceItems : "—"} hint="Photos, videos, notes" />
          <StatCard label="Checklist progress" value={checklistDisplay} hint="Completed / total tasks" />
          <StatCard
            label="Tasks done"
            value={derived ? `${derived.aC}/${derived.aT || 0}` : "—"}
            hint="How many activities were marked complete"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      {header}

      {booting ? (
        <div className="h-[520px] rounded-[26px] border border-slate-200/70 bg-white/60 animate-pulse" />
      ) : err ? (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-5 text-sm text-rose-950">
          <div className="font-semibold">Could not load this session</div>
          <div className="mt-1">{err}</div>
        </div>
      ) : !session ? (
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 text-sm text-slate-700">
          Session not found.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left */}
          <div className="lg:col-span-8 space-y-6">
            <Panel
              title="Evidence & Notes"
              subtitle="Proof of learning: photos, videos, notes, and summaries."
              right={
                <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                  Items: {evidence.length}
                </span>
              }
            >
              {!evidence.length ? (
                <EmptyState
                  title="No evidence captured yet"
                  body="Add at least one photo, short video, or a note so parents and managers can see what was achieved."
                />
              ) : (
                <div className="space-y-3">
                  {evidence.map((ev) => (
                    <div key={ev.id} className="rounded-2xl border border-slate-200/70 bg-white/70 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          {String(ev.type).replace(/_/g, " ").toUpperCase()}
                        </span>
                        <div className="text-xs text-slate-600">{fmtDateTime(ev.created_at)}</div>
                      </div>
                      <div className="mt-2 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {ev.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              title="Session Checklist"
              subtitle="Planned activities and whether they were completed."
              right={
                derived ? (
                  <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                    Progress: {checklistDisplay}
                  </span>
                ) : null
              }
            >
              {!activities.length ? (
                <EmptyState
                  title="No checklist yet"
                  body="Attach a small checklist so staff can deliver consistent sessions and you can track progress over time."
                />
              ) : (
                <div className="space-y-2">
                  {activities.map((a) => (
                    <div key={a.id} className="rounded-2xl border border-slate-200/70 bg-white/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                          <div className="mt-0.5 text-xs text-slate-600">
                            {String(a.activity_type).toUpperCase()}
                            {a.expected_outcome ? (
                              <>
                                <span className="mx-2 text-slate-300">•</span>
                                <span>{a.expected_outcome}</span>
                              </>
                            ) : null}
                          </div>
                          {a.description ? (
                            <div className="mt-2 text-sm text-slate-800 leading-relaxed">{a.description}</div>
                          ) : null}
                        </div>

                        <span
                          className={cx(
                            "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                            a.is_completed
                              ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-950"
                              : "border-slate-200/80 bg-slate-50/70 text-slate-800"
                          )}
                          title={a.completed_at ? `Completed at: ${fmtDateTime(a.completed_at)}` : undefined}
                        >
                          {a.is_completed ? "Done" : "Pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          {/* Right */}
          <div className="lg:col-span-4 space-y-6">
            <Panel
              title="Insight & Next Steps"
              subtitle="Short guidance linked to this session time window."
              right={
                insight ? (
                  <span className="rounded-full border border-indigo-200/80 bg-indigo-50/70 px-3 py-1.5 text-[11px] font-semibold text-indigo-950">
                    {String(insight.source || "INSIGHT").toUpperCase()}
                  </span>
                ) : (
                  <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                    Not available
                  </span>
                )
              }
            >
              <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4">
                <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {insight?.summary ?? insightNote ?? "No insight found for this session window."}
                </div>

                {insight?.created_at ? (
                  <div className="mt-4 grid gap-2 text-xs text-slate-600">
                    <div className="rounded-xl border border-slate-200/70 bg-white/80 p-3">
                      <div className="font-semibold text-slate-700">Generated</div>
                      <div className="mt-0.5 text-slate-900">{fmtDateTime(insight.created_at)}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 bg-white/80 p-3">
                      <div className="font-semibold text-slate-700">Time window</div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-900">
                        {insight.period_start} → {insight.period_end}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </Panel>

            <Panel title="Session Health" subtitle="A simple view for owners and managers (not technical).">
              {!derived ? (
                <EmptyState title="Health is unavailable" body="This appears when the session has not loaded yet." />
              ) : (
                <div className="space-y-3">
                  <div className={cx("rounded-2xl border p-4", healthTone(derived.score))}>
                    <div className="text-sm font-semibold text-slate-900">
                      {derived.label} • {Math.round(derived.score * 100)}%
                    </div>
                    <div className="mt-1 text-sm text-slate-800">
                      Based on participants, evidence captured, and checklist completion.
                    </div>
                  </div>

                  {derived.actions.length ? (
                    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4">
                      <div className="text-sm font-semibold text-slate-900">Recommended actions</div>
                      <ul className="mt-2 list-disc pl-5 text-sm text-slate-800 space-y-1">
                        {derived.actions.map((a) => (
                          <li key={a}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4">
                      <div className="text-sm font-semibold text-slate-900">Looks good</div>
                      <div className="mt-1 text-sm text-slate-800">
                        This session has strong signals (participants + evidence + checklist).
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-xs text-slate-600">
                    Attendance reports are managed in the Attendance area (kept separate on purpose).
                  </div>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
