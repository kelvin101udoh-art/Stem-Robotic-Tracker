export type EvidenceKind = "photo" | "video";

export interface EvidenceMetadataDto {
  session_id?: string | null;
  club_id?: string | null;
  student_id?: string | null;
  note?: string | null;
  captured_at: string;
  kind: EvidenceKind;
}

export interface SubmitEvidenceResponse {
  evidence_id: string;
  status: "uploaded" | "accepted";
  created_at?: string;
}