// web/src/app/app/admin/clubs/[clubId]/attendance/page.tsx


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

type AttendanceStatus = "present" | "absent" | "late";

type AttendanceRow = {
  club_id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  saved_at?: string | null;
  saved_by?: string | null;
  finalised_at?: string | null;
  finalised_by?: string | null;
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

function KPI({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_28px_-28px_rgba(2,6,23,0.35)]">
      <div className="text-[11px] font-semibold tracking-widest text-slate-500">{label.toUpperCase()}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-600">{hint}</div> : null}
    </div>
  );
}

export default function AttendanceDashboardPage() {
  const router = useRouter();
  const params = useParams<{ clubId: string }>();
  const clubId = params.clubId;

  const { checking, supabase } = useAdminGuard({ idleMinutes: 15 });

  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"today" | "yesterday" | "7d" | "30d">("today");

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [saveMsg, setSaveMsg] = useState("");

  const timeWindow = useMemo(() => {
    const now = new Date();

    if (range === "today") {
      return { from: startOfLocalDay(now).toISOString(), to: endOfLocalDay(now).toISOString(), label: "Today" };
    }
    if (range === "yesterday") {
      const y = daysAgo(1);
      return { from: startOfLocalDay(y).toISOString(), to: endOfLocalDay(y).toISOString(), label: "Yesterday" };
    }
    if (range === "7d") {
      const from = startOfLocalDay(daysAgo(6));
      return { from: from.toISOString(), to: endOfLocalDay(now).toISOString(), label: "Last 7 days" };
    }
    const from = startOfLocalDay(daysAgo(29));
    return { from: from.toISOString(), to: endOfLocalDay(now).toISOString(), label: "Last 30 days" };
  }, [range]);

  useEffect(() => {
    if (checking) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setSaveMsg("");

      try {
        // Pull sessions in the selected window
        const sRes = await supabase
          .from("sessions")
          .select("id, club_id, title, starts_at")
          .eq("club_id", clubId)
          .gte("starts_at", timeWindow.from)
          .lte("starts_at", timeWindow.to)
          .order("starts_at", { ascending: false })
          .limit(120);

        if (sRes.error) throw sRes.error;

        const ss = (sRes.data ?? []) as SessionRow[];
        const sessionIds = ss.map((s) => s.id);

        // Pull attendance for those sessions
        let attRows: AttendanceRow[] = [];
        if (sessionIds.length) {
          const aRes = await supabase
            .from("attendance")
            .select("club_id, session_id, student_id, status, saved_at, saved_by, finalised_at, finalised_by")
            .eq("club_id", clubId)
            .in("session_id", sessionIds);

          if (aRes.error) throw aRes.error;
          attRows = (aRes.data ?? []) as AttendanceRow[];
        }

        if (cancelled) return;
        setSessions(ss);
        setAttendance(attRows);
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
  }, [checking, clubId, router, supabase, timeWindow.from, timeWindow.to]);

  const stats = useMemo(() => {
    const totalMarks = attendance.length;
    const present = attendance.filter((a) => a.status === "present").length;
    const late = attendance.filter((a) => a.status === "late").length;
    const absent = attendance.filter((a) => a.status === "absent").length;

    const sessionsCount = sessions.length;

    const coverage = totalMarks ? Math.round(((present + late) / totalMarks) * 100) : 0;

    // “Completion” signal: session has any saved_at (best-effort)
    const savedSessionIds = new Set(attendance.filter((a) => a.saved_at).map((a) => a.session_id));
    const completedSessions = savedSessionIds.size;

    const finalisedSessionIds = new Set(attendance.filter((a) => a.finalised_at).map((a) => a.session_id));
    const finalisedSessions = finalisedSessionIds.size;

    return { totalMarks, present, late, absent, coverage, sessionsCount, completedSessions, finalisedSessions };
  }, [attendance, sessions]);

  // Group by session for simple “history panel”
  const sessionsView = useMemo(() => {
    const map = new Map<string, AttendanceRow[]>();
    attendance.forEach((r) => {
      if (!map.has(r.session_id)) map.set(r.session_id, []);
      map.get(r.session_id)!.push(r);
    });

    return sessions.map((s) => {
      const rows = map.get(s.id) ?? [];
      const p = rows.filter((x) => x.status === "present").length;
      const l = rows.filter((x) => x.status === "late").length;
      const a = rows.filter((x) => x.status === "absent").length;
      const total = rows.length || 0;

      const completed = rows.some((x) => !!x.saved_at);
      const finalised = rows.some((x) => !!x.finalised_at);

      return { session: s, present: p, late: l, absent: a, total, completed, finalised };
    });
  }, [attendance, sessions]);

  if (checking || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-100">
        <div className="mx-auto max-w-[1400px] px-4 py-10">
          <div className="h-10 w-80 rounded-2xl bg-slate-200 animate-pulse" />
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
            <div className="text-sm font-semibold text-slate-900">Attendance Dashboard</div>
            <div className="text-xs text-slate-600">KPIs, trends, AI insights — register is handled on a separate page.</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/admin/clubs/${clubId}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
            >
              Back
            </Link>

            <Link
              href={`/app/admin/clubs/${clubId}/attendance/register`}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Open Today’s Register
            </Link>

            <Link
              href={`/app/admin/clubs/${clubId}/attendance/history`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
            >
              View History
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Attendance Intelligence</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Filter by time range to review performance and compliance. Today’s register is completed on the Register page.
          </p>
        </div>

        {/* Range selector */}
        <div className="mt-6 rounded-[22px] border border-slate-200 bg-white p-4 shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-slate-900">Range: {timeWindow.label}</div>
            <div className="flex flex-wrap items-center gap-2">
              {(["today", "yesterday", "7d", "30d"] as const).map((k) => (
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
                  {k === "today" ? "Today" : k === "yesterday" ? "Yesterday" : k === "7d" ? "Last 7 days" : "Last 30 days"}
                </button>
              ))}
            </div>
          </div>

          {saveMsg ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{saveMsg}</div>
          ) : null}
        </div>

        {/* KPI row */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <KPI label="Sessions" value={stats.sessionsCount} hint="in range" />
          <KPI label="Register completed" value={stats.completedSessions} hint="any saved rows" />
          <KPI label="Finalised" value={stats.finalisedSessions} hint="locked sessions" />
          <KPI label="Coverage" value={`${stats.coverage}%`} hint="present+late / total" />
          <KPI label="Total marks" value={stats.totalMarks} hint="rows" />
        </div>

        {/* AI Insight panel (rules-first; can later be replaced with your Azure route) */}
        <div className="mt-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-500">AI INSIGHTS</div>
              <div className="mt-1 text-lg font-semibold text-slate-900">Trend interpretation (rules-first)</div>
              <div className="mt-1 text-sm text-slate-600">
                This auto-updates based on register completion and attendance marks in your selected time range.
              </div>
            </div>

            <Link
              href={`/app/admin/clubs/${clubId}/attendance/register`}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Complete today’s register
            </Link>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 p-4">
              <div className="text-[11px] font-semibold tracking-widest text-slate-500">ENGAGEMENT</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {stats.coverage >= 90
                  ? "Strong engagement across sessions."
                  : stats.coverage >= 70
                    ? "Moderate engagement — review absences."
                    : "Low engagement — investigate barriers (timing, access, motivation)."}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 p-4">
              <div className="text-[11px] font-semibold tracking-widest text-slate-500">COMPLIANCE</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {stats.finalisedSessions === stats.completedSessions && stats.completedSessions > 0
                  ? "Registers are being finalised consistently."
                  : "Some completed registers are not yet finalised — lock after review."}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 p-4">
              <div className="text-[11px] font-semibold tracking-widest text-slate-500">IMPROVE NEXT</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                {stats.coverage < 80 ? "Add arrival routine + reminders; follow up on frequent absences." : "Keep routine consistent; increase challenge clarity and roles (builder/coder/tester)."}
              </div>
            </div>
          </div>
        </div>

        {/* Recent sessions list (range-based) */}
        <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
            <div>
              <div className="text-sm font-semibold text-slate-900">Sessions in range</div>
              <div className="mt-0.5 text-xs text-slate-600">Click Register to open the session-day register workflow.</div>
            </div>
          </div>

          <div className="divide-y divide-slate-200">
            {sessionsView.length ? (
              sessionsView.map((x) => (
                <div key={x.session.id} className="px-5 py-4 sm:px-6 hover:bg-indigo-50/40">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{x.session.title || "Untitled session"}</div>
                      <div className="mt-0.5 text-xs text-slate-600">{formatDateTime(x.session.starts_at)}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">P: {x.present}</span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">L: {x.late}</span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">A: {x.absent}</span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1">Total: {x.total || "—"}</span>
                        <span
                          className={cx(
                            "rounded-full border px-2.5 py-1",
                            x.finalised
                              ? "border-slate-900 bg-slate-900 text-white"
                              : x.completed
                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                : "border-amber-200 bg-amber-50 text-amber-900"
                          )}
                        >
                          {x.finalised ? "Finalised" : x.completed ? "Completed" : "Not completed"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/app/admin/clubs/${clubId}/attendance/register`}
                        className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Open Register
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-10 text-center">
                <div className="text-sm font-semibold text-slate-900">No sessions found</div>
                <div className="mt-1 text-sm text-slate-600">Try changing the range.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
