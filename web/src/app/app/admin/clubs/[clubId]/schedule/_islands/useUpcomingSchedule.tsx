// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/useUpcomingSchedule.tsx

"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { useAdminGuard } from "@/lib/admin/admin-guard";

export type SessionStatus = "planned" | "open" | "closed";

export type ScheduleSessionRow = {
  id: string;
  club_id: string;
  title: string | null;
  starts_at: string | null;
  duration_minutes: number | null;
  status?: SessionStatus | null;
  activities_total?: number | null;
  evidence_items?: number | null;
  participants?: number | null;

  // client-only flags
  __optimistic?: boolean;
};

type CacheEntry = {
  rows: ScheduleSessionRow[];
  sig: string;
  listeners: Set<(rows: ScheduleSessionRow[]) => void>;
  inflight?: boolean;
  lastFetchedAt?: number | null;
};

const CACHE = new Map<string, CacheEntry>();

function computeSig(rows: ScheduleSessionRow[]) {
  return rows
    .map(
      (r) =>
        `${r.id}:${r.starts_at ?? ""}:${r.status ?? ""}:${r.duration_minutes ?? ""}:${r.title ?? ""}:${r.__optimistic ? "1" : "0"}`
    )
    .join("|");
}

function ensureEntry(clubId: string) {
  if (!CACHE.has(clubId)) {
    CACHE.set(clubId, { rows: [], sig: "", listeners: new Set(), inflight: false, lastFetchedAt: null });
  }
  return CACHE.get(clubId)!;
}

function broadcast(clubId: string) {
  const entry = ensureEntry(clubId);
  for (const fn of entry.listeners) fn(entry.rows);
}

function upsertSorted(rows: ScheduleSessionRow[]) {
  // deterministic: sort by starts_at ascending; optimistic rows included
  return [...rows].sort((a, b) => {
    const ta = a.starts_at ? new Date(a.starts_at).getTime() : 0;
    const tb = b.starts_at ? new Date(b.starts_at).getTime() : 0;
    if (ta !== tb) return ta - tb;
    // optimistic after real if same time
    if (!!a.__optimistic !== !!b.__optimistic) return a.__optimistic ? 1 : -1;
    return a.id.localeCompare(b.id);
  });
}

async function fetchNext7Days(clubId: string, supabase: any) {
  const entry = ensureEntry(clubId);
  if (entry.inflight) return;

  entry.inflight = true;
  try {
    // Range: [now-12h, now+7d+12h] to avoid edge/DST weirdness
    const now = new Date();
    const start = new Date(now);
    start.setHours(now.getHours() - 12);
    const end = new Date(now);
    end.setDate(now.getDate() + 7);
    end.setHours(now.getHours() + 12);

    const { data, error } = await supabase
      .from("sessions")
      .select("id, club_id, title, starts_at, duration_minutes, status")
      .eq("club_id", clubId)
      .gte("starts_at", start.toISOString())
      .lte("starts_at", end.toISOString())
      .order("starts_at", { ascending: true });

    if (error) return;

    // Merge: keep optimistic rows that are not yet confirmed
    const optimistic = entry.rows.filter((r) => r.__optimistic);
    const real = (data ?? []) as ScheduleSessionRow[];

    // Avoid duplicates: if a real row has same id as optimistic (shouldn't), real wins
    const merged = upsertSorted([
      ...real.map((r) => ({ ...r, __optimistic: false })),
      ...optimistic.filter((o) => !real.some((rr) => rr.id === o.id)),
    ]);

    const sig = computeSig(merged);
    if (sig === entry.sig) return;

    entry.rows = merged;
    entry.sig = sig;
    entry.lastFetchedAt = Date.now();
    broadcast(clubId);
  } finally {
    entry.inflight = false;
  }
}

// Public optimistic ops
export function addOptimisticSession(clubId: string, row: ScheduleSessionRow) {
  const entry = ensureEntry(clubId);
  entry.rows = upsertSorted([{ ...row, __optimistic: true }, ...entry.rows]);
  entry.sig = computeSig(entry.rows);
  broadcast(clubId);
}

export function confirmOptimisticSession(clubId: string, tempId: string, realRow: ScheduleSessionRow) {
  const entry = ensureEntry(clubId);
  const next = entry.rows
    .filter((r) => r.id !== tempId) // remove temp
    .concat([{ ...realRow, __optimistic: false }]);

  entry.rows = upsertSorted(next);
  entry.sig = computeSig(entry.rows);
  broadcast(clubId);
}

export function revertOptimisticSession(clubId: string, tempId: string) {
  const entry = ensureEntry(clubId);
  entry.rows = entry.rows.filter((r) => r.id !== tempId);
  entry.sig = computeSig(entry.rows);
  broadcast(clubId);
}

export function useUpcomingSchedule(clubId: string) {
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  const [rows, setRows] = useState<ScheduleSessionRow[]>(() => ensureEntry(clubId).rows);
  const [booting, setBooting] = useState(() => ensureEntry(clubId).rows.length === 0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!clubId) return;

    const entry = ensureEntry(clubId);
    const listener = (nextRows: ScheduleSessionRow[]) => startTransition(() => setRows(nextRows));
    entry.listeners.add(listener);

    return () => {
      entry.listeners.delete(listener);
    };
  }, [clubId]);

  useEffect(() => {
    if (!clubId || checking) return;

    // initial fetch (once per mount)
    (async () => {
      setRefreshing(true);
      await fetchNext7Days(clubId, supabase);
      setRefreshing(false);
      setBooting(false);
    })();
  }, [clubId, supabase, checking]);

  // ... inside useUpcomingSchedule hook

  const computed = useMemo(() => {
    // next 7 days only (client guard)
    const now = Date.now();
    const end = new Date();
    end.setDate(end.getDate() + 7);
    const endTs = end.getTime();

    const filtered = rows.filter((r) => {
      if (!r.starts_at) return false;
      const t = new Date(r.starts_at).getTime();
      // Logic: From 24 hours ago until 7 days from now
      return t >= now - 1000 * 60 * 60 * 24 && t <= endTs + 1000 * 60 * 60 * 24;
    });

    return { next7Days: filtered }; // Rename key from 'rows' to 'next7Days'
  }, [rows]);

  return {
    rows, // Original unfiltered rows from state
    next7Days: computed.next7Days, // The filtered 7-day view
    booting,
    refreshing,
    refetch: () => fetchNext7Days(clubId, supabase)
  };

}
