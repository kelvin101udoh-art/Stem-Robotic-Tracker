// web/src/app/app/admin/clubs/[clubId]/attendance/register/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

type AttendanceStatus = "present" | "absent" | "late";

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

function sameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function pickTodaySession(sessions: SessionRow[]) {
  const now = new Date();
  const today = sessions
    .map((s) => ({ s, dt: s.starts_at ? new Date(s.starts_at) : null }))
    .filter((x) => x.dt && sameLocalDay(x.dt, now)) as Array<{ s: SessionRow; dt: Date }>;

  if (today.length) {
    today.sort((a, b) => a.dt.getTime() - b.dt.getTime());
    return today[0].s;
  }
  return null;
}

export default function AttendanceRegisterTodayPage() {
  const router = useRouter();
  const params = useParams<{ clubId: string }>();
  const clubId = params.clubId;

  // If later you build teacher/staff guard, swap this.
  const { checking, supabase } = useAdminGuard({ idleMinutes: 30 });

  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string>("");

  const [todaySession, setTodaySession] = useState<SessionRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [present, setPresent] = useState<Record<string, boolean>>({});

  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [online, setOnline] = useState(true);
  const autosaveRef = useRef<number | null>(null);

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

  // Load today's session + enrolled students
  useEffect(() => {
    if (checking) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setFatalError("");
      setSaveMsg("");

      try {
        const now = new Date();
        const from = startOfLocalDay(now).toISOString();
        const to = endOfLocalDay(now).toISOString();

        // 1) Only pull sessions "today"
        const sRes = await supabase
          .from("sessions")
          .select("id, club_id, title, starts_at")
          .eq("club_id", clubId)
          .gte("starts_at", from)
          .lte("starts_at", to)
          .order("starts_at", { ascending: true })
          .limit(20);

        if (sRes.error) throw sRes.error;

        const session = pickTodaySession((sRes.data ?? []) as SessionRow[]);
        if (!session) {
          if (cancelled) return;
          setTodaySession(null);
          setStudents([]);
          setPresent({});
          return;
        }

        if (cancelled) return;
        setTodaySession(session);

        // 2) Pull who is meant to participate
        // ✅ Use the table we recommended earlier (it is NOT "enrollments")
        // If you created: public.club_student_enrolments
        const eRes = await supabase
          .from("club_student_enrolments")
          .select("student_id, is_active")
          .eq("club_id", clubId)
          .eq("is_active", true);

        // --- If you instead created session_participants, swap to this:
        // const eRes = await supabase
        //   .from("session_participants")
        //   .select("student_id")
        //   .eq("club_id", clubId)
        //   .eq("session_id", session.id);
        // --------------------------------------------

        if (eRes.error) throw eRes.error;

        const enrolledIds = (eRes.data ?? [])
          .map((x: any) => x.student_id)
          .filter(Boolean);

        if (!enrolledIds.length) {
          if (cancelled) return;
          setStudents([]);
          setPresent({});
          return;
        }

        // 3) Fetch student rows
        const stRes = await supabase
          .from("students")
          .select("id, club_id, full_name")
          .eq("club_id", clubId)
          .in("id", enrolledIds)
          .order("full_name", { ascending: true });

        if (stRes.error) throw stRes.error;

        // 4) Load existing attendance marks (if already started)
        const aRes = await supabase
          .from("attendance")
          .select("student_id, status")
          .eq("club_id", clubId)
          .eq("session_id", session.id)
          .in("student_id", enrolledIds);

        if (aRes.error) throw aRes.error;

        const presentMap: Record<string, boolean> = {};
        (aRes.data ?? []).forEach((r: any) => {
          if (r.status === "present") presentMap[r.student_id] = true;
        });

        if (cancelled) return;
        setStudents((stRes.data ?? []) as StudentRow[]);
        setPresent(presentMap);
      } catch (e: any) {
        // ❗ Do NOT auto-redirect back (it hides the real problem).
        const msg =
          (e?.message as string) ||
          "Load failed (check table names, RLS, or session data).";
        if (!cancelled) setFatalError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [checking, clubId, supabase]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.full_name.toLowerCase().includes(q));
  }, [students, query]);

  const presentCount = useMemo(
    () => Object.values(present).filter(Boolean).length,
    [present]
  );
  const total = students.length;

  function togglePresent(studentId: string) {
    setPresent((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  }

  // Autosave debounce: only writes PRESENT marks (fast + minimal)
  useEffect(() => {
    if (!todaySession) return;
    if (!online) return;
    if (!students.length) return;

    if (autosaveRef.current) window.clearTimeout(autosaveRef.current);

    autosaveRef.current = window.setTimeout(async () => {
      const presentIds = Object.entries(present)
        .filter(([, v]) => v)
        .map(([id]) => id);

      if (!presentIds.length) return;

      try {
        const { data: u } = await supabase.auth.getUser();
        const userId = u.user?.id ?? null;

        setSaveMsg("Saving…");

        const payload = presentIds.map((student_id) => ({
          club_id: clubId,
          session_id: todaySession.id,
          student_id,
          status: "present" as const,
          saved_at: new Date().toISOString(),
          saved_by: userId,
        }));

        const { error } = await supabase.from("attendance").upsert(payload as any, {
          onConflict: "club_id,session_id,student_id",
        });

        if (error) throw error;

        setSaveMsg("Synced");
        setTimeout(() => setSaveMsg(""), 700);
      } catch {
        // keep silent, but show a small hint
        setSaveMsg("Offline / not saved");
        setTimeout(() => setSaveMsg(""), 1000);
      }
    }, 700);

    return () => {
      if (autosaveRef.current) window.clearTimeout(autosaveRef.current);
    };
  }, [present, todaySession, online, students.length, supabase, clubId]);

  // Complete register: writes ABSENT for everyone not marked present + stamps saved_at
  async function completeRegister() {
    if (!todaySession) return;
    if (!students.length) return;

    setSaving(true);
    setSaveMsg("");

    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id ?? null;
      const stamp = new Date().toISOString();

      const presentIds = new Set(
        Object.entries(present)
          .filter(([, v]) => v)
          .map(([id]) => id)
      );

      const payload = students.map((st) => ({
        club_id: clubId,
        session_id: todaySession.id,
        student_id: st.id,
        status: (presentIds.has(st.id) ? "present" : "absent") as AttendanceStatus,
        saved_at: stamp,
        saved_by: userId,
      }));

      const { error } = await supabase.from("attendance").upsert(payload as any, {
        onConflict: "club_id,session_id,student_id",
      });

      if (error) throw error;

      setSaveMsg("Register completed — dashboard updating");
      setTimeout(() => setSaveMsg(""), 1200);

      router.push(`/app/admin/clubs/${clubId}/attendance`);
    } catch {
      setSaveMsg("Complete failed (check RLS / unique constraint / columns)");
    } finally {
      setSaving(false);
    }
  }

  if (checking || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-100">
        <div className="mx-auto max-w-[1000px] px-4 py-10">
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
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-3 px-4 py-3 sm:px-6 relative">
          <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />

          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Today’s Register</div>
            <div className="text-xs text-slate-600">
              Only action: mark Present. Everyone else becomes Absent on completion.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/admin/clubs/${clubId}/attendance`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
            >
              Back to Dashboard
            </Link>

            <button
              type="button"
              onClick={completeRegister}
              disabled={!todaySession || !students.length || saving}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? "Completing…" : "Complete register"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6">
        {fatalError ? (
          <div className="mb-4 rounded-[18px] border border-amber-200 bg-amber-50 p-4">
            <div className="text-sm font-semibold text-amber-900">Register failed to load</div>
            <div className="mt-1 text-sm text-amber-900/90">
              {fatalError}
            </div>
            <div className="mt-3 text-xs text-amber-900/80">
              Most common cause: you queried a table that doesn’t exist (e.g. “enrollments”). This page expects{" "}
              <span className="font-semibold">club_student_enrolments</span> (or switch to session_participants).
            </div>
          </div>
        ) : null}

        {!todaySession ? (
          <div className="rounded-[22px] border border-slate-200 bg-white p-10 text-center shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
            <div className="text-lg font-semibold text-slate-900">No session scheduled for today</div>
            <div className="mt-1 text-sm text-slate-600">Create a session for today to open a register.</div>
            <div className="mt-6 flex justify-center">
              <Link
                href={`/app/admin/clubs/${clubId}/sessions`}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Go to Sessions
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Session header */}
            <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-semibold tracking-widest text-slate-500">SESSION</div>
                  <div className="mt-1 text-xl font-semibold text-slate-900">
                    {todaySession.title || "Untitled session"}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{formatDateTime(todaySession.starts_at)}</div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    Present: <span className="ml-2 text-slate-900">{presentCount}</span>
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                    Total: <span className="ml-2 text-slate-900">{total}</span>
                  </span>
                  <span
                    className={cx(
                      "rounded-full border px-3 py-1 text-xs font-semibold",
                      online
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : "border-amber-200 bg-amber-50 text-amber-900"
                    )}
                  >
                    {online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              {saveMsg ? (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {saveMsg}
                </div>
              ) : null}

              {/* Search */}
              <div className="mt-4">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search student name…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                />
                <div className="mt-2 text-xs text-slate-500">
                  Tip: type 2–3 letters and tap Present quickly.
                </div>
              </div>
            </div>

            {/* Register list */}
            <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
              <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Learners</div>
                  <div className="mt-0.5 text-xs text-slate-600">{filtered.length} shown</div>
                </div>
                <div className="text-xs font-semibold text-slate-600">Only action: Present</div>
              </div>

              <div className="divide-y divide-slate-200">
                {filtered.length ? (
                  filtered.map((st) => {
                    const isPresent = !!present[st.id];
                    return (
                      <div key={st.id} className="px-5 py-4 sm:px-6 hover:bg-indigo-50/40">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{st.full_name}</div>
                            <div className="mt-0.5 text-xs text-slate-500">ID: {st.id.slice(0, 8)}…</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => togglePresent(st.id)}
                            className={cx(
                              "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition",
                              isPresent
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-slate-900 text-white hover:bg-slate-800"
                            )}
                            title="Tap to toggle Present"
                          >
                            {isPresent ? "Present ✓" : "Mark Present"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-6 py-10 text-center">
                    <div className="text-sm font-semibold text-slate-900">No results</div>
                    <div className="mt-1 text-sm text-slate-600">Clear the search input.</div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer helper */}
            <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
              <div className="text-sm font-semibold text-slate-900">
                What happens when you click “Complete register”?
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Everyone not marked Present becomes Absent automatically. Attendance analytics will appear on the Attendance Dashboard.
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
