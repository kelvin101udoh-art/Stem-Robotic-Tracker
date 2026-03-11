// web/src/lib/supabase/server.ts


"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies(); // ✅ Next: cookies() returns a Promise

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) throw new Error("Missing Supabase env vars");

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },

      // ✅ Server Components: cookieStore is read-only, so these must be no-ops
      set(_name: string, _value: string, _options: any) {},
      remove(_name: string, _options: any) {},
    },
  });
}
