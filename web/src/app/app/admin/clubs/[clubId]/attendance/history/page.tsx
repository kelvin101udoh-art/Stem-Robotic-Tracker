// web/src/app/app/admin/clubs/[clubId]/attendance/history/page.tsx


"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminGuard } from "@/lib/admin/admin-guard";

type SessionRow = {
    id: string;
    club_id: string;
    title: string | null;
    starts_at: string | null;
};

type StudentRow = {
    id: string;
    club_id: string;
    full_name: string;
};

type AttendanceStatus = "present" | "absent";

type AttendanceRow = {
    club_id: string;
    session_id: string;
    student_id: string;
    status: AttendanceStatus;
    note?: string | null;
    late_reason?: string | null;
    absent_reason?: string | null;
    saved_at?: string | null;
    saved_by?: string | null;
    finalised_at?: string | null;
    finalised_by?: string | null;
    updated_at?: string | null;
};

function cx(...v: Array<string | false | null | undefined>) {
    return v.filter(Boolean).join(" ");
}

function formatDateTime(iso?: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatTime(iso?: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function sameLocalDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfLocalDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

function pct(n: number, d: number) {
    if (!d) return 0;
    return Math.round((n / d) * 100);
}

function statusBadge(status: AttendanceStatus) {
    if (status === "present") return "border-emerald-200 bg-emerald-50 text-emerald-900";
    return "border-rose-200 bg-rose-50 text-rose-900";
}

function StatusChip({ status }: { status: AttendanceStatus }) {
    const label = status === "present" ? "Present" : "Absent";
    return (
        <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusBadge(status))}>
            {label}
        </span>
    );
}



function KPI({
    label,
    value,
    hint,
    tone = "neutral",
    bar = 0,
    badge,
}: {
    label: string;
    value: string | number;
    hint?: string;
    tone?: "good" | "warn" | "neutral";
    bar?: number; // 0..100 (visual only)
    badge?: string;
}) {
    const toneChip =
        tone === "good"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : tone === "warn"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-slate-200 bg-slate-50 text-slate-700";

    return (
        <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_14px_45px_-38px_rgba(2,6,23,0.55)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-indigo-200/25 blur-3xl opacity-0 transition group-hover:opacity-100" />

            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                        {label.toUpperCase()}
                    </div>

                    <div className="mt-1 flex items-baseline gap-2">
                        <div className="text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
                        {badge ? (
                            <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", toneChip)}>
                                {badge}
                            </span>
                        ) : null}
                    </div>

                    {hint ? <div className="mt-1 text-xs text-slate-600">{hint}</div> : null}

                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full rounded-full bg-slate-900/70"
                            style={{ width: `${Math.max(0, Math.min(100, bar))}%` }}
                        />
                    </div>
                </div>

                <span className={cx("shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold", toneChip)}>
                    {tone === "good" ? "Healthy" : tone === "warn" ? "Needs attention" : "In view"}
                </span>
            </div>
        </div>
    );
}

function aiEvidenceText(r: AttendanceRow) {
    // If you already store AI evidence somewhere later, map it here.
    // For now, we’ll re-use `note` as "AI evidence summary" (read-only UI).
    return (r.note ?? "").trim();
}



function exportCSVFile(filename: string, headers: string[], rows: Array<Record<string, any>>) {
    const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export default function AttendanceHistoryPage() {
    const router = useRouter();
    const params = useParams<{ clubId: string }>();
    const clubId = params.clubId;

    const { checking, supabase } = useAdminGuard({ idleMinutes: 15 });

    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [students, setStudents] = useState<StudentRow[]>([]);

    const [selectedSessionId, setSelectedSessionId] = useState<string>("");
    const [rows, setRows] = useState<AttendanceRow[]>([]);

    const [q, setQ] = useState("");
    const [filter, setFilter] = useState<"all" | "present" | "absent" | "needsAiEvidence">("all");


    const [msg, setMsg] = useState("");

    const timeWindow = useMemo(() => {
        const now = new Date();
        if (range === "all") return { from: null as string | null, to: null as string | null, label: "All time" };

        const days = range === "7d" ? 6 : range === "30d" ? 29 : 89;
        const from = startOfLocalDay(daysAgo(days));
        const to = endOfLocalDay(now);
        return { from: from.toISOString(), to: to.toISOString(), label: range === "7d" ? "Last 7 days" : range === "30d" ? "Last 30 days" : "Last 90 days" };
    }, [range]);

    // Load sessions + students (for drill-down name mapping)
    useEffect(() => {
        if (checking) return;
        let cancelled = false;

        async function load() {
            setLoading(true);
            setMsg("");

            try {
                const sQuery = supabase
                    .from("sessions")
                    .select("id, club_id, title, starts_at")
                    .eq("club_id", clubId)
                    .order("starts_at", { ascending: false })
                    .limit(200);

                const sRes =
                    timeWindow.from && timeWindow.to
                        ? await sQuery.gte("starts_at", timeWindow.from).lte("starts_at", timeWindow.to)
                        : await sQuery;

                if (sRes.error) throw sRes.error;

                const stRes = await supabase
                    .from("students")
                    .select("id, club_id, full_name")
                    .eq("club_id", clubId)
                    .order("full_name", { ascending: true });

                if (stRes.error) throw stRes.error;

                if (cancelled) return;

                const ss = (sRes.data ?? []) as SessionRow[];
                setSessions(ss);
                setStudents((stRes.data ?? []) as StudentRow[]);

                // default: pick the most recent session (or today if exists)
                const now = new Date();
                const today = ss.find((s) => s.starts_at && sameLocalDay(new Date(s.starts_at), now));
                setSelectedSessionId((prev) => prev || (today?.id ?? ss[0]?.id ?? ""));
            } catch {
                router.replace(`/app/admin/clubs/${clubId}/attendance`);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [checking, clubId, router, supabase, timeWindow.from, timeWindow.to]);

    // Load attendance for selected session (drill-down)
    useEffect(() => {
        if (!selectedSessionId) {
            setRows([]);
            return;
        }

        let cancelled = false;

        async function loadSessionRows() {
            setMsg("");
            try {
                const aRes = await supabase
                    .from("attendance")
                    .select("club_id, session_id, student_id, status, note, late_reason, absent_reason, saved_at, saved_by, finalised_at, finalised_by, updated_at")
                    .eq("club_id", clubId)
                    .eq("session_id", selectedSessionId);

                if (aRes.error) throw aRes.error;
                if (cancelled) return;

                setRows((aRes.data ?? []) as AttendanceRow[]);
            } catch {
                setRows([]);
                setMsg("Could not load attendance for selected session (check RLS/columns).");
            }
        }

        loadSessionRows();
        return () => {
            cancelled = true;
        };
    }, [clubId, selectedSessionId, supabase]);

    const selectedSession = useMemo(
        () => sessions.find((s) => s.id === selectedSessionId) ?? null,
        [sessions, selectedSessionId]
    );

    const studentNameById = useMemo(() => {
        const m = new Map<string, string>();
        students.forEach((s) => m.set(s.id, s.full_name));
        return m;
    }, [students]);

    const stats = useMemo(() => {
        const total = rows.length;
        const present = rows.filter((r) => r.status === "present").length;

        const absent = rows.filter((r) => r.status === "absent").length;

        const missingEvidence = rows.filter((r) => (r.status === "present" || r.status === "absent") && (r.note ?? "").trim().length < 6).length;

        const coverage = pct(present + absent, total);
        const punctuality = pct(present, present + absent);

        const anySaved = rows.find((r) => r.saved_at) ?? null;
        const anyFinal = rows.find((r) => r.finalised_at) ?? null;

        return {
            total,
            present,
            absent,
            missingEvidence,
            coverage,
            punctuality,
            saved_at: anySaved?.saved_at ?? null,
            saved_by: anySaved?.saved_by ?? null,
            finalised_at: anyFinal?.finalised_at ?? null,
            finalised_by: anyFinal?.finalised_by ?? null,
        };
    }, [rows]);

    const filteredRows = useMemo(() => {
        const query = q.trim().toLowerCase();

        return rows
            .map((r) => {
                const name = studentNameById.get(r.student_id) ?? r.student_id;
                return { ...r, _name: name };
            })
            .filter((r: any) => {
                const matchesQ =
                    !query ||
                    r._name.toLowerCase().includes(query) ||
                    String(r.student_id).toLowerCase().includes(query) ||
                    String(r.absent_reason ?? "").toLowerCase().includes(query);

                const aiText = aiEvidenceText(r);
                const hasAiEvidence = aiText.length >= 6;

                const matchesFilter =
                    filter === "all"
                        ? true
                        : filter === "needsAiEvidence"
                            ? r.status === "present" && !hasAiEvidence
                            : r.status === filter;


                return matchesQ && matchesFilter;
            });
    }, [rows, q, filter, studentNameById]);

    function exportSelectedSessionCSV() {
        if (!selectedSession) return;

        const headers = [
            "session_id",
            "session_title",
            "session_starts_at",
            "student_id",
            "student_name",
            "status",
            "note",
            "late_reason",
            "absent_reason",
            "saved_at",
            "saved_by",
            "finalised_at",
            "finalised_by",
        ];

        const data = rows.map((r) => ({
            session_id: selectedSession.id,
            session_title: selectedSession.title ?? "",
            session_starts_at: selectedSession.starts_at ?? "",
            student_id: r.student_id,
            student_name: studentNameById.get(r.student_id) ?? "",
            status: r.status,
            note: r.note ?? "",
            late_reason: r.late_reason ?? "",
            absent_reason: r.absent_reason ?? "",
            saved_at: r.saved_at ?? "",
            saved_by: r.saved_by ?? "",
            finalised_at: r.finalised_at ?? "",
            finalised_by: r.finalised_by ?? "",
        }));

        exportCSVFile(`attendance_session_${clubId}_${selectedSession.id}.csv`, headers, data);
        setMsg("Export started");
        setTimeout(() => setMsg(""), 1200);
    }

    if (checking || loading) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-100">
                <div className="mx-auto max-w-[1400px] px-4 py-10">
                    <div className="h-10 w-72 rounded-2xl bg-slate-200 animate-pulse" />
                    <div className="mt-6 h-[640px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
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

            {/* Sticky header */}
            <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 relative">
                    <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">Attendance History</div>
                        <div className="text-xs text-slate-600">Select any session and drill into register details + export.</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={`/app/admin/clubs/${clubId}/attendance`}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
                        >
                            Back to Dashboard
                        </Link>

                        <Link
                            href={`/app/admin/clubs/${clubId}/attendance/register`}
                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            Open Today’s Register
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Register Archive</h1>
                    <p className="max-w-3xl text-sm text-slate-600">
                        Explore previous sessions. Filter by time, select a session, then drill down by learner or status.
                    </p>
                </div>

                {/* Range selector */}
                <div className="mt-6 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm font-semibold text-slate-900">Range: {timeWindow.label}</div>
                        <div className="flex flex-wrap items-center gap-2">
                            {(["7d", "30d", "90d", "all"] as const).map((k) => (
                                <button
                                    key={k}
                                    type="button"
                                    onClick={() => setRange(k)}
                                    className={cx(
                                        "rounded-xl border px-3 py-2 text-sm font-semibold",
                                        range === k
                                            ? "border-indigo-600 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm"
                                            : "border-slate-200 bg-white text-slate-900 hover:bg-indigo-50/60"
                                    )}
                                >
                                    {k === "7d" ? "Last 7 days" : k === "30d" ? "Last 30 days" : k === "90d" ? "Last 90 days" : "All time"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {msg ? (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{msg}</div>
                    ) : null}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-12">
                    {/* Session picker */}
                    <div className="lg:col-span-4">
                        <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
                            <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                                <div className="text-sm font-semibold text-slate-900">Sessions</div>
                                <div className="mt-0.5 text-xs text-slate-600">{sessions.length} in range</div>
                            </div>

                            <div className="max-h-[70vh] overflow-auto divide-y divide-slate-200">
                                {sessions.length ? (
                                    sessions.map((s) => {
                                        const selected = s.id === selectedSessionId;
                                        const isToday = s.starts_at ? sameLocalDay(new Date(s.starts_at), new Date()) : false;

                                        return (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => setSelectedSessionId(s.id)}
                                                className={cx(
                                                    "w-full px-5 py-4 text-left hover:bg-indigo-50/40 sm:px-6",
                                                    selected && "bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="truncate text-sm font-semibold text-slate-900">{s.title || "Untitled session"}</div>
                                                        <div className="mt-0.5 text-xs text-slate-600">{formatDateTime(s.starts_at)}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isToday ? (
                                                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                                Today
                                                            </span>
                                                        ) : null}
                                                        {selected ? (
                                                            <span className="rounded-full border border-slate-900 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                                                                Selected
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">›</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                ) : (
                                    <div className="px-6 py-10 text-center">
                                        <div className="text-sm font-semibold text-slate-900">No sessions found</div>
                                        <div className="mt-1 text-sm text-slate-600">Try a wider date range.</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Drill-down panel */}
                    <div className="lg:col-span-8">
                        <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
                            <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="text-xs font-semibold tracking-widest text-slate-500">SELECTED SESSION</div>
                                        <div className="mt-1 text-lg font-semibold text-slate-900">
                                            {selectedSession?.title || (sessions.length ? "Untitled session" : "No sessions")}
                                        </div>
                                        <div className="mt-1 text-sm text-slate-600">
                                            {selectedSession?.starts_at ? formatDateTime(selectedSession.starts_at) : "—"}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={exportSelectedSessionCSV}
                                            disabled={!selectedSession || !rows.length}
                                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60 disabled:opacity-60"
                                        >
                                            Export CSV (session)
                                        </button>
                                        <Link
                                            href={`/app/admin/clubs/${clubId}/attendance`}
                                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                                        >
                                            View Today Register
                                        </Link>
                                    </div>
                                </div>

                                {/* Session integrity chips (AI register automation) */}
                                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                        Captured:{" "}
                                        <span className="ml-2 text-slate-900">
                                            {stats.saved_at ? formatTime(stats.saved_at) : "—"}
                                        </span>
                                    </span>

                                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                                        Verified:{" "}
                                        <span className="ml-2 text-slate-900">
                                            {stats.finalised_at ? formatTime(stats.finalised_at) : "—"}
                                        </span>
                                    </span>

                                    {stats.finalised_at ? (
                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-900">
                                            Integrity: Verified
                                        </span>
                                    ) : (
                                        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">
                                            Integrity: Pending review
                                        </span>
                                    )}

                                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-700">
                                        AI Register: Enabled
                                    </span>
                                </div>

                            </div>

                            {/* ✅ Session KPIs (owner-friendly) */}
                            <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <div className="text-sm font-semibold text-slate-900">Session Snapshot</div>
                                        <div className="text-xs text-slate-600">
                                            Clear indicators for attendance quality & completeness
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700">
                                            Saved at: <span className="ml-1 text-slate-900">{stats.saved_at ? formatTime(stats.saved_at) : "—"}</span>
                                        </span>

                                        {stats.finalised_at ? (
                                            <span className="rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-white">
                                                Register Saved & Locked
                                            </span>
                                        ) : (
                                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-900">
                                                Register Unsaved & Unlocked
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <KPI
                                        label="Coverage"
                                        value={`${stats.coverage}%`}
                                        hint="Who attended (Present and absent)"
                                        bar={stats.coverage}
                                        tone={stats.coverage >= 90 ? "good" : stats.coverage >= 75 ? "neutral" : "warn"}
                                        badge={stats.coverage >= 90 ? "Strong" : stats.coverage >= 75 ? "OK" : "Low"}
                                    />

                                    <KPI
                                        label="On-time rate"
                                        value={`${stats.punctuality}%`}
                                        hint="Arrived on time (Present out of attended)"
                                        bar={stats.punctuality}
                                        tone={stats.punctuality >= 85 ? "good" : stats.punctuality >= 65 ? "neutral" : "warn"}
                                        badge={stats.punctuality >= 85 ? "On time" : stats.punctuality >= 65 ? "Mixed" : "High-Risk Absences"}
                                    />

                                    <KPI
                                        label="Evidence quality"
                                        value={`${Math.max(0, stats.total - stats.missingEvidence)}/${stats.total}`}
                                        hint="Marks with a usable note"
                                        bar={stats.total ? Math.round(((stats.total - stats.missingEvidence) / stats.total) * 100) : 0}
                                        tone={stats.missingEvidence === 0 ? "good" : stats.missingEvidence <= 2 ? "neutral" : "warn"}
                                        badge={stats.missingEvidence === 0 ? "Complete" : "Improve"}
                                    />

                                    <KPI
                                        label="Register size"
                                        value={stats.total}
                                        hint="Total learners recorded"
                                        bar={stats.total ? 100 : 0}
                                        tone={stats.total > 0 ? "neutral" : "warn"}
                                        badge={stats.total > 0 ? "Captured" : "Empty"}
                                    />
                                </div>
                            </div>


                            {/* Search + filters */}
                            <div className="px-5 py-4 sm:px-6">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                                        <div className="w-full sm:w-[360px]">
                                            <input
                                                value={q}
                                                onChange={(e) => setQ(e.target.value)}
                                                placeholder="Search learner or absence reason…"

                                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                            />
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                            {(["all", "present", "absent", "needsAiEvidence"] as const).map((k) => (
                                                <button
                                                    key={k}
                                                    type="button"
                                                    onClick={() => setFilter(k)}
                                                    className={cx(
                                                        "rounded-xl border px-3 py-2 text-sm font-semibold",
                                                        filter === k
                                                            ? "border-indigo-600 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm"
                                                            : "border-slate-200 bg-white text-slate-900 hover:bg-indigo-50/60"
                                                    )}
                                                >
                                                    {k === "all" ? "All" : k === "needsAiEvidence" ? "Needs AI evidence" : k[0].toUpperCase() + k.slice(1)}
                                                </button>
                                            ))}

                                        </div>
                                    </div>

                                    <div className="text-xs font-semibold text-slate-600">
                                        Showing <span className="text-slate-900">{filteredRows.length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Drill-down table */}
                            <div className="border-t border-slate-200">
                                <div className="hidden lg:grid grid-cols-12 gap-3 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 px-6 py-3 text-[11px] font-semibold tracking-widest text-slate-500">
                                    <div className="col-span-5">LEARNER</div>
                                    <div className="col-span-2">STATUS</div>
                                    <div className="col-span-3">ABSENCE REASON</div>
                                    <div className="col-span-2">AI EVIDENCE</div>
                                </div>


                                <div className="divide-y divide-slate-200">
                                    {filteredRows.map((r: any) => {
                                        const reason = r.status === "absent" ? (r.absent_reason ?? "") : "";
                                        const aiText = aiEvidenceText(r);
                                        const hasAiEvidence = aiText.length >= 6;
                                        const needsAiEvidence = r.status === "present" && !hasAiEvidence;


                                        return (
                                            <div key={`${r.session_id}_${r.student_id}`} className="px-5 py-4 sm:px-6 hover:bg-indigo-50/40">
                                                <div className="grid gap-3 lg:grid-cols-12 lg:items-center">
                                                    <div className="lg:col-span-5 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <div className="truncate text-sm font-semibold text-slate-900">{r._name}</div>

                                                            {needsAiEvidence ? (
                                                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900">
                                                                    Awaiting AI evidence
                                                                </span>
                                                            ) : null}
                                                        </div>

                                                        <div className="mt-0.5 text-xs text-slate-500">ID: {String(r.student_id).slice(0, 8)}…</div>
                                                    </div>

                                                    <div className="lg:col-span-2">
                                                        <StatusChip status={r.status} />
                                                    </div>

                                                    <div className="lg:col-span-3">
                                                        {reason ? (
                                                            <div className="text-sm font-semibold text-slate-900">{reason}</div>
                                                        ) : (
                                                            <div className="text-xs text-slate-500">—</div>
                                                        )}
                                                    </div>

                                                    <div className="lg:col-span-2">
                                                        {r.status === "present" ? (
                                                            hasAiEvidence ? (
                                                                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-900">
                                                                    Ready
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                                                    Pending
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="text-xs text-slate-500">—</span>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
                                        );
                                    })}

                                    {!filteredRows.length ? (
                                        <div className="px-6 py-10 text-center">
                                            <div className="text-sm font-semibold text-slate-900">No results</div>
                                            <div className="mt-1 text-sm text-slate-600">
                                                Try clearing search, switching to “All”, or picking another session.
                                            </div>

                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        {/* Mini help block */}

                    </div>
                </div>
            </div>
        </main>
    );
}
