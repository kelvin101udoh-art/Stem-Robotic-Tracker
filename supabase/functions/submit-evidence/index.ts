// supabase/functions/submit-evidence/index.ts



import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import {
  getServiceClient,
  verifyMobileSessionToken,
} from '../_shared/session-auth.ts';
import {
  processClassroomEvidence,
  type TrackBranch,
} from '../_shared/branch-ai.ts';

function parseJsonSafe<T>(value: FormDataEntryValue | null, fallback: T): T {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabase = getServiceClient();
  const geminiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')?.trim();

  // 1. Verify Mobile Session Token
  const mobileSession = await verifyMobileSessionToken(req, supabase);
  if (!mobileSession) {
    return jsonResponse(
      { error: 'Unauthorized: invalid or expired X-Session-Token.' },
      401
    );
  }

  try {
    const contentType = req.headers.get('content-type') ?? '';
    let sessionId = mobileSession.sessionId;
    let branch: TrackBranch = 'ROBOTICS_CLUB';
    let autoSplit = true;
    let taggedStudentIds: string[] = [];
    let manualNote = '';
    let metadata: Record<string, unknown> = {};
    let evidenceType = 'text_note';
    let uploadedFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData();
      const fileEntry = form.get('file');
      if (fileEntry instanceof File) {
        uploadedFile = fileEntry;
        evidenceType = fileEntry.type.startsWith('video/')
          ? 'live_video_debrief'
          : 'voice_debrief';
      }

      sessionId = String(form.get('sessionId') ?? mobileSession.sessionId).trim();
      branch = (String(form.get('branch') ?? 'ROBOTICS_CLUB').trim() ||
        'ROBOTICS_CLUB') as TrackBranch;
      autoSplit = String(form.get('autoSplit') ?? 'true') !== 'false';
      taggedStudentIds = parseJsonSafe<string[]>(form.get('taggedStudentIds'), []);
      manualNote = String(form.get('manualNote') ?? '').trim();
      metadata = parseJsonSafe<Record<string, unknown>>(form.get('metadata'), {});
    } else {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      sessionId = String(body.sessionId ?? mobileSession.sessionId).trim();
      branch = (String(body.branch ?? 'ROBOTICS_CLUB').trim() ||
        'ROBOTICS_CLUB') as TrackBranch;
      autoSplit = body.autoSplit !== false;
      taggedStudentIds = Array.isArray(body.taggedStudentIds)
        ? (body.taggedStudentIds as string[])
        : [];
      manualNote = String(body.manualNote ?? '').trim();
      metadata =
        typeof body.metadata === 'object' && body.metadata !== null
          ? (body.metadata as Record<string, unknown>)
          : {};
    }

    if (!uploadedFile && !manualNote) {
      return jsonResponse(
        { error: 'Either a media file or manual note is required.' },
        400
      );
    }

    // 2. Verify Tenant Boundary & Fetch Club Plan / Monthly Quota
    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const [{ data: sessionRow }, { data: clubRow }, { count: monthlyCount }] =
      await Promise.all([
        supabase
          .from('sessions')
          .select('id, club_id, branch')
          .eq('id', sessionId)
          .eq('club_id', mobileSession.clubId)
          .maybeSingle(),
        supabase
          .from('clubs')
          .select('plan_tier, monthly_ai_quota, default_branch')
          .eq('id', mobileSession.clubId)
          .single(),
        supabase
          .from('kiki_usage')
          .select('id', { count: 'exact', head: true })
          .eq('club_id', mobileSession.clubId)
          .eq('success', true)
          .gte('created_at', startOfMonth.toISOString()),
      ]);

    if (!sessionRow || !clubRow) {
      return jsonResponse(
        { error: 'Forbidden: session does not belong to this organization.' },
        403
      );
    }

    const effectiveBranch: TrackBranch =
      (sessionRow.branch as TrackBranch | null) ??
      (clubRow.default_branch as TrackBranch) ??
      branch;

    const usedThisMonth = monthlyCount ?? 0;
    const quota = clubRow.monthly_ai_quota ?? 600;
    const quotaExceeded = usedThisMonth >= quota;
    const isProTier =
      clubRow.plan_tier === 'PRO_UNLIMITED' || clubRow.plan_tier === 'MAT_CUSTOM';

    // 3. Load Active Roster & Active Student Goals
    const [{ data: studentsData }, { data: goalsData }] = await Promise.all([
      supabase
        .from('students')
        .select('id, full_name')
        .eq('club_id', mobileSession.clubId)
        .limit(80),
      supabase
        .from('student_goals')
        .select('id, student_id, title, framework_area')
        .eq('club_id', mobileSession.clubId)
        .in('status', ['ACTIVE', 'IN_PROGRESS'])
        .limit(120),
    ]);

    const roster = (studentsData ?? []).map((s) => ({
      id: String(s.id),
      fullName: String(s.full_name),
    }));

    const goals = (goalsData ?? []).map((g) => ({
      id: String(g.id),
      studentId: String(g.student_id),
      title: String(g.title),
      frameworkArea: (g.framework_area as string | null) ?? null,
    }));

    // 4. Process Evidence with Soft Fair-Use Quota Protection
    let aiResult;
    if (quotaExceeded && !isProTier) {
      // Starter/Growth exceeded cap: save safely as PENDING_REVIEW without incurring AI cost
      aiResult = {
        observations: [
          {
            attributedStudentIds: taggedStudentIds,
            linkedGoalIds: [],
            sanitizedSummary:
              manualNote ||
              'Monthly AI allowance reached. Please add a brief summary or upgrade your plan.',
            severity: 'INFO' as const,
            requiresFollowup: false,
            structuredInsight: {
              notice: 'Saved in basic mode because monthly AI quota was reached.',
            },
          },
        ],
        tokenCost: 0,
        modelsUsed: [],
        fallbackReason: 'monthly_quota_reached',
      };
    } else {
      // Pro Fair-Use over 5,000 drops Claude escalation and stays on Gemini-only
      const allowClaudeEscalation = !quotaExceeded;
      aiResult = await processClassroomEvidence({
        mediaFile: uploadedFile,
        manualNote,
        branch: effectiveBranch,
        autoSplit,
        taggedStudentIds,
        roster,
        goals,
        allowClaudeEscalation,
        geminiKey,
        anthropicKey,
      });
      if (quotaExceeded && isProTier) {
        aiResult.fallbackReason = 'pro_fair_use_gemini_only';
      }
    }

    // Explicitly release raw media reference — never persisted
    uploadedFile = null;

    // 5. Insert PENDING_REVIEW Rows into session_evidence
    const clientTimestamp =
      typeof metadata.clientTimestamp === 'string'
        ? metadata.clientTimestamp
        : new Date().toISOString();

    const rowsToInsert = aiResult.observations.map((obs) => ({
      club_id: mobileSession.clubId,
      session_id: sessionRow.id,
      type: evidenceType,
      content: obs.sanitizedSummary,
      meta: {
        ...metadata,
        autoSplitApplied: autoSplit,
        audioDiscardedAtEdge: true,
        modelsUsed: aiResult.modelsUsed,
        aiFallbackReason: aiResult.fallbackReason ?? null,
      },
      created_by: mobileSession.teacherId,
      branch: effectiveBranch,
      source: 'MOBILE_CAPTURE',
      review_status: 'PENDING_REVIEW',
      attributed_student_ids: obs.attributedStudentIds,
      linked_goal_ids: obs.linkedGoalIds,
      structured_insight: obs.structuredInsight,
      severity: obs.severity,
      followup_status: obs.requiresFollowup ? 'OPEN' : 'NONE',
      client_timestamp: clientTimestamp,
      parent_visible: false,
    }));

    const { data: insertedRows, error: insertError } = await supabase
      .from('session_evidence')
      .insert(rowsToInsert)
      .select(
        'id, branch, content, attributed_student_ids, linked_goal_ids, structured_insight, severity, followup_status, review_status, client_timestamp'
      );

    if (insertError) {
      console.error('session_evidence insert failed:', insertError);
      return jsonResponse({ error: 'Failed to save structured evidence.' }, 500);
    }

    // 6. Log AI Metering in kiki_usage
    if (aiResult.modelsUsed.length > 0) {
      await supabase
        .from('kiki_usage')
        .insert({
          club_id: mobileSession.clubId,
          mode: `evidence_${effectiveBranch.toLowerCase()}`,
          token_cost: aiResult.tokenCost,
          success: true,
          http_status: 200,
        })
        .then(() => {})
        .catch(() => {});
    }

    const primary = insertedRows?.[0];

    return jsonResponse({
      success: true,
      evidenceId: primary?.id ?? null,
      reviewStatus: 'PENDING_REVIEW',
      splitCount: insertedRows?.length ?? 0,
      quotaStatus: {
        used: usedThisMonth + (aiResult.modelsUsed.length > 0 ? 1 : 0),
        limit: quota,
        fallbackReason: aiResult.fallbackReason ?? null,
      },
      items: (insertedRows ?? []).map((row) => ({
        id: row.id,
        branch: row.branch,
        summary: row.content,
        attributedStudentIds: row.attributed_student_ids,
        linkedGoalIds: row.linked_goal_ids,
        structuredInsight: row.structured_insight,
        severity: row.severity,
        followupStatus: row.followup_status,
        reviewStatus: row.review_status,
        clientTimestamp: row.client_timestamp,
      })),
    });
  } catch (err) {
    console.error('submit-evidence error:', err);

    await supabase
      .from('kiki_usage')
      .insert({
        club_id: mobileSession.clubId,
        mode: 'evidence_ingest',
        token_cost: 0,
        success: false,
        http_status: 500,
        error_text: err instanceof Error ? err.message : 'Unknown error',
      })
      .then(() => {})
      .catch(() => {});

    return jsonResponse(
      { error: 'Evidence processing failed. Item remains safely queued offline.' },
      500
    );
  }
});