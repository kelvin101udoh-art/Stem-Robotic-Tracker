// web/src/app/api/ai/session-advice/route.ts


import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const body = await req.json();
    const clubId = body?.clubId as string;
    const windowDays = Number(body?.windowDays ?? 1); // default to 1 day for "session live" analytics

    if (!clubId) {
      return NextResponse.json({ error: "clubId is required" }, { status: 400 });
    }

    // ---- Supabase (server-side service role) ----
    const supabaseUrl = mustGet("NEXT_PUBLIC_SUPABASE_URL");
    const serviceKey = mustGet("SUPABASE_SERVICE_ROLE_KEY"); // ✅ server env only
    const supabase = createClient(supabaseUrl, serviceKey);

    // ---- Time window ----
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd.getTime() - windowDays * 24 * 60 * 60 * 1000);

    // Pull compact metrics for the model
    const { data: metricsRows, error: mErr } = await supabase
      .from("v_session_metrics")
      .select("session_id, starts_at, status, participants, evidence_items, activities_total, activities_done")
      .eq("club_id", clubId)
      .gte("starts_at", periodStart.toISOString())
      .lte("starts_at", periodEnd.toISOString());

    if (mErr) throw mErr;

    // If nothing to analyze, return a clean response (and do not write noisy rows)
    if (!metricsRows || metricsRows.length === 0) {
      return NextResponse.json(
        {
          data: null,
          message: "No sessions found in the selected window.",
          windowDays,
        },
        { status: 200 }
      );
    }

    // ---- Azure OpenAI (Session AI) ----
    const azureEndpoint = mustGet("AZURE_OPENAI_ENDPOINT");
    const azureApiKey = mustGet("AZURE_OPENAI_API_KEY");
    const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2025-04-01-preview";

    // You said your deployment name is: AZURE_DEPLOYMENT_SESSION=session-ai
    const deployment = process.env.AZURE_DEPLOYMENT_SESSION ?? "session-ai";

    const url = `${azureEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=${azureApiVersion}`;

    const system = `
You are SessionAI for a STEM club platform.
You ONLY analyze session delivery signals from the session system:
- sessions (starts_at, status)
- participants count
- evidence count
- checklist totals & done
You do NOT give parent/marketing advice.
You do NOT talk about running sessions, links, or UI actions.
Return STRICT JSON ONLY, no markdown, no extra text:
{
  "summary": string,
  "recommendations": [
    {"title": string, "why": string, "action": string}
  ],
  "metrics": object
}
`.trim();

    const user = `
Analyze the following session metrics (most recent window first) and provide operational analytics insight.
Focus on:
- schedule completeness & stability
- open/closed discipline signals (if status patterns exist)
- evidence capture consistency
- checklist usage and completion quality
Return JSON only.

windowDays=${windowDays}
periodStart=${periodStart.toISOString()}
periodEnd=${periodEnd.toISOString()}

metricsRows:
${JSON.stringify(metricsRows)}
`.trim();

    const azureBody = {
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: 800,
    };

    const azureRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": azureApiKey,
      },
      body: JSON.stringify(azureBody),
    });

    if (!azureRes.ok) {
      const txt = await azureRes.text();
      return NextResponse.json(
        { error: `Azure OpenAI error: ${azureRes.status} ${txt}` },
        { status: 502 }
      );
    }

    const azureJson = await azureRes.json();
    const content: string | undefined = azureJson?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Azure OpenAI returned no content." },
        { status: 502 }
      );
    }

    const parsed = safeJsonParse<{
      summary: string;
      recommendations: AiRec[];
      metrics?: Record<string, unknown>;
    }>(content);

    if (!parsed?.summary || !Array.isArray(parsed?.recommendations)) {
      return NextResponse.json(
        {
          error:
            "Azure output was not valid JSON in the required shape. Adjust prompt or model settings.",
          raw: content.slice(0, 600),
        },
        { status: 502 }
      );
    }

    const insertPayload = {
      club_id: clubId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      source: "azure",
      summary: parsed.summary,
      recommendations: parsed.recommendations,
      metrics: {
        windowDays,
        sessions: metricsRows ?? [],
        azure_metrics: parsed.metrics ?? {},
      },
    };

    const { data: saved, error: insErr } = await supabase
      .from("session_ai_insights")
      .insert(insertPayload as any)
      .select("*")
      .single();

    if (insErr) throw insErr;

    return NextResponse.json({ data: saved }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
