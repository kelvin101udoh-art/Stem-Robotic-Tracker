// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/UpcomingSchedule.tsx
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { useAdminGuard } from "@/lib/admin/admin-guard";
import {
  useUpcomingSchedule,
  optimisticUpdateSessionStatus,
  rollbackSessionStatus,
  SessionStatus,
} from "./useUpcomingSchedule";

type DrawerMode = "edit" | "cancel" | null;

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function labelTodayTomorrow(d: Date) {
  const today = startOfDayLocal(new Date());
  const target = startOfDayLocal(d);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return null;
}

function fmtDay(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
}

function fmtTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function statusChip(status?: string | null) {
  const k = status ?? "planned";
  if (k === "open")
    return "border-emerald-200/80 bg-emerald-50/70 text-emerald-950";
  if (k === "closed")
    return "border-slate-200/80 bg-slate-50/70 text-slate-800";
  return "border-indigo-200/80 bg-indigo-50/70 text-indigo-950";
}

function opsQualityForDay(
  rows: Array<{
    status?: string | null;
    participants?: number | null;
    evidence_items?: number | null;
    activities_total?: number | null;
  }>
) {
  if (!rows.length) {
    return {
      label: "NO PLAN",
      cls: "border-slate-200/80 bg-white/70 text-slate-700",
      score: 0,
    };
  }

  const total = rows.length;
  const open = rows.filter((r) => (r.status ?? "planned") === "open").length;
  const withEvidence = rows.filter((r) => (r.evidence_items ?? 0) > 0).length;
  const withChecklist = rows.filter((r) => (r.activities_total ?? 0) > 0).length;
  const withPeople = rows.filter((r) => (r.participants ?? 0) > 0).length;

  const score = Math.max(
    0,
    Math.min(
      1,
      0.35 * (open / total) +
        0.25 * (withEvidence / total) +
        0.25 * (withChecklist / total) +
        0.15 * (withPeople / total)
    )
  );

  if (score >= 0.75)
    return {
      label: "OPS READY",
      cls: "border-emerald-200/80 bg-emerald-50/70 text-emerald-950",
      score,
    };
  if (score >= 0.45)
    return {
      label: "PARTIAL",
      cls: "border-indigo-200/80 bg-indigo-50/70 text-indigo-950",
      score,
    };
  return {
    label: "LOW SIGNAL",
    cls: "border-rose-200/80 bg-rose-50/70 text-rose-950",
    score,
  };
}

function SkeletonMicroCharts() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold tracking-widest text-slate-500">
          LIVE PLACEHOLDERS
        </div>
        <span className="rounded-full border border-slate-200/80 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
          UI-only
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3"
          >
            <div className="h-3 w-28 rounded bg-slate-200/70 animate-pulse" />
            <div className="mt-3 flex items-end gap-1">
              {Array.from({ length: 10 }).map((__, j) => (
                <div
                  key={j}
                  className="w-2 rounded bg-slate-200/70 animate-pulse"
                  style={{ height: `${10 + (i + 2) * (j % 5)}px` }}
                />
              ))}
            </div>
            <div className="mt-3 h-2 w-40 rounded bg-slate-200/60 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Drawer(props: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={props.onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-[520px] border-l border-slate-200/70 bg-white/85 backdrop-blur-xl shadow-[0_24px_80px_-56px_rgba(2,6,23,0.55)]">
        <div className="border-b border-slate-200/70 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">
              {props.title}
            </div>
            <button
              onClick={props.onClose}
              className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-white transition"
              type="button"
            >
              Close
            </button>
          </div>
        </div>
        <div className="p-5">{props.children}</div>
      </div>
    </div>
  );
}

// datetime-local helpers
function isoToLocalInputValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function localInputValueToIso(v: string) {
  const d = new Date(v); // treats input as local
  if (!Number.isFinite(d.getTime())) throw new Error("Invalid date/time");
  return d.toISOString();
}

function computeAutoBadges(s: {
  starts_at?: string | null;
  duration_minutes?: number | null;
  status?: string | null;
}) {
  const status = (s.status ?? "planned") as SessionStatus;
  const startsAt = s.starts_at ? new Date(s.starts_at).getTime() : null;
  const dur = Number(s.duration_minutes ?? 60);
  const now = Date.now();

  if (!startsAt) return { badge: null as null | "AUTO-OPEN" | "AUTO-CLOSE" };

  const endsAt = startsAt + Math.max(0, dur) * 60000;

  // If planned but already past start time -> should be auto-opened by backend job
  if (status === "planned" && now >= startsAt) return { badge: "AUTO-OPEN" as const };

  // If open but already past end time -> should be auto-closed by backend job
  if (status === "open" && now >= endsAt) return { badge: "AUTO-CLOSE" as const };

  return { badge: null };
}

export default function UpcomingSchedule({ clubId }: { clubId: string }) {
  const { rows, booting, refetch } = useUpcomingSchedule(clubId);
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // action states
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Edit form states (backend-wired)
  const [editTitle, setEditTitle] = useState("");
  const [editDuration, setEditDuration] = useState<number>(60);
  const [editStartsLocal, setEditStartsLocal] = useState<string>("");
  const [editSaving, setEditSaving] = useState(false);

  const selectedSession = useMemo(() => {
    if (!selectedId) return null;
    return rows.find((r) => r.id === selectedId) ?? null;
  }, [rows, selectedId]);

  // auto-clear errors
  useEffect(() => {
    if (!actionErr) return;
    const t = window.setTimeout(() => setActionErr(null), 4500);
    return () => window.clearTimeout(t);
  }, [actionErr]);

  function openDrawer(mode: DrawerMode, id: string) {
    setSelectedId(id);
    setDrawerMode(mode);

    if (mode === "edit") {
      const s = rows.find((r) => r.id === id);
      setEditTitle(s?.title ?? "");
      setEditDuration(Number(s?.duration_minutes ?? 60));
      setEditStartsLocal(isoToLocalInputValue(s?.starts_at ?? null));
    }
  }

  // Status update via your RPC (used only for Cancel now)
  async function setStatusAtomic(sessionId: string, nextStatus: SessionStatus) {
    if (checking) {
      setActionErr("Auth/session still checking. Try again in a moment.");
      return;
    }
    if (!supabase) {
      setActionErr("Supabase client not ready yet. Refresh and try again.");
      return;
    }

    const prev: SessionStatus =
      ((rows.find((r) => r.id === sessionId)?.status ?? "planned") as SessionStatus) ??
      "planned";

    setActionErr(null);
    setActionBusyId(sessionId);

    // optimistic flip
    optimisticUpdateSessionStatus(clubId, sessionId, nextStatus);

    try {
      const { data, error } = await supabase.rpc("set_session_status", {
        p_club_id: clubId,
        p_session_id: sessionId,
        p_status: nextStatus,
      });

      if (error || !data) {
        rollbackSessionStatus(clubId, sessionId, prev);
        setActionErr(error?.message ?? "Failed to update status.");
        return;
      }

      await refetch?.();
    } catch (e: any) {
      rollbackSessionStatus(clubId, sessionId, prev);
      setActionErr(e?.message ?? "Failed to update status.");
    } finally {
      setActionBusyId(null);
    }
  }

  // Edit: backend write (sessions.update)
  async function saveEdit() {
    if (!selectedSession || !selectedId) return;

    if (checking) {
      setActionErr("Auth/session still checking. Try again in a moment.");
      return;
    }
    if (!supabase) {
      setActionErr("Supabase client not ready yet. Refresh and try again.");
      return;
    }

    setActionErr(null);
    setEditSaving(true);

    try {
      const cleanTitle = editTitle.trim();
      if (!cleanTitle) {
        setActionErr("Title is required.");
        return;
      }
      if (!Number.isFinite(editDuration) || editDuration < 15) {
        setActionErr("Duration must be at least 15 minutes.");
        return;
      }
      if (!editStartsLocal) {
        setActionErr("Start date/time is required.");
        return;
      }

      const starts_at = localInputValueToIso(editStartsLocal);

      const { error } = await supabase
        .from("sessions")
        .update({
          title: cleanTitle,
          duration_minutes: editDuration,
          starts_at,
        })
        .eq("club_id", clubId)
        .eq("id", selectedId);

      if (error) {
        setActionErr(error.message ?? "Failed to update session.");
        return;
      }

      await refetch?.();
      setDrawerMode(null);
    } catch (e: any) {
      setActionErr(e?.message ?? "Failed to update session.");
    } finally {
      setEditSaving(false);
    }
  }

  const rangeDays = useMemo(() => {
    const base = startOfDayLocal(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
  }, []);

  const grouped = useMemo(() => {
    const byDay = new Map<string, typeof rows>();
    for (const d of rangeDays) byDay.set(startOfDayLocal(d).toISOString(), []);
    for (const r of rows) {
      const dt = r.starts_at
        ? startOfDayLocal(new Date(r.starts_at)).toISOString()
        : null;
      if (dt && byDay.has(dt)) byDay.get(dt)!.push(r);
    }
    for (const [k, list] of byDay) {
      list.sort(
        (a, b) =>
          new Date(a.starts_at ?? 0).getTime() -
          new Date(b.starts_at ?? 0).getTime()
      );
      byDay.set(k, list);
    }
    return byDay;
  }, [rows, rangeDays]);

  const anyInNext7 = useMemo(() => {
    for (const d of rangeDays) {
      const k = startOfDayLocal(d).toISOString();
      if ((grouped.get(k) ?? []).length) return true;
    }
    return false;
  }, [grouped, rangeDays]);

  if (booting) {
    return (
      <div className="h-[420px] rounded-[26px] border border-slate-200/70 bg-white/60 animate-pulse" />
    );
  }

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(1000px_260px_at_10%_0%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(900px_240px_at_90%_0%,rgba(34,211,238,0.08),transparent_55%)] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">
              Upcoming Schedule
            </div>
            <div className="mt-0.5 text-xs text-slate-600">
              Enterprise-grade automation: sessions are planned → auto-open at start time → auto-close at end time (backend scheduler). UI has no manual Open.
            </div>
          </div>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-700">
            Live
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-4">
        {actionErr ? (
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-sm text-rose-950">
            {actionErr}
          </div>
        ) : null}

        {!anyInNext7 ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5">
              <div className="text-xs font-semibold tracking-widest text-slate-500">
                EMPTY
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">
                No sessions in the next 7 days
              </div>
              <div className="mt-1 text-sm text-slate-700">
                Create a session to populate this schedule view.
              </div>
            </div>
            <SkeletonMicroCharts />
          </div>
        ) : (
          <div className="space-y-4">
            {rangeDays.map((day, idx) => {
              const key = startOfDayLocal(day).toISOString();
              const list = grouped.get(key) ?? [];
              const dayLabel = labelTodayTomorrow(day);
              const weekSep =
                idx > 0 && day.getDay() === 1 && !isSameDay(rangeDays[idx - 1], day);

              const quality = opsQualityForDay(list);

              return (
                <div key={key} className="space-y-2">
                  {weekSep ? (
                    <div className="flex items-center gap-3 pt-2">
                      <div className="h-px flex-1 bg-slate-200/70" />
                      <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-700">
                        New week
                      </span>
                      <div className="h-px flex-1 bg-slate-200/70" />
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900">
                        {fmtDay(day)}
                      </div>
                      {dayLabel ? (
                        <span className="rounded-full border border-indigo-200/80 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-950">
                          {dayLabel}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cx(
                          "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                          quality.cls
                        )}
                      >
                        {quality.label}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        Sessions: <span className="text-slate-900">{list.length}</span>
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/60 overflow-hidden">
                    {list.length ? (
                      <div className="divide-y divide-slate-200/70">
                        {list.map((s) => {
                          const { badge } = computeAutoBadges(s);

                          return (
                            <div key={s.id} className="px-4 py-3 sm:px-5">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={cx(
                                        "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                        statusChip(s.status)
                                      )}
                                    >
                                      {(s.status ?? "planned").toUpperCase()}
                                    </span>

                                    {badge ? (
                                      <span
                                        className={cx(
                                          "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                          badge === "AUTO-OPEN"
                                            ? "border-amber-200/80 bg-amber-50/70 text-amber-950"
                                            : "border-rose-200/80 bg-rose-50/70 text-rose-950"
                                        )}
                                      >
                                        {badge}
                                      </span>
                                    ) : null}

                                    {s.__optimistic ? (
                                      <span className="rounded-full border border-amber-200/80 bg-amber-50/70 px-2.5 py-1 text-[11px] font-semibold text-amber-950">
                                        PENDING
                                      </span>
                                    ) : null}

                                    <div className="truncate text-sm font-semibold text-slate-900">
                                      {s.title || "Untitled session"}
                                    </div>
                                  </div>

                                  <div className="mt-1 text-xs text-slate-600">
                                    {fmtTime(s.starts_at)} • {s.duration_minutes ?? 60}m
                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                                      Participants:{" "}
                                      <span className="text-slate-900">
                                        {s.participants ?? 0}
                                      </span>
                                    </span>
                                    <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                                      Evidence:{" "}
                                      <span className="text-slate-900">
                                        {s.evidence_items ?? 0}
                                      </span>
                                    </span>
                                    <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                                      Checklist:{" "}
                                      <span className="text-slate-900">
                                        {s.activities_total ?? 0}
                                      </span>
                                    </span>
                                  </div>
                                </div>

                                {/* Actions: Edit + Cancel only */}
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    onClick={() => openDrawer("edit", s.id)}
                                    className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
                                    type="button"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    onClick={() => openDrawer("cancel", s.id)}
                                    className="rounded-xl border border-rose-200/80 bg-rose-50/70 px-3 py-2 text-xs font-semibold text-rose-950 hover:bg-rose-50 transition"
                                    type="button"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-5 py-4 text-sm text-slate-700">
                        No sessions planned for this day.
                        <div className="mt-1 text-xs text-slate-600">
                          Use “New session” to add one.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drawer: Edit (backend write) */}
      <Drawer
        open={drawerMode === "edit"}
        title="Edit session"
        onClose={() => setDrawerMode(null)}
      >
        <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
          <div className="text-xs text-slate-600">
            Selected session:{" "}
            <span className="font-mono text-slate-900">{selectedId ?? "—"}</span>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-700">Title</div>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Session title"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-slate-700">
                  Start (local)
                </div>
                <input
                  type="datetime-local"
                  value={editStartsLocal}
                  onChange={(e) => setEditStartsLocal(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700">
                  Duration (min)
                </div>
                <input
                  type="number"
                  min={15}
                  step={5}
                  value={editDuration}
                  onChange={(e) =>
                    setEditDuration(Math.max(15, Number(e.target.value) || 0))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDrawerMode(null)}
                className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
              >
                Close
              </button>

              <button
                type="button"
                onClick={saveEdit}
                disabled={editSaving}
                className={cx(
                  "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                  editSaving
                    ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                    : "border-slate-900/10 bg-slate-900 text-white hover:bg-slate-800"
                )}
              >
                {editSaving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Drawer: Cancel (backend write: status -> closed) */}
      <Drawer
        open={drawerMode === "cancel"}
        title="Cancel session"
        onClose={() => setDrawerMode(null)}
      >
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-sm text-rose-950">
          This will mark the session as <span className="font-semibold">CLOSED</span>.
          <div className="mt-3 text-xs text-rose-900/80">
            Selected session: <span className="font-mono">{selectedId ?? "—"}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setDrawerMode(null)}
            className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
          >
            Keep session
          </button>

          <button
            type="button"
            onClick={async () => {
              if (!selectedId) return;
              await setStatusAtomic(selectedId, "closed");
              setDrawerMode(null);
            }}
            disabled={actionBusyId === selectedId}
            className={cx(
              "rounded-xl border px-3 py-2 text-xs font-semibold transition",
              actionBusyId === selectedId
                ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                : "border-rose-200/80 bg-rose-50/70 text-rose-950 hover:bg-rose-50"
            )}
          >
            {actionBusyId === selectedId ? "Cancelling…" : "Confirm cancel"}
          </button>
        </div>
      </Drawer>
    </div>
  );
}
