// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/UpcomingSchedule.tsx

"use client";

import { useMemo } from "react";
import { useUpcomingSchedule, ScheduleSessionRow } from "./useUpcomingSchedule";
import { cx, SectionTitle } from "./_ui/page";

function dayKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function labelForDay(d: Date) {
  const today = new Date();
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((d0 - t0) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return d.toLocaleDateString(undefined, { weekday: "long", day: "2-digit", month: "short" });
}

function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function statusChip(s?: string | null) {
  const k = s ?? "planned";
  if (k === "open") return "border-emerald-200/80 bg-emerald-50/70 text-emerald-950";
  if (k === "closed") return "border-slate-200/80 bg-slate-50/70 text-slate-800";
  return "border-indigo-200/80 bg-indigo-50/70 text-indigo-950";
}

function dayOpsQuality(rows: ScheduleSessionRow[]) {
  // UI-only: coverage score based on planned/open mix
  const total = rows.length;
  if (total === 0) return { label: "NO PLAN", cls: "border-slate-200/80 bg-slate-50/70 text-slate-800" };

  const open = rows.filter((r) => (r.status ?? "planned") === "open").length;
  const planned = rows.filter((r) => (r.status ?? "planned") === "planned").length;

  const score = Math.min(1, (open * 1.0 + planned * 0.6) / Math.max(1, total));
  if (score >= 0.85) return { label: "STRONG", cls: "border-emerald-200/80 bg-emerald-50/70 text-emerald-950" };
  if (score >= 0.6) return { label: "OK", cls: "border-indigo-200/80 bg-indigo-50/70 text-indigo-950" };
  return { label: "WEAK", cls: "border-rose-200/80 bg-rose-50/70 text-rose-950" };
}

export default function UpcomingSchedule({ clubId }: { clubId: string }) {
  const { rows, booting, refreshing } = useUpcomingSchedule(clubId);

  const grouped = useMemo(() => {
    const map = new Map<string, { date: Date; items: ScheduleSessionRow[] }>();
    for (const r of rows) {
      if (!r.starts_at) continue;
      const d = new Date(r.starts_at);
      const key = dayKey(d);
      if (!map.has(key)) map.set(key, { date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), items: [] });
      map.get(key)!.items.push(r);
    }
    return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [rows]);

  if (booting) {
    return <div className="h-[380px] rounded-[26px] border border-slate-200/80 bg-white/60 animate-pulse" />;
  }

  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.08),transparent_55%)] px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Upcoming Schedule</div>
            <div className="mt-0.5 text-xs text-slate-600">Next 7 days • Grouped by day • Optimistic rows appear instantly</div>
          </div>

          <span className="rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            {refreshing ? "Syncing…" : "Live"}
          </span>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        {!grouped.length ? (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-6">
            <SectionTitle label="EMPTY" />
            <div className="mt-2 text-sm font-semibold text-slate-900">No sessions in the next 7 days</div>
            <div className="mt-1 text-sm text-slate-700">Create a session to populate this schedule view.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((g, idx) => {
              const badge = dayOpsQuality(g.items);

              return (
                <div key={dayKey(g.date)} className="rounded-2xl border border-slate-200/80 bg-white/60 overflow-hidden">
                  {/* Day header */}
                  <div className="border-b border-slate-200/70 bg-slate-50/60 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">{labelForDay(g.date)}</div>
                      <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", badge.cls)}>
                        Ops Quality: {badge.label}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200/70">
                    {g.items.map((s) => (
                      <div key={s.id} className="px-4 py-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="truncate text-sm font-semibold text-slate-900">
                                {s.title || "Untitled session"}
                              </div>

                              <span className={cx("rounded-full border px-3 py-1 text-xs font-semibold", statusChip(s.status))}>
                                {(s.status ?? "planned").toUpperCase()}
                              </span>

                              {s.__optimistic ? (
                                <span className="rounded-full border border-amber-200/80 bg-amber-50/70 px-3 py-1 text-xs font-semibold text-amber-950">
                                  Pending…
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-1 text-xs text-slate-600">
                              {fmtTime(s.starts_at)} • {s.duration_minutes ?? 60}m
                            </div>
                          </div>

                          {/* Inline actions (UI-only, no backend edits) */}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition"
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Week separator feel */}
                  {idx < grouped.length - 1 ? (
                    <div className="px-4 py-3">
                      <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
