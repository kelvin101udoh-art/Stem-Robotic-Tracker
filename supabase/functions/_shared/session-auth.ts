// supabes/functions/_shared/session-auth.ts

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

export interface VerifiedMobileSession {
  mobileSessionId: string;
  clubId: string;
  sessionId: string;
  teacherId: string | null;
  accessKeyId: string | null;
}

export function getServiceClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function verifyMobileSessionToken(
  req: Request,
  supabase: SupabaseClient
): Promise<VerifiedMobileSession | null> {
  const token = req.headers.get('x-session-token')?.trim();
  if (!token) return null;

  const { data, error } = await supabase
    .from('mobile_sessions')
    .select('id, club_id, session_id, teacher_id, access_key_id, expires_at')
    .eq('session_token', token)
    .maybeSingle();

  if (error || !data) return null;

  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return {
    mobileSessionId: data.id,
    clubId: data.club_id,
    sessionId: data.session_id,
    teacherId: data.teacher_id ?? null,
    accessKeyId: data.access_key_id ?? null,
  };
}