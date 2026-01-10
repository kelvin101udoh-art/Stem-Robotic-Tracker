"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ✅ Never throw at build time
  if (!url || !anon) {
    // This will only happen if env vars are missing in runtime.
    // Returning a "dummy" client would break, so we throw at runtime instead.
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createBrowserClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
