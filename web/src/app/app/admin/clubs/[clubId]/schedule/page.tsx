"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminGuard } from "@/lib/admin/admin-guard";

import UpcomingSchedule from "./_islands/UpcomingSchedule";
import AiOpsCoachPanel from "./_islands/AiOpsCoachPanel";
import QualityChecklistPanel from "./_islands/QualityChecklistPanel";

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

function fmtDayHeader(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });
}

function todayTomorrowLabel(d: Date) {
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const b = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((b.getTime() - a.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return null;
}

function fmtRelative(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  const mins = Math.round(diff / 60000);
  const abs = Math.abs(mins);

  if (abs < 2) return "just now";
  if (abs < 60) return mins > 0 ? `in ${abs}m` : `${abs}m ago`;
  const hrs = Math.round(abs / 60);
  if (hrs < 48) return mins > 0 ? `in ${hrs}h` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return mins > 0 ? `in ${days}d` : `${days}d ago`;
}

type AiInsightRow = {
  id: string;
  club_id: string;
  period_start: string;
  period_end: string;
  source: "rules" | "azure";
  summary: string;
  created_at: string;
};

type NextSessionRow = {
  id: string;
  title: string | null;
  starts_at: string | null;
  status: string | null;
};

export default function ScheduleHomePage() {
  const { clubId } = useParams<{ clubId: string }>();
  const router = useRouter();
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/app/admin/clubs/${clubId}/schedule`;
  }, [clubId]);

  const now = useMemo(() => new Date(), []);
  const label = useMemo(() => todayTomorrowLabel(now), [now]);

  // ===== Live backend proof (RLS-gated reads) =====
  const [backendOk, setBackendOk] = useState<"idle" | "ok" | "err">("idle");
  const [backendErr, setBackendErr] = useState<string | null>(null);

  const [next7Count, setNext7Count] = useState<number | null>(null);
  const [nextSession, setNextSession] = useState<NextSessionRow | null>(null);

  const [latestInsight, setLatestInsight] = useState<AiInsightRow | null>(null);

  useEffect(() => {
    if (!clubId) return;
    if (!supabase) return;
    if (checking) return;

    let cancelled = false;

    (async () => {
      setBackendErr(null);
      setBackendOk("idle");

      try {
        const nowIso = new Date().toISOString();
        const in7 = new Date(Date.now() + 7 * 86400000).toISOString();

        // 1) Next upcoming session (RLS protected)
        const nextRes = await supabase
          .from("sessions")
          .select("id, title, starts_at, status")
          .eq("club_id", clubId)
          .gte("starts_at", nowIso)
          .order("starts_at", { ascending: true })
          .limit(1);

        if (nextRes.error) throw nextRes.error;

        // 2) Count of sessions next 7 days (cheap proof of backend)
        const countRes = await supabase
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .eq("club_id", clubId)
          .gte("starts_at", nowIso)
          .lte("starts_at", in7);

        if (countRes.error) throw countRes.error;

        // 3) Latest AI insight (RLS protected)
        // If you later want: filter by period_end >= now etc.
        const aiRes = await supabase
          .from("session_ai_insights")
          .select("id, club_id, period_start, period_end, source, summary, created_at")
          .eq("club_id", clubId)
          .order("created_at", { ascending: false })
          .limit(1);

        // NOTE: if your RLS currently blocks this table, you'll get an error here.
        // That's GOOD: it proves RLS is working; we surface it as "AI locked by RLS".
        if (aiRes.error) {
          // Don’t fail whole page; schedule still works even if AI is locked.
          // But show it clearly.
          if (!cancelled) {
            setLatestInsight(null);
            setBackendOk("ok");
            setBackendErr(`AI insight is locked by RLS (or no policy): ${aiRes.error.message}`);
          }
          return;
        }

        if (cancelled) return;

        setNextSession((nextRes.data?.[0] as any) ?? null);
        setNext7Count(countRes.count ?? 0);
        setLatestInsight((aiRes.data?.[0] as any) ?? null);

        setBackendOk("ok");
      } catch (e: any) {
        if (cancelled) return;
        setBackendOk("err");
        setBackendErr(e?.message ?? "Backend read failed.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, supabase, checking]);

  const backendChip =
    backendOk === "ok"
      ? { tone: "emerald", text: "Backend + RLS: OK" }
      : backendOk === "err"
        ? { tone: "rose", text: "Backend: Error" }
        : { tone: "neutral", text: checking ? "Auth: checking…" : "Backend: connecting…" };

  const chipCls =
    backendChip.tone === "emerald"
      ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-950"
      : backendChip.tone === "rose"
        ? "border-rose-200/80 bg-rose-50/70 text-rose-950"
        : "border-slate-200 bg-white/70 text-slate-700";

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Header frame */}
      <div className="mb-6 rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
        {/* Top band */}
        <div className="border-b border-slate-200/70 bg-[radial-gradient(1000px_260px_at_10%_0%,rgba(99,102,241,0.14),transparent_60%),radial-gradient(900px_240px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  Planner
                </span>

                <span
                  className={cx(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                    chipCls
                  )}
                  title={backendErr ?? "Live reads via Supabase + RLS"}
                >
                  {backendChip.text}
                </span>

                {label ? (
                  <span className="inline-flex items-center rounded-full border border-indigo-200/80 bg-indigo-50/70 px-2.5 py-1 text-[11px] font-semibold text-indigo-950">
                    {label}
                  </span>
                ) : null}

                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  {fmtDayHeader(now)}
                </span>
              </div>

              <div className="mt-2 text-sm font-semibold text-slate-900">Schedule Sessions</div>

              <div className="mt-0.5 text-xs text-slate-600">
                Plan sessions fast • Standardize outcomes with templates • Improve evidence + analytics quality
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(`/app/admin/clubs/${clubId}`)}
                className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
              >
                Back
              </button>

              <Link
                href={`/app/admin/clubs/${clubId}/schedule/create`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                New session
              </Link>

              <span
                className={cx(
                  "hidden md:inline-flex items-center rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700",
                  "max-w-[460px]"
                )}
                title={shareUrl || "Shareable schedule link"}
              >
                Shareable link:
                <span className="ml-2 truncate font-mono text-slate-900">
                  {shareUrl || "—"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Secondary strip (now LIVE, not static) */}
        <div className="px-5 py-4 sm:px-7">
          <div className="grid gap-3 md:grid-cols-3">
            {/* SYSTEM */}
            <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
              <div className="text-xs font-semibold tracking-widest text-slate-500">SYSTEM</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">Ops-first scheduling</div>
              <div className="mt-1 text-xs text-slate-600">
                Next 7 days:{" "}
                <span className="font-semibold text-slate-900">
                  {next7Count === null ? "—" : next7Count}
                </span>{" "}
                session(s)
              </div>

              <div className="mt-3 rounded-xl border border-slate-200/70 bg-white/70 p-3">
                <div className="text-[11px] font-semibold text-slate-700">Next session</div>
                <div className="mt-1 text-xs text-slate-600">
                  {nextSession?.starts_at ? (
                    <>
                      <span className="font-semibold text-slate-900">
                        {nextSession.title || "Untitled"}
                      </span>
                      <span className="mx-2 text-slate-400">•</span>
                      <span>{fmtRelative(nextSession.starts_at)}</span>
                    </>
                  ) : (
                    "No upcoming sessions found."
                  )}
                </div>
              </div>
            </div>

            {/* AI AUTOMATION */}
            <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
              <div className="text-xs font-semibold tracking-widest text-slate-500">AI AUTOMATION</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">Signal-driven insight</div>
              <div className="mt-1 text-xs text-slate-600">
                Latest insight:{" "}
                <span className="font-semibold text-slate-900">
                  {latestInsight?.created_at ? fmtRelative(latestInsight.created_at) : "—"}
                </span>
              </div>

              <div className="mt-3 rounded-xl border border-slate-200/70 bg-white/70 p-3">
                <div className="text-[11px] font-semibold text-slate-700">AI summary preview</div>
                <div className="mt-1 text-xs text-slate-600 line-clamp-3">
                  {latestInsight?.summary
                    ? latestInsight.summary
                    : backendErr?.includes("AI insight is locked")
                      ? "AI insights are protected by RLS (policy required)."
                      : "No insights yet — create sessions and evidence to generate insights."}
                </div>
              </div>
            </div>

            {/* ENTERPRISE FLOW */}
            <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
              <div className="text-xs font-semibold tracking-widest text-slate-500">ENTERPRISE FLOW</div>
              <div className="mt-2 text-sm font-semibold text-slate-900">Fast creation</div>
              <div className="mt-1 text-xs text-slate-600">
                Templates apply instantly • Optimistic schedule updates • Low friction ops.
              </div>

              <div className="mt-3 rounded-xl border border-slate-200/70 bg-white/70 p-3">
                <div className="text-[11px] font-semibold text-slate-700">Backend guarantees</div>
                <div className="mt-1 text-xs text-slate-600">
                  Session reads are RLS-gated (owner/member). Create flow remains atomic via RPC.
                </div>
              </div>
            </div>
          </div>

          {backendOk === "err" && backendErr ? (
            <div className="mt-3 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-xs text-rose-950">
              <div className="font-semibold">Backend status</div>
              <div className="mt-1">{backendErr}</div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left */}
        <div className="lg:col-span-8 space-y-6">
          <UpcomingSchedule clubId={clubId} />
        </div>

        {/* Right */}
        <div className="lg:col-span-4 space-y-6">
          <AiOpsCoachPanel clubId={clubId} />
          <QualityChecklistPanel />
        </div>
      </div>
    </div>
  );
}
