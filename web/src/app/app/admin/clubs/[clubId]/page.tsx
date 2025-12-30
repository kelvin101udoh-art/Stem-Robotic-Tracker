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

/** Simple donut chart (SVG) */
function Donut({
  value = 92,
  label = "Attendance Rate",
}: {
  value?: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = 54;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="flex items-center gap-5">
      <div className="relative grid h-[140px] w-[140px] place-items-center">
        <svg viewBox="0 0 140 140" className="h-[140px] w-[140px]">
          {/* track */}
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            stroke="rgba(148,163,184,0.35)"
            strokeWidth="14"
          />
          {/* progress */}
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
          {/* soft inner ring */}
          <circle
            cx="70"
            cy="70"
            r={r - 18}
            fill="rgba(255,255,255,0.9)"
          />
        </svg>

        <div className="absolute text-center">
          <div className="text-4xl font-semibold tracking-tight text-slate-900">
            {pct}%
          </div>
          <div className="mt-1 text-xs font-semibold text-slate-500">{label}</div>
        </div>
      </div>

      {/* little legend pills */}
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
              <div
                className="absolute bottom-0 left-0 right-0 rounded-2xl bg-blue-500/70"
                style={{ height: `${h}%` }}
              />
              {/* subtle gloss */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent" />
            </div>
            <div className="h-2 w-6 rounded-full bg-slate-100" />
          </div>
        );
      })}
    </div>
  );
}

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
    <div className="rounded-[22px] border border-white/70 bg-white/85 shadow-[0_14px_40px_-30px_rgba(2,6,23,0.45)] backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-6 py-5">
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-xl">
              {icon}
            </div>
          ) : null}
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        </div>

        {right ? <div className="text-sm text-slate-500">{right}</div> : null}
      </div>

      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}

function KpiStrip({
  items,
}: {
  items: { label: string; value: string; icon: string }[];
}) {
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/70 bg-white/80 shadow-[0_14px_40px_-30px_rgba(2,6,23,0.45)] backdrop-blur">
      <div className="grid divide-y divide-slate-200/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {items.map((k) => (
          <div key={k.label} className="flex items-center gap-4 px-6 py-5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 text-xl">
              {k.icon}
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-semibold tracking-tight text-slate-900">
                {k.value}
              </div>
              <div className="text-sm font-semibold text-slate-500">
                {k.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

  const topKpis = useMemo(
    () => [
      { label: "Students Enrolled", value: "120", icon: "👥" },
      { label: "Sessions Logged", value: "15", icon: "🗓️" },
      { label: "Attendance Rate", value: "92%", icon: "✅" },
      { label: "Upcoming Events", value: "4", icon: "📍" },
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

  const notes = useMemo(
    () => [
      { title: "Field Trip Reminder", tag: "Reminder", tagClass: "bg-slate-100 text-slate-700" },
      { title: "Project Submissions Due", tag: "Notice", tagClass: "bg-amber-100 text-amber-900" },
    ],
    []
  );

  const recentSessions = useMemo(
    () => [
      { title: "Fanmore Continues", icon: "📄" },
      { title: "Project Submissions", icon: "📦" },
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
      {/* Background like your screenshot (soft blue, clean) */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100" />
        <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="absolute -left-40 top-[-140px] h-[520px] w-[520px] rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute -right-44 top-[120px] h-[560px] w-[560px] rounded-full bg-indigo-200/25 blur-3xl" />
      </div>

      {/* Header (kept fixed + safe) */}
      <header
        className="
          fixed inset-x-0 top-0 z-50
          w-full max-w-[100vw]
          overflow-x-clip overflow-hidden
          border-b border-white/40
          bg-white/65 backdrop-blur-xl
        "
      >
        <div className="relative mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-slate-500">
              ADMIN • {formatTitle(club?.name)}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              Club Command Centre
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Dashboard scoped to this centre.
              <span className="ml-2 hidden sm:inline-flex rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-700">
                ID: {clubId}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/app/admin"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
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
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* spacer */}
      <div aria-hidden className="h-[118px] md:h-[92px]" />

      <section className="mx-auto max-w-7xl px-4 pb-14">
        {/* KPI STRIP (matches screenshot top bar) */}
        <KpiStrip items={topKpis} />

        {/* ROW 1 */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Upcoming Sessions */}
          <Card title="Upcoming Sessions" icon="📋">
            <div className="divide-y divide-slate-200/70 overflow-hidden rounded-2xl border border-slate-200/70 bg-white">
              {upcoming.map((x) => (
                <div key={x.title} className="flex items-center justify-between gap-4 px-4 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 text-xl">
                      {x.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {x.title}
                      </div>
                      <div className="text-xs text-slate-500">Robotics sessions</div>
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

          {/* Attendance Overview */}
          <Card
            title="Attendance Overview"
            icon="📊"
            right={
              <div className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                <span className="font-medium text-slate-500">Recent Sessions</span>
              </div>
            }
          >
            <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
              <Donut value={92} label="Attendance" />
              <div className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">Weekly trend</div>
                  <div className="text-xs text-slate-500">last 6 sessions</div>
                </div>
                <MiniBars values={[120, 160, 140, 180, 210, 260]} />
              </div>
            </div>
          </Card>
        </div>

        {/* ROW 2 */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Notes & Updates */}
          <Card title="Notes & Updates" icon="💬" right={<span>•••</span>}>
            <div className="space-y-3">
              {notes.map((n) => (
                <div
                  key={n.title}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-4"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{n.title}</div>
                    <div className="text-xs text-slate-500">{n.tag}</div>
                  </div>
                  <span className={`rounded-xl px-3 py-1 text-xs font-semibold ${n.tagClass}`}>
                    {n.tag}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Sessions */}
          <Card title="Recent Sessions" icon="🧾" right={<span>•••</span>}>
            <div className="space-y-3">
              {recentSessions.map((s) => (
                <div
                  key={s.title}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white px-4 py-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-50 text-xl">
                      {s.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {s.title}
                      </div>
                      <div className="mt-2 h-2 w-40 max-w-[50vw] overflow-hidden rounded-full bg-slate-100">
                        <div className="h-2 w-1/2 rounded-full bg-blue-500/60" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="h-2 w-8 rounded-full bg-slate-100" />
                    <div className="h-2 w-6 rounded-full bg-slate-100" />
                    <div className="h-2 w-10 rounded-full bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* NOTE: Everything above is UI. Next we wire real data filtered by clubId. */}
        <div className="mt-6 rounded-[22px] border border-white/70 bg-white/70 p-4 text-sm text-slate-600 shadow-[0_14px_40px_-30px_rgba(2,6,23,0.35)] backdrop-blur">
          <span className="font-semibold text-slate-900">Next step:</span> wire KPIs, upcoming sessions,
          notes, and recent sessions from Supabase filtered by centre ID:{" "}
          <span className="font-semibold">{clubId}</span>.
        </div>
      </section>
    </main>
  );
}
