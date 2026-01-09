"use client";

import { useEffect, useState } from "react";

export type BillingStats = {
  chatsUsedToday: number;
  chatsRemaining: number;
  tokensThisWeek: number;
};

const DAILY_CHAT_LIMIT = 40; // ✅ pilot limit (chat only)
function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // Monday as week start
  d.setDate(d.getDate() - diff);
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

      const today = startOfTodayISO();
      const week = startOfWeekISO();

      // ✅ CHAT ONLY
      let qToday = supabase
        .from("kiki_usage")
        .select("id", { count: "exact", head: true })
        .eq("mode", "chat")
        .gte("created_at", today);

      let qTokens = supabase
        .from("kiki_usage")
        .select("token_cost, created_at")
        .eq("mode", "chat")
        .gte("created_at", week);

      if (clubId) {
        qToday = qToday.eq("club_id", clubId);
        qTokens = qTokens.eq("club_id", clubId);
      }

      const [{ count: usedToday, error: e1 }, { data: tokenRows, error: e2 }] =
        await Promise.all([qToday, qTokens]);

      if (e1) throw e1;
      if (e2) throw e2;

      const tokensThisWeek = (tokenRows ?? []).reduce(
        (sum: number, r: any) => sum + (Number(r.token_cost) || 0),
        0
      );

      const chatsUsedToday = usedToday ?? 0;
      const chatsRemaining = Math.max(0, DAILY_CHAT_LIMIT - chatsUsedToday);

      if (!cancelled) {
        setStats({ chatsUsedToday, chatsRemaining, tokensThisWeek });
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
