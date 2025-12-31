// web/src/app/app/admin/clubs/[clubId]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
      {/* base */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100" />
      {/* dot grid */}
      <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:22px_22px]" />
      {/* glows */}
      <div className="absolute -left-44 top-[-160px] h-[520px] w-[520px] rounded-full bg-sky-200/35 blur-3xl" />
      <div className="absolute -right-56 top-[120px] h-[560px] w-[560px] rounded-full bg-indigo-200/30 blur-3xl" />
      <div className="absolute left-1/3 bottom-[-220px] h-[620px] w-[620px] rounded-full bg-emerald-200/25 blur-3xl" />
    </div>
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

function SparkArea({
  values,
  tone = "blue",
}: {
  values: number[];
  tone?: "blue" | "emerald" | "amber" | "slate";
}) {
  const w = 150;
  const h = 56;
  const pad = 6;

  const hist = values.slice(-12);
  const forecastN = 3;

  // ---- helpers ----
  const mean = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const std = (arr: number[]) => {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    const v = arr.reduce((acc, x) => acc + (x - m) ** 2, 0) / (arr.length - 1);
    return Math.sqrt(v);
  };

  // ---- forecast (simple slope projection based on last 4 steps) ----
  const last = hist[hist.length - 1] ?? 0;
  const tail = hist.slice(-5);
  const diffs: number[] = [];
  for (let i = 1; i < tail.length; i++) diffs.push(tail[i] - tail[i - 1]);
  const slope = diffs.length ? mean(diffs.slice(-4)) : 0;

  const forecast: number[] = Array.from({ length: forecastN }).map((_, i) => {
    const v = last + slope * (i + 1);
    return Math.max(0, Math.round(v * 100) / 100);
  });

  const series = [...hist, ...forecast];

  // ---- moving average overlay (window 3) ----
  const maWindow = 3;
  const movingAvg = series.map((_, i) => {
    const start = Math.max(0, i - (maWindow - 1));
    const window = series.slice(start, i + 1);
    return mean(window);
  });

  // ---- anomaly marker (z-score on last point vs baseline) ----
  const baseline = hist.slice(0, -1).slice(-8);
  const baselineMean = mean(baseline);
  const baselineStd = std(baseline);
  const z = baselineStd > 0 ? (last - baselineMean) / baselineStd : 0;
  const isAnomaly = Math.abs(z) >= 1.6;

  // ---- scales ----
  const max = Math.max(1, ...series);
  const min = Math.min(...series);
  const span = Math.max(1, max - min);

  const xFor = (i: number, n: number) =>
    pad + (i * (w - pad * 2)) / Math.max(1, n - 1);
  const yFor = (v: number) =>
    pad + (1 - (v - min) / span) * (h - pad * 2);

  const points = series.map((v, i) => ({
    x: xFor(i, series.length),
    y: yFor(v),
    v,
  }));
  const pointsHist = points.slice(0, hist.length);
  const pointsFc = points.slice(hist.length - 1); // include last real point + forecast points

  const ptsToStr = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x},${p.y}`).join(" ");

  const lineHist = ptsToStr(pointsHist);
  const lineFc = ptsToStr(pointsFc);

  const maPts = movingAvg.map((v, i) => ({
    x: xFor(i, series.length),
    y: yFor(v),
  }));
  const lineMA = ptsToStr(maPts);

  const area = `M ${pad},${h - pad} L ${pointsHist
    .map((p) => `${p.x},${p.y}`)
    .join(" L ")} L ${pointsHist[pointsHist.length - 1]?.x ?? w - pad},${
    h - pad
  } Z`;

  // ---- tones ----
  const stroke =
    tone === "emerald"
      ? "rgba(16,185,129,0.92)"
      : tone === "amber"
        ? "rgba(245,158,11,0.92)"
        : tone === "slate"
          ? "rgba(100,116,139,0.88)"
          : "rgba(59,130,246,0.92)";

  const fill =
    tone === "emerald"
      ? "rgba(16,185,129,0.12)"
      : tone === "amber"
        ? "rgba(245,158,11,0.12)"
        : tone === "slate"
          ? "rgba(100,116,139,0.10)"
          : "rgba(59,130,246,0.12)";

  const maStroke = "rgba(15,23,42,0.45)";
  const anomalyStroke = "rgba(244,63,94,0.95)";

  const lastHistPt = pointsHist[pointsHist.length - 1];

  return (
    <div className="relative">
      {/* EXECUTIVE LABELS */}
      <div className="absolute -top-4 right-0 flex items-center gap-2">
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          Forecast: +3 sessions
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          MA(3)
        </span>
      </div>

      {/* Target band */}
      <div className="pointer-events-none absolute inset-x-0 top-[18px] h-[18px] rounded-xl bg-slate-100/70" />

      <svg viewBox={`0 0 ${w} ${h}`} className="h-[56px] w-[150px]">
        <line
          x1={pad}
          x2={w - pad}
          y1={h / 2}
          y2={h / 2}
          stroke="rgba(148,163,184,0.30)"
          strokeWidth="1"
        />

        {/* area under HIST only */}
        <path d={area} fill={fill} />

        {/* HIST line */}
        <polyline
          fill="none"
          stroke={stroke}
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={lineHist}
        />

        {/* MA overlay */}
        <polyline
          fill="none"
          stroke={maStroke}
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={lineMA}
          opacity="0.9"
        />

        {/* Forecast tail (dotted) */}
        {forecastN > 0 ? (
          <polyline
            fill="none"
            stroke={stroke}
            strokeWidth="2.25"
            strokeDasharray="2 3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={lineFc}
            opacity="0.9"
          />
        ) : null}

        {/* last real point marker */}
        {lastHistPt ? (
          <>
            <circle cx={lastHistPt.x} cy={lastHistPt.y} r="3.8" fill={stroke} />
            <circle
              cx={lastHistPt.x}
              cy={lastHistPt.y}
              r="7"
              fill={stroke}
              opacity="0.10"
            />

            {/* anomaly ring */}
            {isAnomaly ? (
              <>
                <circle
                  cx={lastHistPt.x}
                  cy={lastHistPt.y}
                  r="6.2"
                  fill="transparent"
                  stroke={anomalyStroke}
                  strokeWidth="2.2"
                />
                <circle
                  cx={lastHistPt.x}
                  cy={lastHistPt.y}
                  r="10"
                  fill={anomalyStroke}
                  opacity="0.08"
                />
              </>
            ) : null}
          </>
        ) : null}
      </svg>

      {isAnomaly ? (
        <div className="mt-1 text-[10px] font-semibold text-rose-700">
          Anomaly detected
        </div>
      ) : null}
    </div>
  );
}

function summarizeSeries(values: number[]) {
  const v = values.slice(-12);
  const first = v[0] ?? 0;
  const last = v[v.length - 1] ?? 0;

  const min = Math.min(...v);
  const max = Math.max(...v);

  const pct =
    first === 0 ? 0 : Math.round(((last - first) / Math.abs(first)) * 100);

  const direction =
    last > first ? "Rising" : last < first ? "Falling" : "Stable";

  let stepSum = 0;
  for (let i = 1; i < v.length; i++) stepSum += Math.abs(v[i] - v[i - 1]);
  const avgStep = v.length > 1 ? stepSum / (v.length - 1) : 0;
  const range = Math.max(1, max - min);
  const volatilityScore = avgStep / range;

  const stability =
    volatilityScore < 0.22
      ? "Stable"
      : volatilityScore < 0.45
        ? "Mixed"
        : "Volatile";

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

  const message =
    s.direction === "Rising"
      ? "Good news: performance is improving across recent sessions."
      : s.direction === "Falling"
        ? "Attention needed: performance is dropping in recent sessions."
        : "Steady: performance is consistent across recent sessions.";

  return (
    <div className="rounded-[26px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_60px_-45px_rgba(2,6,23,0.25)] backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${iconTone} text-xl`}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">
                {title}
              </div>
              <div className="text-xs text-slate-500">{subtitle}</div>
            </div>
          </div>

          <div className="mt-5 flex items-end gap-3">
            <div className="text-4xl font-semibold tracking-tight text-slate-900">
              {value}
            </div>
            <TrendBadge delta={delta} />
          </div>
        </div>

        <div className="sm:shrink-0 sm:text-right">
          <div className="text-[11px] font-semibold text-slate-500">
            Last 12 sessions
          </div>

          <div className="mt-2 w-full max-w-[220px] rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <SparkArea values={values} tone={tone} />

            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-500">
              <span>12 sessions ago</span>
              <span>Now</span>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                Min:{" "}
                <span className="font-semibold text-slate-700">{s.min}</span>
              </span>
              <span>
                Max:{" "}
                <span className="font-semibold text-slate-700">{s.max}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
          Trend: {s.direction}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
          Pattern: {s.stability}
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
          {s.pct >= 0 ? `Up ${s.pct}%` : `Down ${Math.abs(s.pct)}%`} in 12
          sessions
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-600">{message}</p>
    </div>
  );
}

/** ----------------- Charts ----------------- */
function Gauge({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="grid place-items-center">
      <div className="relative grid h-[180px] w-[180px] place-items-center">
        <svg viewBox="0 0 180 180" className="h-[180px] w-[180px]">
          <circle
            cx="90"
            cy="90"
            r={r}
            fill="none"
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="16"
          />
          <circle
            cx="90"
            cy="90"
            r={r}
            fill="none"
            stroke="rgba(59,130,246,0.85)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`}
            transform="rotate(-90 90 90)"
          />
          <circle
            cx="90"
            cy="90"
            r={r - 20}
            fill="rgba(255,255,255,0.95)"
          />
        </svg>

        <div className="absolute text-center">
          <div className="text-5xl font-semibold tracking-tight text-slate-900">
            {pct}%
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-500">
            Attendance
          </div>
          <div className="mt-2 inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500/80" />
            Present
            <span className="ml-1 h-2.5 w-2.5 rounded-full bg-slate-300" />
            Missing
          </div>
        </div>
      </div>
    </div>
  );
}

function BarTrend({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-[180px] items-end gap-4">
      {values.map((v, i) => {
        const ht = Math.round((v / max) * 100);
        return (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="relative h-[150px] w-10 overflow-hidden rounded-2xl bg-slate-100">
              <div
                className="absolute bottom-0 left-0 right-0 rounded-2xl bg-blue-500/70"
                style={{ height: `${ht}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/45 via-transparent to-transparent" />
            </div>
            <div className="h-2 w-6 rounded-full bg-slate-100" />
          </div>
        );
      })}
    </div>
  );
}

function LineChart({ values }: { values: number[] }) {
  const w = 520;
  const h = 180;
  const pad = 14;

  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);

  const pts = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (values.length - 1);
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return `${x},${y}`;
  });

  const area = `M ${pad},${h - pad} L ${pts.join(" L ")} L ${w - pad},${
    h - pad
  } Z`;

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">
          Engagement trend
        </div>
        <div className="text-xs text-slate-500">last 12 sessions</div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-[180px] w-full">
        {Array.from({ length: 4 }).map((_, i) => (
          <line
            key={i}
            x1={pad}
            x2={w - pad}
            y1={pad + (i * (h - pad * 2)) / 3}
            y2={pad + (i * (h - pad * 2)) / 3}
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="1"
          />
        ))}

        <path d={area} fill="rgba(59,130,246,0.12)" />
        <polyline
          fill="none"
          stroke="rgba(59,130,246,0.85)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={pts.join(" ")}
        />
        {pts.map((p, i) => {
          const [x, y] = p.split(",").map(Number);
          return (
            <circle key={i} cx={x} cy={y} r="5" fill="rgba(59,130,246,0.85)" />
          );
        })}
      </svg>
    </div>
  );
}

/** ----------------- Insight Rows ----------------- */
function InsightRow({
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
  const pill =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-sky-200 bg-sky-50 text-sky-900";

  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white p-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <div className="mt-1 text-xs text-slate-600">{desc}</div>
      </div>
      <span
        className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${pill}`}
      >
        {tag}
      </span>
    </div>
  );
}

/** ----------------- Pro Analytics Screen ----------------- */
function ProAnalyticsScreen({
  clubId,
  centreName,
}: {
  clubId: string;
  centreName: string;
}) {
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
    <div className="mt-4">
      <div className="rounded-[28px] border border-white/70 bg-white/80 shadow-[0_18px_60px_-45px_rgba(2,6,23,0.30)] backdrop-blur">
        <div className="flex flex-col gap-3 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              ANALYTICS OVERVIEW
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-900">
              Signals, trends, and risks
            </div>
            <div className="mt-1 truncate text-sm text-slate-600">
              {centreName} • scoped to{" "}
              <span className="font-semibold">{clubId}</span>
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

        <div className="grid gap-5 px-6 pb-6 sm:grid-cols-2">
          {tiles.map((t) => (
            <MetricTile key={t.title} {...t} />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_-45px_rgba(2,6,23,0.25)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-500">
                ANALYSIS DIAGRAMS
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                Centre performance visuals
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Attendance, engagement, and delivery consistency in one place.
              </div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 text-lg">
              📈
            </div>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/70 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">
                  Attendance gauge
                </div>
                <div className="text-xs text-slate-500">this term</div>
              </div>
              <div className="mt-4">
                <Gauge value={92} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">
                  Weekly delivery trend
                </div>
                <div className="text-xs text-slate-500">last 6</div>
              </div>
              <div className="mt-5">
                <BarTrend values={[120, 160, 140, 180, 210, 260]} />
              </div>
            </div>

            <div className="lg:col-span-2">
              <LineChart values={[60, 64, 63, 68, 72, 75, 74, 76, 79, 83, 84, 88]} />
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_60px_-45px_rgba(2,6,23,0.25)] backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold tracking-widest text-slate-500">
                AI INSIGHTS
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                What’s happening + next actions
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Admin-ready recommendations (wire later).
              </div>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 text-lg">
              🧠
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <InsightRow
              title="2 learners missing parent link"
              desc="Link parent accounts to unlock home dashboards + portfolio access."
              tone="warn"
              tag="Action"
            />
            <InsightRow
              title="Term week mapping incomplete"
              desc="Finish mapping Term → Sessions to improve reporting accuracy."
              tone="info"
              tag="Check"
            />
            <InsightRow
              title="Attendance consistency strong"
              desc="Stable attendance pattern — keep the same schedule cadence."
              tone="good"
              tag="Good"
            />
          </div>

          <div className="mt-5 rounded-3xl border border-slate-200/70 bg-slate-50 p-5">
            <div className="text-xs font-semibold tracking-widest text-slate-500">
              RECOMMENDED NEXT
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>• Generate student access links for new learners</li>
              <li>• Complete Term → Session mapping for Term 1</li>
              <li>• Add challenge rubric for consistent scoring</li>
              <li>• Enable parent linking for home progress visibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ----------------- Generic Card ----------------- */
function Card({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-slate-200/70 bg-white shadow-[0_16px_50px_-40px_rgba(2,6,23,0.25)]">
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
        {right ? (
          <div className="shrink-0 text-sm text-slate-500">{right}</div>
        ) : null}
      </div>
      <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">{children}</div>
    </div>
  );
}

function InsightPill({ tone, label }: { tone: "good" | "warn" | "info"; label: string }) {
  const cls =
    tone === "good"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : tone === "warn"
        ? "bg-amber-50 text-amber-900 border-amber-200"
        : "bg-sky-50 text-sky-800 border-sky-200";

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

/** ----------------- Mini visuals ----------------- */
function Donut({ value = 92, label = "Attendance" }: { value?: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="flex items-center gap-5">
      <div className="relative grid h-[140px] w-[140px] place-items-center">
        <svg viewBox="0 0 140 140" className="h-[140px] w-[140px]">
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
    <div className="flex h-[140px] items-end gap-3 pr-2">
      {values.map((v, idx) => {
        const ht = Math.round((v / max) * 100);
        return (
          <div key={idx} className="flex w-10 flex-col items-center gap-2">
            <div className="relative h-[120px] w-10 overflow-hidden rounded-2xl bg-slate-100">
              <div className="absolute bottom-0 left-0 right-0 rounded-2xl bg-blue-500/70" style={{ height: `${ht}%` }} />
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent" />
            </div>
            <div className="h-2 w-6 rounded-full bg-slate-100" />
          </div>
        );
      })}
    </div>
  );
}

/** ----------------- Sidebar ----------------- */
function NavItem({
  href,
  icon,
  label,
  desc,
  badge,
  onNavigate,
}: {
  href: string;
  icon: string;
  label: string;
  desc?: string;
  badge?: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-3 shadow-[0_10px_28px_-24px_rgba(2,6,23,0.35)] transition hover:-translate-y-[1px] hover:bg-white"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-lg">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
          {badge ? (
            <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              {badge}
            </span>
          ) : null}
        </div>
        {desc ? <p className="mt-0.5 text-xs text-slate-600">{desc}</p> : null}
      </div>
      <span className="ml-auto mt-2 shrink-0 text-slate-400 transition group-hover:text-slate-700">›</span>
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
  return (
    <aside className="flex h-full w-full flex-col gap-4">
      <div className="rounded-[22px] border border-white/70 bg-white/80 p-4 shadow-[0_18px_60px_-45px_rgba(2,6,23,0.30)] backdrop-blur">
        <div className="text-xs font-semibold tracking-widest text-slate-500">CENTRE</div>
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

      <div className="rounded-[22px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_60px_-45px_rgba(2,6,23,0.26)] backdrop-blur">
        <div className="text-xs font-semibold tracking-widest text-slate-500">ADMIN CONTROLS</div>

        <div className="mt-3 space-y-2">
          <NavItem
            href={`/app/admin/clubs/${clubId}/sessions`}
            icon="🗓️"
            label="Sessions"
            desc="Create & manage delivery"
            badge="Core"
            onNavigate={onNavigate}
          />
          <NavItem
            href={`/app/admin/clubs/${clubId}/attendance`}
            icon="✅"
            label="Attendance"
            desc="Registers, notes, flags"
            badge="Core"
            onNavigate={onNavigate}
          />
          <NavItem
            href={`/app/admin/clubs/${clubId}/terms`}
            icon="📚"
            label="Terms & Lessons"
            desc="Structure + mapping"
            onNavigate={onNavigate}
          />
          <NavItem
            href={`/app/admin/clubs/${clubId}/challenges`}
            icon="🏆"
            label="Challenges"
            desc="Outcomes & scoring"
            onNavigate={onNavigate}
          />
          <NavItem
            href={`/app/admin/clubs/${clubId}/activities`}
            icon="🤖"
            label="Robotics Activities"
            desc="Builds, kits, uploads"
            onNavigate={onNavigate}
          />
          <NavItem
            href={`/app/admin/clubs/${clubId}/reports`}
            icon="📈"
            label="Reports"
            desc="Parent + funder ready"
            onNavigate={onNavigate}
          />
        </div>

        <div className="mt-4 border-t border-slate-200/60 pt-4">
          <div className="text-xs font-semibold tracking-widest text-slate-500">PEOPLE</div>
          <div className="mt-3 space-y-2">
            <NavItem
              href={`/app/admin/clubs/${clubId}/people`}
              icon="👥"
              label="People Management"
              desc="Teachers, students, parents"
              onNavigate={onNavigate}
            />
            <NavItem
              href={`/app/admin/clubs/${clubId}/students`}
              icon="🧒🏽"
              label="Student Access"
              desc="Generate link / PIN"
              onNavigate={onNavigate}
            />
            <NavItem
              href={`/app/admin/clubs/${clubId}/parents`}
              icon="👨‍👩‍👧‍👦"
              label="Parent Linking"
              desc="Connect parent accounts"
              onNavigate={onNavigate}
            />
          </div>
        </div>
      </div>

      <div className="rounded-[22px] border border-white/70 bg-white/75 p-4 shadow-[0_18px_60px_-45px_rgba(2,6,23,0.22)] backdrop-blur">
        <div className="text-xs font-semibold tracking-widest text-slate-500">QUICK ACTIONS</div>
        <div className="mt-3 grid gap-2">
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

  const alerts = useMemo(
    () => [
      { title: "2 students missing parent link", tone: "warn" as const, tag: "Action" },
      { title: "Term 1 week mapping incomplete", tone: "info" as const, tag: "Check" },
      { title: "Attendance consistency strong", tone: "good" as const, tag: "Good" },
    ],
    []
  );

  if (checking || loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        {/* ✅ FULL-WIDTH LOADING (no mx-auto/max-w) */}
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

      {/* MOBILE TOP BAR */}
      <div className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl lg:hidden">
        {/* ✅ FULL-WIDTH (no mx-auto/max-w) */}
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            ☰
          </button>

          <div className="min-w-0 text-center">
            <div className="truncate text-sm font-semibold text-slate-900">Club Command Centre</div>
            <div className="truncate text-xs text-slate-600">{centreName}</div>
          </div>

          <button
            type="button"
            onClick={() => logout("manual")}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </div>

      {/* MOBILE SIDEBAR DRAWER */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-[360px] overflow-y-auto border-r border-slate-200 bg-slate-50/60 p-4 backdrop-blur-xl">
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
          </div>
        </div>
      ) : null}

      {/* DESKTOP LAYOUT */}
      {/* ✅ FULL-WIDTH WRAPPER (removed mx-auto/max-w-7xl) */}
      <div className="flex w-full gap-6 px-4 py-6">
        {/* LEFT SIDEBAR (desktop) */}
        <div className="sticky top-6 hidden h-[calc(100vh-24px)] w-[340px] shrink-0 overflow-y-auto lg:block">
          <Sidebar clubId={clubId} clubName={centreName} />
          <div className="mt-4">
            <button
              type="button"
              onClick={() => logout("manual")}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="min-w-0 flex-1 pb-10">
          {/* Desktop top header (inside content) */}
          <div className="hidden lg:block">
            <div className="rounded-[22px] border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_-45px_rgba(2,6,23,0.28)] backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-widest text-slate-500">ADMIN • {centreName}</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Club Command Centre</h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Sessions, terms, attendance, challenges, robotics activity, and AI insights — all scoped to this centre.
                    <span className="ml-2 inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
                      ID: {clubId}
                    </span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/app/admin"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    ← Back
                  </Link>
                  <Link
                    href="/app/admin/invites"
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Invite users
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* EXEC DASHBOARD */}
          <ProAnalyticsScreen clubId={clubId} centreName={centreName} />

          {/* MAIN GRID: Left + Right */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
            {/* LEFT */}
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card
                  title="Upcoming Sessions"
                  icon="📋"
                  right={
                    <Link className="text-sm font-semibold text-slate-700 hover:text-slate-900" href={`/app/admin/clubs/${clubId}/sessions`}>
                      View all
                    </Link>
                  }
                >
                  <div className="divide-y divide-slate-200/70 overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
                    {upcoming.map((x) => (
                      <div key={x.title} className="flex items-center justify-between gap-4 px-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-50 text-xl">{x.icon}</div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{x.title}</div>
                            <div className="text-xs text-slate-500">Centre schedule</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-700">{x.when}</div>
                            <div className="text-xs text-slate-500">{x.time}</div>
                          </div>
                          <span className="text-slate-400">›</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card
                  title="Attendance Overview"
                  icon="📊"
                  right={
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                      Recent sessions
                    </span>
                  }
                >
                  <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
                    <Donut value={92} label="Attendance" />
                    <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-900">Weekly trend</div>
                        <div className="text-xs text-slate-500">last 6</div>
                      </div>
                      <MiniBars values={[120, 160, 140, 180, 210, 260]} />
                    </div>
                  </div>
                </Card>
              </div>

              <Card
                title="People Management"
                icon="👥"
                right={
                  <Link className="text-sm font-semibold text-slate-700 hover:text-slate-900" href={`/app/admin/clubs/${clubId}/people`}>
                    Manage
                  </Link>
                }
              >
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                    <p className="text-xs font-semibold tracking-widest text-slate-500">TEACHERS</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">—</p>
                    <p className="mt-1 text-xs text-slate-500">Active staff this term</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                    <p className="text-xs font-semibold tracking-widest text-slate-500">STUDENTS</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">120</p>
                    <p className="mt-1 text-xs text-slate-500">Enrolled learners</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
                    <p className="text-xs font-semibold tracking-widest text-slate-500">PARENTS</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">—</p>
                    <p className="mt-1 text-xs text-slate-500">Linked accounts</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <InsightPill tone="good" label="Engagement rising" />
                  <InsightPill tone="info" label="Portfolio update needed" />
                  <InsightPill tone="warn" label="2 missing links" />
                </div>
              </Card>

              <div className="rounded-[22px] border border-slate-200/70 bg-white p-4 text-sm text-slate-600 shadow-[0_16px_50px_-40px_rgba(2,6,23,0.22)]">
                <span className="font-semibold text-slate-900">Next step:</span> wire every block to Supabase and filter by centre ID:{" "}
                <span className="font-semibold">{clubId}</span>.{" "}
                <span className="text-slate-500">(UI is ready — data layer comes next.)</span>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-6">
              <Card title="AI Analytics & Insights" icon="🧠" right={<span className="text-xs font-semibold text-slate-500">Preview layer</span>}>
                <div className="grid gap-3">
                  {[
                    {
                      title: "Parent Insight",
                      desc: "Highlights for parents: attendance pattern, engagement trend, photo uploads, strengths.",
                      icon: "👨‍👩‍👧‍👦",
                      pills: [
                        <InsightPill key="p1" tone="good" label="Engagement rising" />,
                        <InsightPill key="p2" tone="info" label="Portfolio update needed" />,
                      ],
                    },
                    {
                      title: "Student Insight",
                      desc: "Fun, visual progress: builds completed, badges, challenge milestones.",
                      icon: "🧒🏽",
                      pills: [
                        <InsightPill key="s1" tone="good" label="2 badges earned" />,
                        <InsightPill key="s2" tone="info" label="New build uploaded" />,
                      ],
                    },
                    {
                      title: "Session Quality",
                      desc: "Flags delivery issues: low participation, missing notes, repeated absences.",
                      icon: "🗒️",
                      pills: [
                        <InsightPill key="q1" tone="warn" label="2 missing registers" />,
                        <InsightPill key="q2" tone="good" label="Strong session notes" />,
                      ],
                    },
                    {
                      title: "Challenge Performance",
                      desc: "Tracks challenge outcomes, common errors, and improvement suggestions.",
                      icon: "🏆",
                      pills: [
                        <InsightPill key="c1" tone="info" label="Top skill: teamwork" />,
                        <InsightPill key="c2" tone="warn" label="Needs: problem-solving" />,
                      ],
                    },
                  ].map((x) => (
                    <div key={x.title} className="rounded-2xl border border-slate-200/70 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{x.title}</p>
                          <p className="mt-1 text-xs text-slate-600">{x.desc}</p>
                          <div className="mt-2 flex flex-wrap gap-2">{x.pills}</div>
                        </div>
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-lg">
                          {x.icon}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Alerts & Admin To-Do" icon="🚦" right={<span className="text-xs font-semibold text-slate-500">Live later</span>}>
                <div className="space-y-3">
                  {alerts.map((a, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200/70 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                          <p className="mt-1 text-xs text-slate-600">Click into the relevant section to resolve.</p>
                        </div>
                        <InsightRow title="" desc="" tone={a.tone} tag={a.tag} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Centre Setup Quality" icon="🧩">
                <div className="space-y-3">
                  {[
                    { t: "Term weeks mapped to sessions", ok: true },
                    { t: "At least 1 teacher assigned", ok: true },
                    { t: "Attendance templates ready", ok: true },
                    { t: "Parent linking enabled", ok: false },
                    { t: "Challenge rubric created", ok: false },
                  ].map((x) => (
                    <div key={x.t} className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-3">
                      <div
                        className={[
                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border",
                          x.ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500",
                        ].join(" ")}
                      >
                        {x.ok ? "✓" : "•"}
                      </div>
                      <p className="text-sm text-slate-700">{x.t}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

