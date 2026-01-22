//  web/src/app/app/admin/clubs/[clubId]/schedule/create/_islands/TemplateApplyPanel.tsx

"use client";

import { useMemo, useState } from "react";
import { cx, SectionTitle } from "../../_islands/_ui/page";

export type TemplateChecklistItem = { label: string; hint?: string };

type Template = {
  id: string;
  name: string;
  title: string;
  durationMinutes: number;
  checklist: TemplateChecklistItem[];
};

const TEMPLATES: Template[] = [
  {
    id: "robotics_intro",
    name: "Robotics Core",
    title: "Robotics Fundamentals (Build + Test)",
    durationMinutes: 60,
    checklist: [
      { label: "Warm-up + recap", hint: "2–3 minutes: key concept review" },
      { label: "Build activity", hint: "Main hands-on section" },
      { label: "Test + iterate", hint: "1–2 improvement loops" },
      { label: "Evidence capture", hint: "Photo + short note" },
      { label: "Wrap-up reflection", hint: "What worked / what to improve" },
    ],
  },
  {
    id: "competition_ready",
    name: "Competition Prep",
    title: "Competition Readiness Sprint",
    durationMinutes: 75,
    checklist: [
      { label: "Rule constraints check", hint: "Ensure compliance" },
      { label: "Strategy / role allocation", hint: "Who does what" },
      { label: "Timed run", hint: "Measure outcome under pressure" },
      { label: "Failure review", hint: "Top 3 issues" },
      { label: "Fix + rerun", hint: "Re-test after changes" },
      { label: "Evidence capture", hint: "Before/after proof" },
    ],
  },
  {
    id: "ai_storytelling",
    name: "AI Evidence Mode",
    title: "AI-Backed Evidence Session",
    durationMinutes: 50,
    checklist: [
      { label: "Goal definition", hint: "What are we proving today?" },
      { label: "Activity delivery", hint: "Learning by doing" },
      { label: "Capture 2 evidence items", hint: "Photo + note minimum" },
      { label: "Checklist tick-off", hint: "Mark progress live" },
      { label: "Mini reflection", hint: "What did we learn?" },
    ],
  },
];

function Chip(props: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
      {props.children}
    </span>
  );
}

export default function TemplateApplyPanel(props: { onApply: (tpl: Template) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return TEMPLATES.find((t) => t.id === selectedId) ?? null;
  }, [selectedId]);

  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.08),transparent_55%)] px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Templates</div>
            <div className="mt-0.5 text-xs text-slate-600">
              Apply a template to auto-fill Title + Duration and preview suggested checklist.
            </div>
          </div>
          <Chip>Apply to form</Chip>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6 space-y-4">
        <div className="grid gap-3">
          {TEMPLATES.map((t) => {
            const active = t.id === selectedId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setSelectedId(t.id);
                  props.onApply(t);
                }}
                className={cx(
                  "text-left rounded-2xl border p-4 transition",
                  active ? "border-indigo-200/80 bg-indigo-50/50" : "border-slate-200/80 bg-white/70 hover:bg-slate-50"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold tracking-widest text-slate-500">{t.name.toUpperCase()}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 line-clamp-2">{t.title}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Chip>{t.durationMinutes}m</Chip>
                      <Chip>{t.checklist.length} checklist</Chip>
                    </div>
                  </div>

                  <span className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-800">
                    Apply
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
          <SectionTitle label="CHECKLIST PREVIEW" />
          {selected ? (
            <div className="mt-3 space-y-2">
              {selected.checklist.slice(0, 6).map((c, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200/80 bg-white/70 p-3">
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
              <div className="mt-2 text-[11px] text-slate-600">
                This is a UI preview. Later you can persist checklist into <span className="font-mono">session_activities</span>.
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-700">Select a template to preview its checklist.</div>
          )}
        </div>
      </div>
    </div>
  );
}
