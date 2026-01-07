// web/src/app/app/admin/clubs/[clubId]/page.tsx
"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAdminGuard } from "@/lib/admin/admin-guard";

type Club = { id: string; name: string };

type AttendanceMark = {
  club_id: string;
  session_id: string;
  status: "present" | "absent";
  updated_at: string | null; // or saved_at
  note?: string | null;
};


function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function pct(n: number, d: number) {
  if (!d) return 0;
  return Math.round((n / d) * 100);
}

function useAttendance30dMetrics(supabase: any, clubId: string) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<null | {
    attendanceRate: number;
    absences: number;
    sessionsDelivered: number;
    evidenceReadyPct: number;
    followUps: number;
    deltaPct: number;
    presentCount: number;
    totalMarks: number;
  }>(null);

  useEffect(() => {
    if (!supabase || !clubId) return;

    let cancelled = false;

    async function run() {
      setLoading(true);

      const now30 = daysAgoISO(30);
      const prev60 = daysAgoISO(60);

     
      // last 30 days (attendance)
      const { data: last30, error: e1 } = await supabase
        .from("attendance")
        .select("club_id,session_id,status,updated_at,note")
        .eq("club_id", clubId)
        .gte("updated_at", now30);

      if (e1) throw e1;

      // previous 30 days
      const { data: prev30, error: e2 } = await supabase
        .from("attendance")
        .select("club_id,session_id,status,updated_at,note")
        .eq("club_id", clubId)
        .gte("updated_at", prev60)
        .lt("updated_at", now30);

      if (e2) throw e2;


      const a = (last30 ?? []) as AttendanceMark[];
      const b = (prev30 ?? []) as AttendanceMark[];

      const presentA = a.filter((x) => x.status === "present").length;
      const absentA = a.filter((x) => x.status === "absent").length;
      const totalA = a.length;

      const attendanceRateA = pct(presentA, presentA + absentA);

      const sessionsDelivered = new Set(a.map((x) => x.session_id)).size;

      // Evidence-ready definition (adjust to your business rule)
      // Here: a row is evidence-ready if it has note OR photo_url
      const evidenceReadyRows = a.filter((x) => Boolean(x.note)).length;
      const evidenceReadyPct = pct(evidenceReadyRows, totalA);

      // Follow-ups: count absent marks missing a note (simple)
      const followUps = a.filter((x) => x.status === "absent" && !x.note).length;

      // delta vs previous 30 days: compare attendance rates
      const presentB = b.filter((x) => x.status === "present").length;
      const absentB = b.filter((x) => x.status === "absent").length;
      const attendanceRateB = pct(presentB, presentB + absentB);
      const deltaPct = attendanceRateA - attendanceRateB;

      if (!cancelled) {
        setMetrics({
          attendanceRate: attendanceRateA,
          absences: absentA,
          sessionsDelivered,
          evidenceReadyPct,
          followUps,
          deltaPct,
          presentCount: presentA,
          totalMarks: totalA,
        });
      }
    }

    run()
      .catch((err) => {
        console.error("Attendance metrics error:", err);
        if (!cancelled) setMetrics(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supabase, clubId]);

  return { loading, metrics };
}


function formatTitle(name?: string) {
  const n = (name || "").trim();
  return n ? n : "Club centre";
}

/** ----------------- Background ----------------- */
function SoftBg() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100" />
      <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="absolute -left-44 top-[-160px] h-[520px] w-[520px] rounded-full bg-sky-200/35 blur-3xl" />
      <div className="absolute -right-56 top-[120px] h-[560px] w-[560px] rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="absolute left-1/3 bottom-[-220px] h-[620px] w-[620px] rounded-full bg-emerald-200/25 blur-3xl" />
    </div>
  );
}

/** ----------------- Shared Header Bar (Mobile + Desktop) ----------------- */
function TopBar({
  centreName,
  clubId,
  onOpenSidebar,
  onLogout,
}: {
  centreName: string;
  clubId: string;
  onOpenSidebar?: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="sticky top-0 z-50">
      {/* MOBILE */}
      <div className="lg:hidden border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-600/12 via-sky-500/10 to-emerald-500/10" />
          <div className="relative flex w-full items-center justify-between gap-3 px-4 py-3">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              ☰
            </button>

            <div className="min-w-0 text-center">
              <div className="truncate text-sm font-semibold text-white">
                Club Command Centre
              </div>
              <div className="truncate text-xs text-slate-300">{centreName}</div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:block">
        <div className="relative overflow-hidden border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-600/12 via-sky-500/10 to-emerald-500/10" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />

          <div className="relative flex w-full items-center justify-between px-6 py-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
                Admin · {centreName}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                Club Command Centre
              </h1>

              {/*
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <span className="hidden xl:inline">
                  
                </span>
                <span className="hidden xl:inline text-slate-500"></span>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-slate-200">
                  
                </span>
              </div>
                */}

            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenSidebar}
                className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                ☰ Menu
              </button>

              <Link
                href="/app/admin"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                ← Back
              </Link>

              <Link
                href="/app/admin/invites"
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Invite users
              </Link>
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}


function OwnerKpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
      <div className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-600">{hint}</div> : null}
    </div>
  );
}

function OwnerInsight30Days({
  monthLabel = "Last 30 days",
  attendanceRate = 92,
  deltaPct = 3,
  sessionsDelivered = 6,
  absences = 18,
  evidenceReadyPct = 84,
  followUps = 2,
}: {
  monthLabel?: string;
  attendanceRate?: number;
  deltaPct?: number; // compare to previous 30 days
  sessionsDelivered?: number;
  absences?: number;
  evidenceReadyPct?: number;
  followUps?: number;
}) {
  const health =
    attendanceRate >= 90 ? "Great" : attendanceRate >= 80 ? "Watch" : "At risk";

  const healthTone =
    health === "Great"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : health === "Watch"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  const evidenceTone =
    evidenceReadyPct >= 90
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : evidenceReadyPct >= 75
        ? "border-sky-200 bg-sky-50 text-sky-900"
        : "border-amber-200 bg-amber-50 text-amber-900";

  const renewalSignal =
    attendanceRate >= 90 && evidenceReadyPct >= 85 ? "Strong" : attendanceRate >= 85 ? "Good" : "Needs work";

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
            Owner Summary
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{monthLabel}</div>
          <div className="mt-1 text-xs text-slate-600">
            A simple view of delivery consistency, parent confidence, and follow-ups.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${healthTone}`}>
            Attendance health: {health}
          </span>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${evidenceTone}`}>
            Parent-ready evidence: {evidenceReadyPct}%
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OwnerKpi label="Attendance" value={`${attendanceRate}%`} hint="Average (30 days)" />
        <OwnerKpi label="Sessions delivered" value={`${sessionsDelivered}`} hint="Delivered (30 days)" />
        <OwnerKpi label="Missed seats" value={`${absences}`} hint="Absences (30 days)" />
        <OwnerKpi label="Renewal signal" value={renewalSignal} hint="Retention indicator" />
      </div>

      {/* Delta + actions */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DeltaPill delta={deltaPct} label="vs previous 30 days" />

        <span
          className={[
            "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
            followUps > 0
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900",
          ].join(" ")}
        >
          {followUps > 0 ? `${followUps} follow-ups needed` : "No follow-ups needed"}
        </span>
      </div>

      {/* Actions box */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
          What to do next (7 days)
        </div>

        <div className="mt-3 grid gap-2">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="text-sm font-semibold text-slate-900">Message recurring absences</div>
            <div className="text-xs text-slate-600">
              Quick parent check-ins reduce drop-offs and protect renewals.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="text-sm font-semibold text-slate-900">Improve evidence capture</div>
            <div className="text-xs text-slate-600">
              Aim for 90%+ with 1 photo + 1 sentence per learner per session.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="text-sm font-semibold text-slate-900">Use attendance as a growth asset</div>
            <div className="text-xs text-slate-600">
              Strong attendance + strong portfolios = more referrals and easier upsells.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        Built from your Attendance History (last 30 days). No forecasting, no jargon.
      </div>
    </div>
  );


}


/** ----------------- Small UI Pieces ----------------- */
function DeltaPill({
  label = "vs last 30 days",
  delta,
}: {
  label?: string;
  delta: number;
}) {
  const up = delta >= 0;
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold",
        up ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900",
      ].join(" ")}
    >
      <span className="text-[12px]">{up ? "↑" : "↓"}</span>
      <span>{Math.abs(delta)}%</span>
      <span className="text-slate-500 font-semibold">{label}</span>
    </span>
  );
}


function ProgressLine({
  values,
  tone = "blue",
  height = 96,
  showGoal = true,
  goalPct = 0.8, // 80% of range as "goal band" (swap later for real targets)
}: {
  values: number[];
  tone?: "blue" | "emerald" | "amber" | "slate";
  height?: number;
  showGoal?: boolean;
  goalPct?: number;
}) {
  const w = 520; // virtual width; scales via viewBox
  const h = height;
  const padX = 18;
  const padY = 16;

  const v = values.slice(-12);
  const min = Math.min(...v);
  const max = Math.max(1, ...v);
  const span = Math.max(1, max - min);

  const xFor = (i: number, n: number) =>
    padX + (i * (w - padX * 2)) / Math.max(1, n - 1);

  const yFor = (val: number) =>
    padY + (1 - (val - min) / span) * (h - padY * 2);

  const pts = v.map((val, i) => ({ x: xFor(i, v.length), y: yFor(val) }));

  const lineD =
    pts.length <= 1
      ? `M ${padX} ${h - padY} L ${w - padX} ${h - padY}`
      : `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");

  const areaD =
    `M ${pts[0]?.x ?? padX} ${h - padY} ` +
    (pts.length ? `L ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")} ` : "") +
    `L ${pts[pts.length - 1]?.x ?? w - padX} ${h - padY} Z`;

  const stroke =
    tone === "emerald"
      ? "rgba(16,185,129,0.95)"
      : tone === "amber"
        ? "rgba(245,158,11,0.95)"
        : tone === "slate"
          ? "rgba(100,116,139,0.92)"
          : "rgba(59,130,246,0.95)";

  const goalValue = min + span * goalPct;
  const goalY = yFor(goalValue);








}




function summarizeSeries(values: number[]) {
  const v = values.slice(-12);
  const first = v[0] ?? 0;
  const last = v[v.length - 1] ?? 0;
  const min = Math.min(...v);
  const max = Math.max(...v);
  const pct = first === 0 ? 0 : Math.round(((last - first) / Math.abs(first)) * 100);
  const direction = last > first ? "Rising" : last < first ? "Falling" : "Stable";

  let stepSum = 0;
  for (let i = 1; i < v.length; i++) stepSum += Math.abs(v[i] - v[i - 1]);
  const avgStep = v.length > 1 ? stepSum / (v.length - 1) : 0;
  const range = Math.max(1, max - min);
  const volatilityScore = avgStep / range;

  const stability =
    volatilityScore < 0.22 ? "Stable" : volatilityScore < 0.45 ? "Mixed" : "Volatile";

  return { first, last, min, max, pct, direction, stability };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function EducationProgress({
  values,
  unitLabel = "Activity score",
  targetMin,
  targetMax,
}: {
  values: number[];
  unitLabel?: string;
  targetMin?: number;
  targetMax?: number;
}) {
  const v = values.slice(-12);
  const minV = Math.min(...v);
  const maxV = Math.max(...v);
  const start = v[0] ?? 0;
  const now = v[v.length - 1] ?? 0;

  const span = Math.max(1, maxV - minV);

  // percent of overall observed range (feels like “progress this term”)
  const pct = clamp(Math.round(((now - minV) / span) * 100), 0, 100);

  // educational labeling
  const status =
    targetMin != null && targetMax != null
      ? now >= targetMin && now <= targetMax
        ? "On track"
        : now < targetMin
          ? "Below target"
          : "Above target"
      : pct >= 70
        ? "On track"
        : pct >= 45
          ? "Needs attention"
          : "At risk";

  const statusTone =
    status === "On track"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : status === "Needs attention"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  // milestone steps (Amazon-style segments)
  const steps = [20, 40, 60, 80, 100];

  // weekly bars (make them THICK + visible)
  const barMax = Math.max(1, ...v);
  const normalized = v.map((x) => clamp(Math.round((x / barMax) * 100), 2, 100));

  // target band positioning within the bar area
  const bandLeft =
    targetMin == null ? null : clamp(Math.round((targetMin / barMax) * 100), 0, 100);
  const bandRight =
    targetMax == null ? null : clamp(Math.round((targetMax / barMax) * 100), 0, 100);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            Progress (last 12)
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{unitLabel}</div>
          <div className="mt-1 text-xs text-slate-500">
            Start: <span className="font-semibold text-slate-700">{start}</span>{" "}
            <span className="text-slate-400">→</span>{" "}
            Now: <span className="font-semibold text-slate-900">{now}</span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone}`}>
            {status}
          </span>
          <div className="mt-2 text-xs text-slate-500">
            Min <span className="font-semibold text-slate-700">{minV}</span> · Max{" "}
            <span className="font-semibold text-slate-700">{maxV}</span>
          </div>
        </div>
      </div>

      {/* Segmented mastery bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>Mastery</span>
          <span>{pct}%</span>
        </div>

        <div className="mt-2 relative h-3 w-full rounded-full bg-slate-100 overflow-hidden">
          {/* Filled */}
          <div className="h-full rounded-full bg-slate-900" style={{ width: `${pct}%` }} />

          {/* Milestone ticks */}
          {steps.map((s) => (
            <div
              key={s}
              className="absolute top-0 h-full w-[2px] bg-white/70"
              style={{ left: `${s}%` }}
            />
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>Foundation</span>
          <span>Developing</span>
          <span>Secure</span>
          <span>Advanced</span>
        </div>
      </div>

      {/* Weekly activity bars (big + modern) */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
            Weekly activity
          </div>
          {targetMin != null && targetMax != null ? (
            <div className="text-xs font-semibold text-slate-500">
              Target band:{" "}
              <span className="font-semibold text-slate-700">
                {targetMin}–{targetMax}
              </span>
            </div>
          ) : null}
        </div>

        <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-3">
          {/* target band */}
          {bandLeft != null && bandRight != null ? (
            <div
              className="absolute inset-y-3 rounded-xl bg-emerald-200/35"
              style={{
                left: `${Math.min(bandLeft, bandRight)}%`,
                width: `${Math.abs(bandRight - bandLeft)}%`,
              }}
            />
          ) : null}

          <div className="relative flex h-[84px] items-end gap-2">
            {normalized.map((h, i) => (
              <div key={i} className="flex-1">
                <div className="relative h-[84px] w-full rounded-xl bg-white/70 overflow-hidden border border-slate-200">
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-xl bg-slate-900"
                    style={{ height: `${h}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>Week 1</span>
            <span>Week 12</span>
          </div>
        </div>
      </div>
    </div>
  );
}


/** ----------------- Metric Tile ----------------- */
function MetricTile({
  icon,
  title,
  subtitle,
  value,
  delta,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: string;
  delta: number;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[26px] border border-slate-200/70 bg-white/90 shadow-[0_16px_55px_-40px_rgba(2,6,23,0.25)] overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-200/60">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-xl">
              {icon}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
              <div className="truncate text-xs text-slate-500">{subtitle}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="text-4xl font-semibold tracking-tight text-slate-900">{value}</div>
            <DeltaPill delta={delta} label="vs previous 30 days" />
          </div>

          <div className="mt-2 text-xs text-slate-600">
            Based on <span className="font-semibold text-slate-900">last 30 days</span> from Attendance History.
          </div>
        </div>
      </div>

      {/* Body: give it a full-width soft panel background */}
      <div className="px-6 py-6 bg-gradient-to-b from-slate-50 via-white to-white">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 backdrop-blur p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}






/** ----------------- Charts ----------------- */
function Donut({ value = 92, label = "Attendance" }: { value?: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="flex items-center gap-5">
      <div className="relative grid h-[132px] w-[132px] place-items-center">
        <svg viewBox="0 0 140 140" className="h-[132px] w-[132px]">
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(148,163,184,0.35)" strokeWidth="14" />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="rgba(59,130,246,0.85)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform="rotate(-90 70 70)"
          />
          <circle cx="70" cy="70" r={r - 18} fill="white" />
        </svg>

        <div className="absolute text-center">
          <div className="text-4xl font-semibold tracking-tight text-slate-900">{pct}%</div>
          <div className="mt-1 text-xs font-semibold text-slate-500">{label}</div>
        </div>
      </div>

      <div className="hidden sm:block">
        <div className="text-xs font-semibold text-slate-500">This term</div>
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500/80" />
            Present
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            Absent / missing
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniBarsWide({
  values,
  labels,
}: {
  values: number[];
  labels?: string[];
}) {
  const max = Math.max(1, ...values);

  return (
    <div className="w-full">
      <div className="grid grid-cols-6 gap-2">
        {values.slice(0, 6).map((v, idx) => {
          const ht = Math.round((v / max) * 100);
          return (
            <div key={idx} className="flex flex-col justify-end">
              <div className="relative h-[120px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-2xl bg-slate-900"
                  style={{ height: `${Math.max(3, ht)}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-transparent to-transparent" />
              </div>

              <div className="mt-2 text-center text-[11px] font-semibold text-slate-500">
                {labels?.[idx] ?? `W${idx + 1}`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
        <span>Earlier</span>
        <span>Recent</span>
      </div>
    </div>
  );
}


/** ----------------- Insight Row (compact, professional) ----------------- */
function InsightCompactRow({
  title,
  desc,
  tone,
  tag,
}: {
  title: string;
  desc: string;
  tone: "good" | "warn" | "info";
  tag: string;
}) {
  const badge =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-sky-200 bg-sky-50 text-sky-900";

  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="mt-0.5 text-xs text-slate-600">{desc}</div>
      </div>
      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge}`}>
        {tag}
      </span>
    </div>
  );
}

function AttendanceOwnerInsight({
  monthLabel = "January 2026",
  rate = 92,
  present = 210,
  absent = 18,
  sessions = 6,
  evidenceReadyPct = 84,
  riskFlags = 2,
}: {
  monthLabel?: string;
  rate?: number;
  present?: number;
  absent?: number;
  sessions?: number;
  evidenceReadyPct?: number;
  riskFlags?: number;
}) {
  const health =
    rate >= 90 ? "Great" : rate >= 80 ? "Watch" : "At risk";

  const healthTone =
    health === "Great"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : health === "Watch"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-rose-200 bg-rose-50 text-rose-900";

  const evidenceTone =
    evidenceReadyPct >= 90
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : evidenceReadyPct >= 75
        ? "border-sky-200 bg-sky-50 text-sky-900"
        : "border-amber-200 bg-amber-50 text-amber-900";

  const missed = absent; // simple business language
  const renewalSignal =
    rate >= 90 && evidenceReadyPct >= 85 ? "Strong" : rate >= 85 ? "Good" : "Needs work";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
            Attendance — Owner Summary
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{monthLabel}</div>
          <div className="mt-1 text-xs text-slate-600">
            A simple view of delivery consistency, parent trust, and follow-up needs.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${healthTone}`}>
            Health: {health}
          </span>
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${evidenceTone}`}>
            Parent-ready evidence: {evidenceReadyPct}%
          </span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
          <div className="text-[11px] font-semibold tracking-widest text-slate-500">ATTENDANCE</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{rate}%</div>
          <div className="mt-1 text-xs text-slate-600">Average this month</div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
          <div className="text-[11px] font-semibold tracking-widest text-slate-500">MISSED</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{missed}</div>
          <div className="mt-1 text-xs text-slate-600">Learner absences</div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
          <div className="text-[11px] font-semibold tracking-widest text-slate-500">SESSIONS</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{sessions}</div>
          <div className="mt-1 text-xs text-slate-600">Delivered</div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
          <div className="text-[11px] font-semibold tracking-widest text-slate-500">RENEWAL SIGNAL</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{renewalSignal}</div>
          <div className="mt-1 text-xs text-slate-600">Retention indicator</div>
        </div>
      </div>

      {/* Owner actions */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
            Owner Actions (next 7 days)
          </div>
          <span
            className={[
              "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              riskFlags > 0
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900",
            ].join(" ")}
          >
            {riskFlags > 0 ? `${riskFlags} follow-ups` : "All clear"}
          </span>
        </div>

        <div className="mt-3 grid gap-2">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="text-sm font-semibold text-slate-900">Message recurring absences</div>
            <div className="text-xs text-slate-600">
              A quick parent check-in prevents drop-offs and protects renewals.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="text-sm font-semibold text-slate-900">Improve evidence capture</div>
            <div className="text-xs text-slate-600">
              Aim for 90%+ with 1 photo + 1 sentence per learner per session.
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="text-sm font-semibold text-slate-900">Use attendance as a growth asset</div>
            <div className="text-xs text-slate-600">
              High attendance + strong portfolios = stronger referrals and easier upsells.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



function AskKiKiCard({
  centreName,
}: {
  centreName: string;
}) {
  const [q, setQ] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "kiki"; text: string }>>([
    {
      role: "kiki",
      text: `Hi 👋 I’m KiKi. Ask me anything about your dashboard analytics (attendance, sessions, students, parents, teachers).`,
    },
  ]);

  function reply(prompt: string) {
    const p = prompt.toLowerCase();

    // lightweight “smart” replies (UI only, wire to Azure later)
    if (p.includes("attendance")) {
      return "Attendance rate summarises Present vs Absent across the selected month. If evidence-ready is low, focus on capturing one photo + one sentence per session to improve report quality.";
    }
    if (p.includes("why") || p.includes("explain")) {
      return "Tell me which metric you’re looking at (e.g., Attendance rate, Sessions delivered, Students enrolled) and the month. I’ll explain what it means and what action to take.";
    }
    if (p.includes("business") || p.includes("improve")) {
      return "From a business angle: use stable attendance + strong evidence-ready % to support parent retention, renewals, and funding reports. If absences rise, trigger follow-up workflows early.";
    }
    return "Got it. Ask me what metric you want explained (and what month), and I’ll translate it into plain English + an action plan.";
  }

  return (
    <div className="mt-6 rounded-[22px] border border-slate-200/70 bg-white shadow-[0_16px_50px_-40px_rgba(2,6,23,0.25)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-xl">
            🤖
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold text-slate-900">
              Ask KiKi
            </div>
            <div className="truncate text-xs text-slate-500">
              AI helper for analytics + business insights • {centreName}
            </div>
          </div>
        </div>

        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
          Azure AI: planned
        </span>
      </div>

      <div className="px-5 py-4 sm:px-6">
        {/* Suggestions */}
        <div className="flex flex-wrap gap-2">
          {[
            "Explain the attendance rate for this month",
            "Why is evidence-ready important?",
            "Give me actions to improve parent retention",
            "Summarise risks from this dashboard",
          ].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQ(s)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Chat log */}
        <div className="mt-4 max-h-[260px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={[
                  "rounded-2xl px-3 py-2 text-sm",
                  m.role === "kiki"
                    ? "bg-white border border-slate-200 text-slate-800"
                    : "bg-slate-900 text-white ml-auto",
                ].join(" ")}
              >
                <div className="text-[11px] font-semibold opacity-70">
                  {m.role === "kiki" ? "KiKi" : "You"}
                </div>
                <div className="mt-0.5">{m.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="mt-3 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder='Ask KiKi... e.g. "Explain attendance rate"'
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
          <button
            type="button"
            onClick={() => {
              const text = q.trim();
              if (!text) return;

              setMessages((prev) => [...prev, { role: "user", text }]);
              setQ("");

              const kiki = reply(text);
              setMessages((prev) => [...prev, { role: "user", text }, { role: "kiki", text: kiki }]);
            }}
            className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Send
          </button>
        </div>

        <div className="mt-2 text-xs text-slate-500">
          KiKi is UI-only for now. Later you can connect Azure OpenAI + your monthly analytics payload.
        </div>
      </div>
    </div>
  );
}



/** ----------------- Pro Analytics Screen ----------------- */
function ProAnalyticsScreen({ clubId, centreName }: { clubId: string; centreName: string }) {
  const { supabase } = useAdminGuard({ idleMinutes: 15 }); // if you already have it here, otherwise pass supabase in
  const { loading, metrics } = useAttendance30dMetrics(supabase, clubId);

  const [ai, setAi] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    if (!metrics) return;

    let cancelled = false;
    async function go() {
      setAiLoading(true);
      const r = await fetch("/api/ai/attendance-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metrics),
      });
      const data = await r.json();
      if (!cancelled) setAi(data);
      setAiLoading(false);
    }
    go().catch(() => setAiLoading(false));

    return () => {
      cancelled = true;
    };
  }, [metrics]);

  const attendanceValue = metrics ? `${metrics.attendanceRate}%` : "—";
  const delta = metrics ? metrics.deltaPct : 0;

  return (
    <section className="mt-6">
      {/* ... your header stays the same ... */}

      <div className="mt-5 grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
        <div className="2xl:col-span-2">
          <MetricTile
            icon="✅"
            title="Attendance"
            subtitle="Owner view (30 days) • computed from history"
            value={attendanceValue}
            delta={delta}
          >
            {loading || !metrics ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="h-5 w-56 bg-slate-200/70 rounded animate-pulse" />
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl border border-slate-200 bg-slate-50 animate-pulse" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-5">
                <OwnerInsight30Days
                  monthLabel="Last 30 days"
                  attendanceRate={metrics.attendanceRate}
                  deltaPct={metrics.deltaPct}
                  sessionsDelivered={metrics.sessionsDelivered}
                  absences={metrics.absences}
                  evidenceReadyPct={metrics.evidenceReadyPct}
                  followUps={metrics.followUps}
                />

                {/* Azure AI narrative (real, not guessed) */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase">
                      Azure AI Summary
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                      {aiLoading ? "Generating…" : "Live"}
                    </span>
                  </div>

                  {aiLoading && !ai ? (
                    <div className="mt-3 space-y-2">
                      <div className="h-4 w-[80%] rounded bg-slate-200/70 animate-pulse" />
                      <div className="h-4 w-[65%] rounded bg-slate-200/60 animate-pulse" />
                      <div className="h-4 w-[70%] rounded bg-slate-200/60 animate-pulse" />
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="text-sm font-semibold text-slate-900">{ai?.headline ?? "Summary"}</div>
                      <div className="mt-1 text-sm text-slate-700">{ai?.what_ai_sees ?? ai?.raw}</div>

                      {Array.isArray(ai?.actions_next_7_days) ? (
                        <div className="mt-3 grid gap-2">
                          {ai.actions_next_7_days.slice(0, 3).map((x: string, i: number) => (
                            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                              {x}
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}
          </MetricTile>
        </div>

        {/* Right column card stays for other metrics (sessions/students/etc) */}
        <div className="2xl:col-span-1">{/* other tiles */}</div>
      </div>
    </section>
  );
}


/** ----------------- Generic Card (upgraded) ----------------- */
function Card({
  title,
  icon,
  right,
  children,
  className = "",
  bodyClassName = "",
}: {
  title: string;
  icon?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={[
        // ✅ important: flex-col so header stays fixed, body grows, no overlap
        "flex h-full flex-col rounded-[22px] border border-slate-200/70 bg-white shadow-[0_16px_50px_-40px_rgba(2,6,23,0.25)] overflow-hidden",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/60 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {icon ? (
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-xl">
              {icon}
            </div>
          ) : null}
          <h3 className="truncate text-base font-semibold text-slate-900">
            {title}
          </h3>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>

      {/* ✅ important: flex-1 + min-h-0 prevents children overlap in grids */}
      <div
        className={[
          "min-h-0 flex-1 px-5 pb-5 pt-4 sm:px-6 sm:pb-6",
          bodyClassName,
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}


/** ----------------- Overview Row ----------------- */
function OverviewRow({
  clubId,
  upcoming,
  wide,
}: {
  clubId: string;
  upcoming: { title: string; when: string; time: string; icon: string }[];
  wide?: boolean;
}) {
  // mock executive education signals (swap to real data later)
  const execSignals = [
    { label: "Attendance health", value: "Strong", hint: "92% avg", tone: "good" as const },
    { label: "Learner momentum", value: "Rising", hint: "+8% active", tone: "good" as const },
    { label: "Parent links", value: "Action needed", hint: "2 missing", tone: "warn" as const },
    { label: "Staffing readiness", value: "On track", hint: "4 upcoming", tone: "info" as const },
  ];

  const toneBadge = (tone: "good" | "warn" | "info") =>
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-sky-200 bg-sky-50 text-sky-900";

  return (
    <div className="w-full">
      {/* ✅ Always centered, no full-bleed math */}
      <section className="mt-8 w-full">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
          {/* Header */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold tracking-widest text-slate-500">
                LEARNING OVERVIEW
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                Teaching & learner signals
              </div>
              <div className="mt-1 text-sm text-slate-600">
                A teacher-friendly snapshot of progress, engagement, and what to do next.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                Classroom-ready
              </span>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Updated: <span className="ml-2 text-slate-900">Last 24h</span>
              </span>
            </div>
          </div>

          {/* ✅ 2 Education cards only — centered + responsive */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* CARD 1: Learning Outcomes & Mastery */}
            <Card
              title="Learning Outcomes & Mastery"
              icon="🎯"
              right={
                <Link
                  href={`/app/admin/clubs/${clubId}/reports`}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  Open reports →
                </Link>
              }
              bodyClassName="pt-4"
            >
              <div className="grid gap-4">
                {/* Top KPIs */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                      SKILL FOCUS
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">Building + Logic</div>
                    <div className="mt-1 text-xs text-slate-600">This week</div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                      RUBRIC READY
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">3-point</div>
                    <div className="mt-1 text-xs text-slate-600">Recommended</div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                      PORTFOLIO QUALITY
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">Strong</div>
                    <div className="mt-1 text-xs text-slate-600">Notes + photos</div>
                  </div>
                </div>

                {/* Teacher moves (education perspective) */}
                <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                      TEACHER MOVES (NEXT)
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">For next session</span>
                  </div>

                  <div className="mt-3 space-y-3">
                    <InsightCompactRow
                      title="Use a 3-step success checklist"
                      desc="Build → test → explain. Helps learners reflect and improves evidence quality."
                      tone="info"
                      tag="Plan"
                    />
                    <InsightCompactRow
                      title="Capture one learning sentence per learner"
                      desc="What changed today? (e.g., gears, sensors, teamwork)."
                      tone="good"
                      tag="Quality"
                    />
                    <InsightCompactRow
                      title="Add a quick challenge score"
                      desc="Foundation / Developing / Secure to standardise progress tracking."
                      tone="warn"
                      tag="Action"
                    />
                  </div>
                </div>

                {/* Lightweight “targets” strip */}
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Teaching tip:</span>{" "}
                  Keep evidence simple: 1 photo + 1 sentence + 1 score per session.
                </div>
              </div>
            </Card>

            {/* CARD 2: Engagement & Inclusion */}
            <Card
              title="Engagement & Inclusion"
              icon="🤝"
              right={
                <Link
                  href={`/app/admin/clubs/${clubId}/attendance`}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  Manage attendance →
                </Link>
              }
              bodyClassName="pt-4"
            >
              <div className="grid gap-4">
                {/* Donut + bars */}
                <div className="grid gap-4 md:grid-cols-2 md:items-center">
                  <div className="flex justify-center md:justify-start">
                    <Donut value={92} label="Attendance" />
                  </div>

                  <div className="min-w-0 rounded-2xl border border-slate-200/70 bg-white px-4 py-4 overflow-hidden">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-900">Participation trend</div>
                      <div className="text-xs text-slate-500">last 6</div>
                    </div>
                    <MiniBarsWide
                      values={[120, 160, 140, 180, 210, 260]}
                      labels={["W1", "W2", "W3", "W4", "W5", "W6"]}
                    />
                  </div>
                </div>

                {/* Inclusion signals */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                      SAFETY NET
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">Low risk</div>
                    <div className="mt-1 text-xs text-slate-600">Absences</div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                      PARENT LINKS
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">2 missing</div>
                    <div className="mt-1 text-xs text-slate-600">Home access</div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                      CONSISTENCY
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">Strong</div>
                    <div className="mt-1 text-xs text-slate-600">Routine stable</div>
                  </div>
                </div>

                {/* Next actions for inclusion */}
                <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                      SUPPORT ACTIONS
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">This week</span>
                  </div>

                  <div className="mt-3 grid gap-2">
                    <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="mt-0.5 text-slate-400">•</span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">
                          Link missing parent accounts
                        </div>
                        <div className="text-xs text-slate-600">
                          Unlocks home dashboards + portfolio viewing.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <span className="mt-0.5 text-slate-400">•</span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-900">
                          Flag learners needing extra support
                        </div>
                        <div className="text-xs text-slate-600">
                          Add a short note to guide next session scaffolding.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile CTA */}
                <Link
                  className="sm:hidden inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  href={`/app/admin/clubs/${clubId}/people`}
                >
                  Manage learners & parents →
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );



}


/** ----------------- Sidebar ----------------- */
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pt-3 text-[10px] font-semibold tracking-widest text-slate-500">
      {children}
    </div>
  );
}


function NavLink({
  href,
  icon,
  label,
  desc,
  badge,
  active,
  onNavigate,
}: {
  href: string;
  icon: string;
  label: string;
  desc?: string;
  badge?: string;
  active?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={[
        "group flex items-start gap-3 rounded-xl px-3 py-2.5 transition",
        active ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-900",
      ].join(" ")}

    >
      <div
        className={[
          "grid h-8 w-8 shrink-0 place-items-center rounded-xl border text-base",
          active ? "border-white/20 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-700",
        ].join(" ")}
      >
        {icon}
      </div>


      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={["truncate text-sm font-semibold", active ? "text-white" : "text-slate-900"].join(" ")}>
            {label}
          </p>

          {badge ? (
            <span
              className={[
                "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                active ? "border-white/20 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-700",
              ].join(" ")}
            >
              {badge}
            </span>
          ) : null}
        </div>

        {desc ? (
          <p className={["mt-0.5 text-xs", active ? "text-white/80" : "text-slate-500"].join(" ")}>
            {desc}
          </p>
        ) : null}
      </div>

      <span className={["mt-2 shrink-0 text-sm", active ? "text-white/80" : "text-slate-400 group-hover:text-slate-700"].join(" ")}>
        ›
      </span>
    </Link>
  );
}

function Sidebar({
  clubId,
  clubName,
  onNavigate,
}: {
  clubId: string;
  clubName: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="h-full w-full">
      <div className="rounded-[22px] border border-slate-200/70 bg-white/85 shadow-[0_18px_60px_-45px_rgba(2,6,23,0.22)] backdrop-blur">


        {/* 
        <div className="border-b border-slate-200/70 px-4 py-4">
          <div className="text-[11px] font-semibold tracking-widest text-slate-500">CENTRE</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{clubName}</div>
          <div className="mt-1 truncate text-xs text-slate-600">
            ID: <span className="font-semibold">{clubId}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              Data: <span className="ml-2 text-emerald-700">Live</span>
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              Quality: <span className="ml-2 text-sky-700">Strong</span>
            </span>
          </div>
        </div>
         */}


        <nav className="pb-4">
          <SectionLabel>ADMIN CONTROLS</SectionLabel>
          <div className="mt-2 space-y-1 px-2">
            <NavLink
              href={`/app/admin/clubs/${clubId}/sessions`}
              icon="🗓️"
              label="Sessions"
              desc="Create & manage delivery"
              badge="Core"
              active={isActive(`/app/admin/clubs/${clubId}/sessions`)}
              onNavigate={onNavigate}
            />
            <NavLink
              href={`/app/admin/clubs/${clubId}/attendance`}
              icon="✅"
              label="Attendance"
              desc="Registers, notes, flags"
              badge="Core"
              active={isActive(`/app/admin/clubs/${clubId}/attendance`)}
              onNavigate={onNavigate}
            />
            <NavLink
              href={`/app/admin/clubs/${clubId}/terms`}
              icon="📚"
              label="Terms & Lessons"
              desc="Structure + mapping"
              active={isActive(`/app/admin/clubs/${clubId}/terms`)}
              onNavigate={onNavigate}
            />
            <NavLink
              href={`/app/admin/clubs/${clubId}/challenges`}
              icon="🏆"
              label="Challenges"
              desc="Outcomes & scoring"
              active={isActive(`/app/admin/clubs/${clubId}/challenges`)}
              onNavigate={onNavigate}
            />
            <NavLink
              href={`/app/admin/clubs/${clubId}/activities`}
              icon="🤖"
              label="Robotics Activities"
              desc="Builds, kits, uploads"
              active={isActive(`/app/admin/clubs/${clubId}/activities`)}
              onNavigate={onNavigate}
            />
            <NavLink
              href={`/app/admin/clubs/${clubId}/reports`}
              icon="📈"
              label="Reports"
              desc="Parent + funder ready"
              active={isActive(`/app/admin/clubs/${clubId}/reports`)}
              onNavigate={onNavigate}
            />
          </div>

          <SectionLabel>PEOPLE</SectionLabel>
          <div className="mt-2 space-y-1 px-2">
            <NavLink
              href={`/app/admin/clubs/${clubId}/people`}
              icon="👥"
              label="People Management"
              desc="Teachers, students, parents"
              active={isActive(`/app/admin/clubs/${clubId}/people`)}
              onNavigate={onNavigate}
            />
            <NavLink
              href={`/app/admin/clubs/${clubId}/students`}
              icon="🧒🏽"
              label="Student Access"
              desc="Generate link / PIN"
              active={isActive(`/app/admin/clubs/${clubId}/students`)}
              onNavigate={onNavigate}
            />
            <NavLink
              href={`/app/admin/clubs/${clubId}/parents`}
              icon="👨‍👩‍👧‍👦"
              label="Parent Linking"
              desc="Connect parent accounts"
              active={isActive(`/app/admin/clubs/${clubId}/parents`)}
              onNavigate={onNavigate}
            />
          </div>

          {/*
          <SectionLabel>QUICK ACTIONS</SectionLabel>
          <div className="mt-2 grid gap-2 px-4">
            <Link
              href="/app/admin"
              onClick={onNavigate}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              ← Back to Admin
            </Link>
            <Link
              href="/app/admin/invites"
              onClick={onNavigate}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Invite users
            </Link>
          </div>
           */}


        </nav>
      </div>
    </aside>
  );
}

/** ----------------- Page ----------------- */
export default function ClubCentreDashboardPage() {
  const router = useRouter();
  const params = useParams<{ clubId: string }>();
  const clubId = params.clubId;

  const { checking, supabase, logout } = useAdminGuard({ idleMinutes: 15 });

  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<Club | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (checking) return;

    let cancelled = false;

    async function loadClub() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("clubs")
          .select("id, name")
          .eq("id", clubId)
          .single();
        if (error) throw error;
        if (!cancelled) setClub(data as Club);
      } catch {
        router.replace("/app/admin");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadClub();
    return () => {
      cancelled = true;
    };
  }, [checking, clubId, router, supabase]);

  const upcoming = useMemo(
    () => [
      { title: "Robotics Workshop", when: "Tomorrow", time: "3:30 PM", icon: "🤖" },
      { title: "Coding Class", when: "Apr 15", time: "4:10 PM", icon: "💻" },
      { title: "Science Experiments", when: "Apr 17", time: "3:10 PM", icon: "🧪" },
    ],
    []
  );

  if (checking || loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="w-full px-4 py-10">
          <div className="h-10 w-72 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="mt-6 h-[520px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
        </div>
      </main>
    );
  }

  const centreName = formatTitle(club?.name);

  return (
    <main className="relative min-h-screen w-full overflow-x-clip text-slate-900">
      <SoftBg />

      <TopBar
        centreName={centreName}
        clubId={clubId}
        onOpenSidebar={() => setSidebarOpen(true)}
        onLogout={() => logout("manual")}
      />

      {/* MOBILE SIDEBAR DRAWER */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-[60]">

          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />

          {/* ✅ hide scrollbar + add bottom fade */}
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-[380px] lg:w-[420px] lg:max-w-none border-r border-slate-200 bg-slate-50/60 p-4 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Admin Menu</div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            <div className="relative h-[calc(100vh-92px)] overflow-y-auto pr-2 scrollbar-none">
              <Sidebar clubId={clubId} clubName={centreName} onNavigate={() => setSidebarOpen(false)} />

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSidebarOpen(false);
                    logout("manual");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Logout
                </button>
              </div>

              <div className="pointer-events-none sticky bottom-0 h-10 w-full bg-gradient-to-t from-slate-50/90 to-transparent" />
            </div>
          </div>
        </div>
      ) : null}



      {/* DESKTOP LAYOUT (full-bleed to escape parent max-width containers) */}
      <div className="relative left-1/2 right-1/2 -mx-[50dvw] w-[100dvw] overflow-x-hidden">
        <div className="w-full px-4 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <div className="min-w-0 pb-10">
              <ProAnalyticsScreen clubId={clubId} centreName={centreName} />

              {/* ✅ KiKi lives here (dashboard-level helper) */}
              <AskKiKiCard centreName={centreName} />

              <OverviewRow clubId={clubId} upcoming={upcoming} wide />
            </div>
          </div>
        </div>
      </div>




    </main>
  );
}

/*
If `scrollbar-none` doesn't work:
- It means you don’t have the Tailwind scrollbar plugin.
- Quick fallback: add a tiny global css helper:
  .no-scrollbar::-webkit-scrollbar{display:none}
  .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
Then swap `scrollbar-none` to `no-scrollbar` in this file.
*/
