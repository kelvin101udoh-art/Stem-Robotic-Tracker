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

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-600">Progress (last 12)</div>
          <div className="text-[11px] font-semibold text-slate-500">
            Min {min} • Max {max}
          </div>
        </div>

        <div className="relative w-full">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
            <defs>
              <linearGradient id={`area-${tone}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
                <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id={`gridfade`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(15,23,42,0.12)" />
                <stop offset="100%" stopColor="rgba(15,23,42,0.03)" />
              </linearGradient>
            </defs>

            {/* subtle grid */}
            {[0.25, 0.5, 0.75].map((t, i) => {
              const y = padY + t * (h - padY * 2);
              return (
                <line
                  key={i}
                  x1={padX}
                  x2={w - padX}
                  y1={y}
                  y2={y}
                  stroke="url(#gridfade)"
                  strokeWidth="1"
                />
              );
            })}

            {/* goal band */}
            {showGoal ? (
              <rect
                x={padX}
                y={Math.max(padY, goalY - 10)}
                width={w - padX * 2}
                height={20}
                rx={10}
                fill="rgba(15,23,42,0.04)"
              />
            ) : null}

            {/* area */}
            <path d={areaD} fill={`url(#area-${tone})`} />

            {/* line */}
            <path
              d={lineD}
              fill="none"
              stroke={stroke}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* end marker */}
            {pts.length ? (
              <circle
                cx={pts[pts.length - 1].x}
                cy={pts[pts.length - 1].y}
                r="5.5"
                fill="white"
                stroke={stroke}
                strokeWidth="3"
              />
            ) : null}
          </svg>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
          <span>Start: {v[0]}</span>
          <span>Now: {v[v.length - 1]}</span>
        </div>
      </div>
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

  return (
    <div className="rounded-[22px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_14px_46px_-34px_rgba(2,6,23,0.25)] backdrop-blur">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${iconTone} text-xl`}>
              {icon}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
              <div className="truncate text-xs text-slate-500">{subtitle}</div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="text-4xl font-semibold tracking-tight text-slate-900">{value}</div>
            <TrendBadge delta={delta} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              Trend: {s.direction}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
              Pattern: {s.stability}
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] font-semibold text-slate-500">Last 12</div>
          <div className="mt-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-semibold text-slate-600">
            Forecast: +3 • MA(3)
          </div>
        </div>
      </div>

      {/* Full-width chart */}
      <div className="mt-3">
        <EducationProgress
          values={values}
          unitLabel="Participation & delivery signal"
          // optional: set “target band” per tile
          targetMin={tone === "emerald" ? 88 : undefined}
          targetMax={tone === "emerald" ? 95 : undefined}
        />
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

      <div className="mt-5 grid gap-5 sm:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3">
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
    <section  className={[
        "mt-8",
        wide
          ? "relative left-1/2 right-1/2 -mx-[50vw] w-screen overflow-x-hidden"
          : "",
      ].join(" ")}>
         <div className={wide ? "mx-auto w-full max-w-[1200px] px-4 lg:px-6" : ""}>
        {/* ...KEEP ALL YOUR EXISTING OverviewRow CONTENT HERE... */}
      </div>
      
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold tracking-widest text-slate-500">
            EXECUTIVE OVERVIEW
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            Today at a glance
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Quick operational + learning signals for planning delivery.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
            Operational
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            Update window: <span className="ml-2 text-slate-900">Last 24h</span>
          </span>
        </div>
      </div>

      {/* ✅ MAIN EXEC CARDS GRID (activates at lg, not xl) */}
      <div className="grid gap-6 items-stretch lg:grid-cols-12">
        {/* Upcoming */}
        <Card
          className="lg:col-span-5"
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
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {x.title}
                    </div>
                    <div className="text-xs text-slate-500">Centre delivery</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-700">
                      {x.when}
                    </div>
                    <div className="text-xs text-slate-500">{x.time}</div>
                  </div>
                  <span className="text-slate-400">›</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-3 text-xs text-slate-700">
            <span className="font-semibold text-slate-900">Teaching tip:</span>{" "}
            Capture a 1–2 sentence note per session (what was built + what learners improved).
          </div>
        </Card>

        {/* Attendance */}
        <Card
          className="lg:col-span-4"
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
            {/* ✅ switch side-by-side at md to avoid cramping on sm */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <Donut value={92} label="Attendance" />

              <div className="w-full min-w-0 rounded-2xl border border-slate-200/70 bg-white px-4 py-4 overflow-hidden">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">
                    Weekly participation
                  </div>
                  <div className="text-xs text-slate-500">last 6</div>
                </div>

                {/* ✅ PROFESSIONAL WIDE HISTOGRAM */}
                <MiniBarsWide
                  values={[120, 160, 140, 180, 210, 260]}
                  labels={["W1", "W2", "W3", "W4", "W5", "W6"]}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-slate-200/70 bg-white p-3">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                  REGISTER
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  Complete
                </div>
                <div className="mt-1 text-xs text-slate-500">Last session</div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-3">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                  CONSISTENCY
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  Strong
                </div>
                <div className="mt-1 text-xs text-slate-500">6-week avg</div>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-white p-3">
                <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                  RISK
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Low</div>
                <div className="mt-1 text-xs text-slate-500">Absences</div>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Insights */}
        <Card
          className="lg:col-span-3"
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
              <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                RECOMMENDED NEXT
              </div>
              <ul className="mt-2 space-y-2 text-sm text-slate-700">
                <li>• Generate student access links</li>
                <li>• Complete Term → Session mapping</li>
                <li>• Add challenge rubric for scoring</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* ✅ ADVANCED EDUCATION EXEC PANEL */}
      <div className="mt-6 rounded-[22px] border border-slate-200/70 bg-white/85 p-5 shadow-[0_16px_50px_-40px_rgba(2,6,23,0.25)] backdrop-blur">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              EDUCATION EXECUTIVE PANEL
            </div>
            <div className="mt-1 text-base font-semibold text-slate-900">
              Learning delivery signals (teacher-friendly)
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Designed to help you plan sessions, improve engagement, and keep reporting consistent.
            </div>
          </div>

          <Link
            href={`/app/admin/clubs/${clubId}/reports`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Open Reports →
          </Link>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {execSignals.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-slate-200/70 bg-white p-4"
            >
              <div className="text-[11px] font-semibold tracking-widest text-slate-500">
                {s.label.toUpperCase()}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-lg font-semibold text-slate-900">{s.value}</div>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneBadge(s.tone)}`}
                >
                  {s.tone === "good" ? "Good" : s.tone === "warn" ? "Action" : "Info"}
                </span>
              </div>
              <div className="mt-1 text-sm text-slate-600">{s.hint}</div>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
            <div className="text-[11px] font-semibold tracking-widest text-slate-500">
              NEXT TEACHING MOVE
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              Add a 3-point rubric for the next build challenge
            </div>
            <div className="mt-1 text-sm text-slate-600">
              This improves assessment consistency and makes parent portfolios clearer.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
            <div className="text-[11px] font-semibold tracking-widest text-slate-500">
              PARENT ENGAGEMENT
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              Link missing parent accounts this week
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Parents get the home dashboard + learners get a portfolio story they can share.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
            <div className="text-[11px] font-semibold tracking-widest text-slate-500">
              REPORTING CONSISTENCY
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              Complete Term → Session mapping
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Unlocks clean weekly trends and reduces “missing data” flags in reports.
            </div>
          </div>
        </div>
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



      {/* DESKTOP LAYOUT (full-bleed to escape parent max-width containers) */}
      <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
        <div className="flex w-full gap-6 px-4 py-6 lg:px-6">
          {/* ✅ Amazon-style sidebar: NO internal scrolling, just sticky */}
          <div className="sticky top-[88px] hidden w-[340px] shrink-0 self-start lg:block">
            <Sidebar clubId={clubId} clubName={centreName} />
          </div>

          <div className="min-w-0 flex-1 pb-10">
            <ProAnalyticsScreen clubId={clubId} centreName={centreName} />
            <OverviewRow clubId={clubId} upcoming={upcoming} wide />
            {/* Continue your other sections below as needed... */}
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
