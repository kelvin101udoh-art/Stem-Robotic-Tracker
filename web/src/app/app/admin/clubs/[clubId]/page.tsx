// web/src/app/app/admin/clubs/[clubId]/page.tsx
"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAdminGuard } from "@/lib/admin/admin-guard";

type Club = { id: string; name: string };

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

              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <span className="hidden xl:inline">
                  Sessions, attendance, challenges, robotics activity & AI insights
                </span>
                <span className="hidden xl:inline text-slate-500">•</span>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs font-semibold text-slate-200">
                  ID: {clubId}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Live data
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold text-sky-300">
                  Quality: Strong
                </span>
              </div>

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

/** ----------------- Small UI Pieces ----------------- */
function TrendBadge({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        up
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-rose-200 bg-rose-50 text-rose-800",
      ].join(" ")}
    >
      <span className="text-[12px]">{up ? "▲" : "▼"}</span>
      {Math.abs(delta)}%
    </span>
  );
}

function SparkHistogram({
  values,
  tone = "blue",
  showTarget = true,
}: {
  values: number[];
  tone?: "blue" | "emerald" | "amber" | "slate";
  showTarget?: boolean;
}) {
  const w = 150;
  const h = 56;
  const padX = 6;
  const padY = 6;

  const v = values.slice(-12);
  const max = Math.max(1, ...v);
  const min = Math.min(...v);
  const span = Math.max(1, max - min);

  // A simple “goal” line: 80% toward max (works as a generic progress target)
  // You can replace this with a real target later per metric.
  const targetValue = min + span * 0.8;

  const stroke =
    tone === "emerald"
      ? "rgba(16,185,129,0.9)"
      : tone === "amber"
      ? "rgba(245,158,11,0.9)"
      : tone === "slate"
      ? "rgba(100,116,139,0.88)"
      : "rgba(59,130,246,0.9)";

  const fill =
    tone === "emerald"
      ? "rgba(16,185,129,0.22)"
      : tone === "amber"
      ? "rgba(245,158,11,0.22)"
      : tone === "slate"
      ? "rgba(100,116,139,0.18)"
      : "rgba(59,130,246,0.22)";

  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const barCount = v.length;
  const gap = 3;
  const barW = Math.max(6, Math.floor((chartW - gap * (barCount - 1)) / barCount));

  const yFor = (val: number) => {
    const t = (val - min) / span; // 0..1
    return padY + (1 - t) * chartH;
  };

  const targetY = yFor(targetValue);

  return (
    <div className="relative">
      {/* subtle baseline strip (prevents “floating”) */}
      <div className="pointer-events-none absolute inset-x-0 top-[18px] h-[18px] rounded-xl bg-slate-100/70" />

      <svg viewBox={`0 0 ${w} ${h}`} className="h-[56px] w-[150px]">
        {/* optional target line */}
        {showTarget ? (
          <line
            x1={padX}
            x2={w - padX}
            y1={targetY}
            y2={targetY}
            stroke="rgba(15,23,42,0.18)"
            strokeDasharray="3 3"
            strokeWidth="1.5"
          />
        ) : null}

        {/* bars */}
        {v.map((val, i) => {
          const x = padX + i * (barW + gap);
          const y = yFor(val);
          const barH = padY + chartH - y;

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={8}
              fill={fill}
              stroke={stroke}
              strokeWidth="0.6"
              opacity={0.98}
            />
          );
        })}
      </svg>
    </div>
  );
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

/** ----------------- Metric Tile ----------------- */
function MetricTile({
  icon,
  title,
  subtitle,
  value,
  delta,
  values,
  tone = "slate",
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: string;
  delta: number;
  values: number[];
  tone?: "blue" | "emerald" | "amber" | "slate";
}) {
  const iconTone =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "amber"
        ? "bg-amber-50 text-amber-800"
        : tone === "blue"
          ? "bg-sky-50 text-sky-700"
          : "bg-slate-50 text-slate-700";

  const s = summarizeSeries(values);

  // Compact “educational” copy (1 line + 1 next step)
  const meaning =
    title.toLowerCase().includes("attendance")
      ? s.direction === "Rising"
        ? "Routines are working — attendance is improving."
        : s.direction === "Falling"
          ? "Attendance is dipping — check reminders and parent links."
          : "Attendance is steady — keep the same cadence."
      : title.toLowerCase().includes("sessions")
        ? s.direction === "Rising"
          ? "Delivery pace is increasing — consistency looks strong."
          : "Delivery pace is steady — keep weekly structure."
        : title.toLowerCase().includes("students")
          ? "Learner participation is growing — onboarding looks healthy."
          : "Upcoming activity is changing — plan staffing early.";

  const nextAction =
    title.toLowerCase().includes("attendance")
      ? "Next: follow up absences + confirm parent links."
      : title.toLowerCase().includes("sessions")
        ? "Next: keep Term → Session mapping current."
        : title.toLowerCase().includes("students")
          ? "Next: track joins + engagement quality."
          : "Next: confirm dates + staffing coverage.";

  return (
    <div className="rounded-[22px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_14px_46px_-34px_rgba(2,6,23,0.25)] backdrop-blur">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${iconTone} text-xl`}>
            {icon}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
              <TrendBadge delta={delta} />
            </div>
            <div className="truncate text-xs text-slate-500">{subtitle}</div>
          </div>
        </div>
      </div>

      {/* Value + badges */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div className="text-4xl font-semibold tracking-tight text-slate-900">{value}</div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            Trend: {s.direction}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
            Pattern: {s.stability}
          </span>
        </div>
      </div>

      {/* ✅ Full-width chart (no tiny container) */}
      <div className="mt-4">
        <SparkHistogram values={values} tone={tone} />
        <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>Min: {s.min}</span>
          <span>Max: {s.max}</span>
        </div>
      </div>

      {/* ✅ Compact educational insight (not tall) */}
      <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-3">
        <div className="text-[11px] font-semibold tracking-widest text-slate-500">CLASSROOM INSIGHT</div>
        <div className="mt-1 text-sm font-semibold text-slate-900">{meaning}</div>
        <div className="mt-1 text-xs text-slate-600">{nextAction}</div>
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

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-[120px] items-end gap-3 overflow-hidden">
      {values.map((v, idx) => {
        const ht = Math.round((v / max) * 100);
        return (
          <div key={idx} className="flex w-10 flex-col items-center gap-2">
            <div className="relative h-[96px] w-10 overflow-hidden rounded-2xl bg-slate-100">
              <div
                className="absolute bottom-0 left-0 right-0 rounded-2xl bg-blue-500/70"
                style={{ height: `${ht}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent" />
            </div>
            <div className="h-2 w-6 rounded-full bg-slate-100" />
          </div>
        );
      })}
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

/** ----------------- Pro Analytics Screen ----------------- */
function ProAnalyticsScreen({ clubId, centreName }: { clubId: string; centreName: string }) {
  const tiles = [
    {
      icon: "👥",
      title: "Students enrolled",
      subtitle: "Active learners",
      value: "120",
      delta: 8,
      tone: "blue" as const,
      values: [30, 32, 34, 35, 37, 40, 44, 51, 60, 68, 92, 120],
    },
    {
      icon: "🗓️",
      title: "Sessions delivered",
      subtitle: "This term",
      value: "15",
      delta: 12,
      tone: "slate" as const,
      values: [1, 1, 2, 3, 4, 6, 7, 9, 10, 12, 14, 15],
    },
    {
      icon: "✅",
      title: "Attendance rate",
      subtitle: "Avg. last 6 sessions",
      value: "92%",
      delta: 3,
      tone: "emerald" as const,
      values: [84, 86, 85, 88, 90, 92, 91, 92, 93, 92, 92, 92],
    },
    {
      icon: "📍",
      title: "Upcoming events",
      subtitle: "Next 14 days",
      value: "4",
      delta: -5,
      tone: "amber" as const,
      values: [6, 6, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4],
    },
  ];

  return (
    <section className="mt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-widest text-slate-500">ANALYTICS OVERVIEW</div>
          <div className="mt-1 text-xl font-semibold text-slate-900">Signals, trends, and risks</div>
          <div className="mt-1 truncate text-sm text-slate-600">
            {centreName} • scoped to <span className="font-semibold">{clubId}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            Data freshness: <span className="ml-2 text-emerald-700">Live</span>
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            Quality: <span className="ml-2 text-sky-700">Strong</span>
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((t, idx) => (
          <div key={t.title} className={idx === 3 ? "xl:col-span-3" : ""}>
            <MetricTile {...t} />
          </div>
        ))}
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
        "rounded-[22px] border border-slate-200/70 bg-white shadow-[0_16px_50px_-40px_rgba(2,6,23,0.25)] overflow-hidden",
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
          <h3 className="truncate text-base font-semibold text-slate-900">{title}</h3>
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className={["px-5 pb-5 pt-4 sm:px-6 sm:pb-6", bodyClassName].join(" ")}>
        {children}
      </div>
    </div>
  );
}

/** ----------------- Overview Row ----------------- */
function OverviewRow({
  clubId,
  upcoming,
}: {
  clubId: string;
  upcoming: { title: string; when: string; time: string; icon: string }[];
}) {
  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-slate-500">EXECUTIVE OVERVIEW</div>
          <div className="mt-1 text-lg font-semibold text-slate-900">Today at a glance</div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
            Operational
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-stretch">
        {/* Upcoming */}
        <Card
          title="Upcoming Sessions"
          icon="📅"
          right={
            <Link
              className="text-sm font-semibold text-slate-700 hover:text-slate-900"
              href={`/app/admin/clubs/${clubId}/sessions`}
            >
              View all
            </Link>
          }
          bodyClassName="pt-3"
        >
          <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden">
            {upcoming.map((x, i) => (
              <div
                key={x.title}
                className={[
                  "flex items-center justify-between gap-4 px-4 py-3",
                  i !== 0 ? "border-t border-slate-200/70" : "",
                ].join(" ")}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-lg">
                    {x.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{x.title}</div>
                    <div className="text-xs text-slate-500">Centre delivery</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-700">{x.when}</div>
                    <div className="text-xs text-slate-500">{x.time}</div>
                  </div>
                  <span className="text-slate-400">›</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Tip:</span> Keep session notes short and consistent — this improves AI insights quality.
          </div>
        </Card>

        {/* Attendance */}
        <Card
          title="Attendance Snapshot"
          icon="📊"
          right={
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
              Recent sessions
            </span>
          }
          bodyClassName="pt-3"
        >
          <div className="grid gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Donut value={92} label="Attendance" />
              <div className="w-full rounded-2xl border border-slate-200/70 bg-white px-4 py-4 overflow-hidden">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">Weekly trend</div>
                  <div className="text-xs text-slate-500">last 6</div>
                </div>
                <MiniBars values={[120, 160, 140, 180, 210, 260]} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-slate-200/70 bg-white p-3">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">REGISTER</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Complete</div>
                <div className="mt-1 text-xs text-slate-500">Last session</div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-3">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">CONSISTENCY</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Strong</div>
                <div className="mt-1 text-xs text-slate-500">6-week avg</div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-3">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">RISK</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Low</div>
                <div className="mt-1 text-xs text-slate-500">Absences</div>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Insights */}
        <Card
          title="AI Analytics & Insights"
          icon="🧠"
          right={<span className="text-xs font-semibold text-slate-500">Preview layer</span>}
          bodyClassName="pt-3"
        >
          <div className="space-y-3">
            <InsightCompactRow
              title="2 learners missing parent link"
              desc="Link parents to unlock home dashboards + portfolio access."
              tone="warn"
              tag="Action"
            />
            <InsightCompactRow
              title="Term week mapping incomplete"
              desc="Finish mapping Term → Sessions to improve reporting accuracy."
              tone="info"
              tag="Check"
            />
            <InsightCompactRow
              title="Attendance consistency strong"
              desc="Stable pattern — keep the schedule cadence."
              tone="good"
              tag="Good"
            />

            <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
              <div className="text-[11px] font-semibold tracking-widest text-slate-500">RECOMMENDED NEXT</div>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                <li>• Generate student access links</li>
                <li>• Complete Term → Session mapping</li>
                <li>• Add challenge rubric for scoring</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </section>
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
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />

          {/* ✅ hide scrollbar + add bottom fade */}
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-[380px] border-r border-slate-200 bg-slate-50/60 p-4 backdrop-blur-xl">
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


      {/* DESKTOP LAYOUT */}
      <div className="flex w-full gap-6 px-4 py-6 lg:px-6">
        {/* ✅ Amazon-style sidebar: NO internal scrolling, just sticky */}
        <div className="sticky top-[88px] hidden w-[340px] shrink-0 self-start lg:block">
          <Sidebar clubId={clubId} clubName={centreName} />
          {/* ✅ Removed the extra Logout button under the sidebar */}
        </div>

        <div className="min-w-0 flex-1 pb-10">
          <ProAnalyticsScreen clubId={clubId} centreName={centreName} />
          <OverviewRow clubId={clubId} upcoming={upcoming} />
          {/* Continue your other sections below as needed... */}
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
