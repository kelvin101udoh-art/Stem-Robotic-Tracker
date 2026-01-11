// web/src/app/api/dev/billing/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
    const cookieStore = cookies();

    // Authenticated user (cookie session)
    const supabaseUser = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                async get(name: string) {
                    return (await cookieStore).get(name)?.value;
                },
                set() { },
                remove() { },
            },
        }
    );

    const { data: userData } = await supabaseUser.auth.getUser();
    const userId = userData?.user?.id;

    if (!userId) {
        return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { data: profile } = await supabaseUser
        .from("profiles")
        .select("is_dev, is_active")
        .eq("id", userId)
        .single();

    if (!profile?.is_active || !profile?.is_dev) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Service role client (server-only)
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!, // set in Vercel env (SERVER ONLY)
        { cookies: { get() { return undefined; }, set() { }, remove() { } } }
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
        return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    const tokensThisWeek = (tokenRows ?? []).reduce(
        (sum: number, r: any) => sum + (Number(r.token_cost) || 0),
        0
    );

    const chatsUsedToday = usedToday ?? 0;
    const chatsRemaining = Math.max(0, DAILY_CHAT_LIMIT - chatsUsedToday);

    return NextResponse.json({ chatsUsedToday, chatsRemaining, tokensThisWeek });
}
