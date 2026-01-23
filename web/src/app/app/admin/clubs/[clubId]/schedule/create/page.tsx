"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminGuard } from "@/lib/admin/admin-guard";

// Your shared UI helpers (keep your existing import path)
import { cx, SectionTitle } from "../_islands/_ui/page";

// Your existing upcoming schedule hook + optimistic helpers
import {
  addOptimisticSession,
  confirmOptimisticSession,
  revertOptimisticSession,
  ScheduleSessionRow,
  SessionStatus,
  useUpcomingSchedule,
} from "../_islands/useUpcomingSchedule";

// ===== Time helpers (local input -> UTC ISO storage) =====
function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function defaultLocalDateISO() {
  const d = startOfLocalDay(new Date());
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function defaultLocalTimeHHMM() {
  const now = new Date();
  const mins = now.getMinutes();
  const rounded = Math.ceil(mins / 15) * 15;
  const d = new Date(now);
  d.setMinutes(rounded, 0, 0);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function localDateTimeToIsoUtc(dateISO: string, timeHHMM: string) {
  const [y, m, d] = dateISO.split("-").map((x) => Number(x));
  const [hh, mm] = timeHHMM.split(":").map((x) => Number(x));
  const local = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
  if (!Number.isFinite(local.getTime())) throw new Error("Invalid date/time");
  return local.toISOString(); // stored as UTC ISO
}
function fmtLocalHuman(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function makeTempId() {
  return `temp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function addMinutesToHHMM(timeHHMM: string, minutes: number) {
  const [hh, mm] = timeHHMM.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return { time: timeHHMM, crossedMidnight: false };

  const base = new Date(2000, 0, 1, hh, mm, 0, 0);
  base.setMinutes(base.getMinutes() + minutes);

  const crossedMidnight = base.getDate() !== 1;
  const endOfDay = new Date(2000, 0, 1, 23, 45, 0, 0);
  const final = crossedMidnight ? endOfDay : base;

  return {
    time: `${String(final.getHours()).padStart(2, "0")}:${String(final.getMinutes()).padStart(2, "0")}`,
    crossedMidnight,
  };
}

// ===== UI bits =====
function FieldLabel({ children }: { children: string }) {
  return <div className="text-xs font-semibold text-slate-700">{children}</div>;
}
function InputShell({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">{children}</div>;
}
function Chip({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "indigo" | "emerald" | "amber" | "rose" }) {
  const cls =
    tone === "indigo"
      ? "border-indigo-200/80 bg-indigo-50/70 text-indigo-950"
      : tone === "emerald"
        ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-950"
        : tone === "amber"
          ? "border-amber-200/80 bg-amber-50/70 text-amber-950"
          : tone === "rose"
            ? "border-rose-200/80 bg-rose-50/70 text-rose-950"
            : "border-slate-200/80 bg-white/70 text-slate-700";
  return <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", cls)}>{children}</span>;
}

type DeliveryMode = "broadcast" | "differentiated";

type TemplateChecklistItem = { id: string; text: string };

type TemplateDef = {
  id: string;
  name: string;
  title: string;
  durationMinutes: number;
  checklist: TemplateChecklistItem[];
  next?: string; // template chaining (UI-only)
  modeHint?: DeliveryMode; // optional
};

const TEMPLATES: TemplateDef[] = [
  {
    id: "build_test",
    name: "Build + Test Loop",
    title: "Robotics: Build → Test → Iterate",
    durationMinutes: 75,
    checklist: [
      { id: "c1", text: "Safety briefing + roles assigned" },
      { id: "c2", text: "Build step completed (base robot)" },
      { id: "c3", text: "Test run + log issues" },
      { id: "c4", text: "Iteration applied + retest" },
      { id: "c5", text: "Evidence captured (photo + note)" },
      { id: "c6", text: "Wrap-up reflection (1 learning each)" },
    ],
    next: "evidence_first",
    modeHint: "broadcast",
  },
  {
    id: "skills_ladder",
    name: "Skills Ladder",
    title: "Skills Ladder: Concept → Guided Task → Challenge",
    durationMinutes: 60,
    checklist: [
      { id: "c1", text: "Warm-up + recap previous skill" },
      { id: "c2", text: "Guided build step completed" },
      { id: "c3", text: "Challenge extension attempted" },
      { id: "c4", text: "Peer review / demo" },
      { id: "c5", text: "Evidence captured (photo + note)" },
    ],
    next: "build_test",
    modeHint: "differentiated",
  },
  {
    id: "evidence_first",
    name: "Evidence-First Delivery",
    title: "Evidence-First: Capture Signals Early",
    durationMinutes: 60,
    checklist: [
      { id: "c1", text: "Attendance captured in first 5 mins" },
      { id: "c2", text: "Checklist outcomes loaded" },
      { id: "c3", text: "Photo evidence captured early" },
      { id: "c4", text: "Progress update midpoint" },
      { id: "c5", text: "Final evidence + reflection" },
    ],
    next: "skills_ladder",
    modeHint: "broadcast",
  },
];

function findTemplate(id?: string | null) {
  return TEMPLATES.find((t) => t.id === id) ?? null;
}

// ===== Draft persistence (enterprise feel, no backend) =====
function useDraft<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [key, state]);

  return [state, setState] as const;
}

// ===== Conflict detection (UI-only) =====
function overlaps(aStartIso: string, aDurMin: number, bStartIso: string, bDurMin: number) {
  const a0 = new Date(aStartIso).getTime();
  const a1 = a0 + Math.max(0, aDurMin) * 60000;
  const b0 = new Date(bStartIso).getTime();
  const b1 = b0 + Math.max(0, bDurMin) * 60000;
  return a0 < b1 && b0 < a1;
}

function WizardStep({
  idx,
  active,
  title,
  hint,
}: {
  idx: number;
  active: boolean;
  title: string;
  hint: string;
}) {
  return (
    <div className={cx("rounded-2xl border p-3", active ? "border-indigo-200/80 bg-indigo-50/40" : "border-slate-200/80 bg-white/60")}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold tracking-widest text-slate-500">STEP {idx}</div>
        {active ? <Chip tone="indigo">ACTIVE</Chip> : <Chip>READY</Chip>}
      </div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-600">{hint}</div>
    </div>
  );
}

function ModeCard({
  active,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full text-left rounded-2xl border p-4 transition",
        active ? "border-indigo-200/80 bg-indigo-50/50" : "border-slate-200/80 bg-white/60 hover:bg-slate-50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {active ? <Chip tone="indigo">Selected</Chip> : <Chip>Choose</Chip>}
      </div>
      <div className="mt-2 text-xs text-slate-600">{desc}</div>
    </button>
  );
}

function ChecklistPreview({ items }: { items: TemplateChecklistItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 text-sm text-slate-700">
        No checklist selected — this is okay. You can still add it during delivery.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
      <div className="text-xs font-semibold tracking-widest text-slate-500">SUGGESTED CHECKLIST</div>
      <ul className="mt-3 space-y-2 text-sm text-slate-800">
        {items.map((x, i) => (
          <li key={x.id} className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
              {i + 1}
            </span>
            <span>{x.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TemplatePanel({
  appliedId,
  onApply,
  onChain,
}: {
  appliedId: string | null;
  onApply: (t: TemplateDef) => void;
  onChain: () => void;
}) {
  const applied = findTemplate(appliedId);

  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
      <div className="border-b border-slate-200/70 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">AI Templates</div>
            <div className="mt-0.5 text-xs text-slate-600">
              Click Apply to auto-fill title, duration, and checklist. (Chaining is UI-only for now.)
            </div>
          </div>
          {applied ? <Chip tone="indigo">Applied: {applied.name}</Chip> : <Chip>None</Chip>}
        </div>
      </div>

      <div className="p-5 space-y-3">
        {TEMPLATES.map((t) => (
          <div key={t.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-widest text-slate-500">TEMPLATE</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">{t.name}</div>
                <div className="mt-1 text-xs text-slate-600">{t.title}</div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Chip>{t.durationMinutes}m</Chip>
                  <Chip>{t.checklist.length} outcomes</Chip>
                  {t.modeHint ? <Chip tone="amber">Mode hint: {t.modeHint}</Chip> : null}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onApply(t)}
                className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
              >
                Apply
              </button>
            </div>
          </div>
        ))}

        <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold tracking-widest text-slate-500">SMART CHAINING</div>
            <button
              type="button"
              onClick={onChain}
              className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-3 py-2 text-xs font-semibold text-indigo-950 hover:bg-indigo-50 transition"
            >
              Apply next template
            </button>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            If a template defines a “next”, this rotates to the next recommended delivery pattern.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateSessionPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const router = useRouter();
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  // Pull upcoming sessions (real data) so we can do conflict detection UI-only
  const { next7Days } = useUpcomingSchedule(clubId);

  // ===== Core session fields (DB stored) =====
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [status, setStatus] = useState<SessionStatus>("planned");
  const [dateISO, setDateISO] = useState<string>(() => defaultLocalDateISO());
  const [timeHHMM, setTimeHHMM] = useState<string>(() => defaultLocalTimeHHMM());

  // ===== Enterprise workflow =====
  const [bufferMinutes, setBufferMinutes] = useState<number>(10); // break buffer
  const [createAnother, setCreateAnother] = useState(true);
  const [timeAutoClamped, setTimeAutoClamped] = useState(false);

  // ===== Planning metadata (UI-only for now, aligns with your diagram) =====
  const draftKey = `stemtrack:create_session_draft:${clubId}`;
  const [planDraft, setPlanDraft] = useDraft(draftKey, {
    instructor: "",
    location: "",
    mode: "broadcast" as DeliveryMode,
    tracks: [
      { id: "t1", name: "All learners", activity: "Robotics activity", notes: "" },
    ],
  });

  // Template application
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
  const [suggestedChecklist, setSuggestedChecklist] = useState<TemplateChecklistItem[]>([]);

  // Wizard step
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // UX
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setTimedNotice(msg: string) {
    setNotice(msg);
    window.clearTimeout((setTimedNotice as any)._t);
    (setTimedNotice as any)._t = window.setTimeout(() => setNotice(null), 3500);
  }

  const preview = useMemo(() => {
    try {
      const startsAtIso = localDateTimeToIsoUtc(dateISO, timeHHMM);
      return { startsAtIso, localHuman: fmtLocalHuman(startsAtIso) };
    } catch {
      return { startsAtIso: "", localHuman: "—" };
    }
  }, [dateISO, timeHHMM]);

  // Conflict detection UI-only
  const conflicts = useMemo(() => {
    if (!preview.startsAtIso) return [];
    return (next7Days ?? []).filter((s: any) => {
      if (!s?.starts_at) return false;
      const sDur = Number(s.duration_minutes ?? 60);
      return overlaps(preview.startsAtIso, durationMinutes, s.starts_at, sDur);
    });
  }, [next7Days, preview.startsAtIso, durationMinutes]);




  function applyTemplate(t: TemplateDef) {
    setTitle(t.title);
    setDurationMinutes(t.durationMinutes);
    setSuggestedChecklist(t.checklist);
    setAppliedTemplateId(t.id);

    // 1. Extract the hint to a local constant
    const newMode = t.modeHint;

    // 2. Check the local constant
    if (newMode) {
      // TypeScript now knows newMode is exactly 'DeliveryMode' (not undefined)
      setPlanDraft((p) => ({
        ...p,
        mode: newMode
      }));
    }

    setTimedNotice(`Applied template: ${t.name}`);
  }




  function applyNextTemplate() {
    const curr = findTemplate(appliedTemplateId);
    const next = findTemplate(curr?.next);
    if (!next) {
      setTimedNotice("No next template defined for chaining.");
      return;
    }
    applyTemplate(next);
  }

  function resetFormKeepDateAdvanceTime() {
    setTitle("");
    setStatus("planned");
    setSuggestedChecklist([]);
    setAppliedTemplateId(null);

    // Advance time by duration + buffer
    const totalAdvance = Math.max(0, durationMinutes) + Math.max(0, bufferMinutes);
    const res = addMinutesToHHMM(timeHHMM, totalAdvance);
    setTimeHHMM(res.time);
    setTimeAutoClamped(res.crossedMidnight);

    // Keep duration default to 60 unless template was driving it
    setDurationMinutes(60);
    setTimedNotice(`Ready for next session (+${totalAdvance}m).`);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clubId) return;

    setError(null);
    setNotice(null);

    if (checking) {
      setError("Auth/session still checking. Try again in a moment.");
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Title is required.");
      return;
    }
    if (!Number.isFinite(durationMinutes) || durationMinutes < 15) {
      setError("Duration must be at least 15 minutes.");
      return;
    }

    let starts_at: string;
    try {
      starts_at = localDateTimeToIsoUtc(dateISO, timeHHMM);
    } catch (err: any) {
      setError(err?.message ?? "Invalid date/time");
      return;
    }

    // Optimistic insert to schedule list
    const tempId = makeTempId();
    const optimisticRow: ScheduleSessionRow = {
      id: tempId,
      club_id: clubId,
      title: cleanTitle,
      starts_at,
      duration_minutes: durationMinutes,
      status,
      __optimistic: true,
    };

    addOptimisticSession(clubId, optimisticRow);

    setSubmitting(true);
    try {
      const { data, error: insertErr } = await supabase
        .from("sessions")
        .insert([
          {
            club_id: clubId,
            title: cleanTitle,
            starts_at,
            duration_minutes: durationMinutes,
            status,
          },
        ])
        .select("id, club_id, title, starts_at, duration_minutes, status")
        .single();

      if (insertErr || !data) {
        revertOptimisticSession(clubId, tempId);
        setError(insertErr?.message ?? "Insert failed.");
        return;
      }

      confirmOptimisticSession(clubId, tempId, { ...(data as any), __optimistic: false });
      setTimedNotice("Session created successfully.");

      // Keep your plan draft (instructor/location/mode/tracks) as local “plan”
      // so it matches your diagram even before DB schema grows.
      // (This is intentional enterprise UX.)
      setPlanDraft((p) => ({ ...p }));

      if (createAnother) {
        resetFormKeepDateAdvanceTime();
        setSubmitting(false);
        return;
      }

      router.push(`/app/admin/clubs/${clubId}/schedule`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  // Tracks for differentiated mode
  function setMode(mode: DeliveryMode) {
    setPlanDraft((p) => {
      if (mode === "broadcast") {
        return {
          ...p,
          mode,
          tracks: [{ id: "t1", name: "All learners", activity: p.tracks?.[0]?.activity ?? "Robotics activity", notes: "" }],
        };
      }
      // differentiated
      const existing = p.tracks?.length ? p.tracks : [];
      const base = existing.length > 1 ? existing : [
        { id: "t1", name: "Beginner", activity: "Build core robot", notes: "" },
        { id: "t2", name: "Intermediate", activity: "Sensor integration + test", notes: "" },
        { id: "t3", name: "Advanced", activity: "Autonomy challenge extension", notes: "" },
      ];
      return { ...p, mode, tracks: base };
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
        <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">Create Session (Enterprise Wizard)</div>
              <div className="mt-0.5 text-xs text-slate-600">
                Matches your diagram: Instructor • Time • Location • Activities (Broadcast / Differentiated)
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Chip tone="indigo">Optimistic UI</Chip>
                <Chip tone="amber">Conflict detection (UI-only)</Chip>
                <Chip>Draft saved locally</Chip>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip>Preview: {preview.localHuman}</Chip>
              <button
                type="button"
                onClick={() => router.push(`/app/admin/clubs/${clubId}/schedule`)}
                className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        {(notice || error || conflicts.length > 0) && (
          <div className="px-5 py-4 sm:px-6 space-y-3">
            {notice ? (
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 text-sm text-emerald-950">
                {notice}
              </div>
            ) : null}

            {conflicts.length ? (
              <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-sm text-amber-950">
                <div className="font-semibold">Potential conflict detected</div>
                <div className="mt-1 text-xs text-amber-950/80">
                  This time overlaps with {conflicts.length} scheduled session(s). (UI-only warning — still allows create.)
                </div>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-sm text-rose-950">
                {error}
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Stepper */}
          <div className="grid gap-3 sm:grid-cols-3">
            <button type="button" onClick={() => setStep(1)} className="text-left">
              <WizardStep idx={1} active={step === 1} title="Schedule" hint="Timestamp + duration + status + conflicts" />
            </button>
            <button type="button" onClick={() => setStep(2)} className="text-left">
              <WizardStep idx={2} active={step === 2} title="Instructor & Location" hint="Delivery ops context (draft)" />
            </button>
            <button type="button" onClick={() => setStep(3)} className="text-left">
              <WizardStep idx={3} active={step === 3} title="Activities Plan" hint="Broadcast vs Differentiated tracks" />
            </button>
          </div>

          {/* Form card */}
          <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
            <div className="border-b border-slate-200/70 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">Create a session</div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={createAnother}
                      onChange={(e) => setCreateAnother(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Create another (auto-advance time)
                  </label>

                  <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700">
                    Buffer:
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={bufferMinutes}
                      onChange={(e) => setBufferMinutes(Math.max(0, Number(e.target.value) || 0))}
                      className="ml-1 w-[68px] rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-900 outline-none"
                    />
                    min
                  </span>
                </div>
              </div>

              {timeAutoClamped ? (
                <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-950">
                  Auto-advance hit end of day. Time was capped at <span className="font-semibold">23:45</span>.
                </div>
              ) : null}
            </div>

            <form onSubmit={onSubmit} className="px-5 py-5 sm:px-6 space-y-4">
              {/* STEP 1: schedule */}
              {step === 1 ? (
                <>
                  <InputShell>
                    <SectionTitle label="SCHEDULING" />
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <FieldLabel>Session title</FieldLabel>
                        <input
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g., Robotics Build: Line-Following Challenge"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        <div className="mt-2 text-xs text-slate-600">
                          Tip: outcome-driven titles improve reporting + evidence traceability (enterprise clean).
                        </div>
                      </div>

                      <div>
                        <FieldLabel>Date (local)</FieldLabel>
                        <input
                          type="date"
                          value={dateISO}
                          onChange={(e) => setDateISO(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>

                      <div>
                        <FieldLabel>Time (local)</FieldLabel>
                        <input
                          type="time"
                          value={timeHHMM}
                          onChange={(e) => setTimeHHMM(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>

                      <div>
                        <FieldLabel>Duration (minutes)</FieldLabel>
                        <input
                          type="number"
                          min={15}
                          step={5}
                          value={durationMinutes}
                          onChange={(e) => setDurationMinutes(Math.max(15, Number(e.target.value) || 0))}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                      </div>

                      <div>
                        <FieldLabel>Status</FieldLabel>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as SessionStatus)}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                          <option value="planned">Planned</option>
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs font-semibold tracking-widest text-slate-500">INSERT PREVIEW</div>
                        <Chip>
                          starts_at (UTC ISO): <span className="font-mono text-slate-900">{preview.startsAtIso || "—"}</span>
                        </Chip>
                      </div>
                      <div className="mt-2 text-xs text-slate-600">
                        Stored as UTC ISO; UI displays local time automatically. This keeps analytics consistent across devices/timezones.
                      </div>
                    </div>
                  </InputShell>

                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-4 py-2 text-sm font-semibold text-indigo-950 hover:bg-indigo-50 transition"
                    >
                      Next: Instructor & Location →
                    </button>
                  </div>
                </>
              ) : null}

              {/* STEP 2: instructor & location */}
              {step === 2 ? (
                <>
                  <InputShell>
                    <SectionTitle label="DELIVERY OPS (DRAFT)" />
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <FieldLabel>Instructor</FieldLabel>
                        <input
                          value={planDraft.instructor}
                          onChange={(e) => setPlanDraft((p) => ({ ...p, instructor: e.target.value }))}
                          placeholder="e.g., Kelvin / Coach A / Mentor B"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        <div className="mt-2 text-xs text-slate-600">
                          Saved as draft (local) for now — ready for DB mapping later.
                        </div>
                      </div>

                      <div>
                        <FieldLabel>Location</FieldLabel>
                        <input
                          value={planDraft.location}
                          onChange={(e) => setPlanDraft((p) => ({ ...p, location: e.target.value }))}
                          placeholder="e.g., Lab 2 / Hall A / Room 104"
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                        />
                        <div className="mt-2 text-xs text-slate-600">
                          Keeps instructor context operational for real clubs.
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/60 p-4 text-xs text-slate-600">
                      Enterprise note: In production, these map cleanly to <span className="font-mono">sessions.instructor_id</span> and{" "}
                      <span className="font-mono">sessions.location_id</span> (or strings). We’re keeping it schema-safe for now.
                    </div>
                  </InputShell>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
                    >
                      ← Back
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-4 py-2 text-sm font-semibold text-indigo-950 hover:bg-indigo-50 transition"
                    >
                      Next: Activities Plan →
                    </button>
                  </div>
                </>
              ) : null}

              {/* STEP 3: activities plan */}
              {step === 3 ? (
                <>
                  <InputShell>
                    <SectionTitle label="ACTIVITIES (MATCHES YOUR DIAGRAM)" />

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <ModeCard
                        active={planDraft.mode === "broadcast"}
                        title="Broadcast plan (After-school)"
                        desc="One activity plan for all learners. Cleaner ops + easier reporting."
                        onClick={() => setMode("broadcast")}
                      />
                      <ModeCard
                        active={planDraft.mode === "differentiated"}
                        title="Differentiated plan (Robotics club)"
                        desc="Multiple tracks in one session (Beginner/Intermediate/Advanced or per grade)."
                        onClick={() => setMode("differentiated")}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold tracking-widest text-slate-500">SESSION ACTIVITIES</div>
                        <Chip tone="amber">Plan is draft (local) for now</Chip>
                      </div>

                      <div className="mt-3 space-y-3">
                        {planDraft.tracks.map((t: any, idx: number) => (
                          <div key={t.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="text-sm font-semibold text-slate-900">
                                Track {idx + 1}:{" "}
                                <input
                                  value={t.name}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setPlanDraft((p: any) => ({
                                      ...p,
                                      tracks: p.tracks.map((x: any) => (x.id === t.id ? { ...x, name: v } : x)),
                                    }));
                                  }}
                                  className="ml-2 rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-sm text-slate-900 outline-none"
                                />
                              </div>

                              {planDraft.mode === "differentiated" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPlanDraft((p: any) => ({
                                      ...p,
                                      tracks: p.tracks.filter((x: any) => x.id !== t.id),
                                    }));
                                  }}
                                  className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
                                >
                                  Remove
                                </button>
                              ) : null}
                            </div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div className="sm:col-span-2">
                                <FieldLabel>Activity</FieldLabel>
                                <input
                                  value={t.activity}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setPlanDraft((p: any) => ({
                                      ...p,
                                      tracks: p.tracks.map((x: any) => (x.id === t.id ? { ...x, activity: v } : x)),
                                    }));
                                  }}
                                  placeholder="e.g., Build line-following bot / Sensor integration / Coding extension"
                                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <FieldLabel>Notes (optional)</FieldLabel>
                                <textarea
                                  value={t.notes}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setPlanDraft((p: any) => ({
                                      ...p,
                                      tracks: p.tracks.map((x: any) => (x.id === t.id ? { ...x, notes: v } : x)),
                                    }));
                                  }}
                                  placeholder="Materials, constraints, what success looks like…"
                                  className="mt-1 min-h-[80px] w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {planDraft.mode === "differentiated" ? (
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setPlanDraft((p: any) => ({
                                ...p,
                                tracks: [
                                  ...p.tracks,
                                  { id: `t_${Date.now()}`, name: `Track ${p.tracks.length + 1}`, activity: "Robotics task", notes: "" },
                                ],
                              }));
                            }}
                            className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-4 py-2 text-sm font-semibold text-indigo-950 hover:bg-indigo-50 transition"
                          >
                            + Add track
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </InputShell>

                  <ChecklistPreview items={suggestedChecklist} />

                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 text-xs text-slate-700">
                    Status defaults to <span className="font-semibold">PLANNED</span>. Mark <span className="font-semibold">OPEN</span> during delivery for best live analytics.
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
                    >
                      ← Back
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={cx(
                        "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                        submitting
                          ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                          : "border-slate-900/10 bg-slate-900 text-white hover:bg-slate-800"
                      )}
                    >
                      {submitting ? "Creating…" : "Create session"}
                    </button>
                  </div>
                </>
              ) : null}
            </form>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-4 space-y-6">
          <TemplatePanel
            appliedId={appliedTemplateId}
            onApply={applyTemplate}
            onChain={applyNextTemplate}
          />

          <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
            <div className="border-b border-slate-200/70 px-5 py-4">
              <div className="text-sm font-semibold text-slate-900">Ops Quality checklist</div>
              <div className="mt-0.5 text-xs text-slate-600">Signals that make live analytics & AI stronger</div>
            </div>
            <div className="p-5 space-y-3 text-sm">
              {[
                { title: "Session scheduled", desc: "Enables planning + reporting baseline" },
                { title: "Mark OPEN during delivery", desc: "Improves live dashboard signal quality" },
                { title: "Participants recorded", desc: "Attendance accuracy + analytics reliability" },
                { title: "Checklist outcomes attached", desc: "Execution tracking + measurable learning" },
                { title: "Evidence captured early", desc: "Proof logs + more stable AI insight" },
              ].map((x) => (
                <div key={x.title} className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-slate-900">{x.title}</div>
                    <Chip tone="indigo">Recommended</Chip>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">{x.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Enterprise note:</span> This Create page now matches your diagram. Next evolution (when you’re ready) is to persist the plan draft into
            a <span className="font-mono">session_plan</span> table (tracks, instructor, location, checklist).
          </div>
        </div>
      </div>
    </div>
  );
}
