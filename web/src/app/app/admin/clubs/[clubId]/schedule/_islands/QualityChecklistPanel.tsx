// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/QualityChecklistPanel.tsx


"use client";

export default function QualityChecklistPanel() {
  const items = [
    {
      title: "Session is created (at least 24 hours ahead)",
      desc: "Keeps your timetable stable and easier for staff/parents to follow.",
    },
    {
      title: "A short checklist exists (4–6 outcomes)",
      desc: "Makes delivery consistent and improves reports.",
    },
    {
      title: "Attendance / participants are recorded",
      desc: "Improves accuracy and helps accountability.",
    },
    {
      title: "Evidence is captured early (photo + note)",
      desc: "Creates proof for parents and strengthens session summaries.",
    },
    {
      title: "Session is completed (closed) after delivery",
      desc: "Ensures it appears in reports with the right signals.",
    },
  ];

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.08),transparent_55%)] px-5 py-5">
        <div className="text-sm font-semibold text-slate-900">Weekly run sheet</div>
        <div className="mt-0.5 text-xs text-slate-600">
          A simple checklist that keeps your club running smoothly.
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
          If you do these 5 things consistently, your reports become “board-ready” and parent-friendly.
        </div>
      </div>
    </div>
  );
}
