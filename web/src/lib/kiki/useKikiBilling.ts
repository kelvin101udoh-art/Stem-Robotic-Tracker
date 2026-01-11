// web/src/lib/kiki/useKikiBilling.ts
"use client";

import { useEffect, useState } from "react";

export type BillingStats = {
  chatsUsedToday: number;
  chatsRemaining: number;
  tokensThisWeek: number;
};

export function useKiKiBillingStats() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BillingStats | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      const res = await fetch("/api/dev/billing");
      if (!res.ok) throw new Error(`Failed: ${res.status}`);
      const json = await res.json();
      if (!cancelled) setStats(json);
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
  }, []);

  return { loading, stats };
}
