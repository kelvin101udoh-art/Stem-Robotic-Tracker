// web/src/app/api/ai/kiki/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * ✅ Azure OpenAI (Responses API) unified KiKi endpoint
 * - POST /api/ai/kiki
 * - modes:
 *   1) attendance-summary: takes metrics and returns structured summary + actions
 *   2) chat: takes chat messages and returns assistant reply (optionally grounded with dashboard context)
 *
 * Requires env vars:
 * - AZURE_OPENAI_ENDPOINT
 * - AZURE_OPENAI_API_KEY
 * - AZURE_DEPLOYMENT_KIKI
 * - AZURE_OPENAI_API_VERSION (optional)
 *
 * Supabase (for pilot limit + usage logging):
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY   ✅ server-only (do NOT expose to client)
 */

// -------------------- Types --------------------
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
      dashboardContext?: Partial<AttendanceMetrics>;
    };

// -------------------- Utils --------------------
function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function json(data: any, init?: ResponseInit) {
  return NextResponse.json(data, init);
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

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/**
 * Azure Responses API returns something like:
 * {
 *   output: [
 *     { content: [ { type: "output_text", text: "..." } ] }
 *   ],
 *   usage: { total_tokens: ... }
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

// -------------------- Supabase (server) --------------------
const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseServiceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

// ✅ service client for backend inserts/selects (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

// -------------------- Pilot Limit + Logging --------------------
/**
 * ✅ Only limits mode: "chat"
 * - attendance-summary: unlimited (pilot friendly)
 * - chat: daily limit per club to control spend
 */
const DAILY_CHAT_LIMIT = 20; // <-- change anytime

async function getTodayChatUsageCount(clubId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const { count, error } = await supabaseAdmin
    .from("kiki_usage")
    .select("id", { count: "exact", head: true })
    .eq("club_id", clubId)
    .eq("mode", "chat")
    .gte("created_at", start.toISOString());

  if (error) {
    console.error("Supabase usage count error:", error.message);
    // Fail-open: don’t block pilots if DB temporarily fails
    return 0;
  }

  return count ?? 0;
}

async function logKiKiUsage(args: {
  clubId?: string;
  mode: "attendance-summary" | "chat";
  tokenCost: number;
  success: boolean;
  httpStatus?: number;
  errorText?: string;
}) {
  // If no clubId, still allow the feature, but skip logging
  if (!args.clubId) return;

  try {
    await supabaseAdmin.from("kiki_usage").insert({
      club_id: args.clubId,
      mode: args.mode,
      token_cost: args.tokenCost,
      success: args.success,
      http_status: args.httpStatus ?? null,
      error_text: args.errorText ?? null,
    });
  } catch (e: any) {
    console.error("Supabase usage insert error:", e?.message || e);
    // Never block user response due to logging failure
  }
}

/**
 * ✅ Check limit BEFORE calling AI (only for chat)
 */
async function checkPilotLimit(args: { clubId?: string; mode: "attendance-summary" | "chat" }) {
  if (args.mode !== "chat") {
    return { allowed: true, remaining: 9999, dailyLimit: null as number | null };
  }
  if (!args.clubId) {
    // no club id -> don’t block (pilot friendly)
    return { allowed: true, remaining: DAILY_CHAT_LIMIT, dailyLimit: DAILY_CHAT_LIMIT };
  }

  const used = await getTodayChatUsageCount(args.clubId);
  const remaining = Math.max(0, DAILY_CHAT_LIMIT - used);

  return { allowed: used < DAILY_CHAT_LIMIT, remaining, dailyLimit: DAILY_CHAT_LIMIT };
}

// -------------------- Prompt builders --------------------
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
    "You are KiKi: a practical education business assistant for a STEM club dashboard.",
    "Goals: help the admin increase attendance, evidence quality, parent trust, retention, and follow-ups.",
    "If the user asks something broad (e.g., 'how do I grow my club?'), give a structured plan and ask 1 clarifying question.",
    "Style: plain English, no jargon. Prefer short sections + bullets. Give specific next steps.",
    "Output: normal text (no JSON).",
  ]
    .join("\n")
    .trim();
}

// -------------------- Azure Responses call --------------------
async function callAzureResponses(args: {
  system: string;
  user: string;
  // ✅ keep spend low for chat pilots
  mode: "attendance-summary" | "chat";
}) {
  const endpoint = requiredEnv("AZURE_OPENAI_ENDPOINT").replace(/\/+$/, "");
  const apiKey = requiredEnv("AZURE_OPENAI_API_KEY");
  const deployment = requiredEnv("AZURE_DEPLOYMENT_KIKI");
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-04-01-preview";

  const url = `${endpoint}/openai/responses?api-version=${encodeURIComponent(apiVersion)}`;

  // ✅ Pilot cost control:
  // - chat gets fewer max tokens
  // - attendance-summary can be higher (structured JSON + actions)
  const maxTokens = args.mode === "chat" ? 320 : 900;

  const body = {
    model: deployment,
    input: [
      { role: "system", content: [{ type: "input_text", text: args.system }] },
      { role: "user", content: [{ type: "input_text", text: args.user }] },
    ],
    max_output_tokens: maxTokens,
    reasoning: { effort: "medium" },
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
      raw,
      errorText: raw.slice(0, 1200),
      payload: null,
      text: "",
      tokensUsed: 0,
    };
  }

  const payload = safeJsonParse<any>(raw);
  const text = extractOutputText(payload);
  const tokensUsed = Number(payload?.usage?.total_tokens ?? 0) || 0;

  return {
    ok: true as const,
    status: res.status,
    raw,
    payload,
    text,
    tokensUsed,
  };
}

// -------------------- Route --------------------
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as KiKiRequest;

    if (!body || typeof body !== "object" || !("mode" in body)) {
      return json({ error: "Invalid request body" }, { status: 400 });
    }

    // ✅ 1) Limit check (ONLY for chat)
    const limit = await checkPilotLimit({ clubId: body.clubId, mode: body.mode });

    if (!limit.allowed) {
      return json(
        {
          limitExceeded: true,
          mode: body.mode,
          dailyLimit: limit.dailyLimit,
          remaining: limit.remaining,
          message: `Daily chat limit reached (${limit.dailyLimit}/day). Please try tomorrow or upgrade.`,
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

      const r = await callAzureResponses({ system, user, mode: "attendance-summary" });

      if (!r.ok) {
        // optional: log failed call (tokenCost unknown -> 0)
        await logKiKiUsage({
          clubId: body.clubId,
          mode: "attendance-summary",
          tokenCost: 0,
          success: false,
          httpStatus: r.status,
          errorText: r.errorText,
        });

        return json(
          { error: "Azure OpenAI request failed", status: r.status, details: r.errorText },
          { status: 502 }
        );
      }

      // ✅ log successful usage
      await logKiKiUsage({
        clubId: body.clubId,
        mode: "attendance-summary",
        tokenCost: r.tokensUsed,
        success: true,
        httpStatus: r.status,
      });

      // We requested STRICT JSON; still validate
      const parsed = safeJsonParse<{
        headline: string;
        what_ai_sees: string;
        signals: Array<{ label: string; value: string; tone: "good" | "warn" | "risk" }>;
        actions_next_7_days: string[];
      }>(r.text);

      if (!parsed) {
        return json({ error: "Model returned non-JSON output", raw: r.text }, { status: 502 });
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

      const r = await callAzureResponses({ system, user, mode: "chat" });

      if (!r.ok) {
        await logKiKiUsage({
          clubId: body.clubId,
          mode: "chat",
          tokenCost: 0,
          success: false,
          httpStatus: r.status,
          errorText: r.errorText,
        });

        return json(
          { error: "Azure OpenAI request failed", status: r.status, details: r.errorText },
          { status: 502 }
        );
      }

      const reply = (r.text || "").trim();
      if (!reply) {
        // log as failed (no tokens known reliably)
        await logKiKiUsage({
          clubId: body.clubId,
          mode: "chat",
          tokenCost: r.tokensUsed,
          success: false,
          httpStatus: 502,
          errorText: "Empty model response",
        });
        return json({ error: "Empty model response" }, { status: 502 });
      }

      // ✅ log successful chat usage with real tokens
      await logKiKiUsage({
        clubId: body.clubId,
        mode: "chat",
        tokenCost: r.tokensUsed,
        success: true,
        httpStatus: r.status,
      });

      // ✅ recompute remaining after logging (accurate UI)
      // (only for chat; attendance-summary unlimited)
      const usedNow = body.clubId ? await getTodayChatUsageCount(body.clubId) : 0;
      const remainingNow = body.clubId ? Math.max(0, DAILY_CHAT_LIMIT - usedNow) : limit.remaining;

      return json({
        mode: "chat",
        dailyLimit: DAILY_CHAT_LIMIT,
        remaining: remainingNow,
        text: reply,
      });
    }

    return json({ error: "Unsupported mode" }, { status: 400 });
  } catch (err: any) {
    console.error("/api/ai/kiki error:", err);
    return json({ error: "Server error", message: err?.message || "Unknown error" }, { status: 500 });
  }
}
