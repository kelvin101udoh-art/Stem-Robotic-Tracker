// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/QualityChecklistPanel.tsx

"use client";

export default function QualityChecklistPanel() {
  const items = [
    {
      title: "Session created for today/this week",
      desc: "Enables scheduling + reporting baseline",
    },
    {
      title: "Mark OPEN during delivery",
      desc: "Improves live dashboard signal quality",
    },
    {
      title: "Participants recorded",
      desc: "Attendance accuracy → analytics reliability",
    },
    {
      title: "Checklist outcomes attached",
      desc: "Execution tracking & measurable learning",
    },
    {
      title: "Evidence captured early",
      desc: "Proof logs + more stable AI insight",
    },
  ];

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.08),transparent_55%)] px-5 py-5">
        <div className="text-sm font-semibold text-slate-900">Quality checklist</div>
        <div className="mt-0.5 text-xs text-slate-600">
          Signals that make live analytics & AI stronger
        </div>
      </div>

      <div className="p-5">
        <div className="rounded-2xl border border-slate-200/70 bg-white/60 overflow-hidden">
          <div className="divide-y divide-slate-200/70">
            {items.map((it, idx) => (
              <div key={idx} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{it.title}</div>
                    <div className="mt-1 text-xs text-slate-600">{it.desc}</div>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    Recommended
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 text-xs text-slate-700">
          Enterprise note: this checklist becomes a measurable score once you wire status updates + checklist attach + evidence capture.
        </div>
      </div>
    </div>
  );
}
