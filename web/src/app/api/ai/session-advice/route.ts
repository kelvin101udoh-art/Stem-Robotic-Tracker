// web/src/app/api/ai/session-advice/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const clubId = body?.clubId as string;
    const windowDays = Number(body?.windowDays ?? 30);

    if (!clubId) {
      return NextResponse.json({ error: "clubId is required" }, { status: 400 });
    }

    // Server-side Supabase (service role recommended for analytics aggregation)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, serviceKey);

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

    // === Azure OpenAI integration point (replace fakeAzure with real call) ===
    const fakeAzure = {
      summary: `Azure AI: In the last ${windowDays} days, you ran ${(metricsRows ?? []).length} sessions. Evidence consistency is the biggest lever to improve parent trust and retention.`,
      recommendations: [
        {
          title: "Standardize evidence capture (2-minute routine)",
          why: "Evidence is the strongest differentiator for your STEM Proof Engine.",
          action: "During every session: 2 build photos + 1 demo photo + 1 coach note.",
        },
        {
          title: "Reduce checklist complexity if completion is low",
          why: "Overloaded delivery reduces student excitement and outcomes.",
          action: "Keep 4–6 core tasks, push extras to stretch goals.",
        },
      ],
    };

    const insertPayload = {
      club_id: clubId,
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
      source: "azure",
      summary: fakeAzure.summary,
      recommendations: fakeAzure.recommendations,
      metrics: { windowDays, sessions: metricsRows ?? [] },
    };

    const { data: saved, error: insErr } = await supabase
      .from("session_ai_insights")
      .insert(insertPayload as any)
      .select("*")
      .single();

    if (insErr) throw insErr;

    return NextResponse.json({ data: saved }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
