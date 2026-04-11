// stem-robotic-tracker-monorepo/supabase/functions/auth-access-key/index.ts


import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.json();
    const accessKey = body?.access_key;

    if (!accessKey) {
      return new Response("Missing access_key", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // TODO: Replace this with real validation logic
    if (accessKey !== "TEST_ACCESS_KEY") {
      return new Response("Invalid access key", { status: 401 });
    }

    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    // Save session (make sure this table exists)
    const { error } = await supabase.from("mobile_sessions").insert({
      session_token: sessionToken,
      expires_at: expiresAt,
      club_id: "demo-club",
      club_name: "Demo Club",
    });

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    return Response.json({
      session_token: sessionToken,
      expires_at: expiresAt,
      club_id: "demo-club",
      club_name: "Demo Club",
      session_id: null,
    });
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
});