// web/src/app/app/admin/clubs/[clubId]/sessions/_islands/TodaySchedule.tsx

"use client";

import { useLiveDashboard } from "./useLiveDashboard";

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}
function pct(n: number) {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 100)}%`;
}
function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
function statusChip(s?: string | null) {
  const k = s ?? "planned";
  if (k === "open") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (k === "closed") return "border-slate-200 bg-slate-50 text-slate-700";
  return "border-indigo-200 bg-indigo-50 text-indigo-900";
}

export default function TodaySchedule({ clubId }: { clubId: string }) {
  const { sessions, booting } = useLiveDashboard(clubId);

  if (booting) {
    return <div className="h-[240px] rounded-[22px] border border-slate-200 bg-white animate-pulse" />;
  }

  return (
    <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
      <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
        <div className="text-sm font-semibold text-slate-900">Today schedule</div>
        <div className="mt-0.5 text-xs text-slate-600">Sessions planned for today (analytics view only)</div>
      </div>

      <div className="divide-y divide-slate-200">
        {sessions.length ? (
          sessions.map((s) => {
            const total = s.activities_total ?? 0;
            const done = s.activities_done ?? 0;
            const cr = total > 0 ? done / total : 0;

            return (
              <div key={s.id} className="px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{s.title || "Untitled session"}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      {fmtTime(s.starts_at)} • {s.duration_minutes ?? 60}m
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={cx("rounded-full border px-3 py-1 text-xs font-semibold", statusChip(s.status))}>
                        {(s.status ?? "planned").toUpperCase()}
                      </span>

                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        Participants: <span className="ml-1 text-slate-900">{s.participants ?? 0}</span>
                      </span>

                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        Evidence: <span className="ml-1 text-slate-900">{s.evidence_items ?? 0}</span>
                      </span>

                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        Checklist:{" "}
                        <span className="ml-1 text-slate-900">
                          {done}/{total} ({pct(cr)})
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">Live analytics is centered above. History analytics will be a separate page.</div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-6 py-10 text-center">
            <div className="text-sm font-semibold text-slate-900">No sessions scheduled today</div>
            <div className="mt-1 text-sm text-slate-600">Add a session for today to activate live analytics.</div>
          </div>
        )}
      </div>
    </div>
  );
}
