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

type AttendanceAgg = {
    present: number;
    late: number;
    absent: number;
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

function scoreTone(score: number) {
    if (score >= 0.78) return "border-emerald-200/80 bg-emerald-50/70 text-emerald-950";
    if (score >= 0.48) return "border-indigo-200/80 bg-indigo-50/70 text-indigo-950";
    return "border-rose-200/80 bg-rose-50/70 text-rose-950";
}

/**
 * Deterministic session quality score:
 * people signal + evidence + checklist completeness.
 * Not “model output”, not “AI replay”.
 */
function computeQuality(s: SessionRow, attendanceAgg?: AttendanceAgg | null) {
    const participants = safeNum(s.participants, 0);
    const evidence = safeNum(s.evidence_items, 0);
    const aT = safeNum(s.activities_total, 0);
    const aC = safeNum(s.activities_completed, 0);

    const present = safeNum(attendanceAgg?.present ?? s.present_count, 0);
    const late = safeNum(attendanceAgg?.late ?? s.late_count, 0);
    const peopleSignal = participants > 0 || present + late > 0 ? 1 : 0;

    const hasEvidence = evidence > 0 ? 1 : 0;
    const hasChecklist = aT > 0 ? 1 : 0;
    const completionRate = aT > 0 ? Math.min(1, aC / aT) : 0;

    const score = Math.max(
        0,
        Math.min(1, 0.20 * peopleSignal + 0.35 * hasEvidence + 0.15 * hasChecklist + 0.30 * completionRate)
    );

    const label =
        score >= 0.78 ? "QUALITY STRONG" : score >= 0.48 ? "QUALITY PARTIAL" : "QUALITY WEAK";

    const gaps: string[] = [];
    if (!peopleSignal) gaps.push("No attendance / participants signal recorded");
    if (!hasEvidence) gaps.push("No evidence captured (photo/video/note)");
    if (!hasChecklist) gaps.push("No checklist activities attached");
    if (hasChecklist && completionRate < 0.55) gaps.push("Low checklist completion");

    return { score, label, completionRate, gaps };
}

function Section(props: { title: string; right?: ReactNode; children: ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-200/70 bg-white/60 overflow-hidden">
            <div className="border-b border-slate-200/70 px-4 py-3 sm:px-5 flex items-center justify-between gap-3">
                <div className="text-xs font-semibold tracking-widest text-slate-500">{props.title}</div>
                {props.right ? props.right : null}
            </div>
            <div className="px-4 py-4 sm:px-5">{props.children}</div>
        </div>
    );
}

function MetricTile(props: { label: string; value: ReactNode; hint?: string }) {
    return (
        <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
            <div className="text-xs font-semibold tracking-widest text-slate-500">{props.label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</div>
            {props.hint ? <div className="mt-1 text-xs text-slate-600">{props.hint}</div> : null}
        </div>
    );
}

function Badge(props: { text: string; cls: string; title?: string }) {
    return (
        <span
            title={props.title}
            className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", props.cls)}
        >
            {props.text}
        </span>
    );
}

async function fetchSessionBestEffort(supabase: any, clubId: string, sessionId: string): Promise<SessionRow> {
    // Try v_session_metrics first (enterprise metrics)
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
                present_count: x.present_count ?? x.present ?? null,
                late_count: x.late_count ?? x.late ?? null,
                absent_count: x.absent_count ?? x.absent ?? null,
            };
        }
    } catch {
        // ignore
    }

    // Fallback sessions table
    const s = await supabase
        .from("sessions")
        .select("id, club_id, title, starts_at, duration_minutes, status, term_id")
        .eq("club_id", clubId)
        .eq("id", sessionId)
        .limit(1);

    if (s.error || !s.data?.[0]) {
        throw new Error(s.error?.message ?? "Session not found or blocked by RLS.");
    }

    return s.data[0] as SessionRow;
}

async function fetchAttendanceAgg(supabase: any, clubId: string, sessionId: string): Promise<AttendanceAgg> {
    // We do aggregated counts client-side to avoid needing special SQL.
    // This uses your existing attendance_read_club RLS policy.
    const res = await supabase
        .from("attendance")
        .select("status")
        .eq("club_id", clubId)
        .eq("session_id", sessionId);

    if (res.error) throw res.error;

    const present = (res.data ?? []).filter((r: any) => r.status === "present").length;
    const late = (res.data ?? []).filter((r: any) => r.status === "late").length;
    const absent = (res.data ?? []).filter((r: any) => r.status === "absent").length;

    return { present, late, absent };
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
        .select("id, club_id, session_id, title, description, activity_type, expected_outcome, sort_order, is_completed, completed_at")
        .eq("club_id", clubId)
        .eq("session_id", sessionId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

    if (res.error) throw res.error;
    return (res.data ?? []) as ActivityRow[];
}

async function fetchSessionAiInsightForTime(supabase: any, clubId: string, startsAtIso?: string | null): Promise<AiInsight | null> {
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

export default function SessionDetailsPage() {
    const { clubId, sessionId } = useParams<{ clubId: string; sessionId: string }>();
    const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

    const [booting, setBooting] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const [session, setSession] = useState<SessionRow | null>(null);
    const [attendanceAgg, setAttendanceAgg] = useState<AttendanceAgg | null>(null);
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

                // Parallel reads (RLS safe)
                const [att, ev, act, ai] = await Promise.allSettled([
                    fetchAttendanceAgg(supabase, clubId, sessionId),
                    fetchEvidence(supabase, clubId, sessionId),
                    fetchActivities(supabase, clubId, sessionId),
                    fetchSessionAiInsightForTime(supabase, clubId, s.starts_at),
                ]);

                if (cancelled) return;

                if (att.status === "fulfilled") setAttendanceAgg(att.value);
                if (ev.status === "fulfilled") setEvidence(ev.value);
                if (act.status === "fulfilled") setActivities(act.value);

                if (ai.status === "fulfilled") {
                    if (ai.value) {
                        setInsight(ai.value);
                        setInsightNote(null);
                    } else {
                        setInsight(null);
                        setInsightNote("No session insight available for this session window (or locked by RLS).");
                    }
                } else {
                    setInsight(null);
                    setInsightNote("AI insight unavailable (RLS policy required on session_ai_insights).");
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
        const q = computeQuality(session, attendanceAgg);
        const aT = safeNum(session.activities_total, activities.length);
        const aC =
            safeNum(session.activities_completed, 0) ||
            activities.filter((a) => a.is_completed).length;

        const checklistPct = aT > 0 ? Math.round((aC / aT) * 100) : null;

        return {
            ...q,
            checklistPct,
            participants: safeNum(session.participants, 0),
            evidenceItems: safeNum(session.evidence_items, evidence.length),
            present: safeNum(attendanceAgg?.present ?? session.present_count, 0),
            late: safeNum(attendanceAgg?.late ?? session.late_count, 0),
            absent: safeNum(attendanceAgg?.absent ?? session.absent_count, 0),
            aT,
            aC,
        };
    }, [session, attendanceAgg, evidence.length, activities]);

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
                            <Badge text="Session Details" cls="border-slate-200 bg-white/70 text-slate-700" />
                            {session ? (
                                <Badge
                                    text={(session.status ?? "planned").toUpperCase()}
                                    cls={statusChip(session.status)}
                                />
                            ) : null}
                            {derived ? (
                                <Badge
                                    text={`${derived.label} • ${Math.round(derived.score * 100)}%`}
                                    cls={scoreTone(derived.score)}
                                    title={derived.gaps.length ? derived.gaps.join(" • ") : "No gaps detected"}
                                />
                            ) : null}
                        </div>

                        <div className="mt-2 text-sm font-semibold text-slate-900">
                            {session?.title || "—"}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-600">
                            {session ? fmtDateTime(session.starts_at) : "Loading…"} •{" "}
                            {session?.duration_minutes ?? 60}m
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={`/app/admin/clubs/${clubId}/schedule/history`}
                            className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
                        >
                            Back to History
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
                    <MetricTile label="PARTICIPANTS" value={derived ? derived.participants : "—"} hint="From metrics view / participants table" />
                    <MetricTile label="EVIDENCE" value={derived ? derived.evidenceItems : "—"} hint="Notes, images, videos, summaries" />
                    <MetricTile label="ATTENDANCE" value={derived ? `${derived.present}P ${derived.late}L ${derived.absent}A` : "—"} hint="Aggregated from attendance rows" />
                    <MetricTile
                        label="CHECKLIST"
                        value={checklistDisplay}
                        hint="Completed / total activities"
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
                    <div className="font-semibold">Could not load session</div>
                    <div className="mt-1">{err}</div>
                    <div className="mt-3 text-xs text-rose-900/80">
                        Tip: confirm RLS allows you to read sessions / metrics for this club.
                    </div>
                </div>
            ) : !session ? (
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 text-sm text-slate-700">
                    Session not found.
                </div>
            ) : (
                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Left */}
                    <div className="lg:col-span-8 space-y-6">
                        <Section title="EVIDENCE LOG">
                            {!evidence.length ? (
                                <div className="text-sm text-slate-700">
                                    No evidence captured for this session yet.
                                    <div className="mt-1 text-xs text-slate-600">
                                        Evidence types: notes, images, videos, AI summaries.
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {evidence.map((ev) => (
                                        <div key={ev.id} className="rounded-xl border border-slate-200/70 bg-white/70 p-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <Badge text={String(ev.type).toUpperCase()} cls="border-slate-200 bg-white/70 text-slate-700" />
                                                <div className="text-xs text-slate-600">{fmtDateTime(ev.created_at)}</div>
                                            </div>
                                            <div className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
                                                {ev.content}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Section>

                        <Section title="CHECKLIST ACTIVITIES">
                            {!activities.length ? (
                                <div className="text-sm text-slate-700">
                                    No checklist activities attached to this session.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {activities.map((a) => (
                                        <div key={a.id} className="rounded-xl border border-slate-200/70 bg-white/70 p-3">
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
                                                        <div className="mt-2 text-sm text-slate-800">{a.description}</div>
                                                    ) : null}
                                                </div>

                                                <Badge
                                                    text={a.is_completed ? "COMPLETED" : "PENDING"}
                                                    cls={
                                                        a.is_completed
                                                            ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-950"
                                                            : "border-slate-200/80 bg-slate-50/70 text-slate-800"
                                                    }
                                                    title={a.completed_at ? `Completed at: ${fmtDateTime(a.completed_at)}` : undefined}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Section>
                    </div>

                    {/* Right */}
                    <div className="lg:col-span-4 space-y-6">
                        <Section title="ATTENDANCE SUMMARY">
                            {attendanceAgg ? (
                                <div className="grid grid-cols-3 gap-3">
                                    <MetricTile label="PRESENT" value={attendanceAgg.present} />
                                    <MetricTile label="LATE" value={attendanceAgg.late} />
                                    <MetricTile label="ABSENT" value={attendanceAgg.absent} />
                                </div>
                            ) : (
                                <div className="text-sm text-slate-700">
                                    Attendance summary unavailable.
                                    <div className="mt-1 text-xs text-slate-600">
                                        This may happen if attendance rows do not exist yet.
                                    </div>
                                </div>
                            )}
                        </Section>

                        <Section
                            title="SESSION AI INSIGHT"
                            right={
                                insight ? (
                                    <Badge
                                        text={String(insight.source || "AI").toUpperCase()}
                                        cls="border-indigo-200/80 bg-indigo-50/70 text-indigo-950"
                                    />
                                ) : (
                                    <Badge text="NOT AVAILABLE" cls="border-slate-200 bg-white/70 text-slate-700" />
                                )
                            }
                        >
                            <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3">
                                <div className="text-[11px] font-semibold text-slate-700">Insight summary</div>
                                <div className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
                                    {insight?.summary ?? insightNote ?? "No insight found for this session time window."}
                                </div>

                                {insight?.created_at ? (
                                    <div className="mt-3 grid gap-2 text-xs text-slate-600">
                                        <div className="rounded-lg border border-slate-200/70 bg-white/80 p-2">
                                            <div className="font-semibold text-slate-700">Generated</div>
                                            <div className="mt-0.5 text-slate-900">{fmtDateTime(insight.created_at)}</div>
                                        </div>

                                        <div className="rounded-lg border border-slate-200/70 bg-white/80 p-2">
                                            <div className="font-semibold text-slate-700">Window</div>
                                            <div className="mt-0.5 font-mono text-[11px] text-slate-900">
                                                {insight.period_start} → {insight.period_end}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-3 text-xs text-slate-600">
                                        If this is always empty: add SELECT RLS policy on <span className="font-mono text-slate-900">session_ai_insights</span>.
                                    </div>
                                )}
                            </div>
                        </Section>

                        {derived?.gaps?.length ? (
                            <Section title="QUALITY GAPS">
                                <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3">
                                    <div className="text-sm font-semibold text-slate-900">Improvements recommended</div>
                                    <ul className="mt-2 list-disc pl-5 text-sm text-slate-800">
                                        {derived.gaps.map((g) => (
                                            <li key={g}>{g}</li>
                                        ))}
                                    </ul>
                                </div>
                            </Section>
                        ) : (
                            <Section title="QUALITY STATUS">
                                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3">
                                    <div className="text-sm font-semibold text-slate-900">Healthy signals</div>
                                    <div className="mt-1 text-sm text-slate-800">
                                        Evidence, checklist, and people signals look consistent for this session.
                                    </div>
                                </div>
                            </Section>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
