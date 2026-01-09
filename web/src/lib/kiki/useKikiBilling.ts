import { useEffect, useState } from "react";

const DAILY_CHAT_LIMIT = 20; // keep in sync with API

type BillingStats = {
  chatsUsedToday: number;
  chatsRemaining: number;
  tokensThisWeek: number;
};

export function useKiKiBillingStats(
  supabase: any,
  clubId: string
) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BillingStats | null>(null);

  useEffect(() => {
    if (!supabase || !clubId) return;

    let cancelled = false;

    async function run() {
      setLoading(true);

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // 1️⃣ Chats used today
      const { count: chatsToday, error: e1 } = await supabase
        .from("kiki_usage")
        .select("id", { count: "exact", head: true })
        .eq("club_id", clubId)
        .eq("mode", "chat")
        .gte("created_at", startOfToday.toISOString());

      if (e1) throw e1;

      // 2️⃣ Tokens used this week
      const { data: tokensData, error: e2 } = await supabase
        .from("kiki_usage")
        .select("token_cost")
        .eq("club_id", clubId)
        .gte("created_at", startOfWeek.toISOString())
        .eq("success", true);

      if (e2) throw e2;

      const tokensThisWeek =
        tokensData?.reduce(
          (sum: number, r: any) => sum + (r.token_cost ?? 0),
          0
        ) ?? 0;

      const used = chatsToday ?? 0;
      const remaining = Math.max(0, DAILY_CHAT_LIMIT - used);

      if (!cancelled) {
        setStats({
          chatsUsedToday: used,
          chatsRemaining: remaining,
          tokensThisWeek,
        });
      }
    }

    run()
      .catch((err) => console.error("KiKi billing error:", err))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [supabase, clubId]);

  return { loading, stats };
}
