// web/src/app/app/admin/clubs/[clubId]/schedule/page.tsx

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
    year: "numeric",
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
  if (abs < 60) return mins > 0 ? `in ${abs} min` : `${abs} min ago`;
  const hrs = Math.round(abs / 60);
  if (hrs < 48) return mins > 0 ? `in ${hrs} hours` : `${hrs} hours ago`;
  const days = Math.round(hrs / 24);
  return mins > 0 ? `in ${days} days` : `${days} days ago`;
}

type AiInsightRow = {
  id: string;
  club_id: string;
  period_start: string;
  period_end: string;
  source: "rules" | "azure" | string;
  summary: string;
  created_at: string;
};

type NextSessionRow = {
  id: string;
  title: string | null;
  starts_at: string | null;
  status: string | null;
};

function Badge(props: { text: string; cls: string; title?: string }) {
  return (
    <span
      title={props.title}
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        props.cls
      )}
    >
      {props.text}
    </span>
  );
}

function StatTile(props: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-4">
      <div className="text-xs font-semibold tracking-widest text-slate-500">{props.label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{props.value}</div>
      {props.hint ? <div className="mt-1 text-xs text-slate-600">{props.hint}</div> : null}
    </div>
  );
}

function SectionCard(props: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200/70 bg-white/55 shadow-[0_24px_80px_-56px_rgba(2,6,23,0.45)] backdrop-blur-xl overflow-hidden">
      <div className="border-b border-slate-200/70 bg-[radial-gradient(1000px_260px_at_10%_0%,rgba(99,102,241,0.14),transparent_60%),radial-gradient(900px_240px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-5 py-5 sm:px-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">{props.title}</div>
            {props.subtitle ? <div className="mt-0.5 text-xs text-slate-600">{props.subtitle}</div> : null}
          </div>
          {props.right ? props.right : null}
        </div>
      </div>
      <div className="px-5 py-5 sm:px-7">{props.children}</div>
    </div>
  );
}

export default function ScheduleHomePage() {
  const { clubId } = useParams<{ clubId: string }>();
  const router = useRouter();
  const { supabase, checking } = useAdminGuard({ idleMinutes: 20 });

  const now = useMemo(() => new Date(), []);
  const dayTag = useMemo(() => todayTomorrowLabel(now), [now]);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/app/admin/clubs/${clubId}/schedule`;
  }, [clubId]);

  // Business-friendly health + highlights
  const [systemState, setSystemState] = useState<"connecting" | "ready" | "issue">("connecting");
  const [systemNote, setSystemNote] = useState<string | null>(null);

  const [next7Count, setNext7Count] = useState<number | null>(null);
  const [nextSession, setNextSession] = useState<NextSessionRow | null>(null);
  const [latestInsight, setLatestInsight] = useState<AiInsightRow | null>(null);

  const [copied, setCopied] = useState(false);

  async function copyShareLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!clubId) return;
    if (!supabase) return;
    if (checking) return;

    let cancelled = false;

    (async () => {
      setSystemState("connecting");
      setSystemNote(null);

      try {
        const nowIso = new Date().toISOString();
        const in7 = new Date(Date.now() + 7 * 86400000).toISOString();

        const [nextRes, countRes] = await Promise.all([
          supabase
            .from("sessions")
            .select("id, title, starts_at, status")
            .eq("club_id", clubId)
            .gte("starts_at", nowIso)
            .order("starts_at", { ascending: true })
            .limit(1),

          supabase
            .from("sessions")
            .select("id", { count: "exact", head: true })
            .eq("club_id", clubId)
            .gte("starts_at", nowIso)
            .lte("starts_at", in7),
        ]);

        if (nextRes.error) throw nextRes.error;
        if (countRes.error) throw countRes.error;

        // Insight is optional — don’t break schedule if unavailable
        const aiRes = await supabase
          .from("session_ai_insights")
          .select("id, club_id, period_start, period_end, source, summary, created_at")
          .eq("club_id", clubId)
          .order("created_at", { ascending: false })
          .limit(1);

        if (cancelled) return;

        setNextSession((nextRes.data?.[0] as any) ?? null);
        setNext7Count(countRes.count ?? 0);

        if (aiRes.error) {
          setLatestInsight(null);
          setSystemState("ready");
          setSystemNote("Insights are not enabled for this club yet. Your schedule still works normally.");
          return;
        }

        setLatestInsight((aiRes.data?.[0] as any) ?? null);
        setSystemState("ready");
      } catch (e: any) {
        if (cancelled) return;
        setSystemState("issue");
        setSystemNote(e?.message ?? "We couldn’t load schedule data right now.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clubId, supabase, checking]);

  const systemBadge =
    systemState === "ready"
      ? { text: "System: Connected", cls: "border-emerald-200/80 bg-emerald-50/70 text-emerald-950" }
      : systemState === "issue"
        ? { text: "System: Needs attention", cls: "border-rose-200/80 bg-rose-50/70 text-rose-950" }
        : { text: checking ? "Signing in…" : "Connecting…", cls: "border-slate-200 bg-white/70 text-slate-700" };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <SectionCard
        title="Schedule & Operations"
        subtitle="Plan sessions, keep delivery consistent, and build evidence that parents and stakeholders understand."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <Badge text={systemBadge.text} cls={systemBadge.cls} title={systemNote ?? "Live connection status"} />
            {dayTag ? (
              <Badge
                text={dayTag}
                cls="border-indigo-200/80 bg-indigo-50/70 text-indigo-950"
                title="Quick reference"
              />
            ) : null}
            <Badge
              text={fmtDayHeader(now)}
              cls="border-slate-200 bg-white/70 text-slate-700"
              title="Today"
            />
          </div>
        }
      >
        {/* Action row */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">What would you like to do?</div>
            <div className="mt-1 text-xs text-slate-600">
              Create a new session, review past sessions, or manage your timetable for the week.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push(`/app/admin/clubs/${clubId}/sessions`)}
              className="rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
            >
              Sessions
            </button>

            <Link
              href={`/app/admin/clubs/${clubId}/schedule/history`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition"
            >
              Reports
            </Link>

            <Link
              href={`/app/admin/clubs/${clubId}/schedule/create`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              New session
            </Link>
          </div>
        </div>

        {/* Highlights */}
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <StatTile
            label="NEXT 7 DAYS"
            value={next7Count === null ? "—" : next7Count}
            hint="How many sessions are planned this week"
          />

          <StatTile
            label="NEXT SESSION"
            value={nextSession?.starts_at ? (nextSession.title || "Untitled") : "—"}
            hint={nextSession?.starts_at ? `Starts ${fmtRelative(nextSession.starts_at)}` : "No upcoming sessions found"}
          />

          <StatTile
            label="LATEST INSIGHT"
            value={latestInsight?.created_at ? fmtRelative(latestInsight.created_at) : "—"}
            hint={latestInsight?.summary ? "A short summary based on your club signals" : "Insights appear after sessions & evidence"}
          />
        </div>

        {/* Share link */}
        <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/60 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-widest text-slate-500">SHARE</div>
              <div className="mt-1 text-sm font-semibold text-slate-900">Schedule link</div>
              <div className="mt-1 text-xs text-slate-600">
                Share this link with staff/admins who need to view the timetable.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className={cx(
                  "rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs font-semibold text-slate-700",
                  "max-w-[520px]"
                )}
                title={shareUrl || "—"}
              >
                <span className="text-slate-600">Link:</span>{" "}
                <span className="ml-1 truncate font-mono text-slate-900">{shareUrl || "—"}</span>
              </div>

              <button
                type="button"
                onClick={copyShareLink}
                className={cx(
                  "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                  copied
                    ? "border-emerald-200/80 bg-emerald-50/70 text-emerald-950"
                    : "border-slate-200 bg-white/70 text-slate-900 hover:bg-white"
                )}
                disabled={!shareUrl}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
        </div>

        {/* Notice */}
        {systemState === "issue" && systemNote ? (
          <div className="mt-4 rounded-2xl border border-rose-200/80 bg-rose-50/70 p-4 text-sm text-rose-950">
            <div className="font-semibold">We couldn’t load everything</div>
            <div className="mt-1">{systemNote}</div>
            <div className="mt-2 text-xs text-rose-900/80">
              Tip: Refresh the page. If it continues, check your club access permissions.
            </div>
          </div>
        ) : null}

        {systemState === "ready" && systemNote ? (
          <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/60 p-4 text-sm text-slate-700">
            <div className="font-semibold text-slate-900">Note</div>
            <div className="mt-1">{systemNote}</div>
          </div>
        ) : null}
      </SectionCard>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          <UpcomingSchedule clubId={clubId} />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <AiOpsCoachPanel clubId={clubId} />
          <QualityChecklistPanel />
        </div>
      </div>
    </div>
  );
}
