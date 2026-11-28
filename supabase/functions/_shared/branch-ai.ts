// supabase/functions/_shared/branch-ai.ts

import { encodeBase64 } from 'jsr:@std/encoding/base64';

export type TrackBranch = 'ROBOTICS_CLUB' | 'SEND_PROVISION' | 'EARLY_YEARS';
export type EvidenceSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'SAFEGUARDING';

export interface RosterStudent {
  id: string;
  fullName: string;
}

export interface ActiveGoal {
  id: string;
  studentId: string;
  title: string;
  frameworkArea: string | null;
}

export interface SplitObservation {
  attributedStudentIds: string[];
  linkedGoalIds: string[];
  sanitizedSummary: string;
  severity: EvidenceSeverity;
  requiresFollowup: boolean;
  structuredInsight: Record<string, unknown>;
}

export interface AiProcessingResult {
  observations: SplitObservation[];
  tokenCost: number;
  modelsUsed: string[];
  fallbackReason?: string;
}

const GEMINI_MODEL = 'gemini-4-hydrogen';
const CLAUDE_MODEL = 'claude-sonnet-5-5';

const BRANCH_INSTRUCTIONS: Record<TrackBranch, string> = {
  ROBOTICS_CLUB: `
You are a UK STEM & Robotics Club progress analyst.
Extract practical engineering evidence for parent updates and STEM Club Quality Mark / funding impact reports.
Populate "structuredInsight" with:
- "competencyArea": "Hardware" | "Coding" | "Debugging" | "Teamwork" | "Creativity" | "Leadership"
- "independenceLevel": "Guided" | "Peer-Supported" | "Independent"
- "resilienceNote": short note on problem-solving or debugging persistence
- "parentFriendlyHighlight": 1 warm sentence showing practical growth`,

  SEND_PROVISION: `
You are a UK SEND / SEN Specialist & Behaviour Analyst supporting SENCOs, EHCP Annual Reviews, and Ofsted inspections.
Extract objective, non-judgmental behaviour and micro-progress evidence.
Populate "structuredInsight" with:
- "regulationZone": "Blue" | "Green" | "Yellow" | "Red" | "Unknown"
- "antecedent": what triggered or preceded the moment (or null)
- "behaviour": objective description of what happened (including non-verbal cues if video was provided)
- "consequenceOrDeescalation": what helped regulate or resolve it (or null)
- "ehcpOutcomeAlignment": short note on progress toward EHCP Section E outcomes
Set "severity" to "HIGH" or "SAFEGUARDING" and "requiresFollowup" to true for distress, crisis, injury, or any safeguarding concern.`,

  EARLY_YEARS: `
You are a UK Early Years (EYFS) practitioner assistant supporting nurseries and reception classes.
Extract warm, play-centred developmental observations without clinical jargon.
Populate "structuredInsight" with:
- "eyfsArea": primary EYFS Area of Learning (e.g. "Communication & Language", "PSED", "Physical Development", "Literacy", "Mathematics", "Understanding the World", "Expressive Arts & Design")
- "playContext": brief play context (e.g. "Outdoor forest play", "Block construction")
- "wellbeingStatus": "Settled & Happy" | "Engaged" | "Needed Reassurance" | "Unsettled"
- "suggestedNextStep": 1 practical next step for the Key Person
- "parentFriendlyHighlight": 1 joyful sentence reassuring parents their child was safe and happy
Set "severity" to "SAFEGUARDING" and "requiresFollowup" to true if any allegation of harm or safety concern is mentioned.`,
};

function buildSystemPrompt(branch: TrackBranch, autoSplit: boolean): string {
  return `${BRANCH_INSTRUCTIONS[branch]}

STRICT UK GDPR & SAFEGUARDING RULES:
1. Strip all sensitive PII (phone numbers, home addresses, emails, medical IDs, third-party surnames). Refer to learners by first name only.
2. Only use student IDs from ROSTER. Never invent UUIDs.
3. Only use goal IDs from ACTIVE_GOALS when the observation clearly evidences progress on that goal.
4. ${
    autoSplit
      ? 'AUTO-SPLIT ON: If distinct moments occurred for different learners, split them into separate objects inside "observations". Keep collaborative group moments together in one object.'
      : 'AUTO-SPLIT OFF: Return a single observation object attributed to pre-tagged student IDs (or mentioned roster learners if none were pre-tagged).'
  }

Return ONLY valid JSON matching:
{
  "observations": [
    {
      "attributedStudentIds": ["uuid"],
      "linkedGoalIds": ["uuid"],
      "sanitizedSummary": "Clear, objective 1-3 sentence observation summary.",
      "severity": "INFO" | "LOW" | "MEDIUM" | "HIGH" | "SAFEGUARDING",
      "requiresFollowup": false,
      "structuredInsight": {}
    }
  ]
}`;
}

function sanitizeObservations(
  rawObs: SplitObservation[] | undefined,
  roster: RosterStudent[],
  goals: ActiveGoal[],
  taggedStudentIds: string[],
  fallbackText: string
): SplitObservation[] {
  const validStudents = new Set(roster.map((r) => r.id));
  const validGoals = new Set(goals.map((g) => g.id));

  const cleaned = (rawObs ?? []).map((obs) => {
    const students = (obs.attributedStudentIds ?? []).filter((id) =>
      validStudents.has(id)
    );
    const linkedGoals = (obs.linkedGoalIds ?? []).filter((id) =>
      validGoals.has(id)
    );
    const severity: EvidenceSeverity = [
      'INFO',
      'LOW',
      'MEDIUM',
      'HIGH',
      'SAFEGUARDING',
    ].includes(obs.severity)
      ? obs.severity
      : 'INFO';

    return {
      attributedStudentIds: students.length > 0 ? students : taggedStudentIds,
      linkedGoalIds: linkedGoals,
      sanitizedSummary: (obs.sanitizedSummary || fallbackText).trim(),
      severity,
      requiresFollowup:
        Boolean(obs.requiresFollowup) ||
        severity === 'HIGH' ||
        severity === 'SAFEGUARDING',
      structuredInsight: obs.structuredInsight ?? {},
    };
  });

  if (cleaned.length === 0) {
    cleaned.push({
      attributedStudentIds: taggedStudentIds,
      linkedGoalIds: [],
      sanitizedSummary: fallbackText.slice(0, 1200) || 'Captured classroom observation.',
      severity: 'INFO',
      requiresFollowup: false,
      structuredInsight: {},
    });
  }

  return cleaned;
}

/**
 * Pass 1: Native multimodal ingestion (video/audio/text) via Gemini 4 Hydrogen.
 * Media bytes are encoded transiently in memory and never persisted.
 */
async function callGeminiMultimodal(params: {
  geminiKey: string;
  systemPrompt: string;
  contextJson: string;
  mediaFile: File | null;
}): Promise<{ observations: SplitObservation[]; tokens: number }> {
  const parts: Array<Record<string, unknown>> = [{ text: params.contextJson }];

  if (params.mediaFile) {
    const buffer = await params.mediaFile.arrayBuffer();
    const base64Data = encodeBase64(new Uint8Array(buffer));
    parts.push({
      inline_data: {
        mime_type: params.mediaFile.type || 'audio/mp4',
        data: base64Data,
      },
    });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': params.geminiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: params.systemPrompt }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown Gemini error');
    throw new Error(`Gemini failed (${res.status}): ${errText}`);
  }

  const payload = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { totalTokenCount?: number };
  };

  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
  const parsed = JSON.parse(rawText) as { observations?: SplitObservation[] };

  return {
    observations: parsed.observations ?? [],
    tokens: payload.usageMetadata?.totalTokenCount ?? 0,
  };
}

/**
 * Pass 2: Deep SEND behaviour (ABC) & safeguarding refinement via Claude Sonnet 5.5.
 * Receives ONLY PII-sanitized text & structured draft—never raw audio/video.
 */
async function escalateToClaudeSend(params: {
  anthropicKey: string;
  systemPrompt: string;
  draftObservations: SplitObservation[];
  contextJson: string;
}): Promise<{ observations: SplitObservation[]; tokens: number }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2026-10-21',
      Authorization: `Bearer ${params.anthropicKey}`,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      temperature: 0.2,
      system: `${params.systemPrompt}\n\nYou are performing a specialist SENCO/DSL quality review on an initial draft. Sharpen objective ABC behaviour phrasing, verify EHCP alignment, ensure zero judgmental language, and return ONLY raw JSON with no markdown fences.`,
      messages: [
        {
          role: 'user',
          content: JSON.stringify({
            context: JSON.parse(params.contextJson),
            initialDraft: params.draftObservations,
          }),
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown Claude error');
    throw new Error(`Claude escalation failed (${res.status}): ${errText}`);
  }

  const payload = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  const textBlock = payload.content?.find((c) => c.type === 'text')?.text ?? '{}';
  const cleanedJson = textBlock
    .replace(/^```json\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const parsed = JSON.parse(cleanedJson) as { observations?: SplitObservation[] };

  const tokens =
    (payload.usage?.input_tokens ?? 0) + (payload.usage?.output_tokens ?? 0);

  return {
    observations: parsed.observations ?? params.draftObservations,
    tokens,
  };
}

export async function processClassroomEvidence(params: {
  mediaFile: File | null;
  manualNote: string;
  branch: TrackBranch;
  autoSplit: boolean;
  taggedStudentIds: string[];
  roster: RosterStudent[];
  goals: ActiveGoal[];
  allowClaudeEscalation: boolean;
  geminiKey?: string;
  anthropicKey?: string;
}): Promise<AiProcessingResult> {
  const {
    mediaFile,
    manualNote,
    branch,
    autoSplit,
    taggedStudentIds,
    roster,
    goals,
    allowClaudeEscalation,
    geminiKey,
    anthropicKey,
  } = params;

  if (!geminiKey) {
    return {
      observations: sanitizeObservations(
        undefined,
        roster,
        goals,
        taggedStudentIds,
        manualNote || 'Observation captured (GEMINI_API_KEY not configured).'
      ),
      tokenCost: 0,
      modelsUsed: [],
      fallbackReason: 'missing_gemini_key',
    };
  }

  const systemPrompt = buildSystemPrompt(branch, autoSplit);
  const contextJson = JSON.stringify({
    branch,
    preTaggedStudentIds: taggedStudentIds,
    roster,
    activeGoals: goals,
    manualNote: manualNote || null,
  });

  const modelsUsed: string[] = [GEMINI_MODEL];
  let totalTokens = 0;

  // 1. Run Gemini 4 Hydrogen natively on media + note
  const geminiResult = await callGeminiMultimodal({
    geminiKey,
    systemPrompt,
    contextJson,
    mediaFile,
  });
  totalTokens += geminiResult.tokens;

  let finalObs = sanitizeObservations(
    geminiResult.observations,
    roster,
    goals,
    taggedStudentIds,
    manualNote
  );

  // 2. Escalate to Claude Sonnet 5.5 for SEND or any HIGH/SAFEGUARDING alert
  const needsSpecialistReview =
    branch === 'SEND_PROVISION' ||
    finalObs.some(
      (o) => o.severity === 'HIGH' || o.severity === 'SAFEGUARDING'
    );

  if (needsSpecialistReview && allowClaudeEscalation && anthropicKey) {
    try {
      const claudeResult = await escalateToClaudeSend({
        anthropicKey,
        systemPrompt,
        draftObservations: finalObs,
        contextJson,
      });
      finalObs = sanitizeObservations(
        claudeResult.observations,
        roster,
        goals,
        taggedStudentIds,
        manualNote
      );
      totalTokens += claudeResult.tokens;
      modelsUsed.push(CLAUDE_MODEL);
    } catch (err) {
      // Non-fatal: retain Gemini's verified output so teachers never lose a capture
      console.error('Claude escalation skipped due to error:', err);
    }
  }

  return {
    observations: finalObs,
    tokenCost: totalTokens,
    modelsUsed,
  };
}