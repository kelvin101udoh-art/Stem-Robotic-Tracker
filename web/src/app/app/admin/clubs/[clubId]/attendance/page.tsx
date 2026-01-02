// web/src/app/app/admin/clubs/[clubId]/attendance/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  created_at?: string;
};

type AttendanceStatus = "present" | "absent" | "late";

type AttendanceRow = {
  id: string;
  club_id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  note: string | null;
  updated_at?: string;

  // enterprise additions (may be null/undefined if columns not present yet)
  saved_at?: string | null;
  saved_by?: string | null;
  finalised_at?: string | null;
  finalised_by?: string | null;
  late_reason?: string | null;
  absent_reason?: string | null;
};

type DraftRow = {
  status: AttendanceStatus;
  note: string;
  late_reason: string;
  absent_reason: string;
};

const UI_VERSION = "AI_ATTENDANCE_ENTERPRISE_V5";

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
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function pickAutoSession(sessions: SessionRow[]) {
  // Auto-mode: Prefer "today's" session, else nearest upcoming, else most recent.
  const now = new Date();
  const withDate = sessions
    .map((s) => ({ s, dt: s.starts_at ? new Date(s.starts_at) : null }))
    .filter((x) => !!x.dt) as Array<{ s: SessionRow; dt: Date }>;

  const today = withDate
    .filter((x) => sameLocalDay(x.dt, now))
    .sort((a, b) => a.dt.getTime() - b.dt.getTime());

  if (today.length) return today[0].s.id;

  const upcoming = withDate
    .filter((x) => x.dt.getTime() >= now.getTime())
    .sort((a, b) => a.dt.getTime() - b.dt.getTime());

  if (upcoming.length) return upcoming[0].s.id;

  // fallback to most recent
  if (withDate.length) {
    return withDate.sort((a, b) => b.dt.getTime() - a.dt.getTime())[0].s.id;
  }

  return sessions[0]?.id ?? "";
}

function statusBadge(status: AttendanceStatus) {
  if (status === "present") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "late") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-rose-200 bg-rose-50 text-rose-900";
}

function StatusChip({ status }: { status: AttendanceStatus }) {
  const label = status === "present" ? "Present" : status === "late" ? "Late" : "Absent";
  return (
    <span className={cx("inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusBadge(status))}>
      {label}
    </span>
  );
}

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function extractSkillSignals(notes: string[]) {
  const text = notes.join(" ").toLowerCase();
  const signals: Array<{ key: string; label: string }> = [
    { key: "team", label: "Teamwork" },
    { key: "sensor", label: "Sensors" },
    { key: "gear", label: "Gears & mechanics" },
    { key: "code", label: "Coding" },
    { key: "debug", label: "Debugging" },
    { key: "logic", label: "Logic" },
    { key: "build", label: "Build quality" },
    { key: "design", label: "Design thinking" },
    { key: "test", label: "Testing" },
  ];

  const hits = signals
    .map((s) => ({ ...s, hit: text.includes(s.key) }))
    .filter((x) => x.hit)
    .map((x) => x.label);

  return hits.length ? hits.slice(0, 6) : ["Problem-solving", "Teamwork", "Build skills"];
}

function makeAISummary(params: {
  total: number;
  present: number;
  late: number;
  absent: number;
  missingEvidence: number;
  notes: string[];
  sessionTitle: string;
  sessionTime: string;
}) {
  const { total, present, late, absent, missingEvidence, notes, sessionTitle, sessionTime } = params;

  const coverage = pct(present + late, total);
  const punctuality = pct(present, present + late);
  const skills = extractSkillSignals(notes);

  const engagement =
    coverage >= 90
      ? "Engagement was strong with high participation across the cohort."
      : coverage >= 70
      ? "Engagement was moderate; a few learners may need a light follow-up."
      : "Engagement was low; consider checking barriers (timing, motivation, access).";

  const integrity =
    missingEvidence === 0
      ? "Evidence quality is consistent across marked learners."
      : `Evidence notes are missing for ${missingEvidence} marked learner(s); add short skill-based notes for audit readiness.`;

  const improvement =
    absent >= Math.ceil(total * 0.25)
      ? "Improve next session by contacting absentees and confirming access/transport. Consider a quick recap for returning learners."
      : late >= Math.ceil(total * 0.2)
      ? "Improve punctuality next session with a 3-minute warm-up buffer and clear arrival expectations."
      : "Improve next session by increasing challenge clarity and assigning roles (builder/coder/tester) to boost focus.";

  const exportReady = [
    `Session: ${sessionTitle} (${sessionTime})`,
    `Attendance: ${present} present, ${late} late, ${absent} absent (coverage ${coverage}%)`,
    `Signals: ${skills.join(", ")}`,
    `Integrity: ${integrity}`,
    `Coach note: ${engagement}`,
    `Next improvement: ${improvement}`,
  ].join("\n");

  return { engagement, integrity, improvement, skills, exportReady, coverage, punctuality };
}

const LATE_REASONS = [
  "Transport delay",
  "Late arrival (family)",
  "Timetable clash",
  "Behaviour support",
  "Other",
];

const ABSENT_REASONS = [
  "Sick",
  "Family reason",
  "Travel",
  "No notice",
  "Other",
];

function KPI({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_-28px_rgba(2,6,23,0.35)]">
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

  const [draft, setDraft] = useState<Record<string, DraftRow>>({});
  const [dirty, setDirty] = useState(false);

  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "missing" | "late" | "risk">("all");

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string>("");

  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(true);

  const [finalisedAt, setFinalisedAt] = useState<string | null>(null);
  const [finalisedBy, setFinalisedBy] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savedBy, setSavedBy] = useState<string | null>(null);

  // AI summary
  const [summary, setSummary] = useState<null | {
    engagement: string;
    integrity: string;
    improvement: string;
    skills: string[];
    exportReady: string;
    coverage: number;
    punctuality: number;
  }>(null);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId),
    [sessions, selectedSessionId]
  );

  const isFinalised = !!finalisedAt;

  // Load sessions + students (Auto-session mode)
  useEffect(() => {
    if (checking) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setSaveMsg("");

      try {
        const { data: sData, error: sErr } = await supabase
          .from("sessions")
          .select("id, club_id, title, starts_at")
          .eq("club_id", clubId)
          .order("starts_at", { ascending: false })
          .limit(80);

        if (sErr) throw sErr;

        const { data: stData, error: stErr } = await supabase
          .from("students")
          .select("id, club_id, full_name, created_at")
          .eq("club_id", clubId)
          .order("full_name", { ascending: true });

        if (stErr) throw stErr;

        if (cancelled) return;

        const ss = (sData ?? []) as SessionRow[];
        const sts = (stData ?? []) as StudentRow[];

        setSessions(ss);
        setStudents(sts);

        setSelectedSessionId((prev) => {
          if (prev) return prev;
          return pickAutoSession(ss);
        });
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

  // Load register rows and hydrate draft + audit/finalise info
  useEffect(() => {
    if (!selectedSessionId) return;
    let cancelled = false;

    async function loadRegister() {
      setSaveMsg("");
      setSummary(null);

      try {
        // include enterprise columns (safe if missing? -> Supabase errors if column doesn't exist)
        // To avoid hard failures before migration, keep select minimal first,
        // then attempt a second select for enterprise columns.
        const base = await supabase
          .from("attendance")
          .select("id, club_id, session_id, student_id, status, note, updated_at")
          .eq("club_id", clubId)
          .eq("session_id", selectedSessionId);

        if (base.error) throw base.error;

        const data = base.data ?? [];

        // Attempt enterprise fields (ignore if schema not upgraded)
        const ent = await supabase
          .from("attendance")
          .select("student_id, saved_at, saved_by, finalised_at, finalised_by, late_reason, absent_reason")
          .eq("club_id", clubId)
          .eq("session_id", selectedSessionId);

        // If it fails, we continue without enterprise fields
        const entMap = new Map<string, Partial<AttendanceRow>>();
        if (!ent.error && ent.data) {
          ent.data.forEach((r: any) => entMap.set(r.student_id, r));
        }

        if (cancelled) return;

        const map: Record<string, DraftRow> = {};
        (data ?? []).forEach((r: any) => {
          const extra = entMap.get(r.student_id) ?? {};
          map[r.student_id] = {
            status: (r.status ?? "absent") as AttendanceStatus,
            note: r.note ?? "",
            late_reason: (extra.late_reason as string) ?? "",
            absent_reason: (extra.absent_reason as string) ?? "",
          };
        });

        // Ensure every student exists in draft
        students.forEach((st) => {
          if (!map[st.id]) map[st.id] = { status: "absent", note: "", late_reason: "", absent_reason: "" };
        });

        // Derive register-level audit/finalise (pick first row with values)
        const anyEnt = ent.data?.find((x: any) => x.finalised_at || x.saved_at) ?? null;
        setFinalisedAt(anyEnt?.finalised_at ?? null);
        setFinalisedBy(anyEnt?.finalised_by ?? null);
        setSavedAt(anyEnt?.saved_at ?? null);
        setSavedBy(anyEnt?.saved_by ?? null);

        setDraft(map);
        setDirty(false);
        setView("all");
      } catch {
        setDraft({});
      }
    }

    loadRegister();
    return () => {
      cancelled = true;
    };
  }, [clubId, selectedSessionId, supabase, students]);

  const stats = useMemo(() => {
    const entries = Object.values(draft);
    const total = entries.length;
    const present = entries.filter((x) => x.status === "present").length;
    const late = entries.filter((x) => x.status === "late").length;
    const absent = entries.filter((x) => x.status === "absent").length;

    const missingEvidence = entries.filter((x) => (x.status === "present" || x.status === "late") && (x.note ?? "").trim().length < 6).length;

    const coverage = total ? Math.round(((present + late) / total) * 100) : 0;

    return { present, late, absent, total, coverage, missingEvidence };
  }, [draft]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();

    return students.filter((s) => {
      const row = draft[s.id] ?? { status: "absent" as const, note: "", late_reason: "", absent_reason: "" };

      const matchQ =
        !q ||
        s.full_name.toLowerCase().includes(q) ||
        (row.note ?? "").toLowerCase().includes(q) ||
        (row.late_reason ?? "").toLowerCase().includes(q) ||
        (row.absent_reason ?? "").toLowerCase().includes(q);

      const matchView =
        view === "all"
          ? true
          : view === "missing"
          ? (row.status === "present" || row.status === "late") && (row.note ?? "").trim().length < 6
          : view === "late"
          ? row.status === "late"
          : // risk
            row.status === "absent";

      return matchQ && matchView;
    });
  }, [students, draft, query, view]);

  function setStatus(studentId: string, status: AttendanceStatus) {
    if (isFinalised) return;
    setDraft((prev) => {
      const row = prev[studentId] ?? { status: "absent" as const, note: "", late_reason: "", absent_reason: "" };
      return { ...prev, [studentId]: { ...row, status } };
    });
    setDirty(true);
  }

  function setNote(studentId: string, note: string) {
    if (isFinalised) return;
    setDraft((prev) => {
      const row = prev[studentId] ?? { status: "absent" as const, note: "", late_reason: "", absent_reason: "" };
      return { ...prev, [studentId]: { ...row, note } };
    });
    setDirty(true);
  }

  function setReason(studentId: string, kind: "late" | "absent", value: string) {
    if (isFinalised) return;
    setDraft((prev) => {
      const row = prev[studentId] ?? { status: "absent" as const, note: "", late_reason: "", absent_reason: "" };
      return {
        ...prev,
        [studentId]: {
          ...row,
          late_reason: kind === "late" ? value : row.late_reason,
          absent_reason: kind === "absent" ? value : row.absent_reason,
        },
      };
    });
    setDirty(true);
  }

  function bulkSet(status: AttendanceStatus) {
    if (isFinalised) return;
    setDraft((prev) => {
      const next = { ...prev };
      filteredStudents.forEach((st) => {
        const row = next[st.id] ?? { status: "absent" as const, note: "", late_reason: "", absent_reason: "" };
        next[st.id] = { ...row, status };
      });
      return next;
    });
    setDirty(true);
  }

  function applyEvidenceFill() {
    if (isFinalised) return;
    // AI-fill: only present/late with missing evidence
    setDraft((prev) => {
      const next = { ...prev };
      filteredStudents.forEach((st) => {
        const row = next[st.id] ?? { status: "absent" as const, note: "", late_reason: "", absent_reason: "" };
        const needs = (row.status === "present" || row.status === "late") && (row.note ?? "").trim().length < 6;
        if (!needs) return;

        // lightweight “AI-style” standard note (placeholder)
        const auto =
          row.status === "late"
            ? "Arrived late; joined task and contributed to build/testing."
            : "Participated well; demonstrated focus and problem-solving during the activity.";

        next[st.id] = { ...row, note: auto };
      });
      return next;
    });
    setDirty(true);
  }

  function buildSummaryFromDraft() {
    const notes = students
      .map((st) => (draft[st.id]?.note ?? "").trim())
      .filter((n) => n.length >= 6);

    const sTitle = selectedSession?.title || "Session";
    const sTime = selectedSession?.starts_at ? `${formatDateTime(selectedSession.starts_at)}` : "—";

    return makeAISummary({
      total: stats.total,
      present: stats.present,
      late: stats.late,
      absent: stats.absent,
      missingEvidence: stats.missingEvidence,
      notes,
      sessionTitle: sTitle,
      sessionTime: sTime,
    });
  }

  async function exportCSV() {
    // Export visible learners (enterprise feel)
    const lines = [
      ["student_id", "full_name", "status", "note", "late_reason", "absent_reason"].join(","),
      ...filteredStudents.map((st) => {
        const row = draft[st.id] ?? { status: "absent" as const, note: "", late_reason: "", absent_reason: "" };
        const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
        return [
          st.id,
          esc(st.full_name),
          row.status,
          esc(row.note ?? ""),
          esc(row.late_reason ?? ""),
          esc(row.absent_reason ?? ""),
        ].join(",");
      }),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${clubId}_${selectedSessionId || "no_session"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveRegister() {
    if (!selectedSessionId) return;
    setSaving(true);
    setSaveMsg("");

    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id ?? null;

      // Upsert rows for ALL students (consistent register)
      const payload = students.map((st) => {
        const row = draft[st.id] ?? { status: "absent" as const, note: "", late_reason: "", absent_reason: "" };
        return {
          club_id: clubId,
          session_id: selectedSessionId,
          student_id: st.id,
          status: row.status,
          note: row.note ?? "",
          // enterprise fields (requires migration)
          saved_at: new Date().toISOString(),
          saved_by: userId,
          late_reason: row.status === "late" ? (row.late_reason ?? "") : "",
          absent_reason: row.status === "absent" ? (row.absent_reason ?? "") : "",
        };
      });

      const { error } = await supabase
        .from("attendance")
        .upsert(payload as any, { onConflict: "club_id,session_id,student_id" });

      if (error) throw error;

      const nextSummary = buildSummaryFromDraft();
      setSummary(nextSummary);

      setSavedAt(new Date().toISOString());
      setSavedBy(userId);
      setDirty(false);
      setSaveMsg("Saved");
      setTimeout(() => setSaveMsg(""), 1400);
    } catch {
      setSaveMsg("Save failed (check constraints/RLS/columns)");
    } finally {
      setSaving(false);
    }
  }

  async function finaliseRegister() {
    if (!selectedSessionId) return;
    if (!confirm("Finalise register? This will lock edits for this session.")) return;

    setSaving(true);
    setSaveMsg("");

    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id ?? null;
      const stamp = new Date().toISOString();

      // We finalise by stamping all rows (enterprise audit approach)
      const payload = students.map((st) => ({
        club_id: clubId,
        session_id: selectedSessionId,
        student_id: st.id,
        finalised_at: stamp,
        finalised_by: userId,
      }));

      const { error } = await supabase
        .from("attendance")
        .upsert(payload as any, { onConflict: "club_id,session_id,student_id" });

      if (error) throw error;

      setFinalisedAt(stamp);
      setFinalisedBy(userId);
      setSaveMsg("Finalised (locked)");
      setTimeout(() => setSaveMsg(""), 1600);
    } catch {
      setSaveMsg("Finalise failed (check columns/RLS)");
    } finally {
      setSaving(false);
    }
  }

  if (checking || loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-10">
          <div className="h-10 w-80 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="mt-6 h-[560px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
        </div>
      </main>
    );
  }

  const todayBadge = selectedSession?.starts_at && sameLocalDay(new Date(selectedSession.starts_at), new Date());

  return (
    <main className="relative min-h-screen w-full overflow-x-clip text-slate-900">
      {/* Enterprise background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-100" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute -left-56 top-[-220px] h-[640px] w-[640px] rounded-full bg-sky-200/25 blur-3xl" />
        <div className="absolute -right-72 top-[60px] h-[700px] w-[700px] rounded-full bg-indigo-200/20 blur-3xl" />
      </div>

      {/* Sticky command bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                AI Attendance Command Center
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {UI_VERSION}
              </span>
              {isFinalised ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                  Finalised
                </span>
              ) : dirty ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  Unsaved changes
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                  Synced
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/admin/clubs/${clubId}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Back
            </Link>

            <button
              type="button"
              onClick={exportCSV}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={saveRegister}
              disabled={saving || !selectedSessionId || !students.length || isFinalised}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Attendance Intelligence
          </h1>
          <p className="max-w-3xl text-sm text-slate-600">
            High-integrity registers + evidence capture with AI-style assistance and compliance-ready audit signals.
          </p>
        </div>

        {/* Main layout: content + right copilot */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Left: core */}
          <div className="lg:col-span-8">
            {/* Today auto-mode card (dropdown hidden) */}
            <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
              <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {todayBadge ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          Today
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          Auto-selected
                        </span>
                      )}

                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        Window: <span className="ml-2 text-slate-900">{formatTime(selectedSession?.starts_at)}</span>
                      </span>

                      {savedAt ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          Last saved: <span className="ml-2 text-slate-900">{formatTime(savedAt)}</span>
                        </span>
                      ) : null}

                      {saveMsg ? (
                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          {saveMsg}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3 text-xs font-semibold tracking-widest text-slate-500">
                      SESSION CONTEXT
                    </div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {selectedSession?.title || (sessions.length ? "Untitled session" : "No sessions")}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {selectedSession?.starts_at ? formatDateTime(selectedSession.starts_at) : "Create a session to begin."}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSessionPicker(true)}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      Change session
                    </button>

                    <button
                      type="button"
                      onClick={finaliseRegister}
                      disabled={saving || !selectedSessionId || !students.length || isFinalised}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Finalise
                    </button>
                  </div>
                </div>

                {/* Coverage bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Coverage</span>
                    <span className="text-slate-900">{stats.coverage}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-slate-900" style={{ width: `${stats.coverage}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                    <span>{students.length} learners</span>
                    <span>{isFinalised ? "Locked for compliance" : "Editable"}</span>
                  </div>
                </div>
              </div>

              {/* Exceptions-first cards */}
              <div className="grid gap-3 px-5 py-4 sm:grid-cols-3 sm:px-6">
                <button
                  type="button"
                  onClick={() => setView("missing")}
                  className={cx(
                    "rounded-2xl border bg-white p-4 text-left shadow-[0_10px_28px_-28px_rgba(2,6,23,0.25)] transition",
                    view === "missing" ? "border-slate-900" : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className="text-[11px] font-semibold tracking-widest text-slate-500">MISSING EVIDENCE</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{stats.missingEvidence}</div>
                  <div className="mt-1 text-xs text-slate-600">Present/late without notes</div>
                </button>

                <button
                  type="button"
                  onClick={() => setView("late")}
                  className={cx(
                    "rounded-2xl border bg-white p-4 text-left shadow-[0_10px_28px_-28px_rgba(2,6,23,0.25)] transition",
                    view === "late" ? "border-slate-900" : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className="text-[11px] font-semibold tracking-widest text-slate-500">LATE ARRIVALS</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{stats.late}</div>
                  <div className="mt-1 text-xs text-slate-600">Track punctuality signals</div>
                </button>

                <button
                  type="button"
                  onClick={() => setView("risk")}
                  className={cx(
                    "rounded-2xl border bg-white p-4 text-left shadow-[0_10px_28px_-28px_rgba(2,6,23,0.25)] transition",
                    view === "risk" ? "border-slate-900" : "border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className="text-[11px] font-semibold tracking-widest text-slate-500">ABSENCE RISK</div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{stats.absent}</div>
                  <div className="mt-1 text-xs text-slate-600">Follow-up needed</div>
                </button>
              </div>

              {/* KPI row */}
              <div className="grid gap-3 border-t border-slate-200 px-5 py-4 sm:grid-cols-4 sm:px-6">
                <KPI label="Present" value={stats.present} hint="Confirmed present" />
                <KPI label="Late" value={stats.late} hint="Late arrivals" />
                <KPI label="Absent" value={stats.absent} hint="Not in session" />
                <KPI label="Evidence notes" value={Object.values(draft).filter((x) => (x.note ?? "").trim().length >= 6).length} hint="Notes ≥ 6 chars" />
              </div>
            </div>

            {/* Empty states */}
            {!sessions.length ? (
              <div className="mt-6 rounded-[22px] border border-slate-200 bg-white p-10 text-center shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
                <div className="text-lg font-semibold text-slate-900">No sessions available</div>
                <div className="mt-1 text-sm text-slate-600">Create a session first, then take attendance.</div>
                <div className="mt-6 flex justify-center">
                  <Link
                    href={`/app/admin/clubs/${clubId}/sessions`}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Go to Sessions
                  </Link>
                </div>
              </div>
            ) : !students.length ? (
              <div className="mt-6 rounded-[22px] border border-slate-200 bg-white p-10 text-center shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
                <div className="text-lg font-semibold text-slate-900">No learners found</div>
                <div className="mt-1 text-sm text-slate-600">Add learners to generate a register.</div>
                <div className="mt-6 flex justify-center">
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
                {/* Search + bulk actions */}
                <div className="mt-6 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="w-full sm:w-[360px]">
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search learner, note, or reason…"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {(["all", "missing", "late", "risk"] as const).map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setView(k)}
                            className={cx(
                              "rounded-xl border px-3 py-2 text-sm font-semibold",
                              view === k
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                            )}
                          >
                            {k === "all"
                              ? "All"
                              : k === "missing"
                              ? "Missing evidence"
                              : k === "late"
                              ? "Late"
                              : "Absence risk"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => bulkSet("present")}
                        disabled={isFinalised}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Mark visible Present
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkSet("late")}
                        disabled={isFinalised}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Mark visible Late
                      </button>
                      <button
                        type="button"
                        onClick={() => bulkSet("absent")}
                        disabled={isFinalised}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Mark visible Absent
                      </button>
                      <button
                        type="button"
                        onClick={applyEvidenceFill}
                        disabled={isFinalised}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
                      >
                        AI-Fill evidence
                      </button>
                    </div>
                  </div>
                </div>

                {/* Register table */}
                <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Register</div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        {filteredStudents.length} shown • {students.length} total
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <span>Mode:</span>
                      <span className="text-slate-900">
                        {view === "all"
                          ? "All learners"
                          : view === "missing"
                          ? "Evidence exceptions"
                          : view === "late"
                          ? "Punctuality exceptions"
                          : "Absence risk"}
                      </span>
                    </div>
                  </div>

                  {/* Header */}
                  <div className="hidden lg:grid grid-cols-12 gap-3 bg-slate-50 px-6 py-3 text-[11px] font-semibold tracking-widest text-slate-500">
                    <div className="col-span-4">LEARNER</div>
                    <div className="col-span-3">STATUS + REASON</div>
                    <div className="col-span-5">EVIDENCE NOTE</div>
                  </div>

                  <div className="divide-y divide-slate-200">
                    {filteredStudents.map((st) => {
                      const row = draft[st.id] ?? { status: "absent" as const, note: "", late_reason: "", absent_reason: "" };
                      const showEvidenceWarning = (row.status === "present" || row.status === "late") && row.note.trim().length < 6;

                      return (
                        <div key={st.id} className="group px-5 py-4 sm:px-6 hover:bg-slate-50/70">
                          <div className="grid gap-3 lg:grid-cols-12 lg:items-center">
                            {/* Learner */}
                            <div className="lg:col-span-4 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900 truncate">{st.full_name}</div>
                                {showEvidenceWarning ? (
                                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900">
                                    Evidence missing
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">ID: {st.id.slice(0, 8)}…</div>
                            </div>

                            {/* Status + reason */}
                            <div className="lg:col-span-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <StatusChip status={row.status} />

                                {/* Hover actions */}
                                <div className={cx(
                                  "flex items-center gap-1 transition",
                                  "lg:opacity-0 lg:group-hover:opacity-100"
                                )}>
                                  {(["present", "late", "absent"] as const).map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      disabled={isFinalised}
                                      onClick={() => setStatus(st.id, s)}
                                      className={cx(
                                        "rounded-lg border px-2.5 py-1.5 text-xs font-semibold",
                                        row.status === s
                                          ? "border-slate-900 bg-slate-900 text-white"
                                          : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                                        isFinalised && "opacity-60"
                                      )}
                                      title={s}
                                    >
                                      {s === "present" ? "P" : s === "late" ? "L" : "A"}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Reason code */}
                              <div className="mt-2">
                                {row.status === "late" ? (
                                  <select
                                    value={row.late_reason || ""}
                                    disabled={isFinalised}
                                    onChange={(e) => setReason(st.id, "late", e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-60"
                                  >
                                    <option value="">Late reason (optional)</option>
                                    {LATE_REASONS.map((r) => (
                                      <option key={r} value={r}>
                                        {r}
                                      </option>
                                    ))}
                                  </select>
                                ) : row.status === "absent" ? (
                                  <select
                                    value={row.absent_reason || ""}
                                    disabled={isFinalised}
                                    onChange={(e) => setReason(st.id, "absent", e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:opacity-60"
                                  >
                                    <option value="">Absence reason (optional)</option>
                                    {ABSENT_REASONS.map((r) => (
                                      <option key={r} value={r}>
                                        {r}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="text-xs text-slate-500">—</div>
                                )}
                              </div>
                            </div>

                            {/* Note */}
                            <div className="lg:col-span-5">
                              <input
                                value={row.note}
                                disabled={isFinalised}
                                onChange={(e) => setNote(st.id, e.target.value)}
                                placeholder="Evidence note (skills, teamwork, sensors, coding)…"
                                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
                              />
                              <div className="mt-1 text-xs text-slate-500">
                                Tip: keep it skill-based and short for reporting.
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!filteredStudents.length ? (
                      <div className="px-6 py-10 text-center">
                        <div className="text-sm font-semibold text-slate-900">No results</div>
                        <div className="mt-1 text-sm text-slate-600">Clear search or switch the view.</div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* AI session summary (appears after Save) */}
                {summary ? (
                  <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold tracking-widest text-slate-500">
                          AI SESSION SUMMARY
                        </div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">
                          Auto-generated insights for reporting
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          Based on attendance + evidence notes (rules-first AI; easy to upgrade later to real model calls).
                        </div>
                      </div>

                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                        onClick={async () => {
                          await navigator.clipboard.writeText(summary.exportReady);
                          setSaveMsg("Summary copied");
                          setTimeout(() => setSaveMsg(""), 1200);
                        }}
                      >
                        Copy export summary
                      </button>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-[11px] font-semibold tracking-widest text-slate-500">ENGAGEMENT</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{summary.engagement}</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-[11px] font-semibold tracking-widest text-slate-500">INTEGRITY</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{summary.integrity}</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-[11px] font-semibold tracking-widest text-slate-500">IMPROVE NEXT</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{summary.improvement}</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-[11px] font-semibold tracking-widest text-slate-500">EXPORT-READY</div>
                      <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{summary.exportReady}</pre>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* Right: AI Copilot drawer */}
          <aside className="lg:col-span-4">
            <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                <div>
                  <div className="text-xs font-semibold tracking-widest text-slate-500">AI INSIGHTS</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">Integrity & coaching signals</div>
                </div>

                <button
                  type="button"
                  onClick={() => setCopilotOpen((v) => !v)}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  {copilotOpen ? "Collapse" : "Open"}
                </button>
              </div>

              {copilotOpen ? (
                <div className="space-y-3 px-5 py-4 sm:px-6">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">Evidence quality</div>
                      <span className={cx(
                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        stats.missingEvidence === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"
                      )}>
                        {stats.missingEvidence === 0 ? "OK" : "Action"}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {stats.missingEvidence === 0
                        ? "Notes are captured for present/late learners."
                        : `Missing notes for ${stats.missingEvidence} marked learner(s). Use AI-Fill for standardised evidence.`}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">Attendance pattern</div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        Coverage {stats.coverage}%
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {stats.coverage >= 90
                        ? "Strong participation across cohort."
                        : stats.coverage >= 70
                        ? "Moderate participation; review absences."
                        : "Low participation; investigate barriers."}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">RECOMMENDED NEXT</div>
                    <ul className="mt-2 space-y-2 text-sm text-slate-700">
                      <li>• Mark register first, then add short evidence notes.</li>
                      <li>• Use AI-Fill to standardise reporting language.</li>
                      <li>• Export CSV for audits or school reporting.</li>
                      <li>• Finalise to lock register for compliance.</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">COMPLIANCE</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      {isFinalised ? "Register locked" : "Register editable"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {isFinalised
                        ? `Finalised at ${formatDateTime(finalisedAt)}`
                        : "Finalise when complete to prevent post-hoc changes."}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </div>

      {/* Session picker modal */}
      {showSessionPicker ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setShowSessionPicker(false)} />
          <div className="relative w-full max-w-[720px] rounded-[22px] border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold tracking-widest text-slate-500">CHANGE SESSION</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">Select a session to mark</div>
                <div className="mt-1 text-sm text-slate-600">Auto-mode picks “today/next” by default.</div>
              </div>
              <button
                type="button"
                onClick={() => setShowSessionPicker(false)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="mt-4 max-h-[60vh] overflow-auto rounded-2xl border border-slate-200">
              {sessions.map((s) => {
                const isSelected = s.id === selectedSessionId;
                const isToday = s.starts_at ? sameLocalDay(new Date(s.starts_at), new Date()) : false;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSessionId(s.id);
                      setShowSessionPicker(false);
                    }}
                    className={cx(
                      "flex w-full items-center justify-between gap-3 px-4 py-3 text-left",
                      isSelected ? "bg-slate-50" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {s.title || "Untitled session"}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600">{formatDateTime(s.starts_at)}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isToday ? (
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                          Today
                        </span>
                      ) : null}
                      {isSelected ? (
                        <span className="rounded-full border border-slate-900 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                          Selected
                        </span>
                      ) : (
                        <span className="text-slate-400">›</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
