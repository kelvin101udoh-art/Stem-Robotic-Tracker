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
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              ATTENDANCE
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              Register & session notes
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Mark learners present/absent/late and capture lightweight evidence.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/app/admin/clubs/${clubId}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              ← Back
            </Link>

            <button
              type="button"
              onClick={saveRegister}
              disabled={saving || !selectedSessionId}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save register"}
            </button>
          </div>
        </div>

        {/* Controls row */}
        <div className="mt-5 grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-widest text-slate-500">
                  SESSION
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {selectedSession?.title || "Untitled session"}
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  {formatDateTime(selectedSession?.starts_at)}
                </div>
              </div>

              <div className="w-full sm:w-[340px]">
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900"
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
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold tracking-widest text-slate-500">
                SNAPSHOT
              </div>
              <span className="text-xs font-semibold text-slate-600">
                Coverage: <span className="text-slate-900">{stats.pct}%</span>
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                  PRESENT
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {stats.present}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                  LATE
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {stats.late}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                  ABSENT
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {stats.absent}
                </div>
              </div>
            </div>

            {saveMsg ? (
              <div className="mt-3 text-sm font-semibold text-slate-700">
                {saveMsg}
              </div>
            ) : null}
          </div>
        </div>

        {/* Register */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6">
            <div className="text-sm font-semibold text-slate-900">
              Learner register
            </div>
            <div className="text-xs font-semibold text-slate-600">
              {students.length} learners
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {students.map((st) => {
              const row = draft[st.id] ?? { status: "absent" as const, note: "" };

              return (
                <div
                  key={st.id}
                  className="px-4 py-4 sm:px-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">
                        {st.full_name}
                      </div>
                      <div className="mt-1 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold">
                        <span className={["rounded-full border px-2.5 py-1", statusPill(row.status)].join(" ")}>
                          {row.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center gap-2">
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
                            "rounded-xl border px-3 py-2 text-sm font-semibold transition",
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

                  {/* Notes */}
                  <div className="mt-3">
                    <label className="block text-xs font-semibold tracking-widest text-slate-500">
                      NOTE (OPTIONAL)
                    </label>
                    <input
                      value={row.note}
                      onChange={(e) =>
                        setDraft((prev) => ({
                          ...prev,
                          [st.id]: { ...row, note: e.target.value },
                        }))
                      }
                      placeholder="1–2 lines: what improved today? (teamwork, sensors, gears...)"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer helper */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Pro tip:</span>{" "}
          Save after the session, then reuse notes in Reports → Parent Portfolio.
        </div>
      </div>
    </main>
  );
}
