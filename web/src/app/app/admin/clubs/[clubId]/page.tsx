// web/src/app/app/admin/clubs/[clubId]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAdminGuard } from "@/lib/admin/admin-guard";

type Club = { id: string; name: string };

function formatTitle(name?: string) {
  const n = (name || "").trim();
  return n ? n : "Club centre";
}

/** ---------- UI building blocks ---------- */

function Card({
  title,
  icon,
  right,
  children,
}: {
  title: string;
  icon?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
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
          <h3 className="truncate text-base font-semibold text-slate-900">{title}</h3>
        </div>
        {right ? <div className="shrink-0 text-sm text-slate-500">{right}</div> : null}
      </div>
      <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">{children}</div>
    </div>
  );
}

function KpiStrip({
  items,
}: {
  items: { label: string; value: string; icon: string; tone?: "blue" | "emerald" | "amber" | "slate" }[];
}) {
  const toneCls = (t?: string) => {
    switch (t) {
      case "emerald":
        return "bg-emerald-50 text-emerald-700";
      case "amber":
        return "bg-amber-50 text-amber-800";
      case "blue":
        return "bg-sky-50 text-sky-700";
      default:
        return "bg-slate-50 text-slate-700";
    }
  };

  return (
    <div className="overflow-hidden rounded-[22px] border border-slate-200/70 bg-white shadow-[0_16px_50px_-40px_rgba(2,6,23,0.25)]">
      <div className="grid divide-y divide-slate-200/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {items.map((k) => (
          <div key={k.label} className="flex min-w-0 items-center gap-4 px-5 py-5 sm:px-6">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${toneCls(k.tone)} text-xl`}>
              {k.icon}
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-semibold tracking-tight text-slate-900">{k.value}</div>
              <div className="truncate text-sm font-semibold text-slate-500">{k.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Simple donut chart (SVG) */
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

/** Simple bar chart (CSS bars) */
function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-[140px] items-end gap-3 pr-2">
      {values.map((v, idx) => {
        const h = Math.round((v / max) * 100);
        return (
          <div key={idx} className="flex w-10 flex-col items-center gap-2">
            <div className="relative h-[120px] w-10 overflow-hidden rounded-2xl bg-slate-100">
              <div className="absolute bottom-0 left-0 right-0 rounded-2xl bg-blue-500/70" style={{ height: `${h}%` }} />
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent" />
            </div>
            <div className="h-2 w-6 rounded-full bg-slate-100" />
          </div>
        );
      })}
    </div>
  );
}

function ActionTile({
  title,
  desc,
  icon,
  href,
  badge,
}: {
  title: string;
  desc: string;
  icon: string;
  href: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[22px] border border-slate-200/70 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
            {badge ? (
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                {badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-600">{desc}</p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-lg">{icon}</div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-slate-500">Open</p>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition group-hover:bg-slate-50">
          →
        </span>
      </div>
    </Link>
  );
}

function InsightPill({ tone, label }: { tone: "good" | "warn" | "info"; label: string }) {
  const cls =
    tone === "good"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : tone === "warn"
      ? "bg-amber-50 text-amber-900 border-amber-200"
      : "bg-sky-50 text-sky-800 border-sky-200";

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cls}`}>{label}</span>;
}

/** ---------- Page ---------- */

export default function ClubCentreDashboardPage() {
  const router = useRouter();
  const params = useParams<{ clubId: string }>();
  const clubId = params.clubId;

  const { checking, supabase, logout } = useAdminGuard({ idleMinutes: 15 });

  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<Club | null>(null);

  useEffect(() => {
    if (checking) return;

    let cancelled = false;

    async function loadClub() {
      setLoading(true);
      try {
        const { data, error } = await supabase.from("clubs").select("id, name").eq("id", clubId).single();
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

  const topKpis = useMemo(
    () => [
      { label: "Students Enrolled", value: "120", icon: "👥", tone: "blue" as const },
      { label: "Sessions Logged", value: "15", icon: "🗓️", tone: "slate" as const },
      { label: "Attendance Rate", value: "92%", icon: "✅", tone: "emerald" as const },
      { label: "Upcoming Events", value: "4", icon: "📍", tone: "amber" as const },
    ],
    []
  );

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
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="h-10 w-72 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="mt-6 h-[520px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-clip text-slate-900">
      {/* Clean school-style background (hero-like) */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="absolute -left-40 top-[-140px] h-[520px] w-[520px] rounded-full bg-sky-200/28 blur-3xl" />
        <div className="absolute -right-44 top-[120px] h-[560px] w-[560px] rounded-full bg-indigo-200/22 blur-3xl" />
      </div>

      {/* Fixed header */}
      <header className="fixed inset-x-0 top-0 z-50 w-full max-w-[100vw] overflow-x-clip border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-slate-500">ADMIN • {formatTitle(club?.name)}</p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Club Command Centre</h1>
            <p className="mt-1 text-sm text-slate-600">
              Sessions, terms, attendance, challenges, robotics activity, and AI insights — all scoped to this centre.
              <span className="ml-2 hidden sm:inline-flex rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700">
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

            <button
              type="button"
              onClick={() => logout("manual")}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* spacer for fixed header (ONLY ONCE) */}
      <div aria-hidden className="h-[118px] md:h-[92px]" />

      <section className="mx-auto max-w-7xl px-4 pb-14">
        {/* Top KPI strip */}
        <KpiStrip items={topKpis} />

        {/* MAIN GRID: Left + Right */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
          {/* LEFT */}
          <div className="space-y-6">
            <Card title="Admin Control Hub" icon="🧭" right={<span className="text-xs font-semibold text-slate-500">School-grade controls</span>}>
              <div className="grid gap-3 sm:grid-cols-2">
                <ActionTile title="Create Session" desc="Schedule weekly delivery + map to term weeks" icon="🗓️" badge="Core" href={`/app/admin/clubs/${clubId}/sessions`} />
                <ActionTile title="Take Attendance" desc="Fast register + behaviour notes + flags" icon="✅" badge="Core" href={`/app/admin/clubs/${clubId}/attendance`} />
                <ActionTile title="Terms & Lessons" desc="Build term structure, lesson list, and mapping" icon="📚" href={`/app/admin/clubs/${clubId}/terms`} />
                <ActionTile title="Challenges" desc="Track challenge performance + outcomes" icon="🏆" href={`/app/admin/clubs/${clubId}/challenges`} />
                <ActionTile title="Robotics Activities" desc="Log builds, kits, photos, and learning outcomes" icon="🤖" href={`/app/admin/clubs/${clubId}/activities`} />
                <ActionTile title="Reports" desc="Parent-ready + funder-ready summaries" icon="📈" href={`/app/admin/clubs/${clubId}/reports`} />
              </div>
            </Card>

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

              <Card title="Attendance Overview" icon="📊" right={<span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" />Recent sessions</span>}>
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

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ActionTile title="Create Student Access" desc="Generate access link / pin for student dashboard" icon="🧒🏽" href={`/app/admin/clubs/${clubId}/students`} />
                <ActionTile title="Create Parent Access" desc="Link parent accounts to learners" icon="👨‍👩‍👧‍👦" href={`/app/admin/clubs/${clubId}/parents`} />
              </div>
            </Card>
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
                    pills: [<InsightPill key="p1" tone="good" label="Engagement rising" />, <InsightPill key="p2" tone="info" label="Portfolio update needed" />],
                  },
                  {
                    title: "Student Insight",
                    desc: "Fun, visual progress: builds completed, badges, challenge milestones.",
                    icon: "🧒🏽",
                    pills: [<InsightPill key="s1" tone="good" label="2 badges earned" />, <InsightPill key="s2" tone="info" label="New build uploaded" />],
                  },
                  {
                    title: "Session Quality",
                    desc: "Flags delivery issues: low participation, missing notes, repeated absences.",
                    icon: "🗒️",
                    pills: [<InsightPill key="q1" tone="warn" label="2 missing registers" />, <InsightPill key="q2" tone="good" label="Strong session notes" />],
                  },
                  {
                    title: "Challenge Performance",
                    desc: "Tracks challenge outcomes, common errors, and improvement suggestions.",
                    icon: "🏆",
                    pills: [<InsightPill key="c1" tone="info" label="Top skill: teamwork" />, <InsightPill key="c2" tone="warn" label="Needs: problem-solving" />],
                  },
                ].map((x) => (
                  <div key={x.title} className="rounded-2xl border border-slate-200/70 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{x.title}</p>
                        <p className="mt-1 text-xs text-slate-600">{x.desc}</p>
                        <div className="mt-2 flex flex-wrap gap-2">{x.pills}</div>
                      </div>
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-lg">{x.icon}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Alerts & Admin To-Do" icon="🚦" right={<span className="text-xs font-semibold text-slate-500">Live later</span>}>
              <div className="space-y-3">
                {alerts.map((a, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                      <p className="mt-1 text-xs text-slate-600">Click into the relevant section to resolve.</p>
                    </div>
                    <InsightPill tone={a.tone} label={a.tag} />
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

        <div className="mt-6 rounded-[22px] border border-slate-200/70 bg-white p-4 text-sm text-slate-600 shadow-[0_16px_50px_-40px_rgba(2,6,23,0.22)]">
          <span className="font-semibold text-slate-900">Next step:</span> wire every block to Supabase and filter by centre ID:{" "}
          <span className="font-semibold">{clubId}</span>. <span className="text-slate-500">(UI is ready — data layer comes next.)</span>
        </div>
      </section>
    </main>
  );
}
