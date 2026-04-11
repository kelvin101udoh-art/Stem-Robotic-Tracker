import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RosterRow = {
  student_id: string;
  students: {
    full_name: string;
  } | null;
};

type ParsedAttendanceEntry = {
  name: string;
  status: "present" | "absent" | "late";
};

type AttendanceVoiceCandidate = {
  spoken_text: string;
  matched_student_id: string | null;
  matched_student_name: string | null;
  confidence: number | null;
  status: "matched" | "unmatched" | "ambiguous";
  proposed_status: "present" | "absent" | "late";
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

async function transcribeAudio(file: File): Promise<string> {
  const endpoint = Deno.env.get("AZURE_OPENAI_ENDPOINT");
  const apiKey = Deno.env.get("AZURE_OPENAI_API_KEY");

  if (!endpoint || !apiKey) {
    throw new Error("Missing Azure OpenAI config");
  }

  const url = `${endpoint}/openai/deployments/whisper/audio/transcriptions?api-version=2025-04-01-preview`;

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": apiKey,
    },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Azure transcription failed: ${text}`);
  }

  const json = await res.json();
  return json.text;
}

function buildExtractionPrompt(transcript: string) {
  return `
You are an assistant extracting structured attendance from teacher speech.

RULES:
- Only return valid JSON
- No explanations
- No markdown
- No extra text
- Lowercase all names
- Only use "present", "absent", or "late"
- If nothing valid is found, return {"entries":[]}

OUTPUT FORMAT:
{
  "entries": [
    { "name": "john doe", "status": "present" }
  ]
}

TRANSCRIPT:
${transcript}
`;
}

async function extractAttendance(transcript: string): Promise<any> {
  const endpoint = Deno.env.get("AZURE_OPENAI_ENDPOINT");
  const apiKey = Deno.env.get("AZURE_OPENAI_API_KEY");
  const deployment = Deno.env.get("AZURE_DEPLOYMENT_ATTENDANCE");

  if (!endpoint || !apiKey || !deployment) {
    throw new Error("Missing Azure OpenAI config");
  }

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2025-04-01-preview`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      temperature: 0,
      messages: [
        {
          role: "user",
          content: buildExtractionPrompt(transcript),
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Azure extraction failed: ${text}`);
  }

  const json = await res.json();
  const content = json.choices[0].message.content;

  return JSON.parse(content);
}

function safeParseEntries(data: unknown): ParsedAttendanceEntry[] {
  if (!data || typeof data !== "object" || !Array.isArray((data as { entries?: unknown[] }).entries)) {
    throw new Error("Invalid AI output structure");
  }

  const entries = (data as { entries: unknown[] }).entries;

  return entries.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("Malformed entry");
    }

    const rawName = (item as { name?: unknown }).name;
    const rawStatus = (item as { status?: unknown }).status;

    if (typeof rawName !== "string" || typeof rawStatus !== "string") {
      throw new Error("Malformed entry");
    }

    const name = rawName.toLowerCase().trim().replace(/\s+/g, " ");
    const status = rawStatus.toLowerCase().trim();

    if (!name) {
      throw new Error("Malformed entry: empty name");
    }

    if (status !== "present" && status !== "absent" && status !== "late") {
      throw new Error(`Invalid attendance status: ${status}`);
    }

    return {
      name,
      status: status as "present" | "absent" | "late",
    };
  });
}

function normalize(name: string) {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchStudent(
  entry: ParsedAttendanceEntry,
  roster: RosterRow[],
): { match: RosterRow | null; confidence: number | null } {
  const target = normalize(entry.name);

  const exact = roster.find((r) => {
    const fullName = r.students?.full_name;
    return fullName ? normalize(fullName) === target : false;
  });
  if (exact) {
    return { match: exact, confidence: 1.0 };
  }

  const partial = roster.find((r) => {
    const fullName = r.students?.full_name;
    return fullName ? normalize(fullName).includes(target) || target.includes(normalize(fullName)) : false;
  });
  if (partial) {
    return { match: partial, confidence: 0.8 };
  }

  return { match: null, confidence: null };
}

function buildCandidates(
  parsed: ParsedAttendanceEntry[],
  roster: RosterRow[],
): AttendanceVoiceCandidate[] {
  return parsed.map((entry) => {
    const { match, confidence } = matchStudent(entry, roster);

    return {
      spoken_text: `${entry.name} ${entry.status}`,
      matched_student_id: match?.student_id ?? null,
      matched_student_name: match?.students?.full_name ?? null,
      confidence,
      status: match
        ? (confidence !== null && confidence > 0.85 ? "matched" : "ambiguous")
        : "unmatched",
      proposed_status: entry.status,
    };
  });
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("Missing Authorization header", 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return errorResponse("Missing Supabase environment configuration", 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const form = await req.formData();
    const audio = form.get("audio");
    const clubId = String(form.get("club_id") ?? "").trim();
    const sessionId = String(form.get("session_id") ?? "").trim();

    if (!(audio instanceof File)) {
      return errorResponse("Missing audio file", 400);
    }

    if (!clubId || !sessionId) {
      return errorResponse("Missing required fields: club_id or session_id", 400);
    }

    const submissionId = crypto.randomUUID();
    const extension = audio.name?.split(".").pop()?.toLowerCase() || "m4a";
    const filePath =
      `club/${clubId}/session/${sessionId}/attendance/${submissionId}.${extension}`;

    const arrayBuffer = await audio.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("attendance-audio")
      .upload(filePath, arrayBuffer, {
        contentType: audio.type || "audio/mp4",
        upsert: false,
      });

    if (uploadError) {
      return errorResponse(uploadError.message, 500);
    }

    const transcript = await transcribeAudio(audio);
    const aiRaw = await extractAttendance(transcript);
    const parsedEntries = safeParseEntries(aiRaw);

    const { data: roster, error: rosterError } = await supabase
      .from("session_participants")
      .select("student_id, students(full_name)")
      .eq("session_id", sessionId)
      .eq("club_id", clubId);

    if (rosterError) {
      return errorResponse(rosterError.message, 500);
    }

    const rosterRows = (roster ?? []) as RosterRow[];
    const candidates = buildCandidates(parsedEntries, rosterRows);

    const reviewPayload = {
      submission_id: submissionId,
      transcript,
      candidates,
    };

    const { error: insertError } = await supabase
      .from("ai_attendance_jobs")
      .insert({
        id: submissionId,
        club_id: clubId,
        session_id: sessionId,
        created_by: null,
        status: "review_ready",
        payload: {
          audio_path: filePath,
          transcript,
          raw_ai_output: aiRaw,
        },
        result: reviewPayload,
        error: null,
      });

    if (insertError) {
      return errorResponse(insertError.message, 500);
    }

    return jsonResponse(reviewPayload, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorResponse(message, 500);
  }
});