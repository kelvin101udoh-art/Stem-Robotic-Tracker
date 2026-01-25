// web/src/app/app/admin/clubs/[clubId]/schedule/history/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useParams } from "next/navigation";
import { useAdminGuard } from "@/lib/admin/admin-guard";

function cx(...v: Array<string | false | null | undefined>) {
    return v.filter(Boolean).join(" ");
}

function startOfDayLocal(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function fmtDay(d: Date) {
    return d.toLocaleDateString(undefined, {
        weekday: "short",
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

type SortMode = "newest" | "oldest";

type HistoryRow = {
    id: string;
    club_id: string;
    title: string | null;
    starts_at: string | null;
    duration_minutes: number | null;
    status: "planned" | "open" | "closed" | null;

    participants?: number | null;
    evidence_items?: number | null;
    activities_total?: number | null;
    activities_completed?: number | null;

    present_count?: number | null;
    late_count?: number | null;
    absent_count?: number | null;

    session_id?: string | null;
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
    if (k === "closed") return "border-slate-200/80 bg-slate-50/70 text-slate-800";
    if (k === "open") return "border-emerald-200/80 bg-emerald-50/70 text-emerald-950";
    return "border-indigo-200/80 bg-indigo-50/70 text-indigo-950";
}

function scoreTone(score: number) {
    if (score >= 0.78) return "border-emerald-200/80 bg-emerald-50/70 text-emerald-950";
    if (score >= 0.48) return "border-indigo-200/80 bg-indigo-50/70 text-indigo-950";
    return "border-rose-200/80 bg-rose-50/70 text-rose-950";
}

/**
 * Deterministic post-session quality score.
 * No “model” wording anywhere.
 */
function computePostSessionQuality(r: HistoryRow) {
    const p = safeNum(r.participants, 0);
    const e = safeNum(r.evidence_items, 0);
    const aT = safeNum(r.activities_total, 0);
    const aC = safeNum(r.activities_completed, 0);

    const attendanceSignal = safeNum(r.present_count, 0) + safeNum(r.late_count, 0);

    const hasPeople = p > 0 || attendanceSignal > 0 ? 1 : 0;
    const hasEvidence = e > 0 ? 1 : 0;
    const hasChecklist = aT > 0 ? 1 : 0;
    const completionRate = aT > 0 ? Math.min(1, aC / aT) : 0;

    const score = Math.max(
        0,
        Math.min(1, 0.20 * hasPeople + 0.35 * hasEvidence + 0.15 * hasChecklist + 0.30 * completionRate)
    );

    const label =
        score >= 0.78 ? "QUALITY STRONG" : score >= 0.48 ? "QUALITY PARTIAL" : "QUALITY WEAK";

    const gaps: string[] = [];
    if (!hasPeople) gaps.push("No attendance/participants signal recorded");
    if (!hasEvidence) gaps.push("No evidence captured (photo/video/note)");
    if (!hasChecklist) gaps.push("No checklist activities attached");
    if (hasChecklist && completionRate < 0.55) gaps.push("Low checklist completion rate");

    return { score, label, gaps, completionRate };
}

function CardShell(props: { title: string; subtitle?: string; right?: ReactNode; children: ReactNode }) {
    return (
        <div className="rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
            <div className="border-b border-slate-200/70 bg-[radial-gradient(1000px_260px_at_10%_0%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(900px_240px_at_90%_0%,rgba(34,211,238,0.08),transparent_55%)] px-5 py-5 sm:px-7">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{props.title}</div>
                        {props.subtitle ? <div className="mt-0.5 text-xs text-slate-600">{props.subtitle}</div> : null}
                    </div>
                    {props.right ? props.right : null}
                </div>
            </div>
            <div className="p-5 sm:p-7">{props.children}</div>
        </div>
    );
}

function Drawer(props: { open: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
    if (!props.open) return null;
    return (
        <div className="fixed inset-0 z-[80]">
            <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={props.onClose} />
            <div className="absolute right-0 top-0 h-full w-full max-w-[760px] border-l border-slate-200/70 bg-white/90 backdrop-blur-xl shadow-[0_24px_80px_-56px_rgba(2,6,23,0.55)]">
                <div className="border-b border-slate-200/70 px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900">{props.title}</div>
                            {props.subtitle ? <div className="mt-0.5 text-xs text-slate-600">{props.subtitle}</div> : null}
                        </div>
                        <button
                            type="button"
                            onClick={props.onClose}
                            className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-white transition"
                        >
                            Close
                        </button>
                    </div>
                </div>
                <div className="p-5 sm:p-6 overflow-auto h-[calc(100%-72px)]">{props.children}</div>
            </div>
        </div>
    );
}

function dateInputToIsoStart(v: string) {
    if (!v) return null;
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
    return dt.toISOString();
}

function dateInputToIsoEnd(v: string) {
    if (!v) return null;
    const [y, m, d] = v.split("-").map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
    return dt.toISOString();
}

async function tryReadSessionAiInsightForSession(
    supabase: any,
    clubId: string,
    sessionStartsAtIso?: string | null
): Promise<AiInsight | null> {
    if (!sessionStartsAtIso) return null;

    try {
        // Period match: period_start <= starts_at <= period_end
        const res = await supabase
            .from("session_ai_insights")
            .select("id, club_id, period_start, period_end, source, summary, recommendations, metrics, created_at")
            .eq("club_id", clubId)
            .lte("period_start", sessionStartsAtIso)
            .gte("period_end", sessionStartsAtIso)
            .order("created_at", { ascending: false })
            .limit(1);

        if (res?.error) return null;
        return (res?.data?.[0] as AiInsight) ?? null;
    } catch {
        return null;
    }
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

function KV(props: { k: string; v: ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-1">
            <div className="text-xs font-semibold text-slate-600">{props.k}</div>
            <div className="text-xs text-slate-900 text-right">{props.v}</div>
        </div>
    );
}

export default function ScheduleHistoryPage() {
    const { clubId } = useParams<{ clubId: string }>();
    const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

    const [q, setQ] = useState("");
    const [sort, setSort] = useState<SortMode>("newest");

    const [fromDate, setFromDate] = useState(() => {
        const d = startOfDayLocal(new Date());
        d.setMonth(d.getMonth() - 3);
        return d.toISOString().slice(0, 10);
    });
    const [toDate, setToDate] = useState(() => startOfDayLocal(new Date()).toISOString().slice(0, 10));

    const fromISO = useMemo(() => dateInputToIsoStart(fromDate), [fromDate]);
    const toISO = useMemo(() => dateInputToIsoEnd(toDate), [toDate]);

    const [rows, setRows] = useState<HistoryRow[]>([]);
    const [booting, setBooting] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const PAGE = 25;
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
    const [aiInsightBusy, setAiInsightBusy] = useState(false);
    const [aiInsightNote, setAiInsightNote] = useState<string | null>(null);

    const selectedSession = useMemo(() => {
        if (!selectedId) return null;
        return rows.find((r) => r.id === selectedId) ?? null;
    }, [rows, selectedId]);

    function resetPaging() {
        setPage(0);
        setHasMore(true);
        setRows([]);
    }

    useEffect(() => {
        if (!clubId) return;
        if (!supabase) return;
        if (checking) return;

        let cancelled = false;

        (async () => {
            setBooting(true);
            setErr(null);

            try {
                const nowIso = new Date().toISOString();

                const vQ = supabase
                    .from("v_session_metrics")
                    .select("*")
                    .eq("club_id", clubId)
                    .eq("status", "closed")
                    .lt("starts_at", nowIso);

                if (fromISO) vQ.gte("starts_at", fromISO);
                if (toISO) vQ.lte("starts_at", toISO);
                if (q.trim()) vQ.ilike("title", `%${q.trim()}%`);

                vQ.order("starts_at", { ascending: sort === "oldest" });
                vQ.range(0, PAGE - 1);

                const res = await vQ;
                if (res.error) throw res.error;

                if (cancelled) return;

                const normalized: HistoryRow[] = (res.data ?? []).map((x: any) => {
                    const sid = (x.id ?? x.session_id) as string;
                    return {
                        id: sid,
                        session_id: x.session_id ?? null,
                        club_id: x.club_id,
                        title: x.title ?? null,
                        starts_at: x.starts_at ?? null,
                        duration_minutes: x.duration_minutes ?? null,
                        status: x.status ?? null,
                        participants: x.participants ?? x.participants_count ?? null,
                        evidence_items: x.evidence_items ?? x.evidence_count ?? null,
                        activities_total: x.activities_total ?? x.activities_count ?? null,
                        activities_completed: x.activities_completed ?? x.activities_done ?? null,
                        present_count: x.present_count ?? x.present ?? null,
                        late_count: x.late_count ?? x.late ?? null,
                        absent_count: x.absent_count ?? x.absent ?? null,
                    };
                });

                setRows(normalized);
                setHasMore(normalized.length >= PAGE);
            } catch (e: any) {
                // fallback to sessions
                try {
                    const nowIso = new Date().toISOString();

                    const sQ = supabase
                        .from("sessions")
                        .select("id, club_id, title, starts_at, duration_minutes, status")
                        .eq("club_id", clubId)
                        .eq("status", "closed")
                        .lt("starts_at", nowIso);

                    if (fromISO) sQ.gte("starts_at", fromISO);
                    if (toISO) sQ.lte("starts_at", toISO);
                    if (q.trim()) sQ.ilike("title", `%${q.trim()}%`);

                    sQ.order("starts_at", { ascending: sort === "oldest" });
                    sQ.range(0, PAGE - 1);

                    const sRes = await sQ;
                    if (sRes.error) throw sRes.error;

                    if (cancelled) return;

                    const normalized: HistoryRow[] = (sRes.data ?? []).map((x: any) => ({
                        id: x.id,
                        club_id: x.club_id,
                        title: x.title ?? null,
                        starts_at: x.starts_at ?? null,
                        duration_minutes: x.duration_minutes ?? null,
                        status: x.status ?? null,
                    }));

                    setRows(normalized);
                    setHasMore(normalized.length >= PAGE);
                    setErr(
                        `Metrics view not available (or blocked). Loaded CLOSED sessions only. Details: ${e?.message ?? "unknown"
                        }`
                    );
                } catch (fallbackErr: any) {
                    setErr(fallbackErr?.message ?? e?.message ?? "Failed to load history.");
                    setHasMore(false);
                }
            } finally {
                if (!cancelled) setBooting(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [clubId, supabase, checking, q, sort, fromISO, toISO]);

    async function loadMore() {
        if (!clubId || !supabase) return;
        if (!hasMore) return;

        setLoadingMore(true);
        setErr(null);

        try {
            const nowIso = new Date().toISOString();
            const nextPage = page + 1;

            const vQ = supabase
                .from("v_session_metrics")
                .select("*")
                .eq("club_id", clubId)
                .eq("status", "closed")
                .lt("starts_at", nowIso);

            if (fromISO) vQ.gte("starts_at", fromISO);
            if (toISO) vQ.lte("starts_at", toISO);
            if (q.trim()) vQ.ilike("title", `%${q.trim()}%`);

            vQ.order("starts_at", { ascending: sort === "oldest" });
            vQ.range(nextPage * PAGE, nextPage * PAGE + PAGE - 1);

            const res = await vQ;
            if (res.error) throw res.error;

            const normalized: HistoryRow[] = (res.data ?? []).map((x: any) => {
                const sid = (x.id ?? x.session_id) as string;
                return {
                    id: sid,
                    session_id: x.session_id ?? null,
                    club_id: x.club_id,
                    title: x.title ?? null,
                    starts_at: x.starts_at ?? null,
                    duration_minutes: x.duration_minutes ?? null,
                    status: x.status ?? null,
                    participants: x.participants ?? x.participants_count ?? null,
                    evidence_items: x.evidence_items ?? x.evidence_count ?? null,
                    activities_total: x.activities_total ?? x.activities_count ?? null,
                    activities_completed: x.activities_completed ?? x.activities_done ?? null,
                    present_count: x.present_count ?? x.present ?? null,
                    late_count: x.late_count ?? x.late ?? null,
                    absent_count: x.absent_count ?? x.absent ?? null,
                };
            });

            setRows((prev) => [...prev, ...normalized]);
            setPage(nextPage);
            setHasMore(normalized.length >= PAGE);
        } catch (e: any) {
            setErr(e?.message ?? "Failed to load more history.");
            setHasMore(false);
        } finally {
            setLoadingMore(false);
        }
    }

    const kpis = useMemo(() => {
        const total = rows.length;
        if (!total) return { totalClosed: 0, evidenceRate: 0, checklistRate: 0, avgQuality: 0 };

        const evidenceYes = rows.filter((r) => safeNum(r.evidence_items, 0) > 0).length;
        const checklistTotal = rows.filter((r) => safeNum(r.activities_total, 0) > 0).length;
        const checklistGood = rows.filter((r) => {
            const aT = safeNum(r.activities_total, 0);
            const aC = safeNum(r.activities_completed, 0);
            return aT > 0 && aC / aT >= 0.6;
        }).length;

        const avgQuality =
            rows.reduce((acc, r) => acc + computePostSessionQuality(r).score, 0) / total;

        return {
            totalClosed: total,
            evidenceRate: Math.round((evidenceYes / total) * 100),
            checklistRate: checklistTotal ? Math.round((checklistGood / checklistTotal) * 100) : 0,
            avgQuality: Math.round(avgQuality * 100),
        };
    }, [rows]);

    async function openReport(sessionId: string) {
        setSelectedId(sessionId);
        setDrawerOpen(true);

        setAiInsight(null);
        setAiInsightNote(null);

        if (!supabase) return;
        const s = rows.find((r) => r.id === sessionId);
        if (!s) return;

        setAiInsightBusy(true);
        try {
            const insight = await tryReadSessionAiInsightForSession(supabase, clubId, s.starts_at);
            if (!insight) {
                setAiInsight(null);
                setAiInsightNote("No AI insight available for this time window (or locked by RLS).");
            } else {
                setAiInsight(insight);
                setAiInsightNote(null);
            }
        } finally {
            setAiInsightBusy(false);
        }
    }

    const headerRight = (
        <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                CLOSED ONLY
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                Loaded: {rows.length}
            </span>
            <Link
                href={`/app/admin/clubs/${clubId}/schedule`}
                className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
            >
                Back
            </Link>
        </div>
    );

    return (
        <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
            <CardShell
                title="Schedule History Console"
                subtitle="Closed sessions only • Filter, review, and generate structured post-session reports."
                right={headerRight}
            >
                {/* Filters */}
                <div className="grid gap-3 lg:grid-cols-12">
                    <div className="lg:col-span-6">
                        <div className="text-xs font-semibold text-slate-700">Search title</div>
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="e.g., sensors build, demo day, teamwork challenge"
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                    </div>

                    <div className="lg:col-span-2">
                        <div className="text-xs font-semibold text-slate-700">Sort</div>
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as SortMode)}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                        </select>
                    </div>

                    <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                        <div>
                            <div className="text-xs font-semibold text-slate-700">From</div>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-slate-700">To</div>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="text-xs text-slate-600">
                            History excludes planned/open sessions by design.
                        </div>

                        <button
                            type="button"
                            onClick={resetPaging}
                            className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
                        >
                            Reset paging
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <MetricTile label="CLOSED" value={kpis.totalClosed} hint="Loaded in current filter window" />
                    <MetricTile label="EVIDENCE RATE" value={`${kpis.evidenceRate}%`} hint="Sessions with ≥ 1 evidence item" />
                    <MetricTile label="CHECKLIST RATE" value={`${kpis.checklistRate}%`} hint="Completion ≥ 60% (where checklist exists)" />
                    <MetricTile label="AVG QUALITY" value={`${kpis.avgQuality}%`} hint="Deterministic post-session score" />
                </div>

                {/* Errors */}
                {err ? (
                    <div className="mt-4 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-sm text-rose-950">
                        {err}
                    </div>
                ) : null}

                {/* List */}
                <div className="mt-5">
                    {booting ? (
                        <div className="h-[360px] rounded-2xl border border-slate-200/70 bg-white/60 animate-pulse" />
                    ) : !rows.length ? (
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5">
                            <div className="text-xs font-semibold tracking-widest text-slate-500">EMPTY</div>
                            <div className="mt-2 text-sm font-semibold text-slate-900">No closed sessions found</div>
                            <div className="mt-1 text-sm text-slate-700">Try widening the date range or clearing search.</div>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200/70 rounded-2xl border border-slate-200/80 bg-white/60 overflow-hidden">
                            {rows.map((s) => {
                                const { score, label, gaps, completionRate } = computePostSessionQuality(s);
                                const tone = scoreTone(score);

                                const p = safeNum(s.participants, 0);
                                const evi = safeNum(s.evidence_items, 0);
                                const aT = safeNum(s.activities_total, 0);
                                const aC = safeNum(s.activities_completed, 0);
                                const completion = aT > 0 ? Math.round((aC / aT) * 100) : 0;

                                return (
                                    <div key={s.id} className="px-4 py-4 sm:px-5">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusChip("closed"))}>
                                                        CLOSED
                                                    </span>

                                                    <span
                                                        className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", tone)}
                                                        title={gaps.length ? gaps.join(" • ") : "No gaps"}
                                                    >
                                                        {label} • {Math.round(score * 100)}%
                                                    </span>

                                                    <div className="truncate text-sm font-semibold text-slate-900">
                                                        {s.title || "Untitled session"}
                                                    </div>
                                                </div>

                                                <div className="mt-1 text-xs text-slate-600">
                                                    {fmtDateTime(s.starts_at)} • {s.duration_minutes ?? 60}m
                                                </div>

                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                                    <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                                                        Participants: <span className="text-slate-900">{p}</span>
                                                    </span>
                                                    <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                                                        Evidence: <span className="text-slate-900">{evi}</span>
                                                    </span>
                                                    <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                                                        Checklist: <span className="text-slate-900">{aT ? `${completion}%` : "—"}</span>
                                                    </span>
                                                    {aT ? (
                                                        <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                                                            Completion: <span className="text-slate-900">{Math.round(completionRate * 100)}%</span>
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                {/* ✅ FIXED: safe route to avoid 404 */}
                                                <Link
                                                    href={`/app/admin/clubs/${clubId}/sessions/${encodeURIComponent(s.id)}`}
                                                    className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
                                                >
                                                    View
                                                </Link>


                                                <button
                                                    type="button"
                                                    onClick={() => openReport(s.id)}
                                                    className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-3 py-2 text-xs font-semibold text-indigo-950 hover:bg-indigo-50 transition"
                                                >
                                                    Open report
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {rows.length ? (
                        <div className="flex items-center justify-center pt-3">
                            {hasMore ? (
                                <button
                                    type="button"
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className={cx(
                                        "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                                        loadingMore
                                            ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                                            : "border-slate-200 bg-white/70 text-slate-900 hover:bg-white"
                                    )}
                                >
                                    {loadingMore ? "Loading…" : "Load more"}
                                </button>
                            ) : (
                                <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                                    End of history
                                </span>
                            )}
                        </div>
                    ) : null}
                </div>
            </CardShell>

            {/* ✅ Redesigned Report Drawer: structured report layout (not “model”) */}
            <Drawer
                open={drawerOpen}
                title="Session Report"
                subtitle={
                    selectedSession
                        ? `${selectedSession.title || "Untitled session"} • ${fmtDateTime(selectedSession.starts_at)}`
                        : "—"
                }
                onClose={() => setDrawerOpen(false)}
            >
                {!selectedSession ? (
                    <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 text-sm text-slate-700">
                        No session selected.
                    </div>
                ) : (
                    (() => {
                        const s = selectedSession;
                        const { score, label, gaps, completionRate } = computePostSessionQuality(s);
                        const tone = scoreTone(score);

                        const participants = safeNum(s.participants, 0);
                        const evidence = safeNum(s.evidence_items, 0);
                        const aT = safeNum(s.activities_total, 0);
                        const aC = safeNum(s.activities_completed, 0);

                        const present = safeNum(s.present_count, 0);
                        const late = safeNum(s.late_count, 0);
                        const absent = safeNum(s.absent_count, 0);

                        const checklistPct = aT > 0 ? Math.round((aC / aT) * 100) : null;

                        return (
                            <div className="space-y-4">
                                <Section
                                    title="REPORT HEADER"
                                    right={
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusChip("closed"))}>
                                                CLOSED
                                            </span>
                                            <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", tone)}>
                                                {label} • {Math.round(score * 100)}%
                                            </span>
                                        </div>
                                    }
                                >
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3">
                                            <div className="text-[11px] font-semibold text-slate-700">Session</div>
                                            <div className="mt-1 text-sm font-semibold text-slate-900">{s.title || "Untitled session"}</div>
                                            <div className="mt-1 text-xs text-slate-600">{fmtDateTime(s.starts_at)}</div>
                                        </div>
                                        <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3">
                                            <div className="text-[11px] font-semibold text-slate-700">Duration</div>
                                            <div className="mt-1 text-sm font-semibold text-slate-900">{s.duration_minutes ?? 60} minutes</div>
                                            <div className="mt-1 text-xs text-slate-600">Auto-managed lifecycle (planned → open → closed)</div>
                                        </div>
                                    </div>
                                </Section>

                                <Section title="OPERATIONAL SIGNALS">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3">
                                            <div className="text-[11px] font-semibold text-slate-700">People & Attendance</div>
                                            <div className="mt-2 space-y-1">
                                                <KV k="Participants" v={<span className="font-semibold">{participants}</span>} />
                                                <KV k="Present" v={<span className="font-semibold">{present}</span>} />
                                                <KV k="Late" v={<span className="font-semibold">{late}</span>} />
                                                <KV k="Absent" v={<span className="font-semibold">{absent}</span>} />
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3">
                                            <div className="text-[11px] font-semibold text-slate-700">Evidence & Checklist</div>
                                            <div className="mt-2 space-y-1">
                                                <KV k="Evidence items" v={<span className="font-semibold">{evidence}</span>} />
                                                <KV k="Checklist items" v={<span className="font-semibold">{aT}</span>} />
                                                <KV
                                                    k="Checklist completed"
                                                    v={
                                                        checklistPct === null ? (
                                                            "—"
                                                        ) : (
                                                            <span className="font-semibold">{checklistPct}%</span>
                                                        )
                                                    }
                                                />
                                                <KV
                                                    k="Completion rate"
                                                    v={aT ? <span className="font-semibold">{Math.round(completionRate * 100)}%</span> : "—"}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Section>

                                <Section title="QUALITY GAPS">
                                    <div
                                        className={cx(
                                            "rounded-xl border p-3",
                                            gaps.length ? "border-amber-200/80 bg-amber-50/70" : "border-emerald-200/80 bg-emerald-50/70"
                                        )}
                                    >
                                        <div className="text-sm font-semibold text-slate-900">
                                            {gaps.length ? "Improvements recommended" : "No gaps detected in stored signals"}
                                        </div>
                                        {gaps.length ? (
                                            <ul className="mt-2 list-disc pl-5 text-sm text-slate-800">
                                                {gaps.map((g) => (
                                                    <li key={g}>{g}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <div className="mt-1 text-sm text-slate-700">
                                                Evidence + checklist + participants signals look healthy for this session.
                                            </div>
                                        )}
                                    </div>
                                </Section>

                                <Section
                                    title="AI INSIGHT (SESSION_AI_INSIGHTS)"
                                    right={
                                        aiInsightBusy ? (
                                            <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                Loading…
                                            </span>
                                        ) : aiInsight ? (
                                            <span className="rounded-full border border-indigo-200/80 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-950">
                                                {String(aiInsight.source || "AI").toUpperCase()}
                                            </span>
                                        ) : (
                                            <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                Not available
                                            </span>
                                        )
                                    }
                                >
                                    <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3">
                                        <div className="text-[11px] font-semibold text-slate-700">Insight Summary</div>

                                        {/* ✅ no “model”, no “replay”, no raw dump vibe */}
                                        <div className="mt-2 text-sm text-slate-800 leading-relaxed">
                                            {aiInsightBusy
                                                ? "Fetching insight for the session time window…"
                                                : aiInsight?.summary
                                                    ? aiInsight.summary
                                                    : aiInsightNote ?? "No insight found for this session’s time window."}
                                        </div>

                                        {aiInsight?.created_at ? (
                                            <div className="mt-3 grid gap-2 sm:grid-cols-2 text-xs text-slate-600">
                                                <div className="rounded-lg border border-slate-200/70 bg-white/80 p-2">
                                                    <div className="font-semibold text-slate-700">Generated</div>
                                                    <div className="mt-0.5 text-slate-900">{fmtDateTime(aiInsight.created_at)}</div>
                                                </div>
                                                <div className="rounded-lg border border-slate-200/70 bg-white/80 p-2">
                                                    <div className="font-semibold text-slate-700">Window</div>
                                                    <div className="mt-0.5 font-mono text-[11px] text-slate-900">
                                                        {aiInsight.period_start} → {aiInsight.period_end}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : null}

                                        <div className="mt-3 text-xs text-slate-600">
                                            If this always shows “Not available”, add a SELECT policy on{" "}
                                            <span className="font-mono text-slate-900">session_ai_insights</span> for club owner/member.
                                        </div>
                                    </div>
                                </Section>
                            </div>
                        );
                    })()
                )}
            </Drawer>
        </div>
    );
}
