export interface AttendanceStudentDto {
  id: string;
  full_name: string;
  present: boolean;
}

export interface AttendanceVoiceCandidateDto {
  spoken_text: string;
  matched_student_id?: string | null;
  matched_student_name?: string | null;
  confidence?: number | null;
  status: "matched" | "unmatched" | "ambiguous";
}

export interface SubmitAttendanceRequest {
  students: Array<{
    student_id: string;
    present: boolean;
  }>;
}

export interface SubmitAttendanceResponse {
  submitted: boolean;
  present_count: number;
  total_count: number;
  submitted_at?: string;
}