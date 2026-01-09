"use client";

import { useEffect, useState } from "react";

export type BillingStats = {
  chatsUsedToday: number;
  chatsRemaining: number;
  tokensThisWeek: number;
  dailyLimit: number;
};

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeekISO() {
  // Monday-start week (good for UK). If you prefer Sunday, adjust.
  const d = new Date();
  const day = d.getDay(); // 0 Sun ... 6 Sat
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function useKiKiBillingStats(supabase: any, clubId?: string) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BillingStats | null>(null);

  useEffect(() => {
    if (!supabase) return;

    let cancelled = false;

    async function run() {
      setLoading(true);

      const dailyLimit = Number(process.env.NEXT_PUBLIC_KIKI_DAILY_CHAT_LIMIT ?? 30);

      const today = startOfTodayISO();
      const week = startOfWeekISO();

      // ---- Chats used today (mode='chat' only) ----
      let q1 = supabase
        .from("kiki_usage")
        .select("id", { count: "exact", head: true })
        .eq("mode", "chat")
        .gte("created_at", today);

      if (clubId) q1 = q1.eq("club_id", clubId);

      const { count: chatsUsedToday, error: e1 } = await q1;
      if (e1) throw e1;

      // ---- Tokens this week (mode='chat' only) ----
      let q2 = supabase
        .from("kiki_usage")
        .select("token_cost")
        .eq("mode", "chat")
        .gte("created_at", week);

      if (clubId) q2 = q2.eq("club_id", clubId);

      const { data: rows, error: e2 } = await q2;
      if (e2) throw e2;

      const tokensThisWeek = (rows ?? []).reduce(
        (sum: number, r: any) => sum + (Number(r?.token_cost) || 0),
        0
      );

      const used = chatsUsedToday ?? 0;
      const remaining = Math.max(0, dailyLimit - used);

      if (!cancelled) {
        setStats({
          chatsUsedToday: used,
          chatsRemaining: remaining,
          tokensThisWeek,
          dailyLimit,
        });
      }
    }

    run()
      .catch((err) => {
        console.error("useKiKiBillingStats error:", err);
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, clubId]);

  return { loading, stats };
}
