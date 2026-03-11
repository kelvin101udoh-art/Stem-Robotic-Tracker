// web/src/app/api/ai/session-advice/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

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

function bearerToken(req: Request) {
  const auth = req.headers.get("Authorization") || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

export async function POST(req: Request) {
  try {
    // 1) Validate request body
    const json = await req.json();
    const parsedReq = RequestSchema.safeParse(json);

    if (!parsedReq.success) {
      return NextResponse.json({ error: parsedReq.error.format() }, { status: 400 });
    }

    const { clubId, windowDays } = parsedReq.data;

    // 2) Setup Supabase clients
    const supabaseUrl = mustGet("NEXT_PUBLIC_SUPABASE_URL");
    const anonKey = mustGet("NEXT_PUBLIC_SUPABASE_ANON_KEY"); // ✅ add this env
    const serviceKey = mustGet("SUPABASE_SERVICE_ROLE_KEY");  // ✅ server only

    // A) User-scoped client (auth + membership checks)
    const supabaseUser = createClient(supabaseUrl, anonKey);

    // B) Service client (analytics reads + writes)
    const supabaseService = createClient(supabaseUrl, serviceKey);

    // 3) Authn: get user from bearer token (user client)
    const token = bearerToken(req);
    if (!token) {
      return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
    }

    const { data: userRes, error: userErr } = await supabaseUser.auth.getUser(token);
    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = userRes.user;

    // 4) Authz: confirm membership (replace table/columns to match your schema)
    // If your table is NOT club_members, change it here.
    const { data: membership, error: memberErr } = await supabaseService
      .from("club_members")
      .select("id")
      .eq("club_id", clubId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberErr) {
      return NextResponse.json({ error: `Membership check failed: ${memberErr.message}` }, { status: 500 });
    }
    if (!membership) {
      return NextResponse.json({ error: "Forbidden: You do not have access to this club" }, { status: 403 });
    }

    // 5) Time window
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - windowDays * 24 * 60 * 60 * 1000);

    // 6) Data retrieval (service client)
    const { data: metricsRows, error: mErr } = await supabaseService
      .from("v_session_metrics")
      .select("session_id, starts_at, status, participants, evidence_items, activities_total, activities_done")
      .eq("club_id", clubId)
      .gte("starts_at", periodStart.toISOString())
      .lte("starts_at", periodEnd.toISOString());

    if (mErr) {
      return NextResponse.json({ error: `Metrics query failed: ${mErr.message}` }, { status: 500 });
    }

    if (!metricsRows || metricsRows.length === 0) {
      return NextResponse.json({ data: null, message: "No sessions found for the window.", windowDays }, { status: 200 });
    }

    // 7) Azure OpenAI
    const azureEndpoint = mustGet("AZURE_OPENAI_ENDPOINT");
    const azureApiKey = mustGet("AZURE_OPENAI_API_KEY");
    const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";
    const deployment = process.env.AZURE_DEPLOYMENT_SESSION ?? "session-ai";
    const url = `${azureEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=${azureApiVersion}`;

    const system = `
You are SessionAI for live session analytics.
Return STRICT JSON ONLY (no markdown, no extra text):
{
  "summary": string,
  "recommendations": [{"title": string, "why": string, "action": string}],
  "metrics": object
}
`.trim();

    const userPrompt = `
Analyze the following metricsRows and produce operational insights:
clubId=${clubId}
windowDays=${windowDays}
periodStart=${periodStart.toISOString()}
periodEnd=${periodEnd.toISOString()}

metricsRows:
${JSON.stringify(metricsRows)}
`.trim();

    const azureRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": azureApiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 900,
      }),
    });

    if (!azureRes.ok) {
      const txt = await azureRes.text();
      return NextResponse.json({ error: `Azure error ${azureRes.status}: ${txt}` }, { status: 502 });
    }

    const azureJson = await azureRes.json();
    const content: string | undefined = azureJson?.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Azure returned empty content" }, { status: 502 });
    }

    const ai = safeJsonParse<{ summary: string; recommendations: AiRec[]; metrics?: Record<string, any> }>(content);
    if (!ai?.summary || !Array.isArray(ai.recommendations)) {
      return NextResponse.json(
        { error: "Invalid AI response shape (expected strict JSON).", raw: content.slice(0, 800) },
        { status: 502 }
      );
    }

    // 8) Save insight (table columns based on your SQL: created_by exists, requested_by does not)
    const insertPayload = {
      club_id: clubId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      source: "azure",
      summary: ai.summary,
      recommendations: ai.recommendations,
      metrics: {
        windowDays,
        session_count: metricsRows.length,
        model_metrics: ai.metrics ?? {},
      },
      created_by: user.id, // ✅ matches your earlier SQL
    };

    const { data: saved, error: insErr } = await supabaseService
      .from("session_ai_insights")
      .insert(insertPayload as any)
      .select("*")
      .single();

    if (insErr) {
      return NextResponse.json({ error: `Insert failed: ${insErr.message}` }, { status: 500 });
    }

    return NextResponse.json({ data: saved }, { status: 200 });
  } catch (e: any) {
    console.error("[SESSION_ADVICE_ERROR]", e);
    return NextResponse.json({ error: e?.message ?? "Internal Server Error" }, { status: 500 });
  }
}
