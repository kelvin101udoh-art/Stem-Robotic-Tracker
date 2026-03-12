export type CaptureStatus =
  | "uploaded"
  | "processing"
  | "completed"
  | "failed";

export interface VoiceCapture {
  id: string;
  clubId: string;
  createdAt: string;
  status: CaptureStatus;
  durationMs?: number;
  transcript?: string | null;
  audioPath?: string | null;
}