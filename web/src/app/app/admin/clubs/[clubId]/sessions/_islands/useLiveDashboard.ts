// web/src/app/app/admin/clubs/[clubId]/sessions/_islands/useLiveDashboard.ts

"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useAdminGuard } from "@/lib/admin/admin-guard";

export type SessionStatus = "planned" | "open" | "closed";

export type SessionRow = {
  id: string;
  club_id: string;
  title: string | null;
  starts_at: string | null;
  duration_minutes: number | null;
  status?: SessionStatus | null;

  // returned by RPC
  participants?: number;
  evidence_items?: number;
  last_evidence_at?: string | null;
  activities_total?: number;
  activities_done?: number;
};

export type SessionAiInsight = {
  id: string;
  club_id: string;
  period_start: string;
  period_end: string;
  source: "rules" | "azure";
  summary: string;
  recommendations: Array<{ title: string; why: string; action: string }>;
  created_at: string;
};

export type LiveDashboardPayload = {
  last_updated_at?: string | null;
  sessions?: SessionRow[];
  latest_ai?: SessionAiInsight | null;
};

function computeSignature(p: LiveDashboardPayload | null) {
  if (!p) return "";
  const s = p.sessions ?? [];
  const per = s
    .map((x) => `${x.id}:${x.status ?? ""}:${x.last_evidence_at ?? ""}:${x.activities_done ?? 0}:${x.evidence_items ?? 0}`)
    .join("|");
  return `${p.last_updated_at ?? ""}::${p.latest_ai?.created_at ?? ""}::${s.length}::${per}`;
}

// Global in-memory cache per clubId so multiple islands don’t refetch
const CACHE = new Map<
  string,
  {
    payload: LiveDashboardPayload | null;
    sig: string;
    listeners: Set<(p: LiveDashboardPayload | null) => void>;
    timer?: number | null;
    channel?: any;
    inflight?: boolean;
  }
>();

async function fetchAndBroadcast(args: {
  clubId: string;
  supabase: any;
  checking: boolean;
  silent?: boolean;
}) {
  const { clubId, supabase, checking } = args;
  if (checking) return;

  const entry = CACHE.get(clubId);
  if (!entry || entry.inflight) return;

  entry.inflight = true;

  try {
    const { data, error } = await supabase.rpc("get_today_live_dashboard", {
      p_club_id: clubId,
    });

    if (error || !data) return;

    const payload = data as LiveDashboardPayload;
    const nextSig = computeSignature(payload);

    if (nextSig === entry.sig) return;

    entry.payload = payload;
    entry.sig = nextSig;

    for (const fn of entry.listeners) fn(payload);
  } finally {
    entry.inflight = false;
  }
}

export function useLiveDashboard(clubId: string) {
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  const [payload, setPayload] = useState<LiveDashboardPayload | null>(() => {
    const entry = CACHE.get(clubId);
    return entry?.payload ?? null;
  });

  const [booting, setBooting] = useState(() => {
    const entry = CACHE.get(clubId);
    return !entry?.payload;
  });

  const [refreshing, setRefreshing] = useState(false);

  // register cache entry once per clubId
  useEffect(() => {
    if (!clubId) return;

    if (!CACHE.has(clubId)) {
      CACHE.set(clubId, {
        payload: null,
        sig: "",
        listeners: new Set(),
        timer: null,
        channel: null,
        inflight: false,
      });
    }

    const entry = CACHE.get(clubId)!;
    const listener = (p: LiveDashboardPayload | null) => {
      startTransition(() => setPayload(p));
    };

    entry.listeners.add(listener);

    return () => {
      entry.listeners.delete(listener);
    };
  }, [clubId]);

  // start polling + realtime once (per clubId)
  useEffect(() => {
    if (!clubId) return;
    const entry = CACHE.get(clubId)!;

    // initial fetch (only once)
    (async () => {
      setRefreshing(true);
      await fetchAndBroadcast({ clubId, supabase, checking });
      setRefreshing(false);
      setBooting(false);
    })();

    // polling (once)
    if (!entry.timer) {
      entry.timer = window.setInterval(async () => {
        setRefreshing(true);
        await fetchAndBroadcast({ clubId, supabase, checking, silent: true });
        setRefreshing(false);
      }, 25000);
    }

    // realtime (once)
    if (!entry.channel) {
      const ch = supabase.channel(`rt:today_live_dashboard:${clubId}`);

      const debounced = (() => {
        let t: number | null = null;
        return () => {
          if (t) window.clearTimeout(t);
          t = window.setTimeout(async () => {
            setRefreshing(true);
            await fetchAndBroadcast({ clubId, supabase, checking, silent: true });
            setRefreshing(false);
          }, 650);
        };
      })();

      ch.on("postgres_changes", { event: "*", schema: "public", table: "sessions", filter: `club_id=eq.${clubId}` }, debounced);
      ch.on("postgres_changes", { event: "*", schema: "public", table: "session_participants", filter: `club_id=eq.${clubId}` }, debounced);
      ch.on("postgres_changes", { event: "*", schema: "public", table: "session_evidence", filter: `club_id=eq.${clubId}` }, debounced);
      ch.on("postgres_changes", { event: "*", schema: "public", table: "session_activities", filter: `club_id=eq.${clubId}` }, debounced);
      ch.on("postgres_changes", { event: "*", schema: "public", table: "session_ai_insights", filter: `club_id=eq.${clubId}` }, debounced);

      ch.subscribe();
      entry.channel = ch;
    }

    return () => {
      // DO NOT clear timer/channel here (islands can mount/unmount).
      // Keep a single live pipeline while user is on the route.
      // Optional: implement ref-count cleanup later.
    };
  }, [clubId, supabase, checking]);

  const sessions = useMemo(() => payload?.sessions ?? [], [payload]);
  const latestAi = useMemo(() => payload?.latest_ai ?? null, [payload]);
  const lastUpdatedAt = useMemo(() => payload?.last_updated_at ?? null, [payload]);

  return { payload, sessions, latestAi, lastUpdatedAt, booting, refreshing };
}
