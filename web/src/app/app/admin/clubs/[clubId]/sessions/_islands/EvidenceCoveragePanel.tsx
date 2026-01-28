// web/src/app/app/admin/clubs/[clubId]/sessions/_islands/EvidenceCoveragePanel.tsx

"use client";

import { useMemo } from "react";
import { useLiveDashboard } from "./useLiveDashboard";
import { EvidenceCoveragePanel as Coverage } from "./_ui";

export default function EvidenceCoveragePanel({ clubId }: { clubId: string }) {
  const { sessions, booting } = useLiveDashboard(clubId);

  const coverage = useMemo(() => {
    const sessionsCount = sessions.length;
    const openCount = sessions.filter((s) => (s.status ?? "planned") === "open").length;
    const withEvidenceCount = sessions.filter((s) => (s.evidence_items ?? 0) > 0).length;
    const withChecklistCount = sessions.filter((s) => (s.activities_total ?? 0) > 0).length;

    return { sessionsCount, openCount, withEvidenceCount, withChecklistCount };
  }, [sessions]);

  if (booting) return null;

  return (
    <Coverage
      title="Coverage signals (Today)"
      sessionsCount={coverage.sessionsCount}
      openCount={coverage.openCount}
      withEvidenceCount={coverage.withEvidenceCount}
      withChecklistCount={coverage.withChecklistCount}
    />
  );
}
