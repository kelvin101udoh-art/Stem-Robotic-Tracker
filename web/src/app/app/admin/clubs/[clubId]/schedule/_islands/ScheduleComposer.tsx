// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/ScheduleHeader.tsx

"use client";

import { useMemo, useState } from "react";
import { SectionTitle } from "./_ui";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function ScheduleComposer({ clubId }: { clubId: string }) {
  const today = useMemo(() => isoDate(new Date()), []);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("16:00");
  const [duration, setDuration] = useState(60);

  // UI-only: wire to your existing sessions insert later
  const disabled = !title.trim();

  return (
    <section id="composer" className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Create a session</div>
            <div className="mt-0.5 text-xs text-slate-600">
              Capture the minimum needed now — you can attach checklist & evidence during delivery.
            </div>
          </div>

          <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
            Club: <span className="text-slate-900">{clubId.slice(0, 8)}…</span>
          </span>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6 space-y-5">
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <SectionTitle label="SESSION TITLE" />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Robotics Build: Line-Following Challenge"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <div className="mt-2 text-xs text-slate-600">
              Keep it outcome-driven. This name becomes your evidence header for the day.
            </div>
          </div>

          <div className="lg:col-span-6 grid gap-4 sm:grid-cols-3">
            <div>
              <SectionTitle label="DATE" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <SectionTitle label="TIME" />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <SectionTitle label="DURATION" />
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
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
          <SectionTitle label="NEXT" />
          <div className="mt-2 text-sm text-slate-800">
            After creating the session, mark it <span className="font-semibold text-slate-900">OPEN</span> during delivery and capture:
          </div>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-800">
            <li>Attendance (participants)</li>
            <li>Checklist outcomes (4–6)</li>
            <li>Evidence (photo + note early)</li>
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            This form is intentionally lightweight — enterprise systems optimize for low friction + consistent signals.
          </div>

          <button
            disabled={disabled}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              // TODO: wire create via supabase insert / RPC
              alert("UI-only for now. Next step: wire to sessions insert.");
            }}
          >
            Create session
          </button>
        </div>
      </div>
    </section>
  );
}
