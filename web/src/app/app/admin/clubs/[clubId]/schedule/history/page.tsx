// web/src/app/app/admin/clubs/[clubId]/schedule/history/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAdminGuard } from "@/lib/admin/admin-guard";

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function fmtDay(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${fmtDay(d)} • ${fmtTime(iso)}`;
}

function safeNum(x: any, fallback = 0) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

type SortMode = "newest" | "oldest";

type HistoryRow = {
  // base
  id: string; // session id
  club_id: string;
  title: string | null;
  starts_at: string | null;
  duration_minutes: number | null;
  status: "planned" | "open" | "closed" | null;

  // metrics (optional — depends on view availability)
  participants?: number | null;
  evidence_items?: number | null;
  activities_total?: number | null;
  activities_completed?: number | null;

  present_count?: number | null;
  late_count?: number | null;
  absent_count?: number | null;

  // compatibility if view uses session_id instead of id
  session_id?: string | null;
};

function statusChip(status?: string | null) {
  const k = status ?? "planned";
  if (k === "closed") return "border-slate-200/80 bg-slate-50/70 text-slate-800";
  if (k === "open") return "border-emerald-200/80 bg-emerald-50/70 text-emerald-950";
  return "border-indigo-200/80 bg-indigo-50/70 text-indigo-950";
}

function scoreTone(score: number) {
  if (score >= 0.78) return "border-emerald-200/80 bg-emerald-50/70 text-emerald-950";
  if (score >= 0.48) return "border-indigo-200/80 bg-indigo-50/70 text-indigo-950";
  return "border-rose-200/80 bg-rose-50/70 text-rose-950";
}

/**
 * For CLOSED sessions, we show a "Post-Session Quality" score:
 * - Evidence captured
 * - Checklist existed + completion rate
 * - Attendance/participants signals exist
 *
 * (Deterministic, no AI needed.)
 */
function computePostSessionQuality(r: HistoryRow) {
  const p = safeNum(r.participants, 0);
  const e = safeNum(r.evidence_items, 0);
  const aT = safeNum(r.activities_total, 0);
  const aC = safeNum(r.activities_completed, 0);

  const attendanceSignal = safeNum(r.present_count, 0) + safeNum(r.late_count, 0);

  const hasPeople = p > 0 || attendanceSignal > 0 ? 1 : 0;
  const hasEvidence = e > 0 ? 1 : 0;
  const hasChecklist = aT > 0 ? 1 : 0;
  const completionRate = aT > 0 ? Math.min(1, aC / aT) : 0;

  const score = Math.max(
    0,
    Math.min(
      1,
      0.20 * hasPeople +
        0.35 * hasEvidence +
        0.15 * hasChecklist +
        0.30 * completionRate
    )
  );

  const label =
    score >= 0.78 ? "QUALITY STRONG" : score >= 0.48 ? "QUALITY PARTIAL" : "QUALITY WEAK";

  const gaps: string[] = [];
  if (!hasPeople) gaps.push("No attendance/participants signal recorded");
  if (!hasEvidence) gaps.push("No evidence captured (photo/video/note)");
  if (!hasChecklist) gaps.push("No checklist activities attached to session");
  if (hasChecklist && completionRate < 0.55) gaps.push("Low checklist completion rate");

  return { score, label, gaps };
}

/**
 * Optional: If you have an AI summary record for a CLOSED session,
 * we show it as a "Post-Session Summary Preview".
 *
 * IMPORTANT: If RLS blocks the table, we silently return null.
 */
async function tryReadAiSummaryForSession(
  supabase: any,
  clubId: string,
  sessionId: string
) {
  try {
    const res = await supabase
      .from("attendance_ai_summaries")
      .select("summary, created_at")
      .eq("club_id", clubId)
      .eq("session_id", sessionId)
      .limit(1);

    if (res?.error) return null;
    const row = res?.data?.[0];
    if (!row) return null;

    const summary =
      typeof row.summary === "string" ? row.summary : JSON.stringify(row.summary);
    return { summary, created_at: row.created_at as string };
  } catch {
    return null;
  }
}

function SectionCard(props: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(1000px_260px_at_10%_0%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(900px_240px_at_90%_0%,rgba(34,211,238,0.08),transparent_55%)] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{props.title}</div>
            {props.subtitle ? (
              <div className="mt-0.5 text-xs text-slate-600">{props.subtitle}</div>
            ) : null}
          </div>
          {props.right ? props.right : null}
        </div>
      </div>
      <div className="p-5 sm:p-7">{props.children}</div>
    </div>
  );
}

export default function ScheduleHistoryPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  // Filters (NO status filter — closed only)
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");

  const [fromISO, setFromISO] = useState<string>(() => {
    const d = startOfDayLocal(new Date());
    d.setMonth(d.getMonth() - 3); // default: last 3 months
    return d.toISOString().slice(0, 10);
  });
  const [toISO, setToISO] = useState<string>(() => {
    const d = startOfDayLocal(new Date());
    return d.toISOString().slice(0, 10);
  });

  // Data
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [booting, setBooting] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Paging
  const PAGE = 25;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Report drawer
  const [reportOpen, setReportOpen] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [reportSessionId, setReportSessionId] = useState<string | null>(null);
  const [reportText, setReportText] = useState<string | null>(null);

  const effectiveFrom = useMemo(() => {
    try {
      const [y, m, d] = fromISO.split("-").map(Number);
      const dt = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
      return dt.toISOString();
    } catch {
      return null;
    }
  }, [fromISO]);

  const effectiveTo = useMemo(() => {
    try {
      const [y, m, d] = toISO.split("-").map(Number);
      const dt = new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
      return dt.toISOString();
    } catch {
      return null;
    }
  }, [toISO]);

  function resetAndFetch() {
    setPage(0);
    setHasMore(true);
    setRows([]);
  }

  // MAIN LOAD (CLOSED only)
  useEffect(() => {
    if (!clubId) return;
    if (!supabase) return;
    if (checking) return;

    let cancelled = false;

    (async () => {
      setBooting(true);
      setErr(null);

      try {
        const nowIso = new Date().toISOString();
        const from = effectiveFrom;
        const to = effectiveTo;

        // Prefer v_session_metrics
        const baseQuery = supabase
          .from("v_session_metrics")
          .select("*")
          .eq("club_id", clubId)
          .eq("status", "closed")
          .lt("starts_at", nowIso);

        if (from) baseQuery.gte("starts_at", from);
        if (to) baseQuery.lte("starts_at", to);
        if (q.trim()) baseQuery.ilike("title", `%${q.trim()}%`);

        baseQuery.order("starts_at", { ascending: sort === "oldest" });
        baseQuery.range(0, PAGE - 1);

        const res = await baseQuery;
        if (res.error) throw res.error;

        const data = (res.data ?? []) as any[];
        if (cancelled) return;

        const normalized: HistoryRow[] = data.map((x) => {
          const sid = (x.id ?? x.session_id) as string;
          return {
            id: sid,
            session_id: x.session_id ?? null,
            club_id: x.club_id,
            title: x.title ?? null,
            starts_at: x.starts_at ?? null,
            duration_minutes: x.duration_minutes ?? null,
            status: x.status ?? null,

            participants: x.participants ?? x.participants_count ?? null,
            evidence_items: x.evidence_items ?? x.evidence_count ?? null,
            activities_total: x.activities_total ?? x.activities_count ?? null,
            activities_completed: x.activities_completed ?? x.activities_done ?? null,

            present_count: x.present_count ?? x.present ?? null,
            late_count: x.late_count ?? x.late ?? null,
            absent_count: x.absent_count ?? x.absent ?? null,
          };
        });

        setRows(normalized);
        setHasMore(normalized.length >= PAGE);
      } catch (e: any) {
        // FALLBACK: sessions only (closed only)
        try {
          const nowIso = new Date().toISOString();
          const from = effectiveFrom;
          const to = effectiveTo;

          const sQ = supabase
            .from("sessions")
            .select("id, club_id, title, starts_at, duration_minutes, status")
            .eq("club_id", clubId)
            .eq("status", "closed")
            .lt("starts_at", nowIso);

          if (from) sQ.gte("starts_at", from);
          if (to) sQ.lte("starts_at", to);
          if (q.trim()) sQ.ilike("title", `%${q.trim()}%`);

          sQ.order("starts_at", { ascending: sort === "oldest" });
          sQ.range(0, PAGE - 1);

          const sRes = await sQ;
          if (sRes.error) throw sRes.error;

          if (cancelled) return;

          const normalized: HistoryRow[] = (sRes.data ?? []).map((x: any) => ({
            id: x.id,
            club_id: x.club_id,
            title: x.title ?? null,
            starts_at: x.starts_at ?? null,
            duration_minutes: x.duration_minutes ?? null,
            status: x.status ?? null,
          }));

          setRows(normalized);
          setHasMore(normalized.length >= PAGE);
          setErr(
            `Metrics view not available (or blocked). Loaded CLOSED sessions only. Details: ${
              e?.message ?? "unknown"
            }`
          );
        } catch (fallbackErr: any) {
          setErr(fallbackErr?.message ?? e?.message ?? "Failed to load history.");
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, supabase, checking, q, sort, effectiveFrom, effectiveTo]);

  async function loadMore() {
    if (!clubId || !supabase) return;
    if (!hasMore) return;

    setLoadingMore(true);
    setErr(null);

    try {
      const nowIso = new Date().toISOString();
      const from = effectiveFrom;
      const to = effectiveTo;

      const nextPage = page + 1;

      const baseQuery = supabase
        .from("v_session_metrics")
        .select("*")
        .eq("club_id", clubId)
        .eq("status", "closed")
        .lt("starts_at", nowIso);

      if (from) baseQuery.gte("starts_at", from);
      if (to) baseQuery.lte("starts_at", to);
      if (q.trim()) baseQuery.ilike("title", `%${q.trim()}%`);

      baseQuery.order("starts_at", { ascending: sort === "oldest" });
      baseQuery.range(nextPage * PAGE, nextPage * PAGE + PAGE - 1);

      const res = await baseQuery;
      if (res.error) throw res.error;

      const data = (res.data ?? []) as any[];
      const normalized: HistoryRow[] = data.map((x) => {
        const sid = (x.id ?? x.session_id) as string;
        return {
          id: sid,
          session_id: x.session_id ?? null,
          club_id: x.club_id,
          title: x.title ?? null,
          starts_at: x.starts_at ?? null,
          duration_minutes: x.duration_minutes ?? null,
          status: x.status ?? null,

          participants: x.participants ?? x.participants_count ?? null,
          evidence_items: x.evidence_items ?? x.evidence_count ?? null,
          activities_total: x.activities_total ?? x.activities_count ?? null,
          activities_completed: x.activities_completed ?? x.activities_done ?? null,

          present_count: x.present_count ?? x.present ?? null,
          late_count: x.late_count ?? x.late ?? null,
          absent_count: x.absent_count ?? x.absent ?? null,
        };
      });

      setRows((prev) => [...prev, ...normalized]);
      setPage(nextPage);
      setHasMore(normalized.length >= PAGE);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load more history.");
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }

  async function openPostSessionReport(sessionId: string) {
    setReportOpen(true);
    setReportSessionId(sessionId);
    setReportText(null);

    const row = rows.find((r) => r.id === sessionId) ?? null;
    if (!row) {
      setReportText("No session selected.");
      return;
    }

    // Build deterministic report
    setReportBusy(true);
    try {
      const { score, label, gaps } = computePostSessionQuality(row);

      const p = safeNum(row.participants, 0);
      const e = safeNum(row.evidence_items, 0);
      const aT = safeNum(row.activities_total, 0);
      const aC = safeNum(row.activities_completed, 0);

      const present = safeNum(row.present_count, 0);
      const late = safeNum(row.late_count, 0);
      const absent = safeNum(row.absent_count, 0);

      const completion = aT > 0 ? Math.round((aC / aT) * 100) : 0;

      // Optional AI summary preview (only if it exists AND RLS allows reading)
      let aiBlock = "";
      if (supabase) {
        const ai = await tryReadAiSummaryForSession(supabase, clubId, sessionId);
        if (ai?.summary) {
          aiBlock =
            "\n\nPOST-SESSION SUMMARY (if enabled)\n" +
            "--------------------------------\n" +
            ai.summary;
        }
      }

      const report = [
        "POST-SESSION REPORT",
        "===================",
        `Session: ${row.title || "Untitled session"}`,
        `When: ${fmtDateTime(row.starts_at)} • ${row.duration_minutes ?? 60}m`,
        `Status: CLOSED`,
        "",
        `Quality: ${label} (${Math.round(score * 100)}%)`,
        "",
        "Signals",
        "-------",
        `Participants: ${p}`,
        `Evidence items: ${e}`,
        `Checklist: ${aT ? `${aC}/${aT} completed (${completion}%)` : "0 (none attached)"}`,
        `Attendance: present=${present}, late=${late}, absent=${absent}`,
        "",
        "Gaps / Risks",
        "-----------",
        gaps.length ? gaps.map((g) => `• ${g}`).join("\n") : "• None detected",
        "",
        "Next-session improvements",
        "-------------------------",
        e === 0 ? "• Capture at least 1 photo/video + 1 note evidence next time." : "• Maintain evidence consistency and labeling.",
        aT === 0 ? "• Attach a template checklist so outcomes are repeatable." : "• Improve completion by reducing scope and tightening timings.",
        (p === 0 && present + late === 0)
          ? "• Ensure attendance is recorded early for better accountability + analytics."
          : "• Keep attendance recording consistent (start + end).",
      ].join("\n");

      setReportText(report + aiBlock);
    } finally {
      setReportBusy(false);
    }
  }

  const totalLoaded = rows.length;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">
            Schedule History (Closed sessions)
          </div>
          <div className="mt-0.5 text-xs text-slate-600">
            Closed-only timeline • RLS-safe reads • Post-session reports • Metrics-first
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/app/admin/clubs/${clubId}/schedule`}
            className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
          >
            Back to Schedule
          </Link>
        </div>
      </div>

      <SectionCard
        title="History Console"
        subtitle="Closed sessions only. Uses v_session_metrics when available; falls back to sessions (still RLS-safe)."
        right={
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
            Loaded: {totalLoaded}
          </span>
        }
      >
        {/* Filters */}
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="text-xs font-semibold text-slate-700">Search title</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g., LEGO sensors, build challenge, teamwork demo"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="lg:col-span-2">
            <div className="text-xs font-semibold text-slate-700">Sort</div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>

          <div className="lg:col-span-4 grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-700">From</div>
              <input
                type="date"
                value={fromISO}
                onChange={(e) => setFromISO(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700">To</div>
              <input
                type="date"
                value={toISO}
                onChange={(e) => setToISO(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="lg:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="text-xs text-slate-600">
              History is strictly <span className="font-semibold">CLOSED</span> sessions (completed outcomes).
            </div>

            <button
              type="button"
              onClick={resetAndFetch}
              className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
            >
              Reset paging
            </button>
          </div>
        </div>

        {/* Errors */}
        {err ? (
          <div className="mt-4 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-sm text-rose-950">
            {err}
          </div>
        ) : null}

        {/* Loading */}
        {booting ? (
          <div className="mt-5 h-[360px] rounded-2xl border border-slate-200/70 bg-white/60 animate-pulse" />
        ) : (
          <div className="mt-5 space-y-3">
            {!rows.length ? (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5">
                <div className="text-xs font-semibold tracking-widest text-slate-500">
                  EMPTY
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900">
                  No closed sessions match your filters
                </div>
                <div className="mt-1 text-sm text-slate-700">
                  Try widening the date range or clearing the search.
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200/70 rounded-2xl border border-slate-200/80 bg-white/60 overflow-hidden">
                {rows.map((s) => {
                  const { score, label, gaps } = computePostSessionQuality(s);
                  const tone = scoreTone(score);

                  const p = safeNum(s.participants, 0);
                  const e = safeNum(s.evidence_items, 0);
                  const aT = safeNum(s.activities_total, 0);
                  const aC = safeNum(s.activities_completed, 0);

                  const present = safeNum(s.present_count, 0);
                  const late = safeNum(s.late_count, 0);
                  const absent = safeNum(s.absent_count, 0);

                  const completion = aT > 0 ? Math.round((aC / aT) * 100) : 0;

                  return (
                    <div key={s.id} className="px-4 py-4 sm:px-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cx(
                                "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                statusChip("closed")
                              )}
                            >
                              CLOSED
                            </span>

                            <span
                              className={cx(
                                "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                tone
                              )}
                              title={gaps.length ? gaps.join(" • ") : "No gaps"}
                            >
                              {label} • {Math.round(score * 100)}%
                            </span>

                            <div className="truncate text-sm font-semibold text-slate-900">
                              {s.title || "Untitled session"}
                            </div>
                          </div>

                          <div className="mt-1 text-xs text-slate-600">
                            {fmtDateTime(s.starts_at)} • {s.duration_minutes ?? 60}m
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                              Participants: <span className="text-slate-900">{p}</span>
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                              Evidence: <span className="text-slate-900">{e}</span>
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                              Checklist:{" "}
                              <span className="text-slate-900">
                                {aT ? `${aC}/${aT} (${completion}%)` : "0"}
                              </span>
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                              Attendance:{" "}
                              <span className="text-slate-900">
                                P{present} • L{late} • A{absent}
                              </span>
                            </span>
                          </div>

                          {gaps.length ? (
                            <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-950">
                              <div className="font-semibold">Quality gaps</div>
                              <ul className="mt-1 list-disc pl-5">
                                {gaps.map((g) => (
                                  <li key={g}>{g}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/app/admin/clubs/${clubId}/sessions/${s.id}`}
                            className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
                          >
                            View session
                          </Link>

                          <button
                            type="button"
                            onClick={() => openPostSessionReport(s.id)}
                            className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-3 py-2 text-xs font-semibold text-indigo-950 hover:bg-indigo-50 transition"
                          >
                            Post-session report
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {rows.length ? (
              <div className="flex items-center justify-center pt-3">
                {hasMore ? (
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={loadingMore}
                    className={cx(
                      "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                      loadingMore
                        ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                        : "border-slate-200 bg-white/70 text-slate-900 hover:bg-white"
                    )}
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </button>
                ) : (
                  <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
                    End of history
                  </span>
                )}
              </div>
            ) : null}
          </div>
        )}
      </SectionCard>

      {/* Report Drawer */}
      {reportOpen ? (
        <div className="fixed inset-0 z-[70]">
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setReportOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-[560px] border-l border-slate-200/70 bg-white/85 backdrop-blur-xl shadow-[0_24px_80px_-56px_rgba(2,6,23,0.55)]">
            <div className="border-b border-slate-200/70 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-900">
                  Post-Session Report
                </div>
                <button
                  type="button"
                  onClick={() => setReportOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-white transition"
                >
                  Close
                </button>
              </div>
              <div className="mt-2 text-xs text-slate-600">
                Session:{" "}
                <span className="font-mono text-slate-900">{reportSessionId ?? "—"}</span>
              </div>
            </div>

            <div className="p-5">
              <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
                <div className="text-xs font-semibold tracking-widest text-slate-500">
                  REPORT
                </div>

                <div className="mt-3 whitespace-pre-wrap text-sm text-slate-800">
                  {reportBusy ? "Generating report…" : reportText ?? "—"}
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  This is a deterministic post-session report using stored metrics. If an AI summary exists (and RLS permits), it appears as a preview.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
