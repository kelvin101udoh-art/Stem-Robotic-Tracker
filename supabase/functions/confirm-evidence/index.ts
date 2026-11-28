// supabase/functions/confirm-evidence/index.ts

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  getServiceClient,
  verifyMobileSessionToken,
} from '../_shared/session-auth.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabase = getServiceClient();
  const mobileSession = await verifyMobileSessionToken(req, supabase);

  if (!mobileSession) {
    return jsonResponse(
      { error: 'Unauthorized: invalid or expired X-Session-Token.' },
      401
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      evidenceId?: string;
      status?: 'CONFIRMED' | 'REJECTED';
      editedSummary?: string;
      attributedStudentIds?: string[];
      linkedGoalIds?: string[];
      structuredInsight?: Record<string, unknown>;
      parentVisible?: boolean;
      followupNotes?: string;
    };

    if (!body.evidenceId) {
      return jsonResponse({ error: 'evidenceId is required.' }, 400);
    }

    const nextStatus = body.status === 'REJECTED' ? 'REJECTED' : 'CONFIRMED';

    const updatePayload: Record<string, unknown> = {
      review_status: nextStatus,
      reviewed_by: mobileSession.teacherId,
      reviewed_at: new Date().toISOString(),
      parent_visible:
        nextStatus === 'CONFIRMED' ? Boolean(body.parentVisible) : false,
    };

    if (typeof body.editedSummary === 'string' && body.editedSummary.trim()) {
      updatePayload.content = body.editedSummary.trim();
    }
    if (Array.isArray(body.attributedStudentIds)) {
      updatePayload.attributed_student_ids = body.attributedStudentIds;
    }
    if (Array.isArray(body.linkedGoalIds)) {
      updatePayload.linked_goal_ids = body.linkedGoalIds;
    }
    if (body.structuredInsight && typeof body.structuredInsight === 'object') {
      updatePayload.structured_insight = body.structuredInsight;
    }
    if (typeof body.followupNotes === 'string') {
      updatePayload.followup_notes = body.followupNotes.trim();
    }

    const { data, error } = await supabase
      .from('session_evidence')
      .update(updatePayload)
      .eq('id', body.evidenceId)
      .eq('club_id', mobileSession.clubId)
      .select('id, review_status, parent_visible, reviewed_at')
      .maybeSingle();

    if (error || !data) {
      return jsonResponse(
        { error: 'Evidence item not found or access denied.' },
        404
      );
    }

    return jsonResponse({ success: true, evidence: data });
  } catch (err) {
    console.error('confirm-evidence error:', err);
    return jsonResponse({ error: 'Failed to confirm evidence.' }, 500);
  }
});