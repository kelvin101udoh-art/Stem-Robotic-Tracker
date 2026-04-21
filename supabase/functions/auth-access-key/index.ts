// stem-robotic-tracker-monorepo/supabase/functions/auth-access-key/index.ts

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: corsHeaders,
      }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const accessKey = String(body?.access_key ?? "").trim();

    if (!accessKey) {
      return new Response(
        JSON.stringify({ error: "Missing access_key" }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase environment variables" }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1. Validate access key from DB
    const { data: keyRow, error: keyError } = await supabase
      .from("mobile_access_keys")
      .select("id, club_id, session_id, access_key, label, is_active, expires_at")
      .eq("access_key", accessKey)
      .single();

    if (keyError || !keyRow) {
      return new Response(
        JSON.stringify({ error: "Invalid access key" }),
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    if (!keyRow.is_active) {
      return new Response(
        JSON.stringify({ error: "Access key is inactive" }),
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    if (
      keyRow.expires_at &&
      new Date(keyRow.expires_at).getTime() <= Date.now()
    ) {
      return new Response(
        JSON.stringify({ error: "Access key has expired" }),
        {
          status: 401,
          headers: corsHeaders,
        }
      );
    }

    // 2. Get club name
    const { data: clubRow, error: clubError } = await supabase
      .from("clubs")
      .select("id, name")
      .eq("id", keyRow.club_id)
      .single();

    if (clubError || !clubRow) {
      return new Response(
        JSON.stringify({ error: "Club not found for access key" }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // 3. Create short-lived mobile session
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const { error: sessionError } = await supabase
      .from("mobile_sessions")
      .insert({
        access_key_id: keyRow.id,
        club_id: keyRow.club_id,
        session_id: keyRow.session_id,
        session_token: sessionToken,
        expires_at: expiresAt,
      });

    if (sessionError) {
      return new Response(
        JSON.stringify({
          error: "Failed to create mobile session",
          details: sessionError.message,
        }),
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }

    // 4. Return session context to mobile app
    return new Response(
      JSON.stringify({
        session_token: sessionToken,
        expires_at: expiresAt,
        club_id: keyRow.club_id,
        club_name: clubRow.name,
        session_id: keyRow.session_id ?? null,
      }),
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unexpected server error",
      }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});