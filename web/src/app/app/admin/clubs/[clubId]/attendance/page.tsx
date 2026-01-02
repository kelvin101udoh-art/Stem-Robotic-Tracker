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

export default function AttendancePage() {
  const router = useRouter();
  const params = useParams<{ clubId: string }>();
  const clubId = params.clubId;

  const { checking, supabase } = useAdminGuard({ idleMinutes: 15 });

  const [loading, setLoading] = useState(true);

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  // Local editable register state (studentId -> {status,note})
  const [draft, setDraft] = useState<
    Record<string, { status: AttendanceRow["status"]; note: string }>
  >({});

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
    {/* Soft background */}
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100" />
      <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="absolute -left-44 top-[-160px] h-[520px] w-[520px] rounded-full bg-sky-200/35 blur-3xl" />
      <div className="absolute -right-56 top-[120px] h-[560px] w-[560px] rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="absolute left-1/3 bottom-[-220px] h-[620px] w-[620px] rounded-full bg-emerald-200/25 blur-3xl" />
    </div>

    <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Top header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              Admin • Attendance
            </span>
            {selectedSessionId ? (
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                Session active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                Select a session
              </span>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Attendance Register
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Mark presence and capture lightweight learning evidence (great for parent portfolios).
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/app/admin/clubs/${clubId}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            ← Back
          </Link>

          <button
            type="button"
            onClick={saveRegister}
            disabled={saving || !selectedSessionId || !students.length}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save register"}
          </button>
        </div>
      </div>

      {/* Session command bar */}
      <div className="mt-6 rounded-[22px] border border-slate-200/70 bg-white/85 shadow-[0_16px_50px_-40px_rgba(2,6,23,0.25)] backdrop-blur">
        <div className="flex flex-col gap-4 border-b border-slate-200/70 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold tracking-widest text-slate-500">
              CURRENT SESSION
            </div>
            <div className="mt-1 truncate text-base font-semibold text-slate-900">
              {selectedSession?.title || (sessions.length ? "Untitled session" : "No sessions")}
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {selectedSessionId ? formatDateTime(selectedSession?.starts_at) : "Create a session to begin."}
            </div>
          </div>

          <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-[560px]">
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
              <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                SESSION PICKER
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
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                  SAVE STATUS
                </div>
                {saveMsg ? (
                  <span className="text-xs font-semibold text-emerald-700">{saveMsg}</span>
                ) : (
                  <span className="text-xs font-semibold text-slate-500">
                    {saving ? "Working…" : "Ready"}
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-900">{students.length} learners</span>
                <span className="text-slate-600">
                  Coverage <span className="font-semibold text-slate-900">{stats.pct}%</span>
                </span>
              </div>

              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{ width: `${stats.pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          {[
            { label: "Present", value: stats.present, tone: "border-emerald-200 bg-emerald-50 text-emerald-900" },
            { label: "Late", value: stats.late, tone: "border-amber-200 bg-amber-50 text-amber-900" },
            { label: "Absent", value: stats.absent, tone: "border-rose-200 bg-rose-50 text-rose-900" },
            { label: "Coverage", value: `${stats.pct}%`, tone: "border-sky-200 bg-sky-50 text-sky-900" },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                  {k.label.toUpperCase()}
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${k.tone}`}>
                  {k.label}
                </span>
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                {k.value as any}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {k.label === "Coverage" ? "Percent marked (present/late)" : "Count this session"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty states */}
      {!sessions.length ? (
        <div className="mt-6 rounded-[22px] border border-slate-200/70 bg-white p-8 text-center shadow-[0_16px_50px_-40px_rgba(2,6,23,0.25)]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-2xl">
            🗓️
          </div>
          <div className="mt-4 text-lg font-semibold text-slate-900">No sessions yet</div>
          <div className="mt-1 text-sm text-slate-600">
            Create a session first, then come back to mark attendance.
          </div>
          <div className="mt-5 flex justify-center">
            <Link
              href={`/app/admin/clubs/${clubId}/sessions`}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Go to Sessions →
            </Link>
          </div>
        </div>
      ) : !students.length ? (
        <div className="mt-6 rounded-[22px] border border-slate-200/70 bg-white p-8 text-center shadow-[0_16px_50px_-40px_rgba(2,6,23,0.25)]">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-50 text-2xl">
            👥
          </div>
          <div className="mt-4 text-lg font-semibold text-slate-900">No learners found</div>
          <div className="mt-1 text-sm text-slate-600">
            Add students to this club to generate a register.
          </div>
          <div className="mt-5 flex justify-center">
            <Link
              href={`/app/admin/clubs/${clubId}/people`}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Add learners →
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Register table */}
          <div className="mt-6 overflow-hidden rounded-[22px] border border-slate-200/70 bg-white shadow-[0_16px_50px_-40px_rgba(2,6,23,0.25)]">
            <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <div className="text-sm font-semibold text-slate-900">Learner Register</div>
                <div className="mt-0.5 text-xs text-slate-600">
                  Mark status + capture a short learning note (evidence-ready).
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-600">
                {students.length} learners • Session:{" "}
                <span className="text-slate-900">{selectedSession?.title || "Untitled"}</span>
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {students.map((st) => {
                const row = draft[st.id] ?? { status: "absent" as const, note: "" };

                return (
                  <div key={st.id} className="px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-sm font-bold text-slate-700">
                            {st.full_name?.trim()?.[0]?.toUpperCase() || "L"}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-base font-semibold text-slate-900">
                              {st.full_name}
                            </div>
                            <div className="mt-1 inline-flex items-center gap-2">
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusPill(row.status)}`}>
                                {row.status.toUpperCase()}
                              </span>
                              <span className="text-xs text-slate-500">Evidence note optional</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-[11px] font-semibold tracking-widest text-slate-500">
                            NOTE (OPTIONAL)
                          </label>
                          <textarea
                            value={row.note}
                            onChange={(e) =>
                              setDraft((prev) => ({
                                ...prev,
                                [st.id]: { ...row, note: e.target.value },
                              }))
                            }
                            placeholder="Example: improved teamwork, used sensors correctly, better gear alignment…"
                            rows={2}
                            className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        {(["present", "late", "absent"] as const).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                [st.id]: { ...row, status: s },
                              }))
                            }
                            className={[
                              "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                              row.status === s
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            {s === "present" ? "Present" : s === "late" ? "Late" : "Absent"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer helper */}
          <div className="mt-4 rounded-[22px] border border-slate-200/70 bg-white/85 p-5 shadow-[0_16px_50px_-40px_rgba(2,6,23,0.18)] backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Teacher tip:</span>{" "}
                Use short, skill-based notes (teamwork, sensors, gears, coding logic). These feed directly into Reports.
              </div>
              <Link
                href={`/app/admin/clubs/${clubId}/reports`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Open Reports →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  </main>
);



}
