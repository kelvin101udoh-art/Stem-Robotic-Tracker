// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/TemplateSuggestions.tsx

"use client";

import { SectionTitle, cx } from "./_ui/page";

export type SessionTemplate = {
  id: string;
  name: string;
  description: string;
  suggestedTitle: string;
  durationMinutes: number;
  suggestedChecklist: string[];
};

const TEMPLATES: SessionTemplate[] = [
  {
    id: "build-test",
    name: "Build + Test Loop",
    description: "Plan → Build → Test → Iterate (competition-friendly delivery)",
    suggestedTitle: "Robotics Build & Test: Iteration Sprint",
    durationMinutes: 75,
    suggestedChecklist: [
      "Warm-up: recap last build (5 min)",
      "Build phase: core mechanism (25 min)",
      "Test run: measure + log outcomes (15 min)",
      "Iteration: improve based on results (20 min)",
      "Evidence capture: photo + note (5 min)",
      "Wrap-up: what changed + why (5 min)",
    ],
  },
  {
    id: "skills-ladder",
    name: "Skills Ladder",
    description: "Concept → Guided task → Challenge extension",
    suggestedTitle: "Skills Ladder: Sensors & Control",
    durationMinutes: 60,
    suggestedChecklist: [
      "Introduce concept (10 min)",
      "Guided build/task (20 min)",
      "Independent challenge (20 min)",
      "Showcase + explain decisions (5 min)",
      "Evidence capture: photo + 1 note (5 min)",
    ],
  },
  {
    id: "evidence-first",
    name: "Evidence-First Delivery",
    description: "Capture signals early so analytics & AI become reliable fast",
    suggestedTitle: "Evidence-First Session: Capture & Progress",
    durationMinutes: 60,
    suggestedChecklist: [
      "Record participants (start)",
      "Capture first photo within 10 minutes",
      "Define 4–6 outcomes (checklist)",
      "Mark progress live during session",
      "Capture end-of-session proof + reflection note",
    ],
  },
];

export default function TemplateSuggestions(props: {
  clubId: string;
  onApplyTemplate: (t: SessionTemplate) => void;
  activeTemplateId: string | null;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
      <div className="border-b border-slate-200/70 px-5 py-4 sm:px-6">
        <div className="text-sm font-semibold text-slate-900">Template suggestions</div>
        <div className="mt-0.5 text-xs text-slate-600">Click to apply — auto-fills title, duration, and suggested checklist</div>
      </div>

      <div className="px-5 py-5 sm:px-6 space-y-3">
        {TEMPLATES.map((t) => {
          const active = props.activeTemplateId === t.id;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => props.onApplyTemplate(t)}
              className={cx(
                "w-full text-left rounded-2xl border p-4 transition",
                active
                  ? "border-indigo-200/80 bg-indigo-50/70 shadow-[0_18px_50px_-46px_rgba(99,102,241,0.6)]"
                  : "border-slate-200 bg-slate-50/70 hover:bg-white/70"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SectionTitle label={active ? "ACTIVE TEMPLATE" : "TEMPLATE"} />
                  <div className="mt-2 text-sm font-semibold text-slate-900">{t.name}</div>
                  <div className="mt-1 text-xs text-slate-600">{t.description}</div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
                      Duration: <span className="text-slate-900">{t.durationMinutes}m</span>
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
                      Checklist: <span className="text-slate-900">{t.suggestedChecklist.length}</span>
                    </span>
                  </div>
                </div>

                <span
                  className={cx(
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                    active ? "border-indigo-200/80 bg-white/70 text-indigo-950" : "border-slate-200 bg-white/70 text-slate-700"
                  )}
                >
                  Apply
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
