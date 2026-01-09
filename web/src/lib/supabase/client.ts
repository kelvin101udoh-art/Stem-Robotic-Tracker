// web/src/lib/supabase/client.ts
"use client";

import { useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function createClient() {
  return createBrowserClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    }
  );
}

export function useSupabaseBrowser() {
  return useMemo(() => createClient(), []);
}


