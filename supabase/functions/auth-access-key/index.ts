// stem-robotic-tracker-monorepo/supabase/functions/auth-access-key/index.ts

import { corsHeaders, jsonResponse } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/session-auth.ts';

const RATE_LIMIT_MAX_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_LOCK_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8-hour school day

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSessionToken(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  const hex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `st_mob_${hex}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const supabase = getServiceClient();

  try {
    const body = await req.json().catch(() => ({}));
    const rawKey = String(body.accessKey ?? body.access_key ?? '').trim();

    if (!rawKey) {
      return jsonResponse({ error: 'Access key is required.' }, 400);
    }

    // 1. DfE Rate-Limit Check (hashed client IP)
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('cf-connecting-ip') ??
      'unknown';
    const identifier = await sha256Hex(`auth:${clientIp}`);
    const now = new Date();

    const { data: rateRow } = await supabase
      .from('auth_rate_limits')
      .select('id, failed_attempts, window_started_at, locked_until')
      .eq('identifier', identifier)
      .maybeSingle();

    if (rateRow?.locked_until && new Date(rateRow.locked_until) > now) {
      const retryAfterSec = Math.ceil(
        (new Date(rateRow.locked_until).getTime() - now.getTime()) / 1000
      );
      return jsonResponse(
        {
          error: 'Too many failed attempts. Terminal temporarily locked.',
          retryAfterSeconds: retryAfterSec,
        },
        429
      );
    }

    // 2. Validate Access Key
    const { data: keyRecord, error: keyError } = await supabase
      .from('mobile_access_keys')
      .select('id, club_id, session_id, teacher_id, label, is_active, expires_at')
      .eq('access_key', rawKey)
      .maybeSingle();

    const isKeyInvalid =
      keyError ||
      !keyRecord ||
      !keyRecord.is_active ||
      (keyRecord.expires_at && new Date(keyRecord.expires_at) <= now);

    if (isKeyInvalid) {
      // Increment failure counter
      const windowExpired =
        !rateRow ||
        now.getTime() - new Date(rateRow.window_started_at).getTime() >
          RATE_LIMIT_WINDOW_MS;

      const nextAttempts = windowExpired ? 1 : rateRow.failed_attempts + 1;
      const lockedUntil =
        nextAttempts >= RATE_LIMIT_MAX_ATTEMPTS
          ? new Date(now.getTime() + RATE_LIMIT_LOCK_MS).toISOString()
          : null;

      await supabase.from('auth_rate_limits').upsert(
        {
          identifier,
          failed_attempts: nextAttempts,
          window_started_at: windowExpired
            ? now.toISOString()
            : rateRow.window_started_at,
          locked_until: lockedUntil,
        },
        { onConflict: 'identifier' }
      );

      return jsonResponse({ error: 'Invalid or expired access key.' }, 401);
    }

    // Reset rate limit on successful login
    if (rateRow) {
      await supabase
        .from('auth_rate_limits')
        .delete()
        .eq('identifier', identifier);
    }

    // 3. Load Club & 3-Branch Config
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id, name, default_branch, enabled_branches')
      .eq('id', keyRecord.club_id)
      .single();

    if (clubError || !club) {
      return jsonResponse({ error: 'Organization not found.' }, 404);
    }

    // 4. Load Today's Timetable Sessions + Assigned Session
    const startOfDay = new Date(now);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const { data: todaySessions } = await supabase
      .from('sessions')
      .select('id, title, subject, branch, starts_at, duration_minutes, status')
      .eq('club_id', club.id)
      .gte('starts_at', startOfDay.toISOString())
      .lte('starts_at', endOfDay.toISOString())
      .order('starts_at', { ascending: true });

    let sessionsList = todaySessions ?? [];

    // Ensure the access key's assigned session is included even if scheduled on another date
    let primarySession = sessionsList.find((s) => s.id === keyRecord.session_id);
    if (!primarySession && keyRecord.session_id) {
      const { data: assigned } = await supabase
        .from('sessions')
        .select('id, title, subject, branch, starts_at, duration_minutes, status')
        .eq('id', keyRecord.session_id)
        .maybeSingle();

      if (assigned) {
        primarySession = assigned;
        sessionsList = [assigned, ...sessionsList];
      }
    }

    if (!primarySession && sessionsList.length > 0) {
      primarySession = sessionsList[0];
    }

    if (!primarySession) {
      return jsonResponse(
        { error: 'No active session found for this access key.' },
        404
      );
    }

    // 5. Hydrate Active Roster (session_participants -> fallback to club enrolments)
    const { data: participants } = await supabase
      .from('session_participants')
      .select('students(id, full_name, avatar_url, key_person_id, branch_profile)')
      .eq('club_id', club.id)
      .eq('session_id', primarySession.id);

    let activeRoster = (participants ?? [])
      .map((row: Record<string, unknown>) => row.students as Record<string, unknown> | null)
      .filter((s): s is Record<string, unknown> => Boolean(s))
      .map((s) => ({
        id: String(s.id),
        fullName: String(s.full_name),
        avatarUrl: (s.avatar_url as string | null) ?? undefined,
        keyPersonId: (s.key_person_id as string | null) ?? undefined,
        branchProfile: (s.branch_profile as Record<string, unknown>) ?? {},
      }));

    if (activeRoster.length === 0) {
      const { data: clubStudents } = await supabase
        .from('students')
        .select('id, full_name, avatar_url, key_person_id, branch_profile')
        .eq('club_id', club.id)
        .order('full_name', { ascending: true })
        .limit(60);

      activeRoster = (clubStudents ?? []).map((s) => ({
        id: String(s.id),
        fullName: String(s.full_name),
        avatarUrl: s.avatar_url ?? undefined,
        keyPersonId: s.key_person_id ?? undefined,
        branchProfile: s.branch_profile ?? {},
      }));
    }

    // 6. Issue Cryptographic Mobile Session Token
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();

    const { error: sessionInsertError } = await supabase
      .from('mobile_sessions')
      .insert({
        access_key_id: keyRecord.id,
        club_id: club.id,
        session_id: primarySession.id,
        teacher_id: keyRecord.teacher_id,
        session_token: sessionToken,
        expires_at: expiresAt,
      });

    if (sessionInsertError) {
      console.error('Failed to create mobile_sessions row:', sessionInsertError);
      return jsonResponse({ error: 'Could not initialize mobile session.' }, 500);
    }

    const activeBranch = primarySession.branch ?? club.default_branch;

    return jsonResponse({
      sessionToken,
      expiresAt,
      session: {
        sessionId: primarySession.id,
        sessionName: primarySession.title,
        organizationId: club.id,
        organizationName: club.name,
        branch: activeBranch,
        enabledBranches: club.enabled_branches,
        activeRoster,
        sessions: sessionsList.map((s) => ({
          id: s.id,
          title: s.title,
          subject: s.subject ?? s.title,
          branch: s.branch ?? club.default_branch,
          startsAt: s.starts_at,
          durationMinutes: s.duration_minutes ?? 60,
          status: s.status,
        })),
      },
    });
  } catch (err) {
    console.error('auth-access-key error:', err);
    return jsonResponse({ error: 'Unexpected authentication error.' }, 500);
  }
});