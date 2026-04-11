import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AttendanceInput = {
  student_id: string;
  present: boolean;
  note?: string | null;
};

type SubmitAttendanceBody = {
  session_id: string;
  submission_id?: string | null;
  students: AttendanceInput[];
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function badRequest(message: string) {
  return json({ error: message }, 400);
}

function unauthorized(message = "Unauthorized") {
  return json({ error: message }, 401);
}

function serverError(message: string, details?: unknown) {
  return json(
    {
      error: message,
      details: details ?? null,
    },
    500
  );
}

function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function normalizeStudents(input: unknown): AttendanceInput[] {
  if (!Array.isArray(input)) {
    throw new Error("students must be an array");
  }

  return input.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`students[${index}] must be an object`);
    }

    const row = item as Record<string, unknown>;
    const studentId = String(row.student_id ?? "").trim();

    if (!studentId || !isUuidLike(studentId)) {
      throw new Error(`students[${index}].student_id is invalid`);
    }

    return {
      student_id: studentId,
      present: Boolean(row.present),
      note:
        row.note === undefined || row.note === null
          ? null
          : String(row.note).trim(),
    };
  });
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return unauthorized("Missing bearer token");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return serverError("Missing Supabase environment configuration");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    let body: SubmitAttendanceBody;

    try {
      body = (await req.json()) as SubmitAttendanceBody;
    } catch {
      return badRequest("Body must be valid JSON");
    }

    const sessionId = String(body.session_id ?? "").trim();
    const submissionId = body.submission_id ? String(body.submission_id).trim() : null;

    if (!sessionId || !isUuidLike(sessionId)) {
      return badRequest("session_id is required and must be a valid UUID");
    }

    let students: AttendanceInput[];
    try {
      students = normalizeStudents(body.students);
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : "Invalid students payload");
    }

    if (students.length === 0) {
      return badRequest("students array cannot be empty");
    }

    const uniqueIds = new Set(students.map((s) => s.student_id));
    if (uniqueIds.size !== students.length) {
      return badRequest("students array contains duplicate student_id values");
    }

    const {
      data: sessionRow,
      error: sessionError,
    } = await supabase
      .from("sessions")
      .select("id, club_id")
      .eq("id", sessionId)
      .single();

    if (sessionError || !sessionRow) {
      return badRequest("Session not found");
    }

    const clubId = sessionRow.club_id as string;

    const {
      data: rosterRows,
      error: rosterError,
    } = await supabase
      .from("session_participants")
      .select("student_id")
      .eq("session_id", sessionId);

    if (rosterError) {
      return serverError("Failed to load session participants", rosterError.message);
    }

    const rosterIds = new Set((rosterRows ?? []).map((r) => r.student_id as string));
    const invalidStudentIds = students
      .map((s) => s.student_id)
      .filter((id) => !rosterIds.has(id));

    if (invalidStudentIds.length > 0) {
      return badRequest(
        `Some students are not part of this session roster: ${invalidStudentIds.join(", ")}`
      );
    }

    if (submissionId) {
      const {
        data: jobRow,
        error: jobError,
      } = await supabase
        .from("ai_attendance_jobs")
        .select("id, session_id, club_id, status")
        .eq("id", submissionId)
        .single();

      if (jobError || !jobRow) {
        return badRequest("Referenced submission_id was not found");
      }

      if (jobRow.session_id !== sessionId || jobRow.club_id !== clubId) {
        return badRequest("submission_id does not belong to this session");
      }
    }

    const now = new Date().toISOString();

    const attendanceRows = students.map((item) => ({
      club_id: clubId,
      session_id: sessionId,
      student_id: item.student_id,
      status: item.present ? "present" : "absent",
      note: item.note ?? null,
      saved_at: now,
      updated_at: now,
      // keep finalised fields untouched for now
    }));

    const {
      error: upsertError,
    } = await supabase
      .from("attendance")
      .upsert(attendanceRows, {
        onConflict: "club_id,session_id,student_id",
      });

    if (upsertError) {
      return serverError("Failed to save attendance", upsertError.message);
    }

    if (submissionId) {
      const {
        error: updateJobError,
      } = await supabase
        .from("ai_attendance_jobs")
        .update({
          status: "confirmed",
          updated_at: now,
          result: {
            source: "voice_reviewed",
            confirmed_students: students.map((s) => ({
              student_id: s.student_id,
              present: s.present,
              note: s.note ?? null,
            })),
            confirmed_at: now,
          },
        })
        .eq("id", submissionId);

      if (updateJobError) {
        return serverError("Attendance saved, but failed to update AI audit job", updateJobError.message);
      }
    }

    const presentCount = students.filter((s) => s.present).length;

    return json({
      submitted: true,
      present_count: presentCount,
      total_count: students.length,
      submitted_at: now,
      source: submissionId ? "voice_reviewed" : "manual",
    });
  } catch (error) {
    return serverError(
      "Unhandled submit-attendance error",
      error instanceof Error ? error.message : String(error)
    );
  }
});