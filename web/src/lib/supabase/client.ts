// web/src/lib/supabase/client.ts
"use client";

import { useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * SSR-safe env getter:
 * - Never throws during build/SSR
 * - Avoids crashing Next.js "Client Component SSR"
 */
function getPublicEnv(name: string): string | null {
  const v = process.env[name];
  return v && v.trim() ? v : null;
}

export function createClient(): SupabaseClient {
  const url = getPublicEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = getPublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  // ✅ IMPORTANT: don't throw here (this can run during SSR/build)
  // Provide safe fallbacks so build doesn't crash.
  // If these are missing at runtime, Supabase calls will fail gracefully.
  return createBrowserClient(url ?? "", anon ?? "", {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export function useSupabaseBrowser() {
  return useMemo(() => createClient(), []);
}
