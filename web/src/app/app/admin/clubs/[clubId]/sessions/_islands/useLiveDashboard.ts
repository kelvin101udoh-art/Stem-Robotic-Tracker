// web/src/app/app/admin/clubs/[clubId]/sessions/_islands/useLiveDashboard.ts
"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
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
  participants?: number; // high-level signal only (attendance has its own module)
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

function ymdLocal() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function storageKey(clubId: string) {
  // This is the key part that makes “Schedule home page” and “Sessions analytics page”
  // co-work: both pages can read the same stored snapshot instantly on load.
  return `stemtrack:today_live_dashboard:${clubId}:${ymdLocal()}`;
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function computeSignature(p: LiveDashboardPayload | null) {
  if (!p) return "";
  const s = p.sessions ?? [];
  const per = s
    .map(
      (x) =>
        `${x.id}:${x.status ?? ""}:${x.last_evidence_at ?? ""}:${x.activities_done ?? 0}:${x.evidence_items ?? 0}:${x.participants ?? 0}`
    )
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

function hydrateFromStorage(clubId: string) {
  try {
    const raw = window.localStorage.getItem(storageKey(clubId));
    const parsed = safeJsonParse<LiveDashboardPayload>(raw);
    return parsed;
  } catch {
    return null;
  }
}

function persistToStorage(clubId: string, payload: LiveDashboardPayload) {
  try {
    window.localStorage.setItem(storageKey(clubId), JSON.stringify(payload));
  } catch {
    // ignore
  }
}

async function fetchAndBroadcast(args: {
  clubId: string;
  supabase: any;
  checking: boolean;
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

    // ✅ Persist snapshot so other pages (e.g., schedule) can instantly load it too.
    persistToStorage(clubId, payload);

    for (const fn of entry.listeners) fn(payload);
  } finally {
    entry.inflight = false;
  }
}

export function useLiveDashboard(clubId: string) {
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  const [payload, setPayload] = useState<LiveDashboardPayload | null>(() => {
    const entry = CACHE.get(clubId);
    if (entry?.payload) return entry.payload;

    // If cache is empty (first visit on this route), hydrate from storage.
    // This is what makes “session_ai co-working” across pages feel instant.
    if (typeof window !== "undefined") {
      const stored = hydrateFromStorage(clubId);
      if (stored) return stored;
    }
    return null;
  });

  const [booting, setBooting] = useState(() => {
    const entry = CACHE.get(clubId);
    if (entry?.payload) return false;
    // If we have a stored snapshot, we are not booting (we can render immediately).
    if (typeof window !== "undefined") {
      const stored = hydrateFromStorage(clubId);
      return !stored;
    }
    return true;
  });

  const [refreshing, setRefreshing] = useState(false);

  // register cache entry once per clubId
  useEffect(() => {
    if (!clubId) return;

    if (!CACHE.has(clubId)) {
      // try to seed cache from storage
      const stored = typeof window !== "undefined" ? hydrateFromStorage(clubId) : null;
      const seeded = stored ?? null;

      CACHE.set(clubId, {
        payload: seeded,
        sig: computeSignature(seeded),
        listeners: new Set(),
        timer: null,
        channel: null,
        inflight: false,
      });
    }

    const entry = CACHE.get(clubId)!;

    // if this component has payload but cache doesn't, sync it
    if (!entry.payload && payload) {
      entry.payload = payload;
      entry.sig = computeSignature(payload);
    }

    const listener = (p: LiveDashboardPayload | null) => {
      startTransition(() => setPayload(p));
    };

    entry.listeners.add(listener);

    return () => {
      entry.listeners.delete(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  // start polling + realtime once (per clubId)
  useEffect(() => {
    if (!clubId) return;
    if (!supabase) return;

    const entry = CACHE.get(clubId)!;

    // initial fetch
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
        await fetchAndBroadcast({ clubId, supabase, checking });
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
            await fetchAndBroadcast({ clubId, supabase, checking });
            setRefreshing(false);
          }, 650);
        };
      })();

      // Sessions + proof + outcomes + AI insight.
      // Attendance has its own module, but we still listen to participant table
      // because the “engagement signal” number shown here depends on it.
      ch.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions", filter: `club_id=eq.${clubId}` },
        debounced
      );
      ch.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_participants", filter: `club_id=eq.${clubId}` },
        debounced
      );
      ch.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_evidence", filter: `club_id=eq.${clubId}` },
        debounced
      );
      ch.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_activities", filter: `club_id=eq.${clubId}` },
        debounced
      );
      ch.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "session_ai_insights", filter: `club_id=eq.${clubId}` },
        debounced
      );

      ch.subscribe();
      entry.channel = ch;
    }

    return () => {
      // Keep a single pipeline while user is navigating within the club area.
      // Optional: ref-count cleanup later.
    };
  }, [clubId, supabase, checking]);

  const sessions = useMemo(() => payload?.sessions ?? [], [payload]);
  const latestAi = useMemo(() => payload?.latest_ai ?? null, [payload]);
  const lastUpdatedAt = useMemo(() => payload?.last_updated_at ?? null, [payload]);

  return { payload, sessions, latestAi, lastUpdatedAt, booting, refreshing };
}
