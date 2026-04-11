import { serve } from "https://deno.land/std/http/server.ts";
import { resolveSession } from "../_shared/auth.ts";

serve(async (req) => {
  try {
    const { session, supabase } = await resolveSession(req);

    const form = await req.formData();

    const file = form.get("file") as File | null;
    const metadataRaw = form.get("metadata");

    if (!file || !metadataRaw) {
      throw new Error("Missing file or metadata");
    }

    const metadata = JSON.parse(String(metadataRaw));

    if (metadata.club_id !== session.club_id) {
      throw new Error("Club mismatch");
    }

    const id = crypto.randomUUID();

    const path = `club/${session.club_id}/session/${session.session_id}/evidence/${id}-${file.name}`;

    const buffer = await file.arrayBuffer();

    await supabase.storage
      .from("session-evidence")
      .upload(path, buffer, {
        contentType: file.type,
      });

    await supabase.from("evidence_items").insert({
      id,
      club_id: session.club_id,
      session_id: session.session_id,
      student_id: metadata.student_id ?? null,
      kind: metadata.kind,
      file_path: path,
      note: metadata.note ?? null,
      created_at: metadata.captured_at,
    });

    return Response.json({
      evidence_id: id,
      status: "uploaded",
    });
  } catch (err) {
    return new Response(String(err), { status: 400 });
  }
});