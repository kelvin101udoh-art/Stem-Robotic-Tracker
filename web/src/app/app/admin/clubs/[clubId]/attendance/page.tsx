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

type AttendanceRow = {
  id: string;
  club_id: string;
  session_id: string;
  student_id: string;
  status: "present" | "absent" | "late";
  note: string | null;
  updated_at?: string;
};

const UI_VERSION = "AI_ATTENDANCE_V4"; // 🔥 if you don't see this, you're not rendering this file.

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

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function pickDefaultSessionId(sessions: SessionRow[]) {
  if (!sessions.length) return "";
  const now = new Date();

  // 1) Today’s session (closest to now)
  const today = sessions
    .filter((s) => s.starts_at && isSameLocalDay(new Date(s.starts_at), now))
    .sort((x, y) => {
      const ax = x.starts_at ? +new Date(x.starts_at) : 0;
      const ay = y.starts_at ? +new Date(y.starts_at) : 0;
      return Math.abs(ax - +now) - Math.abs(ay - +now);
    })[0];
  if (today?.id) return today.id;

  // 2) Next upcoming
  const upcoming = sessions
    .filter((s) => s.starts_at && new Date(s.starts_at).getTime() >= now.getTime())
    .sort((a, b) => +new Date(a.starts_at!) - +new Date(b.starts_at!))[0];
  if (upcoming?.id) return upcoming.id;

  // 3) Latest past
  return sessions[0]?.id ?? "";
}

function badgeForStatus(status: AttendanceRow["status"]) {
  if (status === "present") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (status === "late") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-rose-200 bg-rose-50 text-rose-900";
}

function StatusPill({ status }: { status: AttendanceRow["status"] }) {
  const label = status === "present" ? "Present" : status === "late" ? "Late" : "Absent";
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        badgeForStatus(status)
      )}
    >
      {label}
    </span>
  );
}

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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_60px_-48px_rgba(2,6,23,0.35)]">
      <div className="text-[11px] font-semibold tracking-widest text-slate-500">{label.toUpperCase()}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-600">{hint}</div> : null}
    </div>
  );
}

function IconDot({ tone }: { tone: "good" | "warn" | "info" }) {
  return (
    <span
      className={cx(
        "h-2.5 w-2.5 rounded-full",
        tone === "good" ? "bg-emerald-500/80" : tone === "warn" ? "bg-amber-500/80" : "bg-slate-400"
      )}
    />
  );
}

function InsightCard({
  tone,
  title,
  desc,
  actionLabel,
  onAction,
}: {
  tone: "good" | "warn" | "info";
  title: string;
  desc: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <IconDot tone={tone} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-600">{desc}</div>
          {actionLabel && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="mt-3 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function downloadCSV(filename: string, rows: Array<Record<string, any>>) {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (v: any) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

  const [draft, setDraft] = useState<Record<string, { status: AttendanceRow["status"]; note: string }>>({});
  const [dirty, setDirty] = useState(false);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "present" | "late" | "absent">("all");

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string>("");

  // ✅ Dev signal: if you don't see this in console, you're not rendering this file
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(`[${UI_VERSION}] rendered for clubId=${clubId}`);
  }, [clubId]);

  // Load sessions + students
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
          .limit(50);

        if (sErr) throw sErr;

        const { data: stData, error: stErr } = await supabase
          .from("students")
          .select("id, club_id, full_name, created_at")
          .eq("club_id", clubId)
          .order("full_name", { ascending: true });

        if (stErr) throw stErr;
        if (cancelled) return;

        const sessionsList = (sData ?? []) as SessionRow[];
        const studentsList = (stData ?? []) as StudentRow[];

        setSessions(sessionsList);
        setStudents(studentsList);

        // ✅ Auto-pick: Today → Next → Latest
        const auto = pickDefaultSessionId(sessionsList);
        setSelectedSessionId((prev) => prev || auto);
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

  // Load attendance rows for selected session
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
          map[r.student_id] = { status: r.status ?? "absent", note: r.note ?? "" };
        });

        // Ensure every student has a row in the draft
        const merged: typeof map = { ...map };
        students.forEach((st) => {
          if (!merged[st.id]) merged[st.id] = { status: "absent", note: "" };
        });

        setDraft(merged);
        setDirty(false);
      } catch {
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

    const notesCount = entries.filter((x) => (x.note ?? "").trim().length >= 6).length;
    const pct = total ? Math.round(((present + late) / total) * 100) : 0;

    // “AI” heuristics (no external AI yet)
    const missingEvidence = entries.filter((x) => x.status !== "absent" && (x.note ?? "").trim().length < 6).length;
    const riskFlags = Math.min(9, (late > 0 ? 1 : 0) + (absent > Math.max(1, Math.floor(total * 0.25)) ? 1 : 0) + (missingEvidence > 0 ? 1 : 0));

    return { present, late, absent, total, pct, notesCount, missingEvidence, riskFlags };
  }, [draft]);

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

  function aiFillEvidenceForVisible() {
    // lightweight “AI-style” templates (you can later replace with a real AI call)
    const templates = [
      "Demonstrated strong teamwork and communication during build steps.",
      "Improved debugging logic and followed instructions with focus.",
      "Showed progress with sensors/mechanics and accuracy in task execution.",
    ];

    setDraft((prev) => {
      const next = { ...prev };
      let t = 0;
      filteredStudents.forEach((st) => {
        const row = next[st.id] ?? { status: "absent" as const, note: "" };
        if (row.status !== "absent" && !row.note.trim()) {
          next[st.id] = { ...row, note: templates[t % templates.length] };
          t++;
        }
      });
      return next;
    });
    setDirty(true);
  }

  async function saveRegister() {
    if (!selectedSessionId) return;
    setSaving(true);
    setSaveMsg("");

    try {
      const payload = students.map((st) => ({
        club_id: clubId,
        session_id: selectedSessionId,
        student_id: st.id,
        status: draft[st.id]?.status ?? "absent",
        note: draft[st.id]?.note ?? "",
      }));

      const { error } = await supabase
        .from("attendance")
        .upsert(payload, { onConflict: "club_id,session_id,student_id" });

      if (error) throw error;

      setSaveMsg("Saved");
      setDirty(false);
      setTimeout(() => setSaveMsg(""), 1400);
    } catch {
      setSaveMsg("Save failed (check constraints/RLS)");
    } finally {
      setSaving(false);
    }
  }

  function exportCSV() {
    const rows = students.map((st) => {
      const row = draft[st.id] ?? { status: "absent" as const, note: "" };
      return {
        student_name: st.full_name,
        status: row.status,
        evidence_note: row.note,
        session_title: selectedSession?.title ?? "",
        session_starts_at: selectedSession?.starts_at ?? "",
        club_id: clubId,
        session_id: selectedSessionId,
        student_id: st.id,
      };
    });

    const safeTitle = (selectedSession?.title ?? "session").replaceAll(/[^\w-]+/g, "_");
    downloadCSV(`attendance_${safeTitle}.csv`, rows);
  }

  if (checking || loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-10">
          <div className="h-10 w-96 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="mt-6 h-[620px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-clip text-slate-900">
      {/* Executive / enterprise background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-100" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:26px_26px]" />
        <div className="absolute -left-56 top-[-220px] h-[640px] w-[640px] rounded-full bg-sky-200/25 blur-3xl" />
        <div className="absolute -right-72 top-[60px] h-[700px] w-[700px] rounded-full bg-indigo-200/20 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Top command header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                AI Attendance Command Center
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                {UI_VERSION}
              </span>
              {dirty ? (
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                  Unsaved changes
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                  Synced
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Attendance Intelligence
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              High-integrity registers + evidence capture with AI-style assistance for education reporting.
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
              onClick={exportCSV}
              disabled={!selectedSessionId || !students.length}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
            >
              Export CSV
            </button>

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

        {/* Session context + KPIs + AI insights */}
        <div className="mt-6 grid gap-4 xl:grid-cols-12">
          {/* Context + KPIs */}
          <div className="xl:col-span-8">
            <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_60px_-44px_rgba(2,6,23,0.35)] overflow-hidden">
              {/* Context bar */}
              <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">SESSION CONTEXT</div>
                    <div className="mt-1 text-base font-semibold text-slate-900">
                      {selectedSession?.title || (sessions.length ? "Untitled session" : "No sessions")}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {selectedSessionId ? formatDateTime(selectedSession?.starts_at) : "Create a session to begin."}
                    </div>
                  </div>

                  <div className="w-full lg:w-[420px]">
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-semibold tracking-widest text-slate-500">SESSION</div>
                        <span className="text-xs font-semibold text-slate-600">
                          Coverage <span className="text-slate-900">{stats.pct}%</span>
                        </span>
                      </div>
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
              </div>

              {/* KPI grid */}
              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
                <KPI label="Present" value={stats.present} hint="Confirmed present" />
                <KPI label="Late" value={stats.late} hint="Late arrivals" />
                <KPI label="Absent" value={stats.absent} hint="Not in session" />
                <KPI label="Evidence notes" value={stats.notesCount} hint="Notes ≥ 6 chars" />
              </div>
            </div>
          </div>

          {/* AI Insights panel */}
          <div className="xl:col-span-4">
            <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_60px_-44px_rgba(2,6,23,0.35)] overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">AI INSIGHTS</div>
                    <div className="mt-1 text-base font-semibold text-slate-900">Integrity & coaching signals</div>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    Preview layer
                  </span>
                </div>
              </div>

              <div className="grid gap-3 p-5 sm:p-6">
                <InsightCard
                  tone={stats.missingEvidence ? "warn" : "good"}
                  title={stats.missingEvidence ? "Evidence missing" : "Evidence quality OK"}
                  desc={
                    stats.missingEvidence
                      ? `${stats.missingEvidence} learner(s) marked present/late with empty notes.`
                      : "Notes are captured for present/late learners."
                  }
                  actionLabel={stats.missingEvidence ? "AI-fill missing evidence notes" : undefined}
                  onAction={stats.missingEvidence ? aiFillEvidenceForVisible : undefined}
                />

                <InsightCard
                  tone={stats.absent > Math.max(1, Math.floor(stats.total * 0.25)) ? "warn" : "info"}
                  title="Attendance pattern"
                  desc={
                    stats.total
                      ? `Coverage is ${stats.pct}%. Absent count: ${stats.absent}.`
                      : "No register loaded."
                  }
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[11px] font-semibold tracking-widest text-slate-500">RECOMMENDED NEXT</div>
                  <ul className="mt-2 space-y-2 text-sm text-slate-700">
                    <li>• Mark register first, then add evidence notes.</li>
                    <li>• Use AI-fill to standardise reporting language.</li>
                    <li>• Export CSV for audits or school reporting.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Empty states */}
        {!sessions.length ? (
          <div className="mt-6 rounded-[22px] border border-slate-200 bg-white p-8 text-center shadow-[0_16px_60px_-44px_rgba(2,6,23,0.35)]">
            <div className="text-base font-semibold text-slate-900">No sessions available</div>
            <div className="mt-1 text-sm text-slate-600">Create a session first, then take attendance.</div>
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
          <div className="mt-6 rounded-[22px] border border-slate-200 bg-white p-8 text-center shadow-[0_16px_60px_-44px_rgba(2,6,23,0.35)]">
            <div className="text-base font-semibold text-slate-900">No learners in this club</div>
            <div className="mt-1 text-sm text-slate-600">Add learners to generate a register.</div>
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
            {/* Toolbar */}
            <div className="mt-6 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_16px_60px_-44px_rgba(2,6,23,0.25)]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="w-full sm:w-[380px]">
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search learner or evidence note…"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
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
                    Mark visible Present
                  </button>
                  <button
                    type="button"
                    onClick={() => bulkSet("late")}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    Mark visible Late
                  </button>
                  <button
                    type="button"
                    onClick={() => bulkSet("absent")}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    Mark visible Absent
                  </button>
                  <button
                    type="button"
                    onClick={aiFillEvidenceForVisible}
                    className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    title="Fills missing evidence notes for present/late learners (lightweight AI-style templates)"
                  >
                    AI Fill Evidence
                  </button>
                </div>
              </div>
            </div>

            {/* Enterprise register */}
            <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_60px_-44px_rgba(2,6,23,0.35)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Register</div>
                  <div className="mt-0.5 text-xs text-slate-600">
                    {filteredStudents.length} shown • {students.length} total
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
                    <span className="h-2 w-2 rounded-full bg-slate-900/70" />
                    Live draft
                  </span>
                </div>
              </div>

              <div className="hidden lg:grid grid-cols-12 gap-3 bg-slate-50 px-6 py-3 text-[11px] font-semibold tracking-widest text-slate-500">
                <div className="col-span-4">LEARNER</div>
                <div className="col-span-3">STATUS</div>
                <div className="col-span-5">EVIDENCE NOTE</div>
              </div>

              <div className="divide-y divide-slate-200">
                {filteredStudents.map((st) => {
                  const row = draft[st.id] ?? { status: "absent" as const, note: "" };

                  return (
                    <div key={st.id} className="px-5 py-4 sm:px-6">
                      <div className="grid gap-3 lg:grid-cols-12 lg:items-center">
                        <div className="lg:col-span-4 min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">{st.full_name}</div>
                          <div className="mt-0.5 text-xs text-slate-500">ID: {st.id.slice(0, 8)}…</div>
                        </div>

                        <div className="lg:col-span-3 flex flex-wrap items-center gap-2">
                          <StatusPill status={row.status} />
                          <div className="flex items-center gap-1">
                            {(["present", "late", "absent"] as const).map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => setStatus(st.id, s)}
                                className={cx(
                                  "rounded-lg border px-3 py-1.5 text-xs font-semibold",
                                  row.status === s
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                                )}
                                title={s}
                              >
                                {s === "present" ? "Present" : s === "late" ? "Late" : "Absent"}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="lg:col-span-5">
                          <input
                            value={row.note}
                            onChange={(e) => setNote(st.id, e.target.value)}
                            placeholder="Evidence: skills, teamwork, debugging, sensors, mechanics…"
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
                    <div className="mt-1 text-sm text-slate-600">Clear search or change the filter.</div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Sticky save bar (enterprise feel) */}
            <div className="mt-4 sticky bottom-4 z-10">
              <div className="mx-auto max-w-[1400px] rounded-[22px] border border-slate-200 bg-white/90 px-5 py-4 shadow-[0_18px_70px_-52px_rgba(2,6,23,0.45)] backdrop-blur">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">AI standard:</span>{" "}
                    capture skill-based evidence notes for present/late learners (audit-ready).
                    {dirty ? <span className="ml-2 font-semibold text-amber-900">Unsaved changes</span> : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={saveRegister}
                      disabled={saving || !selectedSessionId || !students.length}
                      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save register"}
                    </button>

                    <button
                      type="button"
                      onClick={exportCSV}
                      disabled={!selectedSessionId || !students.length}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
                    >
                      Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
