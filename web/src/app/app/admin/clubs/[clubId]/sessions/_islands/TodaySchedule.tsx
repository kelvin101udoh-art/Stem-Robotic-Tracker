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
  if (k === "open") return "border-emerald-200/80 bg-emerald-50/80 text-emerald-950";
  if (k === "closed") return "border-slate-200/80 bg-slate-50/80 text-slate-800";
  return "border-indigo-200/80 bg-indigo-50/80 text-indigo-950";
}

export default function TodaySchedule({ clubId }: { clubId: string }) {
  const { sessions, booting } = useLiveDashboard(clubId);

  if (booting) {
    return <div className="h-[260px] rounded-[22px] border border-slate-200 bg-white/60 animate-pulse" />;
  }

  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-4 sm:px-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">Today schedule</div>
            <div className="mt-0.5 text-xs text-slate-600">Session list + coverage snapshot (analytics view only)</div>
          </div>
          <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
            Rows: <span className="text-slate-900">{sessions.length}</span>
          </span>
        </div>
      </div>

      {sessions.length ? (
        <div className="divide-y divide-slate-200/70">
          {sessions.map((s) => {
            const total = s.activities_total ?? 0;
            const done = s.activities_done ?? 0;
            const cr = total > 0 ? done / total : 0;

            const evidence = s.evidence_items ?? 0;
            const participants = s.participants ?? 0;

            return (
              <div key={s.id} className="px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="truncate text-sm font-semibold text-slate-900">{s.title || "Untitled session"}</div>

                      <span className={cx("rounded-full border px-3 py-1 text-xs font-semibold", statusChip(s.status))}>
                        {(s.status ?? "planned").toUpperCase()}
                      </span>

                      <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
                        {fmtTime(s.starts_at)} • {s.duration_minutes ?? 60}m
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                        <div className="text-[11px] font-semibold tracking-widest text-slate-500">PARTICIPANTS</div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">{participants}</div>
                        <div className="text-xs text-slate-600">Attendance signal</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                        <div className="text-[11px] font-semibold tracking-widest text-slate-500">EVIDENCE</div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">{evidence}</div>
                        <div className="text-xs text-slate-600">Proof items captured</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                        <div className="text-[11px] font-semibold tracking-widest text-slate-500">CHECKLIST</div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">
                          {done}/{total} <span className="text-sm text-slate-600">({pct(cr)})</span>
                        </div>
                        <div className="text-xs text-slate-600">Execution coverage</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 lg:max-w-[260px]">
                    This page is live-only. Historical trends will be shown on the History Analytics page.
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-6 py-10">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 text-center">
            <div className="text-sm font-semibold text-slate-900">No sessions scheduled today</div>
            <div className="mt-1 text-sm text-slate-700">Add a session for today to activate live analytics and AI output.</div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 text-left">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <div className="text-xs font-semibold tracking-widest text-slate-500">STEP 1</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Schedule today</div>
                <div className="mt-1 text-xs text-slate-600">A session dated today enables reporting and monitoring.</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <div className="text-xs font-semibold tracking-widest text-slate-500">STEP 2</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Mark OPEN</div>
                <div className="mt-1 text-xs text-slate-600">Improves signal quality while delivering the session.</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <div className="text-xs font-semibold tracking-widest text-slate-500">STEP 3</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">Capture proof</div>
                <div className="mt-1 text-xs text-slate-600">Add evidence (photo + note) to stabilize AI insight.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
