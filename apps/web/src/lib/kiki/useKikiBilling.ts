// web/src/lib/kiki/useKiKiBilling.ts

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/dev/billing", { cache: "no-store" });
      const text = await res.text();

      if (!res.ok) {
        throw new Error(`API ${res.status}: ${text}`);
      }

      const json = JSON.parse(text);
      if (!cancelled) setStats(json);
    }

    run()
      .catch((err) => {
        console.error("useKiKiBillingStats error:", err);
        if (!cancelled) setError(String(err?.message || err));
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { loading, stats, error };
}
