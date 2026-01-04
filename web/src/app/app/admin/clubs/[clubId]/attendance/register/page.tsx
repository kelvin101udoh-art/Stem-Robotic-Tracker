//  web/src/app/app/admin/clubs/[clubId]/attendance/register/page.tsx

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
  duration_minutes?: number | null; // ✅ NEW
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

  if (!today.length) return null;
  today.sort((a, b) => a.dt.getTime() - b.dt.getTime());
  return today[0].s;
}

function computeSessionEnd(session: SessionRow, fallbackMinutes = 90) {
  const start = session.starts_at ? new Date(session.starts_at) : null;
  if (!start) return null;

  const mins =
    typeof session.duration_minutes === "number" && session.duration_minutes > 0
      ? session.duration_minutes
      : fallbackMinutes;

  return new Date(start.getTime() + mins * 60_000);
}

function msToClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

const FINALISE_QUEUE_KEY = "attendance_register_finalise_queue_v1";

type QueuedFinalise = {
  clubId: string;
  sessionId: string;
  stamp: string;
  presentIds: string[];
};

export default function AttendanceRegisterTodayPage() {
  const router = useRouter();
  const params = useParams<{ clubId: string }>();
  const clubId = params.clubId;

  // Later you can swap to a teacher/staff guard
  const { checking, supabase } = useAdminGuard({ idleMinutes: 30 });

  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string>("");

  const [todaySession, setTodaySession] = useState<SessionRow | null>(null);
  const [sessionEndAt, setSessionEndAt] = useState<Date | null>(null);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [present, setPresent] = useState<Record<string, boolean>>({});

  const [query, setQuery] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  const [online, setOnline] = useState(true);
  const autosaveRef = useRef<number | null>(null);

  const [remainingMs, setRemainingMs] = useState<number>(0);
  const finalisingRef = useRef(false);

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

  // Helper: safe query sessions with duration_minutes
  async function fetchTodaySessionsSafe(from: string, to: string) {
    // Try including duration_minutes (new column)
    const rich = await supabase
      .from("sessions")
      .select("id, club_id, title, starts_at, duration_minutes")
      .eq("club_id", clubId)
      .gte("starts_at", from)
      .lte("starts_at", to)
      .order("starts_at", { ascending: true })
      .limit(20);

    if (!rich.error) return (rich.data ?? []) as SessionRow[];

    // Fallback minimal select (if migrations not applied yet)
    const basic = await supabase
      .from("sessions")
      .select("id, club_id, title, starts_at")
      .eq("club_id", clubId)
      .gte("starts_at", from)
      .lte("starts_at", to)
      .order("starts_at", { ascending: true })
      .limit(20);

    if (basic.error) throw basic.error;
    return (basic.data ?? []) as SessionRow[];
  }

  function queueFinaliseOffline(sessionId: string, presentIds: string[]) {
    try {
      const stamp = new Date().toISOString();
      const item: QueuedFinalise = { clubId, sessionId, stamp, presentIds };
      const raw = localStorage.getItem(FINALISE_QUEUE_KEY);
      const arr = raw ? (JSON.parse(raw) as QueuedFinalise[]) : [];
      const next = [
        ...arr.filter((x) => !(x.clubId === clubId && x.sessionId === sessionId)),
        item,
      ];
      localStorage.setItem(FINALISE_QUEUE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  async function finaliseRegisterAuto(opts: { reason: "timer" | "resume" }) {
    if (!todaySession) return;
    if (!students.length) return;
    if (finalisingRef.current) return;
    finalisingRef.current = true;

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
        finalised_at: stamp,
        finalised_by: userId,
      }));

      const { error } = await supabase.from("attendance").upsert(payload as any, {
        onConflict: "club_id,session_id,student_id",
      });
      if (error) throw error;

      // Remove queue item if exists
      try {
        const raw = localStorage.getItem(FINALISE_QUEUE_KEY);
        if (raw) {
          const arr = JSON.parse(raw) as QueuedFinalise[];
          const next = arr.filter((x) => !(x.clubId === clubId && x.sessionId === todaySession.id));
          localStorage.setItem(FINALISE_QUEUE_KEY, JSON.stringify(next));
        }
      } catch {
        // ignore
      }

      setSaveMsg("Register auto-finalised ✓");
      setTimeout(() => setSaveMsg(""), 900);

      router.replace(`/app/admin/clubs/${clubId}/attendance`);
    } catch {
      setSaveMsg("Auto-finalise failed (RLS/constraint).");
      setTimeout(() => setSaveMsg(""), 1400);
    } finally {
      finalisingRef.current = false;
    }
  }

  // Load today session + participants + existing present marks + finalise state
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

        const sessionsToday = await fetchTodaySessionsSafe(from, to);
        const session = pickTodaySession(sessionsToday);

        if (!session) {
          if (!cancelled) {
            setTodaySession(null);
            setSessionEndAt(null);
            setStudents([]);
            setPresent({});
          }
          return;
        }

        const endAt = computeSessionEnd(session, 90);
        if (!endAt) throw new Error("Session has no valid start time.");
        if (!cancelled) {
          setTodaySession(session);
          setSessionEndAt(endAt);
        }

        // ✅ Use session_participants (your real schema)
        const pRes = await supabase
          .from("session_participants")
          .select("student_id")
          .eq("club_id", clubId)
          .eq("session_id", session.id);

        if (pRes.error) throw pRes.error;

        const participantIds = (pRes.data ?? []).map((x: any) => x.student_id).filter(Boolean);

        if (!participantIds.length) {
          if (!cancelled) {
            setStudents([]);
            setPresent({});
          }
          return;
        }

        const stRes = await supabase
          .from("students")
          .select("id, club_id, full_name")
          .eq("club_id", clubId)
          .in("id", participantIds)
          .order("full_name", { ascending: true });

        if (stRes.error) throw stRes.error;

        // If finalised already -> do not show register
        const finRes = await supabase
          .from("attendance")
          .select("finalised_at")
          .eq("club_id", clubId)
          .eq("session_id", session.id)
          .not("finalised_at", "is", null)
          .limit(1);

        if (finRes.error) throw finRes.error;

        if ((finRes.data ?? []).length > 0) {
          router.replace(`/app/admin/clubs/${clubId}/attendance`);
          return;
        }

        const aRes = await supabase
          .from("attendance")
          .select("student_id, status")
          .eq("club_id", clubId)
          .eq("session_id", session.id)
          .in("student_id", participantIds);

        if (aRes.error) throw aRes.error;

        const presentMap: Record<string, boolean> = {};
        (aRes.data ?? []).forEach((r: any) => {
          if (r.status === "present") presentMap[r.student_id] = true;
        });

        if (cancelled) return;
        setStudents((stRes.data ?? []) as StudentRow[]);
        setPresent(presentMap);
      } catch (e: any) {
        if (!cancelled) {
          setFatalError(
            e?.message ||
              "Load failed (check session_participants table, RLS, session data)."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [checking, clubId, supabase, router]);

  // Countdown + auto-finalise at end time
  useEffect(() => {
    if (!todaySession || !sessionEndAt) return;

    const tick = () => {
      const now = Date.now();
      const ms = sessionEndAt.getTime() - now;
      setRemainingMs(ms);

      if (ms <= 0) {
        const presentIds = Object.entries(present)
          .filter(([, v]) => v)
          .map(([id]) => id);

        if (!online) {
          setSaveMsg("Offline — will auto-finalise when online");
          queueFinaliseOffline(todaySession.id, presentIds);
          return;
        }

        finaliseRegisterAuto({ reason: "timer" });
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [todaySession, sessionEndAt, online, present]);

  // Resume queued finalise when back online
  useEffect(() => {
    if (!online) return;
    if (!todaySession || !sessionEndAt) return;
    if (Date.now() < sessionEndAt.getTime()) return;

    try {
      const raw = localStorage.getItem(FINALISE_QUEUE_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw) as QueuedFinalise[];
      const hit = arr.find((x) => x.clubId === clubId && x.sessionId === todaySession.id);
      if (!hit) return;

      const restored: Record<string, boolean> = {};
      hit.presentIds.forEach((id) => (restored[id] = true));
      setPresent((prev) => ({ ...prev, ...restored }));

      finaliseRegisterAuto({ reason: "resume" });
    } catch {
      // ignore
    }
  }, [online, todaySession, sessionEndAt, clubId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.full_name.toLowerCase().includes(q));
  }, [students, query]);

  const presentCount = useMemo(() => Object.values(present).filter(Boolean).length, [present]);
  const total = students.length;

  function togglePresent(studentId: string) {
    setPresent((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  }

  // Autosave debounce (only PRESENT marks)
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
        setSaveMsg("Not saved (check RLS/offline)");
        setTimeout(() => setSaveMsg(""), 1200);
      }
    }, 700);

    return () => {
      if (autosaveRef.current) window.clearTimeout(autosaveRef.current);
    };
  }, [present, todaySession, online, students.length, supabase, clubId]);

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
              Only action: mark Present. Auto-finalises at session end time.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/admin/clubs/${clubId}/attendance`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
            >
              Back to Dashboard
            </Link>
            <Link
              href={`/app/admin/clubs/${clubId}/attendance/history`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
            >
              History
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6">
        {fatalError ? (
          <div className="mb-4 rounded-[18px] border border-amber-200 bg-amber-50 p-4">
            <div className="text-sm font-semibold text-amber-900">Register failed to load</div>
            <div className="mt-1 text-sm text-amber-900/90">{fatalError}</div>
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
                  <div className="mt-1 text-sm text-slate-600">
                    {formatDateTime(todaySession.starts_at)}
                    {sessionEndAt ? (
                      <>
                        {" "}
                        • Ends{" "}
                        <span className="font-semibold text-slate-900">
                          {formatTime(sessionEndAt.toISOString())}
                        </span>
                      </>
                    ) : null}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Duration:{" "}
                    <span className="font-semibold text-slate-900">
                      {todaySession.duration_minutes ?? 90} mins
                    </span>{" "}
                    (default if not set)
                  </div>
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
                  {sessionEndAt ? (
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      Auto-finalise in{" "}
                      <span className="ml-2 text-slate-900">{msToClock(remainingMs)}</span>
                    </span>
                  ) : null}
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
              <div className="text-sm font-semibold text-slate-900">Auto-finalise behaviour</div>
              <div className="mt-1 text-sm text-slate-600">
                When the session ends, everyone not marked Present becomes Absent, the register is locked (finalised),
                and analytics appear on the Attendance Dashboard. To view completed registers, use History.
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
