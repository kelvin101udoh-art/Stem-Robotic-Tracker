// web/src/app/api/dev/billing/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export const runtime = "nodejs"; // important on Vercel (avoid edge surprises)
export const dynamic = "force-dynamic";

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // Monday start
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

const DAILY_CHAT_LIMIT = 40;

export async function GET() {
  // ✅ Next.js cookies() may be async (Next 15+)
  const cookieStore = await cookies();

  // ✅ Client tied to the user's session (cookie-based)
  const supabaseUser = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const { data: userData } = await supabaseUser.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // ✅ Confirm dev flag (RLS-protected but should allow reading own profile row)
  const { data: profile, error: pErr } = await supabaseUser
    .from("profiles")
    .select("is_dev,is_active")
    .eq("id", userId)
    .single();

  if (pErr) {
    return NextResponse.json({ error: "Profile check failed" }, { status: 403 });
  }

  if (!profile?.is_active || !profile?.is_dev) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ✅ Service role client (server-only, no cookies, bypasses RLS)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "Missing SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const today = startOfTodayISO();
  const week = startOfWeekISO();

  const qToday = supabaseAdmin
    .from("kiki_usage")
    .select("id", { count: "exact", head: true })
    .eq("mode", "chat")
    .gte("created_at", today);

  const qTokens = supabaseAdmin
    .from("kiki_usage")
    .select("token_cost")
    .eq("mode", "chat")
    .gte("created_at", week);

  const [{ count: usedToday, error: e1 }, { data: tokenRows, error: e2 }] =
    await Promise.all([qToday, qTokens]);

  if (e1 || e2) {
    return NextResponse.json(
      { error: "Query failed", details: { e1, e2 } },
      { status: 500 }
    );
  }

  const tokensThisWeek = (tokenRows ?? []).reduce(
    (sum: number, r: any) => sum + (Number(r.token_cost) || 0),
    0
  );

  const chatsUsedToday = usedToday ?? 0;
  const chatsRemaining = Math.max(0, DAILY_CHAT_LIMIT - chatsUsedToday);

  return NextResponse.json({ chatsUsedToday, chatsRemaining, tokensThisWeek });
}
