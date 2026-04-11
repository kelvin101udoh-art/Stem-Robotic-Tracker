export type EvidenceDraft = {
  localUri: string;
  fileName: string;
  mimeType: string;
  note: string;
  studentId?: string | null;
  capturedAt: string;
  kind: "photo" | "video";
};