// supabase/functions/submit-evidence/index.ts


import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

type TrackBranch = 'ROBOTICS_CLUB' | 'SEND_PROVISION' | 'EARLY_YEARS';

interface RosterCandidate {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

interface IngestPayload {
  sessionId: string;
  organizationId: string;
  branch: TrackBranch;
  taggedStudentIds: string[];
  transcriptionAudioBase64?: string;
  mediaFileUrl?: string;
  manualNote?: string;
  metadata: Record<string, unknown>;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function buildBranchSystemPrompt(branch: TrackBranch): string {
  switch (branch) {
    case 'SEND_PROVISION':
      return [
        'You are a UK SEND & EHCP statutory behaviour analyst.',
        'Analyze the educator note/media and extract objective, safeguarding-compliant behaviour & regulation evidence.',
        'Return strict JSON with keys: matchedStudentIds (string[]), summary (string), curriculumTags (string[]), behaviorOrRegulationNote (string).',
        'Frame behaviour neutrally (antecedent, observed action, regulation zone/co-regulation, and EHCP outcome alignment) without diagnosing.',
      ].join(' ');
    case 'EARLY_YEARS':
      return [
        'You are an Early Years Foundation Stage (EYFS) Development Matters specialist.',
        'Analyze child-initiated play, communication, and continuous provision moments.',
        'Return strict JSON with keys: matchedStudentIds (string[]), summary (string), curriculumTags (string[]), behaviorOrRegulationNote (string).',
      ].join(' ');
    case 'ROBOTICS_CLUB':
    default:
      return [
        'You are a STEM & Robotics learning evidence engine aligned with UK Computing & Engineering Milestones.',
        'Extract engineering concepts, iterative debugging, and collaborative problem-solving.',
        'Return strict JSON with keys: matchedStudentIds (string[]), summary (string), curriculumTags (string[]), behaviorOrRegulationNote (string).',
      ].join(' ');
  }
}

async function runMultimodalBranchLLM(args: {
  openAiApiKey: string;
  branch: TrackBranch;
  manualNote?: string;
  mediaBase64?: string;
  roster: RosterCandidate[];
  preselectedStudentIds: string[];
}) {
  const userContent: Array<Record<string, unknown>> = [
    {
      type: 'text',
      text: JSON.stringify({
        branch: args.branch,
        preselectedStudentIds: args.preselectedStudentIds,
        manualNote: args.manualNote ?? '',
        rosterCandidates: args.roster.map((r) => ({
          id: r.id,
          name: `${r.firstName} ${r.lastName}`,
          hasOnboardingPortrait: Boolean(r.avatarUrl),
        })),
        instruction:
          args.preselectedStudentIds.length > 0
            ? 'Use preselectedStudentIds as the pinned students.'
            : 'Identify any visible/mentioned roster learners from the media/onboarding context and return their IDs in matchedStudentIds.',
      }),
    },
  ];

  // Attach onboarding reference portraits when auto-pinning from media
  if (args.preselectedStudentIds.length === 0) {
    for (const member of args.roster) {
      if (member.avatarUrl) {
        userContent.push({
          type: 'image_url',
          image_url: { url: member.avatarUrl, detail: 'low' },
        });
      }
    }
  }

  if (args.mediaBase64) {
    userContent.push({
      type: 'input_audio',
      input_audio: {
        data: args.mediaBase64,
        format: 'mp4',
      },
    });
  }

  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${args.openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildBranchSystemPrompt(args.branch) },
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text().catch(() => '');
    throw new Error(`LLM processing failed (${aiRes.status}): ${errText}`);
  }

  const completion = await aiRes.json();
  const rawContent = completion.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(rawContent) as {
    matchedStudentIds?: string[];
    summary?: string;
    curriculumTags?: string[];
    behaviorOrRegulationNote?: string;
  };

  const resolvedIds =
    args.preselectedStudentIds.length > 0
      ? args.preselectedStudentIds
      : Array.isArray(parsed.matchedStudentIds)
        ? parsed.matchedStudentIds
        : [];

  return {
    resolvedStudentIds: resolvedIds,
    structuredInsight: {
      summary: parsed.summary ?? 'Observation structured and saved.',
      curriculumTags: Array.isArray(parsed.curriculumTags) ? parsed.curriculumTags : [],
      behaviorOrRegulationNote: parsed.behaviorOrRegulationNote,
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey || !openAiApiKey) {
      throw new Error('Missing required Edge Function environment secrets.');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const payload = (await req.json()) as IngestPayload;

    if (!payload.sessionId || !payload.organizationId || !payload.branch) {
      return new Response(
        JSON.stringify({ error: 'Missing required sessionId, organizationId, or branch.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch session roster + onboarding portraits (avatar_url) for automatic face/identity attribution
    const { data: rosterRows } = await supabase
      .from('students')
      .select('id, first_name, last_name, avatar_url')
      .eq('club_id', payload.organizationId);

    const roster: RosterCandidate[] = (rosterRows ?? []).map((row) => ({
      id: String(row.id),
      firstName: String(row.first_name ?? ''),
      lastName: String(row.last_name ?? ''),
      avatarUrl: row.avatar_url ? String(row.avatar_url) : undefined,
    }));

    const { resolvedStudentIds, structuredInsight } = await runMultimodalBranchLLM({
      openAiApiKey,
      branch: payload.branch,
      manualNote: payload.manualNote,
      mediaBase64: payload.transcriptionAudioBase64,
      roster,
      preselectedStudentIds: payload.taggedStudentIds ?? [],
    });

    // Persist sanitized evidence record (raw base64 media is never stored in DB)
    const { data: inserted, error: insertError } = await supabase
      .from('session_evidence')
      .insert({
        session_id: payload.sessionId,
        club_id: payload.organizationId,
        branch: payload.branch,
        student_ids: resolvedStudentIds,
        summary: structuredInsight.summary,
        curriculum_tags: structuredInsight.curriculumTags,
        ehcp_or_behaviour_note: structuredInsight.behaviorOrRegulationNote ?? null,
        metadata: payload.metadata,
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Database insert failed: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        evidenceId: inserted?.id ?? crypto.randomUUID(),
        structuredInsight,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected edge error.';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});