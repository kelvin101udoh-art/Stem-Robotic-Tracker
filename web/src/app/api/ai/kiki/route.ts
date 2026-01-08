//  web/src/app/api/ai/kiki/route.ts


import { NextResponse } from "next/server";

/**
 * ✅ Azure OpenAI (Responses API) unified KiKi endpoint
 * - POST /api/ai/kiki
 * - modes:
 *   1) attendance-summary: takes metrics and returns structured summary + actions
 *   2) chat: takes chat messages and returns assistant reply (optionally grounded with dashboard context)
 *
 * Requires env vars:
 * - AZURE_OPENAI_ENDPOINT (e.g. https://YOUR-RESOURCE.openai.azure.com)
 * - AZURE_OPENAI_API_KEY
 * - AZURE_OPENAI_DEPLOYMENT (e.g. kiki-gpt5)
 * - AZURE_OPENAI_API_VERSION (e.g. 2025-04-01-preview)
 */

export const runtime = "nodejs"; // keep node runtime for stable fetch + env

type AttendanceMetrics = {
  attendanceRate: number;
  absences: number;
  sessionsDelivered: number;
  evidenceReadyPct: number;
  followUps: number;
  deltaPct: number;
  presentCount: number;
  totalMarks: number;
};

type ChatMessage = { role: "user" | "assistant"; text: string };

type KiKiRequest =
  | {
      mode: "attendance-summary";
      clubId?: string;
      centreName?: string;
      metrics: AttendanceMetrics;
    }
  | {
      mode: "chat";
      clubId?: string;
      centreName?: string;
      messages: ChatMessage[];
      // optional lightweight grounding to keep chat relevant:
      dashboardContext?: Partial<AttendanceMetrics>;
    };

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

/** -----------------------
 * ✅ Pilot usage limits (starter)
 * Replace with DB-based counter later (Supabase table, KV, etc.)
 * ----------------------*/
async function checkAndConsumePilotLimit(args: {
  // you can pass userId/adminId when you have it
  clubId?: string;
  mode: "attendance-summary" | "chat";
}) {
  // ✅ MVP default: allow; no cost-control enforced here yet
  // Replace with real logic, e.g.:
  // - lookup usage counter per admin/day
  // - increment if under limit
  // - return { allowed: false, remaining: 0 } if exceeded
  return { allowed: true, remaining: 9999 };
}

/** -----------------------
 * ✅ Response helpers
 * ----------------------*/
function json(data: any, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

/**
 * Azure Responses API returns something like:
 * {
 *   output: [
 *     { content: [ { type: "output_text", text: "..." } ] }
 *   ]
 * }
 */
function extractOutputText(payload: any): string {
  try {
    const output = payload?.output;
    if (!Array.isArray(output)) return "";

    for (const item of output) {
      const content = item?.content;
      if (!Array.isArray(content)) continue;

      for (const c of content) {
        if (c?.type === "output_text" && typeof c?.text === "string") {
          return c.text;
        }
      }
    }
    return "";
  } catch {
    return "";
  }
}

function safeJsonParse<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** -----------------------
 * ✅ Prompt builders
 * ----------------------*/
function systemPromptBase(centreName?: string) {
  const name = (centreName ?? "").trim();
  return [
    "You are KiKi, an education business analytics assistant inside a STEM club management dashboard.",
    "You must be concise, practical, and use plain English (no jargon).",
    "When suggesting actions, prioritize: attendance consistency, evidence capture quality, parent trust, retention, and follow-ups.",
    name ? `The current club centre is: "${name}".` : "",
    "If user asks for something unrelated to the dashboard, politely steer them back and ask what metric or module they want help with.",
  ]
    .filter(Boolean)
    .join("\n");
}

function userPromptAttendanceSummary(metrics: AttendanceMetrics) {
  const {
    attendanceRate,
    absences,
    sessionsDelivered,
    evidenceReadyPct,
    followUps,
    deltaPct,
    presentCount,
    totalMarks,
  } = metrics;

  // A little guardrail so model doesn't hallucinate beyond what you provide
  const ar = clamp(attendanceRate, 0, 100);
  const er = clamp(evidenceReadyPct, 0, 100);

  return `
Generate a structured dashboard summary based ONLY on these metrics:

- attendanceRate: ${ar}%
- evidenceReadyPct: ${er}%
- sessionsDelivered: ${sessionsDelivered}
- absences: ${absences}
- followUps: ${followUps}
- deltaPct vs previous 30 days: ${deltaPct}%
- presentCount: ${presentCount}
- totalMarks: ${totalMarks}

Return STRICT JSON (no markdown, no extra keys) in this exact shape:

{
  "headline": "string (max 90 chars)",
  "what_ai_sees": "string (2-3 sentences, plain English)",
  "signals": [
    { "label": "string", "value": "string", "tone": "good|warn|risk" }
  ],
  "actions_next_7_days": [
    "string (action 1)",
    "string (action 2)",
    "string (action 3)"
  ]
}

Rules:
- Do not invent data not present in the metrics.
- Use tones:
  - good: strong/healthy
  - warn: needs attention
  - risk: urgent concern
- Actions must be specific and doable by an admin/teacher in 7 days.
`.trim();
}

function userPromptChat(messages: ChatMessage[], dashboardContext?: Partial<AttendanceMetrics>) {
  const last = messages.slice(-12); // keep payload small

  const contextLines = dashboardContext
    ? [
        "Dashboard context (optional, may be partial):",
        ...Object.entries(dashboardContext).map(([k, v]) => `- ${k}: ${String(v)}`),
      ]
    : [];

  const chatLines = last.map((m) => `${m.role.toUpperCase()}: ${m.text}`);

  return [
    ...contextLines,
    "",
    "Conversation (most recent last):",
    ...chatLines,
    "",
    "Reply as KiKi in 1-6 short sentences. If suggesting actions, give up to 3 bullet points.",
  ]
    .join("\n")
    .trim();
}

/** -----------------------
 * ✅ Call Azure OpenAI (Responses API)
 * ----------------------*/

async function callAzureResponses(args: { system: string; user: string }) {
  const endpoint = requiredEnv("AZURE_OPENAI_ENDPOINT").replace(/\/+$/, "");
  const apiKey = requiredEnv("AZURE_OPENAI_API_KEY");

  // ✅ FIX: use your Foundry deployment name for KiKi
  const deployment = requiredEnv("AZURE_DEPLOYMENT_KIKI"); // "KiKi"

  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-04-01-preview";

  const url = `${endpoint}/openai/responses?api-version=${encodeURIComponent(apiVersion)}`;

  const body = {
    model: deployment, // ✅ Pass deployment here
    input: [
      { role: "system", content: [{ type: "input_text", text: args.system }] },
      { role: "user", content: [{ type: "input_text", text: args.user }] },
    ],
    max_output_tokens: 4000, // ✅ Higher tokens for reasoning
    reasoning: { effort: "medium" }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const raw = await res.text();

  if (!res.ok) {
    return {
      ok: false as const,
      status: res.status,
      errorText: raw.slice(0, 1200),
    };
  }

  const payload = safeJsonParse<any>(raw);
  return {
    ok: true as const,
    payload,
    text: extractOutputText(payload),
  };
}


/** -----------------------
 * ✅ Route
 * ----------------------*/
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as KiKiRequest;

    // Basic shape checks
    if (!body || typeof body !== "object" || !("mode" in body)) {
      return json({ error: "Invalid request body" }, { status: 400 });
    }

    // ✅ pilot limiter hook
    const limit = await checkAndConsumePilotLimit({
      clubId: body.clubId,
      mode: body.mode,
    });

    if (!limit.allowed) {
      return json(
        {
          limitExceeded: true,
          message:
            "KiKi pilot limit reached. Upgrade to continue using advanced analytics.",
          remaining: limit.remaining,
        },
        { status: 429 }
      );
    }

    const system = systemPromptBase(body.centreName);

    // ---------- MODE: attendance-summary ----------
    if (body.mode === "attendance-summary") {
      if (!body.metrics) {
        return json({ error: "metrics is required" }, { status: 400 });
      }

      const user = userPromptAttendanceSummary(body.metrics);

      const r = await callAzureResponses({ system, user });
      if (!r.ok) {
        return json(
          {
            error: "Azure OpenAI request failed",
            status: r.status,
            details: r.errorText,
          },
          { status: 502 }
        );
      }

      // We requested STRICT JSON; still validate
      const parsed = safeJsonParse<{
        headline: string;
        what_ai_sees: string;
        signals: Array<{ label: string; value: string; tone: "good" | "warn" | "risk" }>;
        actions_next_7_days: string[];
      }>(r.text);

      if (!parsed) {
        return json(
          {
            error: "Model returned non-JSON output",
            raw: r.text,
          },
          { status: 502 }
        );
      }

      return json({
        mode: "attendance-summary",
        remaining: limit.remaining,
        ...parsed,
      });
    }

    // ---------- MODE: chat ----------
    if (body.mode === "chat") {
      const msgs = Array.isArray(body.messages) ? body.messages : [];
      if (!msgs.length) {
        return json({ error: "messages is required" }, { status: 400 });
      }

      const user = userPromptChat(msgs, body.dashboardContext);

      const r = await callAzureResponses({ system, user });
      if (!r.ok) {
        return json(
          {
            error: "Azure OpenAI request failed",
            status: r.status,
            details: r.errorText,
          },
          { status: 502 }
        );
      }

      const reply = (r.text || "").trim();
      if (!reply) {
        return json({ error: "Empty model response" }, { status: 502 });
      }

      return json({
        mode: "chat",
        remaining: limit.remaining,
        text: reply,
      });
    }

    return json({ error: "Unsupported mode" }, { status: 400 });
  } catch (err: any) {
    console.error("/api/ai/kiki error:", err);
    return json(
      { error: "Server error", message: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
