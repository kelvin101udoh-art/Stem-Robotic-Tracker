//  web/src/app/app/admin/clubs/[clubId]/schedule/create/_islands/SuggestedChecklistPreview.tsx

"use client";

import { SectionTitle } from "../../_islands/_ui/page";
import type { TemplateChecklistItem } from "./TemplateApplyPanel";

export default function SuggestedChecklistPreview(props: { items: TemplateChecklistItem[] }) {
  if (!props.items?.length) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
        <SectionTitle label="EMPTY" />
        <div className="mt-2 text-sm text-slate-800">No checklist suggestions yet.</div>
        <div className="mt-1 text-xs text-slate-600">
          Apply a template to populate a suggested checklist preview (UI-only).
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
      <SectionTitle label="SUGGESTED CHECKLIST" />
      <div className="mt-3 space-y-2">
        {props.items.map((c, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200/80 bg-white/70 text-xs font-bold text-slate-800">
                {idx + 1}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">{c.label}</div>
                {c.hint ? <div className="mt-1 text-xs text-slate-600">{c.hint}</div> : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-[11px] text-slate-600">
        Preview only. Next: “Create session” can optionally insert these items into <span className="font-mono">session_activities</span>.
      </div>
    </div>
  );
}
