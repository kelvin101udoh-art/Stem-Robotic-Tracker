// apps/mobile/src/api/http.ts

import { SessionStorageService } from '../core/session';

export async function http<T>(
  url: string,
  init: RequestInit,
  timeoutMs = 30000
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Request failed (${response.status}). ${text}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}



export function getUploadHeaders(
  contentType?: 'application/json',
  sessionToken?: string | null
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (anonKey) {
    headers.apikey = anonKey;
    headers.Authorization = `Bearer ${anonKey}`;
  }

  if (sessionToken) {
    headers['X-Session-Token'] = sessionToken;
  }

  return headers;
}

export async function getAuthenticatedUploadHeaders(
  contentType?: 'application/json'
): Promise<Record<string, string>> {
  const token = await SessionStorageService.getSessionToken();
  return getUploadHeaders(contentType, token);
}

