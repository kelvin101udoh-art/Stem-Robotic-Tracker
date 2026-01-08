// web/src/app/api/ai/attendance-summary/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
    sessionTitle?: string;
    sessionTime?: string;
    stats?: {
        total?: number;
        present?: number;
        late?: number;
        absent?: number;
        coverage?: number;
        missingEvidence?: number;
    };
    notes?: string[];
    reasons?: Array<{
        student_id: string;
        full_name: string;
        status: "present" | "late" | "absent";
        late_reason?: string;
        absent_reason?: string;
        note?: string;
    }>;
};

function requireEnv(name: string) {
    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

function normalizeEndpoint(raw: string) {
    let endpoint = (raw || "").trim();
    if (!endpoint.startsWith("http")) endpoint = `https://${endpoint}`;
    return endpoint.replace(/\/+$/, "");
}

function extractOutputText(payload: any): string {
    try {
        const output = payload?.output;
        if (!Array.isArray(output)) return "";
        for (const item of output) {
            const content = item?.content;
            if (!Array.isArray(content)) continue;
            for (const c of content) {
                if (c?.type === "output_text" && typeof c?.text === "string") return c.text;
            }
        }
        return "";
    } catch {
        return "";
    }
}

export async function GET() {
    return NextResponse.json({ ok: true, route: "attendance-summary" });
}

export async function POST(req: Request) {
    try {
        // ✅ Env (fixed: use your dedicated attendance deployment var)
        const endpoint = normalizeEndpoint(requireEnv("AZURE_OPENAI_ENDPOINT"));
        const apiKey = requireEnv("AZURE_OPENAI_API_KEY");
        const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-04-01-preview";
        const deployment = requireEnv("AZURE_DEPLOYMENT_ATTENDANCE"); // ✅ attendance-ai

        // ✅ Parse body
        const body = (await req.json()) as Body;

        const stats = body.stats || {};
        const notes = (body.notes || []).join(" | ");

        const fullPrompt = `
You are a STEM coach assistant. Return STRICT JSON ONLY (no markdown, no commentary). Do not wrap in backticks. Do not include explanations outside JSON.
Required Schema:
{
  "engagement": string,
  "integrity": string,
  "improvement": string,
  "skills": string[],
  "exportReady": string,
  "coverage": number | null,
  "punctuality": number | null
}

Context:
- Session: ${body.sessionTitle || "STEM Session"}
- Stats: total=${stats.total || 0}, present=${stats.present || 0}, late=${stats.late || 0}, coverage=${stats.coverage || 0}%
- Evidence Notes: ${notes || "No specific notes provided."}
- Punctuality definition:
  punctuality = round(((present) / (present + absent)) * 100)
  If denominator is 0, punctuality = null

Rules:
- Use ONLY the supplied stats.
- NEVER estimate or guess numbers.
- If required numeric inputs are missing, output null for those numeric fields and explain briefly in "exportReady".
- Keep tone professional for school reports.
- 'exportReady' should be 2-3 sentences.
`.trim();

        // ✅ Responses API URL (deployment-targeted)
        // The 2026 Responses API targets the deployment via the 'model' body field, not the URL path
        const url = `${endpoint}/openai/responses?api-version=${encodeURIComponent(apiVersion)}`;


        // ✅ Responses body (Azure): no "model" field needed here



        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey,
            },
            body: JSON.stringify({
                model: deployment,
                input: [
                    {
                        role: "user",
                        content: [{ type: "input_text", text: fullPrompt }],
                    },
                ],
                // ✅ 1. Increase this to 4000+ so there is room for reasoning + the JSON result
                max_output_tokens: 4000,

                // ✅ 2. Set effort to 'low' for faster, cheaper analytics
                reasoning: {
                    effort: "low"
                },

                // ✅ 3. Ensure the model knows we want a text-based JSON response
                text: {
                    format: { type: "text" },
                    verbosity: "medium"
                }
            }),
        });


        const raw = await res.text();

        if (!res.ok) {
            return NextResponse.json(
                { error: "Azure API Error", status: res.status, details: raw.slice(0, 2000) },
                { status: res.status }
            );
        }

        const payload = JSON.parse(raw);
        const textOut = extractOutputText(payload);

        if (!textOut) {
            return NextResponse.json(
                { error: "No response text from AI", raw: payload },
                { status: 502 }
            );
        }

        // ✅ parse STRICT JSON output
        let cleanJson = textOut.replace(/```json|```/g, "").trim();

        try {
            return NextResponse.json(JSON.parse(cleanJson));
        } catch {
            // small safety net if model slightly malformed
            try {
                const fixedJson = cleanJson
                    .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
                    .replace(/'/g, '"');
                return NextResponse.json(JSON.parse(fixedJson));
            } catch {
                return NextResponse.json(
                    { error: "Invalid JSON format from AI", raw: textOut },
                    { status: 502 }
                );
            }
        }
    } catch (err: any) {
        console.error("attendance-summary error:", err);
        return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
    }
}
