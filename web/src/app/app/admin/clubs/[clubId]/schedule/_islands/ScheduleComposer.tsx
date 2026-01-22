// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/ScheduleComposer.tsx

"use client";

import { useMemo, useState } from "react";
import { useAdminGuard } from "@/lib/admin/admin-guard";
import { SectionTitle } from "./_ui/page";

export type ScheduleDraft = {
  title: string;
  date: string; // YYYY-MM-DD (local)
  time: string; // HH:mm (local)
  durationMinutes: number;
  checklist: string[];
  templateId: string | null;
};

type SessionsInsert = {
  club_id: string;
  title: string | null;
  starts_at: string; // ISO
  duration_minutes: number | null;
  status?: "planned" | "open" | "closed" | null;
};

function makeStartsAtISO(dateYYYYMMDD: string, timeHHmm: string) {
  // Interprets the user’s input as LOCAL time, then converts to UTC ISO for storage.
  // This is the safest default when DB uses timestamptz.
  const local = new Date(`${dateYYYYMMDD}T${timeHHmm}:00`);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

function fmtPreviewLocal(dateYYYYMMDD: string, timeHHmm: string) {
  const local = new Date(`${dateYYYYMMDD}T${timeHHmm}:00`);
  if (Number.isNaN(local.getTime())) return "—";
  return local.toLocaleString(undefined, { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ScheduleComposer(props: {
  clubId: string;
  draft: ScheduleDraft;
  onDraftChange: (d: ScheduleDraft) => void;
  onCreated?: () => void;
}) {
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  const disabled = useMemo(() => {
    if (checking) return true;
    if (submitting) return true;
    if (!props.draft.title.trim()) return true;
    if (!props.draft.date) return true;
    if (!props.draft.time) return true;
    return false;
  }, [checking, submitting, props.draft]);

  async function createSession() {
    setBanner(null);

    const startsAtIso = makeStartsAtISO(props.draft.date, props.draft.time);
    if (!startsAtIso) {
      setBanner({ kind: "err", msg: "Invalid date/time. Please pick a valid schedule time." });
      return;
    }

    const payload: SessionsInsert = {
      club_id: props.clubId,
      title: props.draft.title.trim(),
      starts_at: startsAtIso,
      duration_minutes: props.draft.durationMinutes,
      status: "planned",
    };

    setSubmitting(true);

    try {
      // Insert + return inserted row (enterprise: immediate confirmation + IDs)
      const { data, error } = await supabase
        .from("sessions")
        .insert(payload)
        .select("id, title, starts_at, duration_minutes, status")
        .single();

      if (error) throw error;

      setBanner({
        kind: "ok",
        msg: `Session created: "${data?.title ?? "Untitled"}" • ${fmtPreviewLocal(props.draft.date, props.draft.time)}`,
      });

      // Clear only title; keep date/time as admin might schedule multiple sessions quickly.
      props.onDraftChange({
        ...props.draft,
        title: "",
        checklist: [],
        templateId: null,
      });

      props.onCreated?.();
    } catch (e: any) {
      setBanner({
        kind: "err",
        msg: e?.message ?? "Failed to create session. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="composer"
      className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden"
    >
      <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Create a session</div>
            <div className="mt-0.5 text-xs text-slate-600">
              Local scheduling → stored safely as UTC. Keeps analytics accurate across devices/timezones.
            </div>
          </div>

          <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
            Preview: <span className="text-slate-900">{fmtPreviewLocal(props.draft.date, props.draft.time)}</span>
          </span>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6 space-y-5">
        {banner ? (
          <div
            className={[
              "rounded-2xl border p-4 text-sm",
              banner.kind === "ok"
                ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-950"
                : "border-rose-200/80 bg-rose-50/70 text-rose-950",
            ].join(" ")}
          >
            {banner.msg}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SectionTitle label="SESSION TITLE" />
            <input
              value={props.draft.title}
              onChange={(e) => props.onDraftChange({ ...props.draft, title: e.target.value })}
              placeholder="e.g., Robotics Build: Line-Following Challenge"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <div className="mt-2 text-xs text-slate-600">
              Outcome-driven naming makes reporting and evidence traceability enterprise-clean.
            </div>
          </div>

          <div className="lg:col-span-6 grid gap-4 sm:grid-cols-3">
            <div>
              <SectionTitle label="DATE" />
              <input
                type="date"
                value={props.draft.date}
                onChange={(e) => props.onDraftChange({ ...props.draft, date: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <SectionTitle label="TIME" />
              <input
                type="time"
                value={props.draft.time}
                onChange={(e) => props.onDraftChange({ ...props.draft, time: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <SectionTitle label="DURATION" />
              <select
                value={props.draft.durationMinutes}
                onChange={(e) => props.onDraftChange({ ...props.draft, durationMinutes: Number(e.target.value) })}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {[45, 60, 75, 90, 120].map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SectionTitle label="SUGGESTED CHECKLIST" />
              <div className="mt-2 text-sm text-slate-800">
                Apply a template (right panel) to auto-fill outcomes for consistent execution tracking.
              </div>
            </div>
            <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
              {props.draft.checklist.length ? `${props.draft.checklist.length} item(s)` : "None"}
            </span>
          </div>

          {props.draft.checklist.length ? (
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-800">
              {props.draft.checklist.slice(0, 6).map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 text-xs text-slate-600">
              No checklist selected yet — this is okay. You can still add it during delivery.
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            Status defaults to <span className="font-semibold text-slate-900">PLANNED</span>. Mark
            <span className="font-semibold text-slate-900"> OPEN</span> during delivery for best live analytics.
          </div>

          <button
            disabled={disabled}
            onClick={createSession}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Creating…" : "Create session"}
          </button>
        </div>
      </div>
    </section>
  );
}
