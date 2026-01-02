// web/src/app/app/admin/clubs/[clubId]/attendance/page.tsx


"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAdminGuard } from "@/lib/admin/admin-guard";

// ---- Types (adjust to your DB schema if names differ) ----
type SessionRow = {
    id: string;
    club_id: string;
    title: string | null;
    starts_at: string | null; // ISO string
};

type StudentRow = {
    id: string;
    club_id: string;
    full_name: string;
    created_at?: string;
};

// A register row for a student in a session
type AttendanceRow = {
    id: string;
    club_id: string;
    session_id: string;
    student_id: string;
    status: "present" | "absent" | "late";
    note: string | null;
    updated_at?: string;
};

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

function statusPill(status: AttendanceRow["status"]) {
    return status === "present"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : status === "late"
            ? "border-amber-200 bg-amber-50 text-amber-900"
            : "border-rose-200 bg-rose-50 text-rose-900";
}

function cx(...v: Array<string | false | null | undefined>) {
    return v.filter(Boolean).join(" ");
}

function StatusChip({ status }: { status: AttendanceRow["status"] }) {
    const cls =
        status === "present"
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : status === "late"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-rose-200 bg-rose-50 text-rose-900";

    const label = status === "present" ? "Present" : status === "late" ? "Late" : "Absent";

    return (
        <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", cls)}>
            {label}
        </span>
    );
}

function MetricKPI({
    label,
    value,
    hint,
}: {
    label: string;
    value: string | number;
    hint?: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold tracking-widest text-slate-500">{label.toUpperCase()}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
            {hint ? <div className="mt-1 text-xs text-slate-600">{hint}</div> : null}
        </div>
    );
}


export default function AttendancePage() {
    const router = useRouter();
    const params = useParams<{ clubId: string }>();
    const clubId = params.clubId;

    const { checking, supabase } = useAdminGuard({ idleMinutes: 15 });

    const [loading, setLoading] = useState(true);

    const [sessions, setSessions] = useState<SessionRow[]>([]);
    const [students, setStudents] = useState<StudentRow[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>("");

    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<"all" | "present" | "late" | "absent">("all");
    const [dirty, setDirty] = useState(false);

    // Local editable register state (studentId -> {status,note})
    const [draft, setDraft] = useState<
        Record<string, { status: AttendanceRow["status"]; note: string }>
    >({});

    const filteredStudents = useMemo(() => {
        const q = query.trim().toLowerCase();
        return students.filter((s) => {
            const row = draft[s.id] ?? { status: "absent" as const, note: "" };
            const matchQ = !q || s.full_name.toLowerCase().includes(q) || (row.note ?? "").toLowerCase().includes(q);
            const matchF = filter === "all" ? true : row.status === filter;
            return matchQ && matchF;
        });
    }, [students, draft, query, filter]);

    function setStatus(studentId: string, status: AttendanceRow["status"]) {
        setDraft((prev) => {
            const row = prev[studentId] ?? { status: "absent" as const, note: "" };
            return { ...prev, [studentId]: { ...row, status } };
        });
        setDirty(true);
    }

    function setNote(studentId: string, note: string) {
        setDraft((prev) => {
            const row = prev[studentId] ?? { status: "absent" as const, note: "" };
            return { ...prev, [studentId]: { ...row, note } };
        });
        setDirty(true);
    }

    function bulkSet(status: AttendanceRow["status"]) {
        setDraft((prev) => {
            const next = { ...prev };
            filteredStudents.forEach((st) => {
                const row = next[st.id] ?? { status: "absent" as const, note: "" };
                next[st.id] = { ...row, status };
            });
            return next;
        });
        setDirty(true);
    }




    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string>("");

    // Load sessions + students
    useEffect(() => {
        if (checking) return;
        let cancelled = false;

        async function load() {
            setLoading(true);
            setSaveMsg("");

            try {
                // Sessions (latest first). Adjust table/columns if needed.
                const { data: sData, error: sErr } = await supabase
                    .from("sessions")
                    .select("id, club_id, title, starts_at")
                    .eq("club_id", clubId)
                    .order("starts_at", { ascending: false })
                    .limit(30);

                if (sErr) throw sErr;

                // Students
                const { data: stData, error: stErr } = await supabase
                    .from("students")
                    .select("id, club_id, full_name, created_at")
                    .eq("club_id", clubId)
                    .order("full_name", { ascending: true });

                if (stErr) throw stErr;

                if (cancelled) return;

                setSessions((sData ?? []) as SessionRow[]);
                setStudents((stData ?? []) as StudentRow[]);

                // Default session selection to newest
                const firstSessionId = (sData?.[0]?.id as string) || "";
                setSelectedSessionId((prev) => prev || firstSessionId);
            } catch (e) {
                router.replace(`/app/admin/clubs/${clubId}`);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [checking, clubId, router, supabase]);

    // Load register rows for selected session and hydrate draft
    useEffect(() => {
        if (!selectedSessionId) return;
        let cancelled = false;

        async function loadRegister() {
            setSaveMsg("");
            try {
                const { data, error } = await supabase
                    .from("attendance")
                    .select("id, club_id, session_id, student_id, status, note, updated_at")
                    .eq("club_id", clubId)
                    .eq("session_id", selectedSessionId);

                if (error) throw error;

                if (cancelled) return;

                const map: Record<string, { status: AttendanceRow["status"]; note: string }> = {};
                (data ?? []).forEach((r: any) => {
                    map[r.student_id] = {
                        status: r.status ?? "absent",
                        note: r.note ?? "",
                    };
                });

                // Ensure every student has a default row in the draft
                const merged: typeof map = { ...map };
                students.forEach((st) => {
                    if (!merged[st.id]) merged[st.id] = { status: "absent", note: "" };
                });

                setDraft(merged);
            } catch (e) {
                // If table doesn't exist or schema mismatch, you’ll see console errors.
                // Keep UX calm; just reset.
                setDraft({});
            }
        }

        loadRegister();
        return () => {
            cancelled = true;
        };
    }, [clubId, selectedSessionId, supabase, students]);

    const selectedSession = useMemo(
        () => sessions.find((s) => s.id === selectedSessionId),
        [sessions, selectedSessionId]
    );

    const stats = useMemo(() => {
        const entries = Object.values(draft);
        const present = entries.filter((x) => x.status === "present").length;
        const late = entries.filter((x) => x.status === "late").length;
        const absent = entries.filter((x) => x.status === "absent").length;
        const total = entries.length;
        const pct = total ? Math.round(((present + late) / total) * 100) : 0;
        return { present, late, absent, total, pct };
    }, [draft]);

    async function saveRegister() {
        if (!selectedSessionId) return;
        setSaving(true);
        setSaveMsg("");

        try {
            // Upsert rows for ALL students in this session.
            const payload = students.map((st) => ({
                club_id: clubId,
                session_id: selectedSessionId,
                student_id: st.id,
                status: draft[st.id]?.status ?? "absent",
                note: draft[st.id]?.note ?? "",
            }));

            // Requires a unique constraint on (club_id, session_id, student_id)
            const { error } = await supabase
                .from("attendance")
                .upsert(payload, { onConflict: "club_id,session_id,student_id" });

            if (error) throw error;

            setSaveMsg("Saved ✔");
            setTimeout(() => setSaveMsg(""), 1800);
        } catch (e: any) {
            setSaveMsg("Save failed — check table/constraints");
        } finally {
            setSaving(false);
        }
    }

    if (checking || loading) {
        return (
            <main className="min-h-screen bg-slate-50">
                <div className="mx-auto w-full max-w-[1200px] px-4 py-10">
                    <div className="h-10 w-72 rounded-2xl bg-slate-200 animate-pulse" />
                    <div className="mt-6 h-[520px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
                </div>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen w-full overflow-x-clip text-slate-900">
            {/* executive background */}
            <div className="fixed inset-0 -z-10 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-100" />
                <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:24px_24px]" />
                <div className="absolute -left-56 top-[-220px] h-[640px] w-[640px] rounded-full bg-sky-200/25 blur-3xl" />
                <div className="absolute -right-72 top-[60px] h-[700px] w-[700px] rounded-full bg-indigo-200/20 blur-3xl" />
            </div>

            <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
                {/* Header: enterprise */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                Attendance
                            </span>
                            <span className={cx(
                                "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                                selectedSessionId ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"
                            )}>
                                {selectedSessionId ? "Session selected" : "Select a session"}
                            </span>

                            {dirty ? (
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                                    Unsaved changes
                                </span>
                            ) : null}
                        </div>

                        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                            Attendance Operations
                        </h1>
                        <p className="mt-1 text-sm text-slate-600">
                            High-integrity register, notes, and compliance-ready evidence for reporting.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href={`/app/admin/clubs/${clubId}`}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                        >
                            Back
                        </Link>

                        <button
                            type="button"
                            onClick={saveRegister}
                            disabled={saving || !selectedSessionId || !students.length}
                            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                        >
                            {saving ? "Saving…" : "Save"}
                        </button>
                    </div>
                </div>

                {/* Command Bar (sticky style) */}
                <div className="mt-6 rounded-[18px] border border-slate-200 bg-white shadow-[0_12px_40px_-28px_rgba(2,6,23,0.35)]">
                    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <div className="text-[11px] font-semibold tracking-widest text-slate-500">SESSION CONTEXT</div>
                            <div className="mt-1 text-base font-semibold text-slate-900">
                                {selectedSession?.title || (sessions.length ? "Untitled session" : "No sessions")}
                            </div>
                            <div className="mt-1 text-sm text-slate-600">
                                {selectedSessionId ? formatDateTime(selectedSession?.starts_at) : "Create/select a session to begin."}
                            </div>
                        </div>

                        <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-[620px]">
                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                <div className="text-[11px] font-semibold tracking-widest text-slate-500">SESSION</div>
                                <select
                                    value={selectedSessionId}
                                    onChange={(e) => setSelectedSessionId(e.target.value)}
                                    className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-900 outline-none"
                                >
                                    {sessions.length ? (
                                        sessions.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {(s.title || "Untitled")} • {formatDateTime(s.starts_at)}
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">No sessions found</option>
                                    )}
                                </select>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                <div className="flex items-center justify-between">
                                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">QUALITY</div>
                                    <span className="text-xs font-semibold text-slate-600">
                                        Coverage <span className="text-slate-900">{stats.pct}%</span>
                                    </span>
                                </div>
                                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-slate-900" style={{ width: `${stats.pct}%` }} />
                                </div>
                                <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                                    <span>{students.length} learners</span>
                                    <span>{saving ? "Saving…" : saveMsg ? saveMsg : "Ready"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KPI strip */}
                    <div className="grid gap-3 px-5 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
                        <MetricKPI label="Present" value={stats.present} hint="Marked present" />
                        <MetricKPI label="Late" value={stats.late} hint="Marked late" />
                        <MetricKPI label="Absent" value={stats.absent} hint="Marked absent" />
                        <MetricKPI label="Register size" value={stats.total} hint="Learners in scope" />
                    </div>
                </div>

                {/* No-data states */}
                {!sessions.length ? (
                    <div className="mt-6 rounded-[18px] border border-slate-200 bg-white p-8 text-center shadow-[0_12px_40px_-28px_rgba(2,6,23,0.35)]">
                        <div className="text-base font-semibold text-slate-900">No sessions available</div>
                        <div className="mt-1 text-sm text-slate-600">
                            Create a session to start capturing attendance and evidence.
                        </div>
                        <div className="mt-5 flex justify-center">
                            <Link
                                href={`/app/admin/clubs/${clubId}/sessions`}
                                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                                Go to Sessions
                            </Link>
                        </div>
                    </div>
                ) : !students.length ? (
                    <div className="mt-6 rounded-[18px] border border-slate-200 bg-white p-8 text-center shadow-[0_12px_40px_-28px_rgba(2,6,23,0.35)]">
                        <div className="text-base font-semibold text-slate-900">No learners in this club</div>
                        <div className="mt-1 text-sm text-slate-600">
                            Add learners to generate a register for the selected session.
                        </div>
                        <div className="mt-5 flex justify-center">
                            <Link
                                href={`/app/admin/clubs/${clubId}/people`}
                                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                                Manage People
                            </Link>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Toolbar: search + filters + bulk actions */}
                        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                                <div className="w-full sm:w-[360px]">
                                    <label className="sr-only">Search</label>
                                    <input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search learner or note…"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    {(["all", "present", "late", "absent"] as const).map((k) => (
                                        <button
                                            key={k}
                                            type="button"
                                            onClick={() => setFilter(k)}
                                            className={cx(
                                                "rounded-xl border px-3 py-2 text-sm font-semibold",
                                                filter === k
                                                    ? "border-slate-900 bg-slate-900 text-white"
                                                    : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                                            )}
                                        >
                                            {k === "all" ? "All" : k[0].toUpperCase() + k.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => bulkSet("present")}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                                >
                                    Mark all Present
                                </button>
                                <button
                                    type="button"
                                    onClick={() => bulkSet("absent")}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                                >
                                    Mark all Absent
                                </button>
                            </div>
                        </div>

                        {/* Enterprise table */}
                        <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_12px_40px_-28px_rgba(2,6,23,0.35)]">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                                <div>
                                    <div className="text-sm font-semibold text-slate-900">Register</div>
                                    <div className="mt-0.5 text-xs text-slate-600">
                                        {filteredStudents.length} shown • {students.length} total
                                    </div>
                                </div>
                                <div className="text-xs font-semibold text-slate-600">
                                    Session: <span className="text-slate-900">{selectedSession?.title || "Untitled"}</span>
                                </div>
                            </div>

                            {/* Table header */}
                            <div className="hidden lg:grid grid-cols-12 gap-3 bg-slate-50 px-6 py-3 text-[11px] font-semibold tracking-widest text-slate-500">
                                <div className="col-span-4">LEARNER</div>
                                <div className="col-span-2">STATUS</div>
                                <div className="col-span-6">EVIDENCE NOTE</div>
                            </div>

                            <div className="divide-y divide-slate-200">
                                {filteredStudents.map((st) => {
                                    const row = draft[st.id] ?? { status: "absent" as const, note: "" };

                                    return (
                                        <div key={st.id} className="px-5 py-4 sm:px-6">
                                            <div className="grid gap-3 lg:grid-cols-12 lg:items-center">
                                                {/* Learner */}
                                                <div className="lg:col-span-4 min-w-0">
                                                    <div className="text-sm font-semibold text-slate-900 truncate">{st.full_name}</div>
                                                    <div className="mt-0.5 text-xs text-slate-500">Learner ID: {st.id.slice(0, 8)}…</div>
                                                </div>

                                                {/* Status */}
                                                <div className="lg:col-span-2 flex flex-wrap items-center gap-2">
                                                    <StatusChip status={row.status} />
                                                    <div className="flex items-center gap-1">
                                                        {(["present", "late", "absent"] as const).map((s) => (
                                                            <button
                                                                key={s}
                                                                type="button"
                                                                onClick={() => setStatus(st.id, s)}
                                                                className={cx(
                                                                    "rounded-lg border px-2.5 py-1.5 text-xs font-semibold",
                                                                    row.status === s
                                                                        ? "border-slate-900 bg-slate-900 text-white"
                                                                        : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                                                                )}
                                                            >
                                                                {s === "present" ? "P" : s === "late" ? "L" : "A"}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Note */}
                                                <div className="lg:col-span-6">
                                                    <input
                                                        value={row.note}
                                                        onChange={(e) => setNote(st.id, e.target.value)}
                                                        placeholder="Short evidence note (skills, teamwork, sensors, coding)…"
                                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {!filteredStudents.length ? (
                                    <div className="px-6 py-10 text-center">
                                        <div className="text-sm font-semibold text-slate-900">No results</div>
                                        <div className="mt-1 text-sm text-slate-600">
                                            Try clearing search or switching the filter.
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Bottom helper */}
                        <div className="mt-4 rounded-[18px] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-[0_12px_40px_-28px_rgba(2,6,23,0.25)]">
                            <span className="font-semibold text-slate-900">Evidence standard:</span>{" "}
                            Keep notes short and skill-based. This feeds reporting and parent portfolio exports.
                        </div>
                    </>
                )}
            </div>
        </main>
    );




}
