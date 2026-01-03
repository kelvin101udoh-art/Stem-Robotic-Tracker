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

        const fullPrompt = `
You are a STEM coach assistant. Return STRICT JSON ONLY.
Required Schema:
{
  "engagement": string,
  "integrity": string,
  "improvement": string,
  "skills": string[],
  "exportReady": string,
  "coverage": number,
  "punctuality": number
}

Context:
- Session: ${body.sessionTitle || 'STEM Session'}
- Stats: total=${stats.total || 0}, present=${stats.present || 0}, late=${stats.late || 0}, coverage=${stats.coverage || 0}%
- Evidence Notes: ${notes || "No specific notes provided."}

Rules:
- Keep the tone professional for school reports.
- 'exportReady' should be a 2-3 sentence summary.
- If data is missing, provide a reasonable educational estimate.
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
