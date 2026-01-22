// web/src/app/app/admin/clubs/[clubId]/schedule/create/page.tsx
"use client";

import React, { useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminGuard } from "@/lib/admin/admin-guard";

import TemplateApplyPanel, { TemplateChecklistItem } from "./_islands/TemplateApplyPanel";
import SuggestedChecklistPreview from "./_islands/SuggestedChecklistPreview";
import { cx, SectionTitle } from "../_islands/_ui/page";

import {
  addOptimisticSession,
  confirmOptimisticSession,
  revertOptimisticSession,
  ScheduleSessionRow,
  SessionStatus,
} from "../_islands/useUpcomingSchedule";

/* ------------------------------ date/time utils ------------------------------ */

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

/**
 * Convert a local date+time (inputs are "YYYY-MM-DD" and "HH:MM") into a UTC ISO string.
 * This is correct for "store UTC, display local" workflow.
 */
function localDateTimeToIsoUtc(dateISO: string, timeHHMM: string) {
  const [y, m, d] = dateISO.split("-").map((x) => Number(x));
  const [hh, mm] = timeHHMM.split(":").map((x) => Number(x));

  const local = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
  if (!Number.isFinite(local.getTime())) throw new Error("Invalid date/time");
  return local.toISOString();
}

function toLocalDayRangeUtcIso(dateISO: string) {
  const [y, m, d] = dateISO.split("-").map((x) => Number(x));
  const startLocal = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
  const endLocal = new Date(y, (m ?? 1) - 1, d ?? 1, 23, 59, 59, 999);
  if (!Number.isFinite(startLocal.getTime()) || !Number.isFinite(endLocal.getTime())) {
    throw new Error("Invalid date");
  }
  return { startUtcIso: startLocal.toISOString(), endUtcIso: endLocal.toISOString() };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function roundToStepMinutes(totalMinutes: number, step: number) {
  if (!Number.isFinite(totalMinutes)) return 0;
  if (step <= 1) return totalMinutes;
  return Math.round(totalMinutes / step) * step;
}

/**
 * Add minutes to a HH:MM time while keeping the SAME day.
 * If it crosses midnight, it clamps to end-of-day and reports crossedMidnight=true.
 * Optionally rounds to a step (e.g. 5 or 15 minutes) after adding.
 */
function addMinutesToHHMM(args: { timeHHMM: string; minutesToAdd: number; roundStep?: number }) {
  const { timeHHMM, minutesToAdd, roundStep = 5 } = args;

  const [hh, mm] = timeHHMM.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
    return { time: timeHHMM, crossedMidnight: false, changed: false };
  }

  const base = new Date(2000, 0, 1, hh, mm, 0, 0);
  base.setMinutes(base.getMinutes() + minutesToAdd);

  // if crossed, clamp (enterprise-safe: never silently changes date)
  const crossedMidnight = base.getDate() !== 1;
  const endOfDay = new Date(2000, 0, 1, 23, 45, 0, 0);
  const final = crossedMidnight ? endOfDay : base;

  // round on same day (after clamp)
  let total = final.getHours() * 60 + final.getMinutes();
  total = clamp(roundToStepMinutes(total, roundStep), 0, 23 * 60 + 45);

  const HH = String(Math.floor(total / 60)).padStart(2, "0");
  const MM = String(total % 60).padStart(2, "0");

  const next = `${HH}:${MM}`;
  const changed = next !== timeHHMM;

  return { time: next, crossedMidnight, changed };
}

function makeTempId() {
  return `temp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/* ------------------------------ UI shells ------------------------------ */

function FieldLabel({ children }: { children: string }) {
  return <div className="text-xs font-semibold text-slate-700">{children}</div>;
}

function InputShell({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-4">{children}</div>;
}

/* ------------------------------ conflicts ------------------------------ */

type DbSessionLite = {
  id: string;
  title: string | null;
  starts_at: string | null;
  duration_minutes: number | null;
  status?: SessionStatus | null;
};

function toMillis(iso?: string | null) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : null;
}

function overlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

function fmtLocalTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/* ------------------------------ template chaining (UI-only) ------------------------------ */

/**
 * UI-only chain rules by template name.
 * This works even if TemplateApplyPanel remains unchanged.
 * If the next template isn't cached yet, we queue it and prompt user to click it (still enterprise feel).
 */
const TEMPLATE_CHAIN: Record<string, string> = {
  "Template A": "Template B",
  "Template B": "Template C",
  // add your real names here:
  // "Intro Robotics (Build)": "Sensors & Calibration",
  // "Sensors & Calibration": "Challenge Run",
};

export default function CreateSessionPage() {
  const { clubId } = useParams<{ clubId: string }>();
  const router = useRouter();
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  // Form state
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [status, setStatus] = useState<SessionStatus>("planned");
  const [dateISO, setDateISO] = useState<string>(() => defaultLocalDateISO());
  const [timeHHMM, setTimeHHMM] = useState<string>(() => defaultLocalTimeHHMM());

  // “Create another” + time automation
  const [createAnother, setCreateAnother] = useState(true);

  // NEW: buffer + rounding (ops workflow)
  const [autoBufferOn, setAutoBufferOn] = useState(true);
  const [bufferMinutes, setBufferMinutes] = useState<number>(10);
  const [roundStep, setRoundStep] = useState<number>(5); // 5 or 15 usually

  const [timeAutoClamped, setTimeAutoClamped] = useState(false);

  // UI-only checklist
  const [suggestedChecklist, setSuggestedChecklist] = useState<TemplateChecklistItem[]>([]);
  const [appliedTemplateName, setAppliedTemplateName] = useState<string | null>(null);

  // NEW: template chaining
  const [chainOn, setChainOn] = useState(true);
  const [queuedNextTemplateName, setQueuedNextTemplateName] = useState<string | null>(null);

  // Cache templates we’ve seen (so we can auto-apply next in chain without modifying TemplateApplyPanel)
  const templateCacheRef = useRef(new Map<string, { name: string; title: string; durationMinutes: number; checklist: TemplateChecklistItem[] }>());

  // UX state
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // NEW: conflict detection (UI-only read) state
  const [conflictsLoading, setConflictsLoading] = useState(false);
  const [conflicts, setConflicts] = useState<
    Array<{
      id: string;
      title: string;
      startIso: string;
      endIso: string;
      status: SessionStatus;
    }>
  >([]);

  const preview = useMemo(() => {
    try {
      const startsAtIso = localDateTimeToIsoUtc(dateISO, timeHHMM);
      const local = new Date(startsAtIso);
      return {
        startsAtIso,
        localHuman: local.toLocaleString(undefined, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    } catch {
      return { startsAtIso: "", localHuman: "—" };
    }
  }, [dateISO, timeHHMM]);

  function setTimedNotice(msg: string) {
    setNotice(msg);
    window.clearTimeout((setTimedNotice as any)._t);
    (setTimedNotice as any)._t = window.setTimeout(() => setNotice(null), 3500);
  }

  function applyTemplate(tpl: { name: string; title: string; durationMinutes: number; checklist: TemplateChecklistItem[] }) {
    setTitle(tpl.title);
    setDurationMinutes(tpl.durationMinutes);
    setSuggestedChecklist(tpl.checklist);
    setAppliedTemplateName(tpl.name);

    // cache it for chaining
    templateCacheRef.current.set(tpl.name, tpl);

    // queue next in chain (UI-only)
    const next = TEMPLATE_CHAIN[tpl.name] ?? null;
    setQueuedNextTemplateName(next);
    if (next) setTimedNotice(`Applied: ${tpl.name} • Next in chain: ${next}`);
    else setTimedNotice(`Applied: ${tpl.name}`);
  }

  function maybeAutoApplyNextTemplateFromChain() {
    if (!chainOn) return;

    const nextName = queuedNextTemplateName;
    if (!nextName) return;

    const cached = templateCacheRef.current.get(nextName);
    if (!cached) {
      // we can’t auto-apply a template we haven’t seen yet without changing TemplateApplyPanel;
      // still provide enterprise behavior: queue + nudge.
      setTimedNotice(`Next template queued: ${nextName} (click it in Templates panel to apply)`);
      return;
    }

    applyTemplate(cached);
  }

  function resetFormKeepDateAndAdvanceTime() {
    // reset fields
    setTitle("");
    setStatus("planned");
    setSuggestedChecklist([]);
    setAppliedTemplateName(null);

    // Keep duration? In enterprise ops, keep duration; BUT user said “Create another keeps same date and auto-advance time”.
    // We keep duration so repeating session blocks is fast.
    // setDurationMinutes(60); // (commented intentionally)

    // ⏱️ AUTO-ADVANCE TIME = duration + optional buffer
    const add = durationMinutes + (autoBufferOn ? clamp(bufferMinutes, 0, 120) : 0);
    const result = addMinutesToHHMM({ timeHHMM, minutesToAdd: add, roundStep });

    setTimeHHMM(result.time);
    setTimeAutoClamped(result.crossedMidnight);

    // after reset, if chaining is enabled, apply next template if cached
    maybeAutoApplyNextTemplateFromChain();
  }

  async function checkConflictsUIOnly(args: { startsAtIso: string; durationMinutes: number }) {
    if (!clubId) return [];

    const startsMs = toMillis(args.startsAtIso);
    if (startsMs === null) return [];

    const endsMs = startsMs + clamp(args.durationMinutes, 0, 24 * 60) * 60000;

    const { startUtcIso, endUtcIso } = toLocalDayRangeUtcIso(dateISO);

    // Read-only, UI-only detection.
    // We only fetch the SAME day range to keep it fast and predictable.
    const { data, error: readErr } = await supabase
      .from("sessions")
      .select("id, title, starts_at, duration_minutes, status")
      .eq("club_id", clubId)
      .gte("starts_at", startUtcIso)
      .lte("starts_at", endUtcIso);

    if (readErr) {
      // conflicts check should NEVER block core create flow if reads fail;
      // we simply return no conflicts and let create proceed.
      return [];
    }

    const rows = (data ?? []) as DbSessionLite[];

    const hits = rows
      .map((s) => {
        const sStartMs = toMillis(s.starts_at);
        if (sStartMs === null) return null;
        const sEndMs = sStartMs + clamp(s.duration_minutes ?? 0, 0, 24 * 60) * 60000;

        if (!overlap(startsMs, endsMs, sStartMs, sEndMs)) return null;

        return {
          id: s.id,
          title: (s.title ?? "Untitled session").trim(),
          startIso: s.starts_at ?? "",
          endIso: new Date(sEndMs).toISOString(),
          status: (s.status ?? "planned") as SessionStatus,
        };
      })
      .filter(Boolean) as Array<{ id: string; title: string; startIso: string; endIso: string; status: SessionStatus }>;

    return hits;
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

    // 🔎 UI-only conflict check (non-blocking but warns strongly)
    setConflictsLoading(true);
    try {
      const hits = await checkConflictsUIOnly({ startsAtIso: starts_at, durationMinutes });
      setConflicts(hits);

      // Enterprise behavior: block create if conflicts exist unless user explicitly decides.
      // Since you asked "UI-only before insert", we do NOT auto-reschedule; we ask user to fix time.
      if (hits.length > 0) {
        setError("Scheduling conflict detected. Adjust time or duration before creating.");
        setTimedNotice("Conflict check: overlaps found.");
        return;
      }
    } finally {
      setConflictsLoading(false);
    }

    // ✅ OPTIMISTIC INSERT
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

      if (createAnother) {
        resetFormKeepDateAndAdvanceTime();
        return;
      }

      router.push(`/app/admin/clubs/${clubId}/schedule`);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const hasConflicts = conflicts.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
        <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.08),transparent_55%)] px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">Create Session</div>
              <div className="mt-0.5 text-xs text-slate-600">
                Optimistic UI enabled • Conflict detection (UI-only) • Buffer auto-increment • Template chain (UI-only)
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/app/admin/clubs/${clubId}/schedule`)}
                className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
              >
                Back to schedule
              </button>

              <span className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700">
                Preview: <span className="ml-2 text-slate-900">{preview.localHuman}</span>
              </span>
            </div>
          </div>
        </div>

        {(notice || error) && (
          <div className="px-5 py-4 sm:px-6">
            {notice ? (
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 p-4 text-sm text-emerald-950">{notice}</div>
            ) : null}

            {error ? (
              <div className="mt-3 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-sm text-rose-950">{error}</div>
            ) : null}
          </div>
        )}
      </div>

      {/* Content grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: form */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
            <div className="border-b border-slate-200/70 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">Session details</div>

                {appliedTemplateName ? (
                  <span className="rounded-full border border-indigo-200/80 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-950">
                    Template: {appliedTemplateName}
                  </span>
                ) : (
                  <span className="rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">No template</span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={createAnother}
                    onChange={(e) => setCreateAnother(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Create another (keep same date)
                </label>

                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800">
                  <input type="checkbox" checked={autoBufferOn} onChange={(e) => setAutoBufferOn(e.target.checked)} className="h-4 w-4" />
                  Auto buffer
                </label>

                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800">
                  Buffer
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={bufferMinutes}
                    onChange={(e) => setBufferMinutes(clamp(Number(e.target.value) || 0, 0, 120))}
                    className="w-16 rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  min
                </label>

                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800">
                  Round
                  <select
                    value={roundStep}
                    onChange={(e) => setRoundStep(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value={5}>5m</option>
                    <option value={15}>15m</option>
                  </select>
                </label>

                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800">
                  <input type="checkbox" checked={chainOn} onChange={(e) => setChainOn(e.target.checked)} className="h-4 w-4" />
                  Template chaining
                </label>

                {queuedNextTemplateName ? (
                  <span className="rounded-xl border border-indigo-200/80 bg-indigo-50/60 px-3 py-2 text-xs font-semibold text-indigo-950">
                    Next: <span className="ml-1">{queuedNextTemplateName}</span>
                  </span>
                ) : (
                  <span className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700">Next: —</span>
                )}

                <span className="rounded-xl border border-slate-200/80 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700">
                  Optimistic: <span className="ml-1 text-slate-900">ON</span>
                </span>
              </div>
            </div>

            <form onSubmit={onSubmit} className="px-5 py-5 sm:px-6 space-y-4">
              <InputShell>
                <SectionTitle label="CORE" />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FieldLabel>Title</FieldLabel>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Robotics Fundamentals (Build + Test)"
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
                </div>
              </InputShell>

              <InputShell>
                <SectionTitle label="SCHEDULING" />
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
                      onChange={(e) => {
                        setTimeHHMM(e.target.value);
                        setTimeAutoClamped(false);
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-semibold tracking-widest text-slate-500">INSERT PREVIEW</div>
                    <span className="rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                      starts_at (UTC ISO): <span className="font-mono text-slate-900">{preview.startsAtIso || "—"}</span>
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-600">We store UTC ISO; UI displays local time automatically. (No backend changes.)</div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 font-semibold text-slate-800">
                      Auto-advance:{" "}
                      <span className="text-slate-900">
                        {durationMinutes}m {autoBufferOn ? `+ ${bufferMinutes}m buffer` : ""} • round {roundStep}m
                      </span>
                    </span>

                    {conflictsLoading ? (
                      <span className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                        Conflict check: <span className="ml-1 animate-pulse">running…</span>
                      </span>
                    ) : (
                      <span
                        className={cx(
                          "rounded-full border px-3 py-1 font-semibold",
                          hasConflicts ? "border-rose-200/80 bg-rose-50/70 text-rose-950" : "border-emerald-200/80 bg-emerald-50/70 text-emerald-950"
                        )}
                      >
                        Conflict check: {hasConflicts ? "OVERLAP" : "CLEAR"}
                      </span>
                    )}
                  </div>

                  {timeAutoClamped && (
                    <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-950">
                      Time reached end of day. Auto-advance capped at <span className="font-semibold">23:45</span>.
                    </div>
                  )}

                  {hasConflicts && (
                    <div className="mt-3 rounded-xl border border-rose-200/80 bg-rose-50/70 p-4">
                      <div className="text-xs font-semibold tracking-widest text-rose-900">CONFLICTS FOUND (UI-ONLY)</div>
                      <div className="mt-2 space-y-2">
                        {conflicts.slice(0, 4).map((c) => (
                          <div key={c.id} className="rounded-xl border border-rose-200/70 bg-white/70 p-3 text-xs text-rose-950">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-semibold">{c.title}</div>
                              <span className="rounded-full border border-rose-200/80 bg-rose-50/70 px-2 py-0.5 text-[11px] font-semibold">
                                {(c.status ?? "planned").toUpperCase()}
                              </span>
                            </div>
                            <div className="mt-1 text-rose-900/90">
                              {fmtLocalTime(c.startIso)} – {fmtLocalTime(c.endIso)}
                            </div>
                          </div>
                        ))}
                        {conflicts.length > 4 ? <div className="text-xs text-rose-900/90">+ {conflicts.length - 4} more…</div> : null}
                      </div>
                      <div className="mt-3 text-xs text-rose-900/90">
                        Adjust <span className="font-semibold">time</span> or <span className="font-semibold">duration</span> to clear overlaps before creating.
                      </div>
                    </div>
                  )}
                </div>
              </InputShell>

              <InputShell>
                <SectionTitle label="SUGGESTED CHECKLIST (UI ONLY)" />
                <div className="mt-4">
                  <SuggestedChecklistPreview items={suggestedChecklist} />
                </div>
              </InputShell>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTitle("");
                    setSuggestedChecklist([]);
                    setAppliedTemplateName(null);
                    setTimedNotice("Reset fields (kept date/time).");
                  }}
                  className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
                >
                  Reset (keep date/time)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      // simulate next slot without submitting (enterprise preview action)
                      const add = durationMinutes + (autoBufferOn ? clamp(bufferMinutes, 0, 120) : 0);
                      const result = addMinutesToHHMM({ timeHHMM, minutesToAdd: add, roundStep });
                      setTimeHHMM(result.time);
                      setTimeAutoClamped(result.crossedMidnight);
                      setTimedNotice(`Advanced time by ${add}m (${autoBufferOn ? "duration+buffer" : "duration"})`);
                    }}
                    className="rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
                  >
                    Advance time
                  </button>

                  <button
                    type="submit"
                    disabled={submitting || hasConflicts}
                    className={cx(
                      "rounded-xl border px-4 py-2 text-sm font-semibold transition",
                      submitting || hasConflicts
                        ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                        : "border-indigo-200/80 bg-indigo-50/70 text-indigo-950 hover:bg-indigo-50"
                    )}
                  >
                    {submitting ? "Creating…" : hasConflicts ? "Fix conflicts to create" : "Create session"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right: template panel */}
        <div className="lg:col-span-4 space-y-6">
          <TemplateApplyPanel
            onApply={(tpl) => {
              applyTemplate(tpl);
            }}
          />

          {/* UI-only chain helper panel (enterprise ops guidance) */}
          <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
            <div className="border-b border-slate-200/70 px-5 py-4">
              <div className="text-sm font-semibold text-slate-900">Template chain</div>
              <div className="mt-0.5 text-xs text-slate-600">UI-only workflow: A → B → C (no backend changes)</div>
            </div>

            <div className="px-5 py-5 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-800">
                <div className="text-xs font-semibold tracking-widest text-slate-500">STATUS</div>
                <div className="mt-2">
                  Current:{" "}
                  <span className="font-semibold text-slate-900">{appliedTemplateName ?? "—"}</span>
                  <span className="mx-2 text-slate-400">→</span>
                  Next:{" "}
                  <span className="font-semibold text-slate-900">{queuedNextTemplateName ?? "—"}</span>
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  On “Create another”, we’ll try to auto-apply the next template if it’s already cached (i.e., you’ve clicked it before in this session).
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  maybeAutoApplyNextTemplateFromChain();
                }}
                className="w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
              >
                Apply next (if available)
              </button>

              <div className="text-xs text-slate-600">
                Want full automatic chaining without this cache rule? We can export templates from <span className="font-mono">TemplateApplyPanel</span> (still UI-only).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
