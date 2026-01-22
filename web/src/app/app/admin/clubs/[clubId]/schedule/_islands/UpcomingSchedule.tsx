// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/ScheduleHeader.tsx

"use client";

import { SectionTitle } from "./_ui";

export default function UpcomingSchedule({ clubId }: { clubId: string }) {
  return (
    <div className="rounded-[26px] border border-slate-200/80 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
      <div className="border-b border-slate-200/70 px-5 py-4 sm:px-6">
        <div className="text-sm font-semibold text-slate-900">Next 7 days</div>
        <div className="mt-0.5 text-xs text-slate-600">Upcoming sessions (preview)</div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6">
          <SectionTitle label="EMPTY" />
          <div className="mt-2 text-sm text-slate-800">No upcoming sessions yet.</div>
          <div className="mt-1 text-xs text-slate-600">
            Once you create sessions, this becomes your operational weekly plan.
          </div>
        </div>
      </div>
    </div>
  );
}
