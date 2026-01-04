// web/src/app/app/admin/clubs/[clubId]/attendance/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

function pickAutoSession(sessions: SessionRow[]) {
  // Prefer today's session, else nearest upcoming, else most recent.
  const now = new Date();
  const withDate = sessions
    .map((s) => ({ s, dt: s.starts_at ? new Date(s.starts_at) : null }))
    .filter((x) => !!x.dt) as Array<{ s: SessionRow; dt: Date }>;

  const today = withDate.filter((x) => sameLocalDay(x.dt, now)).sort((a, b) => a.dt.getTime() - b.dt.getTime());
  if (today.length) return today[0].s.id;

  const upcoming = withDate.filter((x) => x.dt.getTime() >= now.getTime()).sort((a, b) => a.dt.getTime() - b.dt.getTime());
  if (upcoming.length) return upcoming[0].s.id;

  if (withDate.length) return withDate.sort((a, b) => b.dt.getTime() - a.dt.getTime())[0].s.id;
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

const LATE_REASONS = ["Transport delay", "Late arrival (family)", "Timetable clash", "Behaviour support", "Other"];
const ABSENT_REASONS = ["Sick", "Family reason", "Travel", "No notice", "Other"];

function KPI({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
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
  const [view, setView] = useState<"all" | "present" | "late" | "absent">("all");

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string>("");

  const [showSessionPicker, setShowSessionPicker] = useState(false);

  const [finalisedAt, setFinalisedAt] = useState<string | null>(null);
  const [finalisedBy, setFinalisedBy] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savedBy, setSavedBy] = useState<string | null>(null);

  // ONE-SIGNAL additions
  const [evidenceMode, setEvidenceMode] = useState(false);
  const [online, setOnline] = useState(true);
  const autosaveRef = useRef<number | null>(null);

  // “AI draft queue” (UI state only; wire server later)
  const [aiJob, setAiJob] = useState<null | { status: "idle" | "queued" | "running" | "done" | "failed"; msg?: string }>(
    { status: "idle" }
  );

  // Session summary (rules-first preview; AI job can later overwrite)
  const [summary, setSummary] = useState<null | {
    engagement: string;
    integrity: string;
    improvement: string;
    skills: string[];
    exportReady: string;
    coverage: number;
    punctuality: number;
    source?: "rules" | "ai";
  }>(null);

  const selectedSession = useMemo(() => sessions.find((s) => s.id === selectedSessionId), [sessions, selectedSessionId]);
  const isFinalised = !!finalisedAt;

  // Online/offline tracking
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

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
        setSelectedSessionId((prev) => (prev ? prev : pickAutoSession(ss)));
      } catch {
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
        const base = await supabase
          .from("attendance")
          .select("id, club_id, session_id, student_id, status, note, updated_at")
          .eq("club_id", clubId)
          .eq("session_id", selectedSessionId);

        if (base.error) throw base.error;
        const data = base.data ?? [];

        const ent = await supabase
          .from("attendance")
          .select("student_id, saved_at, saved_by, finalised_at, finalised_by, late_reason, absent_reason")
          .eq("club_id", clubId)
          .eq("session_id", selectedSessionId);

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

        // ONE-SIGNAL: ensure every learner exists; default absent
        students.forEach((st) => {
          if (!map[st.id]) map[st.id] = { status: "absent", note: "", late_reason: "", absent_reason: "" };
        });

        const anyEnt = ent.data?.find((x: any) => x.finalised_at || x.saved_at) ?? null;
        setFinalisedAt(anyEnt?.finalised_at ?? null);
        setFinalisedBy(anyEnt?.finalised_by ?? null);
        setSavedAt(anyEnt?.saved_at ?? null);
        setSavedBy(anyEnt?.saved_by ?? null);

        setDraft(map);
        setDirty(false);
        setView("all");
        setAiJob({ status: "idle" });
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

    const missingEvidence = entries.filter(
      (x) => (x.status === "present" || x.status === "late") && (x.note ?? "").trim().length < 6
    ).length;

    const coverage = total ? Math.round(((present + late) / total) * 100) : 0;

    const missingLateReasons = entries.filter((x) => x.status === "late" && (x.late_reason ?? "").trim().length < 2).length;
    const missingAbsentReasons = entries.filter((x) => x.status === "absent" && (x.absent_reason ?? "").trim().length < 2).length;

    return { present, late, absent, total, coverage, missingEvidence, missingLateReasons, missingAbsentReasons };
  }, [draft]);

  const filteredStudents = useMemo(() => {
    const q = query.trim().toLowerCase();

    return students.filter((s) => {
      const row = draft[s.id] ?? { status: "absent" as const, note: "", late_reason: "", absent_reason: "" };

      const matchQ = !q || s.full_name.toLowerCase().includes(q);

      const matchView =
        view === "all"
          ? true
          : view === "present"
            ? row.status === "present"
            : view === "late"
              ? row.status === "late"
              : row.status === "absent";

      return matchQ && matchView;
    });
  }, [students, draft, query, view]);

  function setStatus(studentId: string, status: AttendanceStatus) {
    if (isFinalised) return;

    setDraft((prev) => {
      const row = prev[studentId] ?? { status: "absent" as const, note: "", late_reason: "", absent_reason: "" };
      const next: DraftRow = { ...row, status };

      // ONE-SIGNAL: keep reasons consistent
      if (status !== "late") next.late_reason = "";
      if (status !== "absent") next.absent_reason = "";

      return { ...prev, [studentId]: next };
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

  function buildSummaryFromDraft() {
    const notes = students.map((st) => (draft[st.id]?.note ?? "").trim()).filter((n) => n.length >= 6);
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

  const liveSummary = useMemo(() => {
    if (!students.length || !selectedSessionId) return null;
    // keep it lightweight: only show once there's meaningful signals
    if (stats.present + stats.late < 2) return null;
    return buildSummaryFromDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, students.length, selectedSessionId, stats.present, stats.late]);

  async function exportCSV() {
    const lines = [
      ["student_id", "full_name", "status", "note", "late_reason", "absent_reason"].join(","),
      ...filteredStudents.map((st) => {
        const row = draft[st.id] ?? { status: "absent" as const, note: "", late_reason: "", absent_reason: "" };
        const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
        return [st.id, esc(st.full_name), row.status, esc(row.note ?? ""), esc(row.late_reason ?? ""), esc(row.absent_reason ?? "")].join(",");
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

  async function saveRegister(opts?: { silent?: boolean }) {
    if (!selectedSessionId) return;
    if (!online) return;

    setSaving(true);
    if (!opts?.silent) setSaveMsg("");

    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id ?? null;

      const payload = students.map((st) => {
        const row = draft[st.id] ?? { status: "absent" as const, note: "", late_reason: "", absent_reason: "" };
        return {
          club_id: clubId,
          session_id: selectedSessionId,
          student_id: st.id,
          status: row.status,
          note: row.note ?? "",
          saved_at: new Date().toISOString(),
          saved_by: userId,
          late_reason: row.status === "late" ? (row.late_reason ?? "") : "",
          absent_reason: row.status === "absent" ? (row.absent_reason ?? "") : "",
        };
      });

      const { error } = await supabase.from("attendance").upsert(payload as any, { onConflict: "club_id,session_id,student_id" });
      if (error) throw error;

      setSavedAt(new Date().toISOString());
      setSavedBy(userId);
      setDirty(false);

      if (!opts?.silent) {
        setSaveMsg("Synced");
        setTimeout(() => setSaveMsg(""), 1200);
      }
    } catch {
      if (!opts?.silent) setSaveMsg("Save failed (check constraints/RLS/columns)");
    } finally {
      setSaving(false);
    }
  }

  // Auto-save debounce (ONE-SIGNAL)
  useEffect(() => {
    if (isFinalised) return;
    if (!dirty) return;
    if (!selectedSessionId || !students.length) return;
    if (!online) return;

    if (autosaveRef.current) window.clearTimeout(autosaveRef.current);

    const delay = evidenceMode ? 1500 : 800;
    autosaveRef.current = window.setTimeout(async () => {
      await saveRegister({ silent: true });
    }, delay);

    return () => {
      if (autosaveRef.current) window.clearTimeout(autosaveRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, online, evidenceMode, isFinalised, selectedSessionId, students.length]);

  // Flush immediately when back online
  useEffect(() => {
    if (!online) return;
    if (!dirty) return;
    if (isFinalised) return;
    saveRegister({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online]);

  async function finaliseRegister() {
    if (!selectedSessionId) return;
    if (!confirm("Finalise register? This will lock edits for this session.")) return;

    setSaving(true);
    setSaveMsg("");

    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id ?? null;
      const stamp = new Date().toISOString();

      const payload = students.map((st) => ({
        club_id: clubId,
        session_id: selectedSessionId,
        student_id: st.id,
        finalised_at: stamp,
        finalised_by: userId,
      }));

      const { error } = await supabase.from("attendance").upsert(payload as any, { onConflict: "club_id,session_id,student_id" });
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

  // ONE-SIGNAL: enqueue AI drafts (UI-only placeholder; wire server later)
  async function enqueueAIDraft() {
    if (isFinalised) return;

    // Always snapshot a rules-first summary immediately (instant value)
    const s = buildSummaryFromDraft();
    setSummary({ ...s, source: "rules" });

    setAiJob({ status: "queued", msg: "Queued for drafting…" });

    // Simulate background job progression (replace with real API later)
    setTimeout(() => setAiJob({ status: "running", msg: "Drafting evidence in background…" }), 500);

    setTimeout(() => {
      setAiJob({ status: "done", msg: "Drafts ready (review in Evidence mode)." });
      // In real flow: you’d fetch the job result and apply notes here (optionally).
      // For now, we keep rules-first summary.
    }, 1400);
  }

  if (checking || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-10">
          <div className="h-10 w-80 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="mt-6 h-[560px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
        </div>
      </main>
    );
  }

  const todayBadge = selectedSession?.starts_at && sameLocalDay(new Date(selectedSession.starts_at), new Date());

  // Header status: Synced / Saving / Offline / Finalised
  const headerStatus = isFinalised ? "Finalised" : !online ? "Offline" : saving ? "Saving…" : dirty ? "Saving…" : "Synced";
  const headerStatusClass =
    headerStatus === "Finalised"
      ? "border-slate-900 bg-slate-900 text-white"
      : headerStatus === "Offline"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : headerStatus === "Saving…"
          ? "border-slate-200 bg-white text-slate-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-900 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]";

  return (
    <main className="relative min-h-screen w-full overflow-x-clip text-slate-900">
      {/* Enterprise background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-100" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute -left-56 top-[-220px] h-[640px] w-[640px] rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -right-72 top-[60px] h-[700px] w-[700px] rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      {/* Sticky header (ONE-SIGNAL) */}
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 relative">
          <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">Attendance Register</div>
                <div className="text-xs text-slate-600">ONE-SIGNAL: tap presence only — evidence drafts automatically.</div>
              </div>

              <span className={cx("ml-2 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", headerStatusClass)}>
                {headerStatus}
                {headerStatus === "Synced" && savedAt ? <span className="ml-2 text-[11px] opacity-80">• {formatTime(savedAt)}</span> : null}
              </span>

              {saveMsg ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {saveMsg}
                </span>
              ) : null}
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
              onClick={exportCSV}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={finaliseRegister}
              disabled={saving || !selectedSessionId || !students.length || isFinalised}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              Finalise
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Attendance</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Designed for real sessions: mark presence fast. Evidence and summaries can be drafted later.
          </p>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Left */}
          <div className="lg:col-span-8">
            {/* Session card */}
            <div className="rounded-[22px] border border-slate-200 bg-gradient-to-b from-white via-white to-cyan-50/30 shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
              <div className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        {todayBadge ? "Today" : "Auto-selected"}
                      </span>

                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        Window: <span className="ml-2 text-slate-900">{formatTime(selectedSession?.starts_at)}</span>
                      </span>
                    </div>

                    <div className="mt-3 text-xs font-semibold tracking-widest text-slate-500">SESSION</div>
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
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
                    >
                      Change session
                    </button>

                    <button
                      type="button"
                      onClick={() => setEvidenceMode((v) => !v)}
                      className={cx(
                        "inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold",
                        evidenceMode
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-900 hover:bg-indigo-50/60"
                      )}
                      title="Show/hide evidence fields (optional)"
                    >
                      Evidence mode: {evidenceMode ? "On" : "Off"}
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
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${stats.coverage}%` }} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                    <span>{students.length} learners</span>
                    <span>{isFinalised ? "Locked" : "Editable"}</span>
                  </div>
                </div>
              </div>

              {/* KPI row */}
              <div className="grid gap-3 px-5 py-4 sm:grid-cols-4 sm:px-6">
                <KPI label="Present" value={stats.present} hint="Tapped present" />
                <KPI label="Late" value={stats.late} hint="Late arrivals" />
                <KPI label="Absent" value={stats.absent} hint="Default state" />
                <KPI label="Evidence notes" value={Object.values(draft).filter((x) => (x.note ?? "").trim().length >= 6).length} hint="Optional" />
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
                {/* Search + view */}
                <div className="mt-6 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="w-full sm:w-[360px]">
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search learner…"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {(["all", "present", "late", "absent"] as const).map((k) => (
                          <button
                            key={k}
                            type="button"
                            onClick={() => setView(k)}
                            className={cx(
                              "rounded-xl border px-3 py-2 text-sm font-semibold",
                              view === k
                                ? "border-indigo-600 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm"
                                : "border-slate-200 bg-white text-slate-900 hover:bg-indigo-50/60"
                            )}
                          >
                            {k === "all" ? "All" : k === "present" ? "Present" : k === "late" ? "Late" : "Absent"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-600">
                      ONE-SIGNAL: default is Absent • tap Present/Late only
                    </div>
                  </div>
                </div>

                {/* Register table */}
                <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Register</div>
                      <div className="mt-0.5 text-xs text-slate-600">
                        {filteredStudents.length} shown • {students.length} total
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <span>Status:</span>
                      <span className="text-slate-900">{headerStatus}</span>
                    </div>
                  </div>

                  <div className={cx("divide-y divide-slate-200", isFinalised && "opacity-95")}>
                    {filteredStudents.map((st) => {
                      const row = draft[st.id] ?? { status: "absent" as const, note: "", late_reason: "", absent_reason: "" };
                      const showEvidenceWarning =
                        evidenceMode && (row.status === "present" || row.status === "late") && row.note.trim().length < 6;

                      return (
                        <div key={st.id} className="group px-5 py-4 sm:px-6 hover:bg-indigo-50/40">
                          <div className="grid gap-3 lg:grid-cols-12 lg:items-center">
                            {/* Learner */}
                            <div className="lg:col-span-5 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900 truncate">{st.full_name}</div>
                                <StatusChip status={row.status} />
                                {showEvidenceWarning ? (
                                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900">
                                    Evidence missing
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">ID: {st.id.slice(0, 8)}…</div>
                            </div>

                            {/* ONE-SIGNAL action buttons */}
                            <div className="lg:col-span-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  disabled={isFinalised}
                                  onClick={() => setStatus(st.id, row.status === "present" ? "absent" : "present")}
                                  className={cx(
                                    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm",
                                    row.status === "present"
                                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                      : "bg-slate-900 text-white hover:bg-slate-800",
                                    isFinalised && "opacity-60"
                                  )}
                                  title="Tap to mark Present (tap again to revert to Absent)"
                                >
                                  Present
                                </button>

                                <button
                                  type="button"
                                  disabled={isFinalised}
                                  onClick={() => setStatus(st.id, row.status === "late" ? "absent" : "late")}
                                  className={cx(
                                    "inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold",
                                    row.status === "late"
                                      ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                                      : "border-slate-200 bg-white text-slate-900 hover:bg-indigo-50/60",
                                    isFinalised && "opacity-60"
                                  )}
                                  title="Optional: mark Late"
                                >
                                  Late
                                </button>
                              </div>

                              <div className="mt-1 text-xs text-slate-500">
                                {row.status === "absent" ? "Absent by default" : "Marked"}
                              </div>
                            </div>

                            {/* Evidence (optional) */}
                            <div className="lg:col-span-4">
                              {evidenceMode ? (
                                <div className="space-y-2">
                                  {/* Reason dropdowns */}
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
                                  ) : null}

                                  <input
                                    value={row.note}
                                    disabled={isFinalised}
                                    onChange={(e) => setNote(st.id, e.target.value)}
                                    placeholder="Evidence note (optional)…"
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
                                  />
                                  <div className="text-xs text-slate-500">Tip: keep it short and skill-based.</div>
                                </div>
                              ) : (
                                <div className="text-xs text-slate-500">
                                  Evidence hidden (ONE-SIGNAL mode).
                                </div>
                              )}
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

                {/* Summary panel (optional) */}
                {summary ? (
                  <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-xs font-semibold tracking-widest text-slate-500">SESSION SUMMARY</div>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            {summary.source === "ai" ? "AI Draft" : "Rules-first"}
                          </span>
                        </div>

                        <div className="mt-1 text-lg font-semibold text-slate-900">Export-ready insights</div>
                        <div className="mt-1 text-sm text-slate-600">Generated from attendance marks (and evidence, if present).</div>
                      </div>

                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
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
                      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 p-4">
                        <div className="text-[11px] font-semibold tracking-widest text-slate-500">ENGAGEMENT</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{summary.engagement}</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 p-4">
                        <div className="text-[11px] font-semibold tracking-widest text-slate-500">INTEGRITY</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{summary.integrity}</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 p-4">
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

          {/* Right: ONE-SIGNAL / AI Draft Queue */}
          <aside className="lg:col-span-4">
            <div className="rounded-[22px] border border-slate-200 bg-gradient-to-b from-white via-white to-cyan-50/30 shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
              <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                <div className="text-xs font-semibold tracking-widest text-slate-500">ONE-SIGNAL FRAMEWORK</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">Fast marking, delayed intelligence</div>
                <div className="mt-1 text-sm text-slate-600">
                  Teachers mark presence only. Evidence and summaries can be drafted after the session.
                </div>
              </div>

              <div className="space-y-3 px-5 py-4 sm:px-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-slate-900">AI Draft Queue</div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      {aiJob?.status === "idle"
                        ? "Idle"
                        : aiJob?.status === "queued"
                          ? "Queued"
                          : aiJob?.status === "running"
                            ? "Running"
                            : aiJob?.status === "done"
                              ? "Ready"
                              : "Failed"}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-slate-600">
                    {aiJob?.msg
                      ? aiJob.msg
                      : "When ready, switch on Evidence mode to review or edit drafts."}
                  </div>

                  <div className="mt-3 grid gap-2">
                    <button
                      type="button"
                      disabled={isFinalised || stats.present + stats.late === 0}
                      onClick={enqueueAIDraft}
                      className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                    >
                      Draft evidence + summary
                    </button>

                    <button
                      type="button"
                      disabled={!liveSummary}
                      onClick={() => {
                        if (!liveSummary) return;
                        setSummary({ ...liveSummary, source: "rules" });
                        setSaveMsg("Summary generated");
                        setTimeout(() => setSaveMsg(""), 1200);
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60 disabled:opacity-60"
                    >
                      Generate quick summary (rules-first)
                    </button>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                    <div className="font-semibold">Status meanings</div>
                    <div className="mt-1">• Synced: saved successfully</div>
                    <div>• Saving…: autosave in progress</div>
                    <div>• Offline: will sync when online</div>
                    <div>• Finalised: locked for compliance</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-semibold tracking-widest text-slate-500">LIVE SIGNALS</div>
                  {liveSummary ? (
                    <>
                      <div className="mt-2 text-sm font-semibold text-slate-900">{liveSummary.engagement}</div>
                      <div className="mt-1 text-sm text-slate-600">{liveSummary.integrity}</div>
                    </>
                  ) : (
                    <div className="mt-2 text-sm text-slate-600">
                      Mark a few learners present/late to unlock signals.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 p-4">
                  <div className="text-[11px] font-semibold tracking-widest text-slate-500">COMPLIANCE</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{isFinalised ? "Register locked" : "Register editable"}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {isFinalised ? `Finalised at ${formatDateTime(finalisedAt)}` : "Finalise after marking to prevent post-hoc edits."}
                  </div>
                  {finalisedBy ? <div className="mt-2 text-xs text-slate-500">Finalised by: {finalisedBy.slice(0, 8)}…</div> : null}
                </div>
              </div>
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
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
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
                      isSelected ? "bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50" : "hover:bg-indigo-50/60"
                    )}
                  >
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
