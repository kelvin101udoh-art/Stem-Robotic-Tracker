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

function statusLabel(status?: string | null) {
  const k = status ?? "planned";
  if (k === "open") return "In progress";
  if (k === "closed") return "Completed";
  return "Planned";
}

function statusChip(status?: string | null) {
  const k = status ?? "planned";
  if (k === "open") return "border-emerald-200/80 bg-emerald-50/70 text-emerald-950";
  if (k === "closed") return "border-slate-200/80 bg-slate-50/70 text-slate-800";
  return "border-indigo-200/80 bg-indigo-50/70 text-indigo-950";
}

/**
 * Simple “day readiness” signal a business owner can understand.
 * (Not “AI”, not “enterprise jargon”.)
 */
function dayReadiness(rows: Array<{ status?: string | null; activities_total?: number | null }>) {
  if (!rows.length) {
    return { label: "No sessions", cls: "border-slate-200/80 bg-white/70 text-slate-700" };
  }

  const total = rows.length;
  const inProgress = rows.filter((r) => (r.status ?? "planned") === "open").length;
  const withPlan = rows.filter((r) => (r.activities_total ?? 0) > 0).length;

  // Bias toward “do we have a plan and are we running on time?”
  const score = Math.max(0, Math.min(1, 0.6 * (withPlan / total) + 0.4 * (inProgress / total)));

  if (score >= 0.75) return { label: "Ready", cls: "border-emerald-200/80 bg-emerald-50/70 text-emerald-950" };
  if (score >= 0.45) return { label: "Partly ready", cls: "border-indigo-200/80 bg-indigo-50/70 text-indigo-950" };
  return { label: "Needs setup", cls: "border-rose-200/80 bg-rose-50/70 text-rose-950" };
}

function Drawer(props: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!props.open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={props.onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[560px] border-l border-slate-200/70 bg-white/90 backdrop-blur-xl shadow-[0_24px_80px_-56px_rgba(2,6,23,0.55)]">
        <div className="border-b border-slate-200/70 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">{props.title}</div>
            <button
              onClick={props.onClose}
              className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-white transition"
              type="button"
            >
              Close
            </button>
          </div>
        </div>
        <div className="p-5 overflow-auto h-[calc(100%-72px)]">{props.children}</div>
      </div>
    </div>
  );
}

// datetime-local helpers
function isoToLocalInputValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function localInputValueToIso(v: string) {
  const d = new Date(v); // input treated as local
  if (!Number.isFinite(d.getTime())) throw new Error("Invalid date/time");
  return d.toISOString();
}

export default function UpcomingSchedule({ clubId }: { clubId: string }) {
  const { rows, booting, refetch } = useUpcomingSchedule(clubId);
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // action states
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editDuration, setEditDuration] = useState<number>(60);
  const [editStartsLocal, setEditStartsLocal] = useState<string>("");
  const [editSaving, setEditSaving] = useState(false);

  const selectedSession = useMemo(() => {
    if (!selectedId) return null;
    return rows.find((r: any) => r.id === selectedId) ?? null;
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
      const s: any = rows.find((r: any) => r.id === id);
      setEditTitle(s?.title ?? "");
      setEditDuration(Number(s?.duration_minutes ?? 60));
      setEditStartsLocal(isoToLocalInputValue(s?.starts_at ?? null));
    }
  }

  // Status update via RPC (used for Cancel)
  async function setStatusAtomic(sessionId: string, nextStatus: SessionStatus) {
    if (checking) {
      setActionErr("Please wait — signing in is still completing.");
      return;
    }
    if (!supabase) {
      setActionErr("System is not ready yet. Refresh and try again.");
      return;
    }

    const prev: SessionStatus =
      (((rows.find((r: any) => r.id === sessionId)?.status ?? "planned") as SessionStatus) ?? "planned");

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
        setActionErr(error?.message ?? "Could not update the session.");
        return;
      }

      await refetch?.();
    } catch (e: any) {
      rollbackSessionStatus(clubId, sessionId, prev);
      setActionErr(e?.message ?? "Could not update the session.");
    } finally {
      setActionBusyId(null);
    }
  }

  // Edit: backend write
  async function saveEdit() {
    if (!selectedSession || !selectedId) return;

    if (checking) {
      setActionErr("Please wait — signing in is still completing.");
      return;
    }
    if (!supabase) {
      setActionErr("System is not ready yet. Refresh and try again.");
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
        setActionErr(error.message ?? "Could not save changes.");
        return;
      }

      await refetch?.();
      setDrawerMode(null);
    } catch (e: any) {
      setActionErr(e?.message ?? "Could not save changes.");
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
    const byDay = new Map<string, any[]>();
    for (const d of rangeDays) byDay.set(startOfDayLocal(d).toISOString(), []);
    for (const r of rows as any[]) {
      const dt = r.starts_at ? startOfDayLocal(new Date(r.starts_at)).toISOString() : null;
      if (dt && byDay.has(dt)) byDay.get(dt)!.push(r);
    }
    for (const [k, list] of byDay) {
      list.sort(
        (a, b) => new Date(a.starts_at ?? 0).getTime() - new Date(b.starts_at ?? 0).getTime()
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
    return <div className="h-[420px] rounded-[26px] border border-slate-200/70 bg-white/60 animate-pulse" />;
  }

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(1000px_260px_at_10%_0%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(900px_240px_at_90%_0%,rgba(34,211,238,0.08),transparent_55%)] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">This week’s timetable</div>
            <div className="mt-0.5 text-xs text-slate-600">
              Plan sessions ahead. Sessions change automatically as time passes (planned → in progress → completed).
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
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5">
            <div className="text-xs font-semibold tracking-widest text-slate-500">EMPTY</div>
            <div className="mt-2 text-sm font-semibold text-slate-900">No sessions planned in the next 7 days</div>
            <div className="mt-1 text-sm text-slate-700">
              Create a session to build your timetable for the week.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {rangeDays.map((day, idx) => {
              const key = startOfDayLocal(day).toISOString();
              const list = grouped.get(key) ?? [];
              const dayLabel = labelTodayTomorrow(day);

              const weekSep = idx > 0 && day.getDay() === 1 && !isSameDay(rangeDays[idx - 1], day);
              const readiness = dayReadiness(list);

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
                      <div className="text-sm font-semibold text-slate-900">{fmtDay(day)}</div>
                      {dayLabel ? (
                        <span className="rounded-full border border-indigo-200/80 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-950">
                          {dayLabel}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", readiness.cls)}
                        title="A simple signal based on whether sessions have a plan and are currently running"
                      >
                        {readiness.label}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        Sessions: <span className="text-slate-900">{list.length}</span>
                      </span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/80 bg-white/60 overflow-hidden">
                    {list.length ? (
                      <div className="divide-y divide-slate-200/70">
                        {list.map((s: any) => (
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
                                    {statusLabel(s.status).toUpperCase()}
                                  </span>

                                  {s.__optimistic ? (
                                    <span className="rounded-full border border-amber-200/80 bg-amber-50/70 px-2.5 py-1 text-[11px] font-semibold text-amber-950">
                                      Updating…
                                    </span>
                                  ) : null}

                                  <div className="truncate text-sm font-semibold text-slate-900">
                                    {s.title || "Untitled session"}
                                  </div>
                                </div>

                                <div className="mt-1 text-xs text-slate-600">
                                  {fmtTime(s.starts_at)} • {s.duration_minutes ?? 60} minutes
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                  <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                                    Participants: <span className="text-slate-900">{s.participants ?? 0}</span>
                                  </span>
                                  <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                                    Evidence items: <span className="text-slate-900">{s.evidence_items ?? 0}</span>
                                  </span>
                                  <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold text-slate-700">
                                    Checklist items: <span className="text-slate-900">{s.activities_total ?? 0}</span>
                                  </span>
                                </div>
                              </div>

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
                        ))}
                      </div>
                    ) : (
                      <div className="px-5 py-4 text-sm text-slate-700">
                        No sessions planned for this day.
                        <div className="mt-1 text-xs text-slate-600">Use “New session” to add one.</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drawer: Edit */}
      <Drawer open={drawerMode === "edit"} title="Edit session" onClose={() => setDrawerMode(null)}>
        <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
          <div className="text-xs text-slate-600">
            Session ID: <span className="font-mono text-slate-900">{selectedId ?? "—"}</span>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-700">Session title</div>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="e.g., Robotics build (Sensors)"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-slate-700">Start time</div>
                <input
                  type="datetime-local"
                  value={editStartsLocal}
                  onChange={(e) => setEditStartsLocal(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700">Duration (minutes)</div>
                <input
                  type="number"
                  min={15}
                  step={5}
                  value={editDuration}
                  onChange={(e) => setEditDuration(Math.max(15, Number(e.target.value) || 0))}
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

        <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 text-xs text-slate-700">
          Tip: Keeping titles consistent (e.g., “Week 3 – Sensors Build”) makes reports easier to understand later.
        </div>
      </Drawer>

      {/* Drawer: Cancel */}
      <Drawer open={drawerMode === "cancel"} title="Cancel session" onClose={() => setDrawerMode(null)}>
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-sm text-rose-950">
          This will mark the session as <span className="font-semibold">Completed</span> (cancelled).
          <div className="mt-3 text-xs text-rose-900/80">
            Session ID: <span className="font-mono">{selectedId ?? "—"}</span>
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
