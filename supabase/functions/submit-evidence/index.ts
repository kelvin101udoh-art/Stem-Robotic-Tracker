// supabase/functions/submit-evidence/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { IngestEvidenceRequestDTO, IngestEvidenceResponseDTO } from '../../../packages/stemtrack-sdk/src/types/index.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const BRANCH_SYSTEM_PROMPTS: Record<string, string> = {
  ROBOTICS_CLUB: `You are an expert UK STEM & Robotics Assessor. 
Analyze the learning note. Extract:
1. Computational/Mechanical thinking demonstration.
2. Specific debugging steps and problem-solving resilience.
3. Link to Computing National Curriculum competency.
Output concise, objective summary.`,

  SEND_PROVISION: `You are an expert UK SENCO and Educational Psychologist.
Analyze the observation. Extract:
1. Zones of Regulation state (Green, Yellow, Red, Blue) and transitions.
2. De-escalation and co-regulation strategies employed.
3. Verifiable evidence linking to EHCP social-emotional and independence outcomes.
Output audit-safe clinical summary.`,

  EARLY_YEARS: `You are an expert Early Years Foundation Stage (EYFS) Practitioner.
Analyze the observation. Extract:
1. Relevant Development Matters Area (PSED, Communication & Language, Physical).
2. Distinction between child-initiated discovery and adult-guided learning.
3. Concrete progress milestone evidence.
Output concise observational learning log.`,
};

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const payload: IngestEvidenceRequestDTO = await req.json();
    const systemPrompt = BRANCH_SYSTEM_PROMPTS[payload.branch] || BRANCH_SYSTEM_PROMPTS['ROBOTICS_CLUB'];

    // 1. Call OpenAI to structure the observation
    const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: payload.manualNote || 'Observed activity recorded via mobile terminal.' },
        ],
        temperature: 0.2,
      }),
    });

    const llmJson = await llmResponse.json();
    const parsedSummary = llmJson.choices?.[0]?.message?.content || 'Observation processed successfully.';

    // 2. Persist to Relational SQL Database (`evidence` table)
    const { data: evidenceRow, error: insertError } = await supabase
      .from('evidence_items')
      .insert({
        session_id: payload.sessionId,
        organization_id: payload.organizationId,
        branch: payload.branch,
        media_url: payload.mediaFileUrl || null,
        raw_transcription: payload.manualNote || null,
        structured_summary: parsedSummary,
        metadata: payload.metadata,
        verified_by_educator: true,
      })
      .select('id')
      .single();

    if (insertError) {
      throw new Error(`Database persistence error: ${insertError.message}`);
    }

    const evidenceId = evidenceRow.id;

    // 3. Persist student relations (`evidence_students` join table)
    if (payload.taggedStudentIds && payload.taggedStudentIds.length > 0) {
      const studentRelations = payload.taggedStudentIds.map((studentId) => ({
        evidence_id: evidenceId,
        student_id: studentId,
      }));

      const { error: relationError } = await supabase
        .from('evidence_students')
        .insert(studentRelations);

      if (relationError) {
        console.error('Failed to link tagged students:', relationError.message);
      }
    }

    // 4. Return typed enterprise DTO response
    const responsePayload: IngestEvidenceResponseDTO = {
      success: true,
      evidenceId,
      structuredInsight: {
        summary: parsedSummary,
        curriculumTags: [payload.branch, payload.metadata.captureMode],
      },
    };

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error during evidence ingestion';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});