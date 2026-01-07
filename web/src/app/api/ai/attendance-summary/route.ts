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
    const apiKey = requireEnv("AZURE_OPENAI_API_KEY");
    const deployment = requireEnv("AZURE_OPENAI_DEPLOYMENT");

    const v = process.env[name];
    if (!v) throw new Error(`Missing env var: ${name}`);
    return v;
}

export async function GET() {
    return NextResponse.json({ ok: true, route: "attendance-summary" });
}


export async function POST(req: Request) {
    try {
        // 1. Fix URL & Config
        let endpoint = (process.env.AZURE_OPENAI_ENDPOINT || "").trim();
        if (!endpoint.startsWith("http")) endpoint = `https://${endpoint}`;
        endpoint = endpoint.replace(/\/+$/, "");

        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

        // 2. Parse Body
        const rawBody = await req.text();
        if (!rawBody) return NextResponse.json({ error: "Empty body" }, { status: 400 });
        const body = JSON.parse(rawBody);

        // 3. ENHANCED PROMPT: This ensures the AI follows your STEM schema
        const stats = body.stats || {};
        const notes = (body.notes || []).join(" | ");

        const total = Number(stats.total ?? 0);
        const present = Number(stats.present ?? 0);
        const absent = Number(stats.absent ?? 0);
        const coverage = stats.coverage ?? null;

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
- Session: ${body.sessionTitle || 'STEM Session'}
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

        // 4. Responses API URL (2026 Preview)
        const url = `${endpoint}/openai/responses?api-version=2025-04-01-preview`;

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey!,
            },
            body: JSON.stringify({
                model: deployment,
                input: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "input_text",
                                text: fullPrompt // Send the FULL prompt here
                            }
                        ],
                    },
                ],
                reasoning: {
                    effort: "medium"
                }
            }),
        });

        if (!res.ok) {
            const errText = await res.text();
            return NextResponse.json({ error: "Azure API Error", details: errText }, { status: res.status });
        }

        const data = await res.json();

        // 5. EXTRACTION: Locate the assistant message in the output array
        const messageOutput = data.output?.find((o: any) => o.type === "message");
        const textOut = messageOutput?.content?.find((c: any) => c.type === "output_text")?.text || "";

        if (!textOut) {
            console.error("No text in response:", JSON.stringify(data, null, 2));
            throw new Error("No response text from AI");
        }

        // 6. JSON CLEANUP & PARSE
        let cleanJson = textOut.replace(/```json|```/g, "").trim();

        try {
            return NextResponse.json(JSON.parse(cleanJson));
        } catch (firstErr) {
            console.warn("Standard parse failed, attempting regex fix...");
            try {
                const fixedJson = cleanJson
                    .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
                    .replace(/'/g, '"');
                return NextResponse.json(JSON.parse(fixedJson));
            } catch (secondErr) {
                return NextResponse.json({
                    error: "Invalid JSON format from AI",
                    raw: textOut
                }, { status: 500 });
            }
        }

    } catch (err: any) {
        console.error("Server Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
