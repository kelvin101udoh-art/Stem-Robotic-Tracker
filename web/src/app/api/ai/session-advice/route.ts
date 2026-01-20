// web/src/app/api/ai/session-advice/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// 1. Strict Schema Validation
const RequestSchema = z.object({
  clubId: z.string().uuid({ message: "Invalid Club ID format" }),
  windowDays: z.number().min(1).max(90).default(1),
});

type AiRec = { title: string; why: string; action: string };

function mustGet(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function safeJsonParse<T = any>(s: string): T | null {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // 2. Validate Request Body
    const json = await req.json();
    const parseResult = RequestSchema.safeParse(json);
    
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.format() }, { status: 400 });
    }

    const { clubId, windowDays } = parseResult.data;

    // 3. Setup Supabase
    const supabaseUrl = mustGet("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = mustGet("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceKey);

    // 4. Authorization Check: Is the user logged in and part of this club?
    // Note: We extract the Bearer token from headers sent by the frontend
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing Authorization header" }, { status: 401 });
    }

    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user membership (Replace 'club_members' with your actual junction table name)
    const { data: membership, error: memberErr } = await supabase
      .from("club_members")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .single();

    if (memberErr || !membership) {
      return NextResponse.json({ error: "Forbidden: You do not have access to this club" }, { status: 403 });
    }

    // 5. Time window 
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - windowDays * 24 * 60 * 60 * 1000);

    // 6. Data Retrieval
    const { data: metricsRows, error: mErr } = await supabase
      .from("v_session_metrics")
      .select("session_id, starts_at, status, participants, evidence_items, activities_total, activities_done")
      .eq("club_id", clubId)
      .gte("starts_at", periodStart.toISOString())
      .lte("starts_at", periodEnd.toISOString());

    if (mErr) throw mErr;
    if (!metricsRows || metricsRows.length === 0) {
      return NextResponse.json({ data: null, message: "No sessions found.", windowDays }, { status: 200 });
    }

    // 7. Azure OpenAI Logic
    const azureEndpoint = mustGet("AZURE_OPENAI_ENDPOINT");
    const azureApiKey = mustGet("AZURE_OPENAI_API_KEY");
    const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";
    const deployment = process.env.AZURE_DEPLOYMENT_SESSION ?? "session-ai";
    const url = `${azureEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=${azureApiVersion}`;

    const system = `You are SessionAI. Return STRICT JSON ONLY: {"summary": string, "recommendations": [{"title": string, "why": string, "action": string}], "metrics": object}`;
    const userPrompt = `Analyze metrics for club ${clubId}: ${JSON.stringify(metricsRows)}`;

    const azureRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": azureApiKey },
      body: JSON.stringify({
        messages: [{ role: "system", content: system }, { role: "user", content: userPrompt }],
        temperature: 0.2,
      }),
    });

    if (!azureRes.ok) throw new Error(`Azure error: ${azureRes.status}`);

    const azureJson = await azureRes.json();
    const parsed = safeJsonParse(azureJson?.choices?.[0]?.message?.content);

    if (!parsed?.summary) throw new Error("Invalid AI response shape");

    // 8. Save Insight (Audit Trail)
    const { data: saved, error: insErr } = await supabase
      .from("session_ai_insights")
      .insert({
        club_id: clubId,
        requested_by: user.id, // Enterprise practice: track who generated the insight
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        summary: parsed.summary,
        recommendations: parsed.recommendations,
        metrics: { windowDays, session_count: metricsRows.length },
      } as any)
      .select("*")
      .single();

    if (insErr) throw insErr;

    return NextResponse.json({ data: saved }, { status: 200 });

  } catch (e: any) {
    console.error("[SESSION_ADVICE_ERROR]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
