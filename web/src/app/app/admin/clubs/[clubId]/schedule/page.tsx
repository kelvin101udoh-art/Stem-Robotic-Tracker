// web/src/app/app/admin/clubs/[clubId]/schedule/page.tsx

"use client";

import { useParams } from "next/navigation";
import ScheduleHeader from "./_islands/ScheduleHeader";
import ScheduleComposer from "./_islands/ScheduleComposer";
import UpcomingSchedule from "./_islands/UpcomingSchedule";
import TemplateSuggestions from "./_islands/TemplateSuggestions";
import QualityChecklistPanel from "./_islands/QualityChecklistPanel";

export default function SchedulePage() {
  const { clubId } = useParams<{ clubId: string }>();

  return (
    <>
      <ScheduleHeader clubId={clubId} />

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <ScheduleComposer clubId={clubId} />
            <UpcomingSchedule clubId={clubId} />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <TemplateSuggestions clubId={clubId} />
            <QualityChecklistPanel clubId={clubId} />
          </div>
        </div>
      </div>
    </>
  );
}
