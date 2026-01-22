// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/QualityChecklistPanel.tsx

"use client";

import { SectionTitle } from "./_ui";

export default function QualityChecklistPanel({ clubId }: { clubId: string }) {
  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
      <div className="border-b border-slate-200/70 px-5 py-4 sm:px-6">
        <div className="text-sm font-semibold text-slate-900">Quality checklist</div>
        <div className="mt-0.5 text-xs text-slate-600">Signals that make live analytics & AI stronger</div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          {[
            { k: "Session created for today/this week", v: "Enables scheduling + reporting baseline" },
            { k: "Mark OPEN during delivery", v: "Improves live dashboard signal quality" },
            { k: "Participants recorded", v: "Attendance accuracy + analytics reliability" },
            { k: "Checklist outcomes attached", v: "Execution tracking & measurable learning" },
            { k: "Evidence captured early", v: "Proof logs + more stable AI insight" },
          ].map((x, i) => (
            <div key={i} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">{x.k}</div>
                <div className="mt-1 text-xs text-slate-600">{x.v}</div>
              </div>
              <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                Recommended
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


