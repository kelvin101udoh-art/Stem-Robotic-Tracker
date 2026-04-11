export type CaptureSubmissionStatus =
  | "idle"
  | "recording"
  | "review"
  | "submitting"
  | "submitted"
  | "failed";

export interface SubmitLearningCaptureResponse {
  capture_id: string;
  status: "queued" | "processing" | "accepted";
  created_at?: string;
}