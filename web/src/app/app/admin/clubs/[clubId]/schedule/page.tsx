// web/src/app/app/admin/clubs/[clubId]/schedule/page.tsx

"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ScheduleHeader from "./_islands/ScheduleHeader";
import ScheduleComposer, { ScheduleDraft } from "./_islands/ScheduleComposer";
import UpcomingSchedule from "./_islands/UpcomingSchedule";
import TemplateSuggestions, { SessionTemplate } from "./_islands/TemplateSuggestions";
import QualityChecklistPanel from "./_islands/QualityChecklistPanel";

function isoDateLocal(d: Date) {
  // YYYY-MM-DD in local time
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function SchedulePage() {
  const { clubId } = useParams<{ clubId: string }>();

  const initialDraft = useMemo<ScheduleDraft>(() => {
    const now = new Date();
    return {
      title: "",
      date: isoDateLocal(now),
      time: "16:00",
      durationMinutes: 60,
      checklist: [],
      templateId: null,
    };
  }, []);

  const [draft, setDraft] = useState<ScheduleDraft>(initialDraft);
  const [refreshToken, setRefreshToken] = useState(0);

  function applyTemplate(t: SessionTemplate) {
    setDraft((d) => ({
      ...d,
      title: t.suggestedTitle,
      durationMinutes: t.durationMinutes,
      checklist: t.suggestedChecklist,
      templateId: t.id,
    }));
    // Keep date/time as user selected (enterprise UX: don’t override scheduling intent)
  }

  return (
    <>
      <ScheduleHeader clubId={clubId} />

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-6">
            <ScheduleComposer
              clubId={clubId}
              draft={draft}
              onDraftChange={setDraft}
              onCreated={() => setRefreshToken((x) => x + 1)}
            />

            <UpcomingSchedule clubId={clubId} />
          </div>

          <div className="lg:col-span-4 space-y-6">
            <TemplateSuggestions clubId={clubId} onApplyTemplate={applyTemplate} activeTemplateId={draft.templateId} />
            <QualityChecklistPanel clubId={clubId} />
          </div>
        </div>
      </div>
    </>
  );
}
