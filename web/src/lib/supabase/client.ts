// lib/supabase/client.ts

"use client";
// Fix the typo here and rename the import to something local like 'createBrowserClientOriginal'
import { createBrowserClient as createBrowserClientOriginal } from "@supabase/ssr"; 
import type { SupabaseClient } from "@supabase/supabase-js";

// Export the function using the name 'createClient' to match your other files
export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  
  // Use the correctly imported name here
  return createBrowserClientOriginal(url, anon, { 
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}
