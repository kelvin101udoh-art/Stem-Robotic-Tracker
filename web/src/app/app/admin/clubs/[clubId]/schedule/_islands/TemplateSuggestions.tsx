// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/ScheduleHeader.tsx

"use client";

import { SectionTitle } from "./_ui";

export default function TemplateSuggestions({ clubId }: { clubId: string }) {
  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
      <div className="border-b border-slate-200/70 px-5 py-4 sm:px-6">
        <div className="text-sm font-semibold text-slate-900">Template suggestions</div>
        <div className="mt-0.5 text-xs text-slate-600">Fast-create patterns for consistent delivery</div>
      </div>

      <div className="px-5 py-5 sm:px-6 space-y-3">
        {[
          { t: "Build + Test", d: "Plan → build → test → iterate (ideal for competitions)" },
          { t: "Skills Ladder", d: "Introduce concept → guided task → challenge extension" },
          { t: "Evidence-first", d: "Capture early evidence + checklist to stabilize analytics" },
        ].map((x, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <SectionTitle label={`TEMPLATE ${i + 1}`} />
            <div className="mt-2 text-sm font-semibold text-slate-900">{x.t}</div>
            <div className="mt-1 text-xs text-slate-600">{x.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
