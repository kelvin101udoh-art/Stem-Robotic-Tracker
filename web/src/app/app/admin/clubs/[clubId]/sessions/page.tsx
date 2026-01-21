// web/src/app/app/admin/clubs/[clubId]/sessions/page.tsx
"use client";

import { useParams } from "next/navigation";
import LiveHeader from "./_islands/LiveHeader";
import TodayKpis from "./_islands/TodayKpis";
import LiveSessionFocus from "./_islands/LiveSessionFocus";
import TodaySchedule from "./_islands/TodaySchedule";
import AiInsightPanel from "./_islands/AiInsightPanel";

export default function SessionsPage() {
  const { clubId } = useParams<{ clubId: string }>();

  return (
    <>
      <LiveHeader clubId={clubId} />

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <TodayKpis clubId={clubId} />

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <LiveSessionFocus clubId={clubId} />
            <TodaySchedule clubId={clubId} />
          </div>

          <div className="lg:col-span-4">
            <AiInsightPanel clubId={clubId} />
          </div>
        </div>
      </div>
    </>
  );
}
