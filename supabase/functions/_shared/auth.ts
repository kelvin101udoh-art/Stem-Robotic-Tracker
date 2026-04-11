// stem-robotic-tracker-monorepo/supabase/functions/_shared/auth.ts



import { createClient } from "@supabase/supabase-js";

export async function resolveSession(req: Request) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid Authorization header");
  }

  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data, error } = await supabase
    .from("mobile_sessions")
    .select("*")
    .eq("session_token", token)
    .single();

  if (error || !data) {
    throw new Error("Invalid session token");
  }

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    throw new Error("Session expired");
  }

  return {
    session: data,
    supabase,
  };
}