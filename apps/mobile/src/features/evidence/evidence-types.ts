// apps/mobile/src/features/evidence/evidence-types.ts
import type { EvidenceMetadata, TrackBranch } from "stemtrack-sdk";

export type EvidenceDraft = {
  localUri: string;
  fileName: string;
  mimeType: string;
  note: string;
  branch: TrackBranch;
  taggedStudentIds: string[];
  capturedAt: string;
  kind: "photo" | "video";
  metadata: EvidenceMetadata;
};