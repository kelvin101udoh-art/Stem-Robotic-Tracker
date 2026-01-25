// web/src/app/app/admin/clubs/[clubId]/schedule/history/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  id: string;
  club_id: string;
  title: string | null;
  starts_at: string | null;
  duration_minutes: number | null;
  status: "planned" | "open" | "closed" | null;

  participants?: number | null;
  evidence_items?: number | null;
  activities_total?: number | null;
  activities_completed?: number | null;

  // legacy attendance fields (ignored here by design)
  present_count?: number | null;
  late_count?: number | null;
  absent_count?: number | null;

  session_id?: string | null;
};

function statusChip(status?: string | null) {
  const k = status ?? "planned";
  if (k === "closed") return "border-slate-200/80 bg-slate-50/70 text-slate-800";
  if (k === "open") return "border-emerald-200/80 bg-emerald-50/70 text-emerald-950";
  return "border-indigo-200/80 bg-indigo-50/70 text-indigo-950";
}

function healthTone(score: number) {
  if (score >= 0.78) return "border-emerald-200/80 bg-emerald-50/70 text-emerald-950";
  if (score >= 0.48) return "border-indigo-200/80 bg-indigo-50/70 text-indigo-950";
  return "border-rose-200/80 bg-rose-50/70 text-rose-950";
}

/**
 * Business-friendly "Session Health" for History:
 * participants + evidence + checklist completeness only.
 * Attendance is intentionally excluded (separate module).
 */
function computeHistoryHealth(r: HistoryRow) {
  const p = safeNum(r.participants, 0);
  const e = safeNum(r.evidence_items, 0);
  const aT = safeNum(r.activities_total, 0);
  const aC = safeNum(r.activities_completed, 0);

  const hasPeople = p > 0 ? 1 : 0;
  const hasEvidence = e > 0 ? 1 : 0;
  const hasChecklist = aT > 0 ? 1 : 0;
  const completionRate = aT > 0 ? Math.min(1, aC / aT) : 0;

  const score = Math.max(
    0,
    Math.min(1, 0.25 * hasPeople + 0.40 * hasEvidence + 0.15 * hasChecklist + 0.20 * completionRate)
  );

  const label =
    score >= 0.78 ? "Healthy" : score >= 0.48 ? "Needs attention" : "At risk";

  const actions: string[] = [];
  if (!hasPeople) actions.push("No participants recorded");
  if (!hasEvidence) actions.push("No evidence captured");
  if (!hasChecklist) actions.push("No checklist");
  if (hasChecklist && completionRate < 0.6) actions.push("Low checklist completion");

  return { score, label, actions, completionRate };
}

function CardShell(props: { title: string; subtitle?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(1000px_260px_at_10%_0%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(900px_240px_at_90%_0%,rgba(34,211,238,0.08),transparent_55%)] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-slate-900">{props.title}</div>
            {props.subtitle ? <div className="mt-0.5 text-sm text-slate-700">{props.subtitle}</div> : null}
          </div>
          {props.right ? props.right : null}
        </div>
      </div>
      <div className="p-5 sm:p-7">{props.children}</div>
    </div>
  );
}

function StatCard(props: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4">
      <div className="text-xs font-semibold text-slate-600">{props.label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs text-slate-600">{props.hint}</div> : null}
    </div>
  );
}

function dateInputToIsoStart(v: string) {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
  return dt.toISOString();
}

function dateInputToIsoEnd(v: string) {
  if (!v) return null;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
  return dt.toISOString();
}

function exportHistoryCsv(rows: HistoryRow[]) {
  const headers = [
    "Session ID",
    "Title",
    "Start Time",
    "Duration (min)",
    "Participants",
    "Evidence Items",
    "Checklist Total",
    "Checklist Completed",
  ];

  const csv = [
    headers.join(","),
    ...rows.map((r) => [
      r.id,
      `"${(r.title ?? "").replace(/"/g, '""')}"`,
      r.starts_at ?? "",
      r.duration_minutes ?? "",
      safeNum(r.participants, 0),
      safeNum(r.evidence_items, 0),
      safeNum(r.activities_total, 0),
      safeNum(r.activities_completed, 0),
    ].join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `session-history-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);
}

export default function ScheduleHistoryPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortMode>("newest");

  const [fromDate, setFromDate] = useState(() => {
    const d = startOfDayLocal(new Date());
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => startOfDayLocal(new Date()).toISOString().slice(0, 10));

  const fromISO = useMemo(() => dateInputToIsoStart(fromDate), [fromDate]);
  const toISO = useMemo(() => dateInputToIsoEnd(toDate), [toDate]);

  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [booting, setBooting] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const PAGE = 25;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  function resetPaging() {
    setPage(0);
    setHasMore(true);
    setRows([]);
  }

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

        const vQ = supabase
          .from("v_session_metrics")
          .select("*")
          .eq("club_id", clubId)
          .eq("status", "closed")
          .lt("starts_at", nowIso);

        if (fromISO) vQ.gte("starts_at", fromISO);
        if (toISO) vQ.lte("starts_at", toISO);
        if (q.trim()) vQ.ilike("title", `%${q.trim()}%`);

        vQ.order("starts_at", { ascending: sort === "oldest" });
        vQ.range(0, PAGE - 1);

        const res = await vQ;
        if (res.error) throw res.error;

        if (cancelled) return;

        const normalized: HistoryRow[] = (res.data ?? []).map((x: any) => {
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

            // legacy (ignored)
            present_count: x.present_count ?? x.present ?? null,
            late_count: x.late_count ?? x.late ?? null,
            absent_count: x.absent_count ?? x.absent ?? null,
          };
        });

        setRows(normalized);
        setHasMore(normalized.length >= PAGE);
      } catch (e: any) {
        // fallback to sessions table (no metrics)
        try {
          const nowIso = new Date().toISOString();

          const sQ = supabase
            .from("sessions")
            .select("id, club_id, title, starts_at, duration_minutes, status")
            .eq("club_id", clubId)
            .eq("status", "closed")
            .lt("starts_at", nowIso);

          if (fromISO) sQ.gte("starts_at", fromISO);
          if (toISO) sQ.lte("starts_at", toISO);
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
          setErr("Some metrics are unavailable. Showing closed sessions only.");
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
  }, [clubId, supabase, checking, q, sort, fromISO, toISO]);

  async function loadMore() {
    if (!clubId || !supabase) return;
    if (!hasMore) return;

    setLoadingMore(true);
    setErr(null);

    try {
      const nowIso = new Date().toISOString();
      const nextPage = page + 1;

      const vQ = supabase
        .from("v_session_metrics")
        .select("*")
        .eq("club_id", clubId)
        .eq("status", "closed")
        .lt("starts_at", nowIso);

      if (fromISO) vQ.gte("starts_at", fromISO);
      if (toISO) vQ.lte("starts_at", toISO);
      if (q.trim()) vQ.ilike("title", `%${q.trim()}%`);

      vQ.order("starts_at", { ascending: sort === "oldest" });
      vQ.range(nextPage * PAGE, nextPage * PAGE + PAGE - 1);

      const res = await vQ;
      if (res.error) throw res.error;

      const normalized: HistoryRow[] = (res.data ?? []).map((x: any) => {
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

  const kpis = useMemo(() => {
    const total = rows.length;
    if (!total) return { totalClosed: 0, evidenceRate: 0, checklistRate: 0, avgHealth: 0 };

    const evidenceYes = rows.filter((r) => safeNum(r.evidence_items, 0) > 0).length;
    const checklistTotal = rows.filter((r) => safeNum(r.activities_total, 0) > 0).length;
    const checklistGood = rows.filter((r) => {
      const aT = safeNum(r.activities_total, 0);
      const aC = safeNum(r.activities_completed, 0);
      return aT > 0 && aC / aT >= 0.6;
    }).length;

    const avgHealth = rows.reduce((acc, r) => acc + computeHistoryHealth(r).score, 0) / total;

    return {
      totalClosed: total,
      evidenceRate: Math.round((evidenceYes / total) * 100),
      checklistRate: checklistTotal ? Math.round((checklistGood / checklistTotal) * 100) : 0,
      avgHealth: Math.round(avgHealth * 100),
    };
  }, [rows]);

  const headerRight = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
        Closed sessions
      </span>

      <button
        type="button"
        onClick={() => exportHistoryCsv(rows)}
        className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-4 py-2 text-sm font-semibold text-indigo-950 hover:bg-indigo-50 transition"
      >
        Export (CSV)
      </button>

      <Link
        href={`/app/admin/clubs/${clubId}/schedule`}
        className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
      >
        Back
      </Link>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <CardShell
        title="Session History"
        subtitle="Review past sessions in plain language. Click View to open the full session report."
        right={headerRight}
      >
        {/* Filters */}
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="text-xs font-semibold text-slate-700">Search by name</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g., Sensors build, Demo day, Team challenge"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="lg:col-span-2">
            <div className="text-xs font-semibold text-slate-700">Sort</div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
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
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700">To</div>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="lg:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="text-xs text-slate-600">
              Tip: History shows closed sessions only (for clean reporting).
            </div>

            <button
              type="button"
              onClick={resetPaging}
              className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
            >
              Reset list
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <StatCard label="Closed sessions" value={kpis.totalClosed} hint="In the selected date range" />
          <StatCard label="Evidence coverage" value={`${kpis.evidenceRate}%`} hint="Sessions with at least 1 evidence item" />
          <StatCard label="Checklist performance" value={`${kpis.checklistRate}%`} hint="60%+ completion (where checklist exists)" />
          <StatCard label="Average health" value={`${kpis.avgHealth}%`} hint="Based on participants, evidence, checklist" />
        </div>

        {/* Errors */}
        {err ? (
          <div className="mt-4 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-sm text-rose-950">
            {err}
          </div>
        ) : null}

        {/* List */}
        <div className="mt-5">
          {booting ? (
            <div className="h-[360px] rounded-2xl border border-slate-200/70 bg-white/60 animate-pulse" />
          ) : !rows.length ? (
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5">
              <div className="text-xs font-semibold tracking-widest text-slate-500">EMPTY</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">No sessions found</div>
              <div className="mt-1 text-sm text-slate-700">Try widening the date range or clearing the search.</div>
            </div>
          ) : (
            <div className="grid gap-3">
              {rows.map((s) => {
                const { score, label, actions, completionRate } = computeHistoryHealth(s);

                const p = safeNum(s.participants, 0);
                const evi = safeNum(s.evidence_items, 0);
                const aT = safeNum(s.activities_total, 0);
                const aC = safeNum(s.activities_completed, 0);
                const checklistPct = aT > 0 ? Math.round((aC / aT) * 100) : null;

                return (
                  <div
                    key={s.id}
                    className="rounded-[26px] border border-slate-200/70 bg-white/60 shadow-[0_18px_60px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden"
                  >
                    <div className="border-b border-slate-200/70 px-5 py-4 sm:px-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusChip("closed"))}>
                            CLOSED
                          </span>

                          <span
                            className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", healthTone(score))}
                            title={actions.length ? actions.join(" • ") : "No actions suggested"}
                          >
                            HEALTH: {label.toUpperCase()} • {Math.round(score * 100)}%
                          </span>

                          <div className="truncate text-sm font-semibold text-slate-900">
                            {s.title || "Untitled session"}
                          </div>
                        </div>

                        <div className="mt-1 text-sm text-slate-700">
                          {fmtDateTime(s.starts_at)} <span className="mx-2 text-slate-300">•</span> {s.duration_minutes ?? 60} minutes
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/app/admin/clubs/${clubId}/sessions/${encodeURIComponent(s.id)}`}
                          className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
                        >
                          View report
                        </Link>
                      </div>
                    </div>

                    <div className="px-5 py-4 sm:px-6">
                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4">
                          <div className="text-xs font-semibold text-slate-600">Participants</div>
                          <div className="mt-2 text-xl font-semibold text-slate-900">{p}</div>
                          <div className="mt-1 text-xs text-slate-600">People who took part (count)</div>
                        </div>

                        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4">
                          <div className="text-xs font-semibold text-slate-600">Evidence captured</div>
                          <div className="mt-2 text-xl font-semibold text-slate-900">{evi}</div>
                          <div className="mt-1 text-xs text-slate-600">Photos, videos, notes</div>
                        </div>

                        <div className="rounded-2xl border border-slate-200/70 bg-white/70 p-4">
                          <div className="text-xs font-semibold text-slate-600">Checklist</div>
                          <div className="mt-2 text-xl font-semibold text-slate-900">
                            {checklistPct === null ? "—" : `${checklistPct}%`}
                          </div>
                          <div className="mt-1 text-xs text-slate-600">
                            {aT ? `${aC}/${aT} tasks done • completion ${(completionRate * 100).toFixed(0)}%` : "No checklist attached"}
                          </div>
                        </div>
                      </div>

                      {actions.length ? (
                        <div className="mt-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4">
                          <div className="text-sm font-semibold text-slate-900">Suggested next steps</div>
                          <ul className="mt-2 list-disc pl-5 text-sm text-slate-800 space-y-1">
                            {actions.slice(0, 3).map((a) => (
                              <li key={a}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4">
                          <div className="text-sm font-semibold text-slate-900">All good</div>
                          <div className="mt-1 text-sm text-slate-800">This session has strong signals for reporting.</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {rows.length ? (
            <div className="flex items-center justify-center pt-4">
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
                  End of list
                </span>
              )}
            </div>
          ) : null}
        </div>
      </CardShell>
    </div>
  );
}
