// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/QualityChecklistPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminGuard } from "@/lib/admin/admin-guard";

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

type ChecklistItem = {
  key: string;
  title: string;
  desc: string;
  stage: "before" | "during" | "after";
};

type DbRow = {
  club_id: string;
  item_key: string;
  is_done: boolean;
  updated_at: string;
  updated_by: string | null;
};

function stageTone(stage: ChecklistItem["stage"]) {
  if (stage === "before") return "border-indigo-200/80 bg-indigo-50/70 text-indigo-950";
  if (stage === "during") return "border-emerald-200/80 bg-emerald-50/70 text-emerald-950";
  return "border-slate-200/80 bg-slate-50/70 text-slate-800";
}

function stageLabel(stage: ChecklistItem["stage"]) {
  if (stage === "before") return "Before";
  if (stage === "during") return "During";
  return "After";
}

export default function QualityChecklistPanel({ clubId }: { clubId: string }) {
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  // ✅ define once (stable list)
  const items: ChecklistItem[] = useMemo(
    () => [
      {
        key: "session_created",
        stage: "before",
        title: "Create the session (so it appears in the timetable)",
        desc: "Keeps the week organised for staff and parents.",
      },
      {
        key: "checklist_added",
        stage: "before",
        title: "Add a simple plan (4–6 checklist items)",
        desc: "Example: warm-up → build → test → improve → demo → wrap-up.",
      },
      {
        key: "attendance_recorded",
        stage: "during",
        title: "Record who attended",
        desc: "Makes reports accurate and supports parent updates.",
      },
      {
        key: "evidence_captured",
        stage: "during",
        title: "Capture evidence early (1 photo + 1 short note)",
        desc: "Gives you proof for parents and better summaries later.",
      },
      {
        key: "session_closed",
        stage: "after",
        title: "Close the session when finished",
        desc: "So it shows correctly in reports (not stuck as ‘running’).",
      },
    ],
    []
  );

  // saved states (per club)
  const [map, setMap] = useState<Record<string, boolean>>({});
  const [booting, setBooting] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // per-item saving indicator
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Load from DB
  useEffect(() => {
    if (!clubId) return;
    if (!supabase) return;
    if (checking) return;

    let cancelled = false;

    (async () => {
      setBooting(true);
      setErr(null);

      try {
        const res = await supabase
          .from("club_ops_checklist")
          .select("club_id, item_key, is_done, updated_at, updated_by")
          .eq("club_id", clubId);

        if (res.error) throw res.error;

        if (cancelled) return;

        const next: Record<string, boolean> = {};
        for (const r of (res.data ?? []) as DbRow[]) {
          next[r.item_key] = !!r.is_done;
        }
        setMap(next);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to load checklist.");
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, supabase, checking]);

  const doneCount = useMemo(() => {
    return items.reduce((acc, it) => acc + (map[it.key] ? 1 : 0), 0);
  }, [items, map]);

  const totalCount = items.length;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  const status =
    pct >= 90 ? "✅ Healthy" : pct >= 60 ? "✅ Mostly ready" : "⚠️ Missing basics";

  async function toggle(itemKey: string, nextValue: boolean) {
    if (checking) {
      setErr("Auth/session still checking. Try again in a moment.");
      return;
    }
    if (!supabase) {
      setErr("Supabase client not ready yet. Refresh and try again.");
      return;
    }

    setErr(null);
    setSavingKey(itemKey);

    // Optimistic UI
    setMap((prev) => ({ ...prev, [itemKey]: nextValue }));

    try {
      const { error } = await supabase
        .from("club_ops_checklist")
        .upsert(
          {
            club_id: clubId,
            item_key: itemKey,
            is_done: nextValue,
            updated_at: new Date().toISOString(),
            // updated_by is optional; if you have auth.uid() default/trigger you can remove
          },
          { onConflict: "club_id,item_key" }
        );

      if (error) throw error;
    } catch (e: any) {
      // rollback
      setMap((prev) => ({ ...prev, [itemKey]: !nextValue }));
      setErr(e?.message ?? "Failed to save. Please try again.");
    } finally {
      setSavingKey(null);
    }
  }

  function resetAll() {
    // UI-first reset (optional): set all to false, then persist best-effort
    const next: Record<string, boolean> = {};
    for (const it of items) next[it.key] = false;

    setMap(next);

    // best-effort persist
    (async () => {
      if (!supabase) return;
      try {
        const payload = items.map((it) => ({
          club_id: clubId,
          item_key: it.key,
          is_done: false,
          updated_at: new Date().toISOString(),
        }));
        await supabase.from("club_ops_checklist").upsert(payload, { onConflict: "club_id,item_key" });
      } catch {
        // silent; it will reload later anyway
      }
    })();
  }

  const grouped = useMemo(() => {
    const out: Record<ChecklistItem["stage"], ChecklistItem[]> = {
      before: [],
      during: [],
      after: [],
    };
    for (const it of items) out[it.stage].push(it);
    return out;
  }, [items]);

  if (booting) {
    return <div className="h-[280px] rounded-[26px] border border-slate-200/70 bg-white/60 animate-pulse" />;
  }

  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.08),transparent_55%)] px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Health check</div>
            <div className="mt-0.5 text-xs text-slate-600">
              Tick what you’ve done. This is saved per club.
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              {status} • {pct}%
            </span>
            <span className="text-[11px] text-slate-600">
              {doneCount}/{totalCount} completed
            </span>
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full border border-slate-200 bg-white/70">
          <div className="h-full bg-slate-900" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {err ? (
          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-sm text-rose-950">
            {err}
          </div>
        ) : null}

        {(["before", "during", "after"] as const).map((stage) => {
          const list = grouped[stage];
          const stageDone = list.filter((it) => !!map[it.key]).length;
          const stagePct = list.length ? Math.round((stageDone / list.length) * 100) : 0;

          return (
            <div
              key={stage}
              className="rounded-2xl border border-slate-200/70 bg-white/60 overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 bg-white/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-slate-900">
                    {stageLabel(stage)}
                  </div>
                  <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", stageTone(stage))}>
                    {stagePct}% done
                  </span>
                </div>

                <span className="text-[11px] text-slate-600">
                  {stageDone}/{list.length}
                </span>
              </div>

              <div className="divide-y divide-slate-200/70">
                {list.map((it) => {
                  const done = !!map[it.key];
                  const busy = savingKey === it.key;

                  return (
                    <label
                      key={it.key}
                      className={cx(
                        "block px-4 py-3 cursor-pointer",
                        busy ? "opacity-70" : ""
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={done}
                          disabled={busy}
                          onChange={(e) => toggle(it.key, e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-slate-300"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm font-semibold text-slate-900">{it.title}</div>
                            <span
                              className={cx(
                                "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                done
                                  ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-950"
                                  : "border-amber-200/80 bg-amber-50/70 text-amber-950"
                              )}
                            >
                              {done ? "✅ Done" : "⚠️ Missing"}
                            </span>
                            {busy ? (
                              <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                Saving…
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1 text-xs text-slate-600">{it.desc}</div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-slate-600">
            Tip: aim for <span className="font-semibold text-slate-900">80%+</span> before the week ends.
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-white transition"
          >
            Reset all
          </button>
        </div>
      </div>
    </div>
  );
}
