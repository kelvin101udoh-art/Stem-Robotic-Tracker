// web/src/app/app/admin/clubs/[clubId]/schedule/create/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminGuard } from "@/lib/admin/admin-guard";
import { cx, SectionTitle } from "../_islands/_ui/page";

import {
  addOptimisticSession,
  confirmOptimisticSession,
  revertOptimisticSession,
  ScheduleSessionRow,
  SessionStatus,
  useUpcomingSchedule,
} from "../_islands/useUpcomingSchedule";

// ===== Time helpers (local input -> stored safely) =====
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
  return local.toISOString();
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
  if (!Number.isFinite(hh) || !Number.isFinite(mm))
    return { time: timeHHMM, crossedMidnight: false };

  const base = new Date(2000, 0, 1, hh, mm, 0, 0);
  base.setMinutes(base.getMinutes() + minutes);

  const crossedMidnight = base.getDate() !== 1;
  const endOfDay = new Date(2000, 0, 1, 23, 45, 0, 0);
  const final = crossedMidnight ? endOfDay : base;

  return {
    time: `${String(final.getHours()).padStart(2, "0")}:${String(
      final.getMinutes()
    ).padStart(2, "0")}`,
    crossedMidnight,
  };
}

// ===== UI bits =====
function FieldLabel({ children }: { children: string }) {
  return <div className="text-xs font-semibold text-slate-700">{children}</div>;
}
function InputShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
      {children}
    </div>
  );
}
function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "indigo" | "emerald" | "amber" | "rose";
}) {
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
  return (
    <span
      className={cx(
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        cls
      )}
    >
      {children}
    </span>
  );
}

// ===== Templates (optional) =====
type TemplateChecklistItem = { id: string; text: string };
type TemplateDef = {
  id: string;
  name: string;
  title: string;
  durationMinutes: number;
  checklist: TemplateChecklistItem[];
  next?: string;
};

const TEMPLATES: TemplateDef[] = [
  {
    id: "build_test",
    name: "Build + Test Loop",
    title: "Robotics: Build → Test → Improve",
    durationMinutes: 75,
    checklist: [
      { id: "c1", text: "Safety briefing + roles assigned" },
      { id: "c2", text: "Build step completed (base robot)" },
      { id: "c3", text: "Test run + note what failed" },
      { id: "c4", text: "Improve + retest" },
      { id: "c5", text: "Capture evidence (photo + note)" },
      { id: "c6", text: "Wrap-up reflection (1 learning each)" },
    ],
    next: "evidence_first",
  },
  {
    id: "skills_ladder",
    name: "Skills Ladder",
    title: "Skills Ladder: Learn → Guided Task → Challenge",
    durationMinutes: 60,
    checklist: [
      { id: "c1", text: "Warm-up + recap previous skill" },
      { id: "c2", text: "Guided build step completed" },
      { id: "c3", text: "Challenge extension attempted" },
      { id: "c4", text: "Short demo / share-back" },
      { id: "c5", text: "Capture evidence (photo + note)" },
    ],
    next: "build_test",
  },
  {
    id: "evidence_first",
    name: "Evidence-First",
    title: "Evidence First: Capture Proof Early",
    durationMinutes: 60,
    checklist: [
      { id: "c1", text: "Attendance recorded in first 5 mins" },
      { id: "c2", text: "Session outcomes ready (checklist)" },
      { id: "c3", text: "Capture photo evidence early" },
      { id: "c4", text: "Mid-session progress update" },
      { id: "c5", text: "Final evidence + reflection" },
    ],
    next: "skills_ladder",
  },
];

function findTemplate(id?: string | null) {
  return TEMPLATES.find((t) => t.id === id) ?? null;
}

function ChecklistPreview({ items }: { items: TemplateChecklistItem[] }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">
      <div className="text-xs font-semibold tracking-widest text-slate-500">
        SESSION PLAN (OPTIONAL)
      </div>
      <div className="mt-1 text-xs text-slate-600">
        This is a suggested run-through for staff. You can still save the session
        without a plan.
      </div>

      {!items.length ? (
        <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 text-sm text-slate-700">
          No plan selected yet. Choose a template on the right to preview a plan.
        </div>
      ) : (
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
      )}
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
            <div className="text-sm font-semibold text-slate-900">
              Session templates (optional)
            </div>
            <div className="mt-0.5 text-xs text-slate-600">
              Pick a template to auto-fill the title + duration and show a
              suggested plan.
            </div>
          </div>

          {applied ? (
            <Chip tone="indigo">Selected: {applied.name}</Chip>
          ) : (
            <Chip>None</Chip>
          )}
        </div>
      </div>

      <div className="p-5 space-y-3">
        {TEMPLATES.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-widest text-slate-500">
                  TEMPLATE
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {t.name}
                </div>
                <div className="mt-1 text-xs text-slate-600">{t.title}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Chip>{t.durationMinutes} mins</Chip>
                  <Chip>{t.checklist.length} steps</Chip>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onApply(t)}
                className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
              >
                Use template
              </button>
            </div>
          </div>
        ))}

        <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              QUICK ROTATION
            </div>
            <button
              type="button"
              onClick={onChain}
              className="rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-3 py-2 text-xs font-semibold text-indigo-950 hover:bg-indigo-50 transition"
            >
              Try next template
            </button>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            Helpful when you run different session styles across the week.
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Draft persistence for "Who & where" =====
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
    } catch {}
  }, [key, state]);

  return [state, setState] as const;
}

// ===== Time clash warning (gentle) =====
function overlaps(
  aStartIso: string,
  aDurMin: number,
  bStartIso: string,
  bDurMin: number
) {
  const a0 = new Date(aStartIso).getTime();
  const a1 = a0 + Math.max(0, aDurMin) * 60000;
  const b0 = new Date(bStartIso).getTime();
  const b1 = b0 + Math.max(0, bDurMin) * 60000;
  return a0 < b1 && b0 < a1;
}

// ===== Data types for dropdowns =====
type TeacherOption = { id: string; full_name: string | null };
type LocationOption = { id: string; name: string };

export default function CreateSessionPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const router = useRouter();
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  const { next7Days } = useUpcomingSchedule(clubId);

  // Stored fields
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // Business owners should not set "open" at creation.
  const [status] = useState<SessionStatus>("planned");

  const [dateISO, setDateISO] = useState<string>(() => defaultLocalDateISO());
  const [timeHHMM, setTimeHHMM] = useState<string>(() => defaultLocalTimeHHMM());

  // Who & where (persisted in draft)
  const draftKey = `stemtrack:schedule_create:${clubId}`;
  const [opsDraft, setOpsDraft] = useDraft(draftKey, {
    teacherId: "" as string,
    locationId: "" as string,
  });

  // Dropdown data
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Workflow
  const [breakMinutes, setBreakMinutes] = useState<number>(10);
  const [addAnotherAfterSaving, setAddAnotherAfterSaving] = useState(true);
  const [timeAutoClamped, setTimeAutoClamped] = useState(false);

  // Template
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
  const [suggestedChecklist, setSuggestedChecklist] = useState<
    TemplateChecklistItem[]
  >([]);

  // UX
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function setTimedNotice(msg: string) {
    setNotice(msg);
    window.clearTimeout((setTimedNotice as any)._t);
    (setTimedNotice as any)._t = window.setTimeout(() => setNotice(null), 3500);
  }

  // Fetch teachers + locations
  useEffect(() => {
    if (!clubId) return;
    if (!supabase) return;

    let cancelled = false;

    (async () => {
      setLoadingLookups(true);
      setError(null);
      try {
        const [tRes, lRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name")
            .eq("club_id", clubId)
            .eq("role", "teacher")
            .eq("is_active", true)
            .order("full_name", { ascending: true }),
          supabase
            .from("club_locations")
            .select("id, name")
            .eq("club_id", clubId)
            .order("name", { ascending: true }),
        ]);

        if (cancelled) return;

        if (tRes.error) throw tRes.error;
        if (lRes.error) throw lRes.error;

        setTeachers((tRes.data ?? []) as TeacherOption[]);
        setLocations((lRes.data ?? []) as LocationOption[]);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load staff/locations.");
      } finally {
        if (!cancelled) setLoadingLookups(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, supabase]);

  const preview = useMemo(() => {
    try {
      const startsAtIso = localDateTimeToIsoUtc(dateISO, timeHHMM);
      return { startsAtIso, localHuman: fmtLocalHuman(startsAtIso) };
    } catch {
      return { startsAtIso: "", localHuman: "—" };
    }
  }, [dateISO, timeHHMM]);

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
    setTimedNotice(`Template applied: ${t.name}`);
  }

  function applyNextTemplate() {
    const curr = findTemplate(appliedTemplateId);
    const next = findTemplate(curr?.next);
    if (!next) {
      setTimedNotice("No next template available.");
      return;
    }
    applyTemplate(next);
  }

  function resetAfterSaveAdvanceTime() {
    // Keep date, move time forward, clear the content.
    setTitle("");
    setSuggestedChecklist([]);
    setAppliedTemplateId(null);

    const totalAdvance = Math.max(0, durationMinutes) + Math.max(0, breakMinutes);
    const res = addMinutesToHHMM(timeHHMM, totalAdvance);
    setTimeHHMM(res.time);
    setTimeAutoClamped(res.crossedMidnight);

    setDurationMinutes(60);
    setTimedNotice(`Ready for the next one (+${totalAdvance} mins).`);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clubId) return;

    setError(null);
    setNotice(null);

    if (checking) {
      setError("Please wait a moment — still signing you in.");
      return;
    }
    if (!supabase) {
      setError("System not ready yet. Refresh the page and try again.");
      return;
    }

    const cleanTitle = title.trim();
    if (!cleanTitle) return setError("Please enter a session title.");
    if (!Number.isFinite(durationMinutes) || durationMinutes < 15)
      return setError("Duration must be at least 15 minutes.");

    let starts_at: string;
    try {
      starts_at = localDateTimeToIsoUtc(dateISO, timeHHMM);
    } catch (err: any) {
      return setError(err?.message ?? "Invalid date/time");
    }

    // Optimistic row for schedule list
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
      const { data: session, error: rpcErr } = await supabase.rpc(
        "create_session_with_lead_teacher",
        {
          p_club_id: clubId,
          p_title: cleanTitle,
          p_starts_at: starts_at,
          p_duration_minutes: durationMinutes,
          p_status: status,
          p_location_id: opsDraft.locationId || null,
          p_lead_teacher_id: opsDraft.teacherId || null,
        }
      );

      if (rpcErr || !session) {
        revertOptimisticSession(clubId, tempId);
        setError(rpcErr?.message ?? "Could not save the session. Please try again.");
        return;
      }

      confirmOptimisticSession(clubId, tempId, {
        ...(session as any),
        __optimistic: false,
      });

      setTimedNotice("Session saved.");

      if (addAnotherAfterSaving) {
        resetAfterSaveAdvanceTime();
        return;
      }

      router.push(`/app/admin/clubs/${clubId}/schedule`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
        <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">
                Schedule a session
              </div>
              <div className="mt-0.5 text-xs text-slate-600">
                Add a session to your timetable. Parents and staff will see it in
                the schedule.
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {loadingLookups ? (
                  <Chip>Loading staff & locations…</Chip>
                ) : (
                  <Chip tone="emerald">Ready</Chip>
                )}
                <Chip tone="indigo">Preview: {preview.localHuman}</Chip>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/app/admin/clubs/${clubId}/schedule`)}
                className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
              >
                Back to schedule
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
                <div className="font-semibold">Time clash warning</div>
                <div className="mt-1 text-xs text-amber-950/80">
                  This time overlaps with {conflicts.length} other session(s). You
                  can still save, but it may confuse staff/parents.
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

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: ONE form */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
            <div className="border-b border-slate-200/70 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">
                  Session details
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={addAnotherAfterSaving}
                      onChange={(e) => setAddAnotherAfterSaving(e.target.checked)}
                      className="h-4 w-4"
                    />
                    Add another after saving
                  </label>

                  <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700">
                    Break between sessions:
                    <input
                      type="number"
                      min={0}
                      step={5}
                      value={breakMinutes}
                      onChange={(e) =>
                        setBreakMinutes(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="ml-1 w-[72px] rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs text-slate-900 outline-none"
                    />
                    min
                  </span>
                </div>
              </div>

              {timeAutoClamped ? (
                <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-950">
                  Next time was pushed late in the day, so it was capped at{" "}
                  <span className="font-semibold">23:45</span>.
                </div>
              ) : null}
            </div>

            <form onSubmit={onSubmit} className="px-5 py-5 sm:px-6 space-y-4">
              <InputShell>
                <SectionTitle label="SESSION DETAILS" />

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
                      Tip: clear, outcome-based titles make reports easier to
                      understand.
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Date</FieldLabel>
                    <input
                      type="date"
                      value={dateISO}
                      onChange={(e) => setDateISO(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  <div>
                    <FieldLabel>Start time</FieldLabel>
                    <input
                      type="time"
                      value={timeHHMM}
                      onChange={(e) => setTimeHHMM(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  <div>
                    <FieldLabel>Duration (mins)</FieldLabel>
                    <input
                      type="number"
                      min={15}
                      step={5}
                      value={durationMinutes}
                      onChange={(e) =>
                        setDurationMinutes(Math.max(15, Number(e.target.value) || 0))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <div className="mt-2 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                      <div className="text-xs font-semibold tracking-widest text-slate-500">
                        SUMMARY
                      </div>
                      <div className="mt-2 text-sm text-slate-800">
                        <span className="font-semibold">When:</span>{" "}
                        {preview.localHuman}
                        <span className="mx-2 text-slate-400">•</span>
                        <span className="font-semibold">Duration:</span>{" "}
                        {durationMinutes} mins
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        Times display in your local time.
                      </div>
                    </div>
                  </div>
                </div>
              </InputShell>

              <InputShell>
                <SectionTitle label="WHO & WHERE" />

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Lead teacher (optional)</FieldLabel>
                    <select
                      value={opsDraft.teacherId}
                      onChange={(e) =>
                        setOpsDraft((p) => ({ ...p, teacherId: e.target.value }))
                      }
                      disabled={loadingLookups}
                      className={cx(
                        "mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200",
                        loadingLookups ? "opacity-70" : ""
                      )}
                    >
                      <option value="">
                        {loadingLookups ? "Loading…" : "No lead teacher selected"}
                      </option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.full_name || "Unnamed teacher"}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-xs text-slate-600">
                      This person will show as the lead for the session.
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Location (optional)</FieldLabel>
                    <select
                      value={opsDraft.locationId}
                      onChange={(e) =>
                        setOpsDraft((p) => ({ ...p, locationId: e.target.value }))
                      }
                      disabled={loadingLookups}
                      className={cx(
                        "mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200",
                        loadingLookups ? "opacity-70" : ""
                      )}
                    >
                      <option value="">
                        {loadingLookups ? "Loading…" : "No location selected"}
                      </option>
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-xs text-slate-600">
                      Helps staff and parents know where to go.
                    </div>
                  </div>
                </div>

                {(!teachers.length || !locations.length) && !loadingLookups ? (
                  <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs text-amber-950">
                    <div className="font-semibold">Setup reminder</div>
                    <div className="mt-1">
                      {teachers.length ? null : "No teachers added yet. "}
                      {locations.length ? null : "No locations added yet. "}
                      You can still save the session now and fill these later.
                    </div>
                  </div>
                ) : null}
              </InputShell>

              <ChecklistPreview items={suggestedChecklist} />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTitle("");
                    setDurationMinutes(60);
                    setAppliedTemplateId(null);
                    setSuggestedChecklist([]);
                    setTimedNotice("Cleared.");
                  }}
                  className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
                >
                  Clear form
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
                  {submitting ? "Saving…" : "Save session"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: templates */}
        <div className="lg:col-span-4 space-y-6">
          <TemplatePanel
            appliedId={appliedTemplateId}
            onApply={applyTemplate}
            onChain={applyNextTemplate}
          />
        </div>
      </div>
    </div>
  );
}
