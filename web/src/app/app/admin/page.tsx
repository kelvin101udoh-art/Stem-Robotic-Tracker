"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminGuard } from "@/lib/admin/admin-guard";

type ClubCentreRow = {
  id: string;
  name: string;
  created_at?: string;
};

function makeDefaultCentreName(existingCount: number) {
  return `Club Centre ${existingCount + 1}`;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = (parts[0]?.[0] || "C").toUpperCase();
  const b = (parts[1]?.[0] || parts[0]?.[1] || "C").toUpperCase();
  return `${a}${b}`;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/* ----------------------------- Small inline icons ----------------------------- */

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
      {children}
    </span>
  );
}

function IconCentres() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10.5L12 3l9 7.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9.5 21v-6.2a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3V21"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l7 4v6c0 5-3 9-7 10C8 21 5 17 5 12V6l7-4z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path d="M9.2 12l1.9 1.9L15 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconBolt() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconReport() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 3v4a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12h8M8 16h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SectionTitle({
  icon,
  kicker,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <IconWrap>{icon}</IconWrap>
      <div>
        <p className="text-xs font-semibold tracking-widest text-slate-600">{kicker}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-2 text-sm text-slate-700">{subtitle}</p> : null}
      </div>
    </div>
  );
}

/* ------------------------------- Visual blocks ------------------------------- */

function CentreThumb({ index }: { index: number }) {
  const src = index === 0 ? "/images/admin/centre-1.png" : "/images/admin/centre-2.png";
  return (
    <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        onError={(e) => ((e.currentTarget as any).style.display = "none")}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/30 to-transparent" />
      <div className="absolute bottom-3 left-3 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
        Dashboard preview
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-sm ring-1 ring-white/50 backdrop-blur">
      <p className="text-xs font-semibold tracking-widest text-slate-600">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        {hint ? <p className="text-xs text-slate-600">{hint}</p> : null}
      </div>

      {/* tiny “chart” placeholder */}
      <div className="mt-4 h-8 w-full rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50" />
    </div>
  );
}

function ActivityRow({
  title,
  desc,
  when,
}: {
  title: string;
  desc: string;
  when: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-700">{desc}</p>
      </div>
      <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
        {when}
      </span>
    </div>
  );
}

export default function AdminHomePage() {
  const router = useRouter();
  const { checking, supabase, logout } = useAdminGuard({ idleMinutes: 15 });

  const [loading, setLoading] = useState(false);
  const [centres, setCentres] = useState<ClubCentreRow[]>([]);
  const [centreName, setCentreName] = useState("");

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  function resetAlerts() {
    setMsg("");
    setError("");
  }

  async function loadCentres() {
    resetAlerts();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clubs")
        .select("id, name, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rows = (data || []) as ClubCentreRow[];
      setCentres(rows);

      if (!centreName) setCentreName(makeDefaultCentreName(rows.length));
    } catch (e: any) {
      setError(e?.message || "Could not load club centres.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (checking) return;
    loadCentres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);

  async function createCentre(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();

    const name = centreName.trim();
    if (!name) return setError("Please enter a centre name.");

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clubs")
        .insert({ name })
        .select("id, name, created_at")
        .single();

      if (error) throw error;

      setMsg("Club centre created.");
      setCentreName("");

      await loadCentres();
      router.push(`/app/admin/clubs/${(data as ClubCentreRow).id}`);
    } catch (e: any) {
      setError(e?.message || "Could not create centre.");
    } finally {
      setLoading(false);
    }
  }

  const quickActions = useMemo(
    () => [
      { title: "Invites", desc: "Create role-based links", href: "/app/admin/invites" },
      { title: "Enrollment inbox", desc: "Approve new learners", href: "/app/admin/enrollment/inbox" },
      { title: "Sessions", desc: "Plan delivery + evidence", href: "/app/admin/sessions" },
      { title: "Reports", desc: "Export impact summaries", href: "/app/admin/reports" },
    ],
    []
  );

  const activitySeed = useMemo(
    () => [
      { title: "System ready", desc: "Admin workspace is configured for centre-separated data.", when: "Now" },
      { title: "Next step", desc: "Create your first centre to start inviting teachers and learners.", when: "Today" },
      { title: "Evidence pipeline", desc: "Sessions → Attendance → Progress → Reports (funder-ready).", when: "This week" },
    ],
    []
  );

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="h-12 w-72 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="h-[420px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
            <div className="h-[420px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-slate-900">
      {/* Background (image + overlays to keep readability) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/admin/hero.png')" }} />
        <div className="absolute inset-0 bg-white/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/70 to-white/95" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/app/admin" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <span className="text-sm font-bold">ST</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">STEMTrack</div>
              <div className="text-xs text-slate-600">Admin • Club centres</div>
            </div>
          </Link>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={loadCentres}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 sm:w-auto"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => logout("manual")}
              className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* KPI Row (adds richness immediately) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total centres" value={`${centres.length}`} hint="active workspaces" />
          <StatCard label="People enrolled" value="—" hint="students + parents" />
          <StatCard label="Sessions logged" value="—" hint="this term" />
          <StatCard label="Attendance" value="—%" hint="last 4 sessions" />
        </div>

        {/* Hero + Quick actions */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur sm:p-8">
            <div className="flex items-start gap-3">
              <IconWrap>
                <IconBolt />
              </IconWrap>
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-600">ADMIN START</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Build centre-based operations that stay clean and reportable
                </h1>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              Each centre keeps its own people, terms, sessions, attendance, evidence and reports — making delivery consistent and
              impact export simple for schools and funders.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {["Role-based access", "Centre-separated data", "Evidence-ready reporting"].map((x) => (
                <div key={x} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">{x}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {x === "Role-based access"
                      ? "Admins, teachers, students, parents — locked by role."
                      : x === "Centre-separated data"
                      ? "Each centre is isolated for security and clarity."
                      : "Export term summaries for parents and funders."}
                  </p>
                </div>
              ))}
            </div>

            {(error || msg) && (
              <div className="mt-5 space-y-3">
                {error ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm font-semibold text-rose-800">Error</p>
                    <p className="mt-1 text-sm text-rose-700">{error}</p>
                  </div>
                ) : null}
                {msg ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-semibold text-emerald-800">Update</p>
                    <p className="mt-1 text-sm text-emerald-700">{msg}</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Screenshot strip */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="relative h-36 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <Image src="/images/admin/centre-1.png" alt="" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/20 to-transparent" />
              </div>
              <div className="relative h-36 overflow-hidden rounded-3xl border border-slate-200 bg-white">
                <Image src="/images/admin/centre-2.png" alt="" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/20 to-transparent" />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur sm:p-8">
            <SectionTitle icon={<IconReport />} kicker="QUICK ACTIONS" title="Start the workflow" subtitle="Fast links to the admin tools." />
            <div className="mt-5 grid gap-3">
              {quickActions.map((a) => (
                <Link
                  key={a.title}
                  href={a.href}
                  className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                    <p className="mt-1 text-sm text-slate-700">{a.desc}</p>
                  </div>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 group-hover:bg-slate-100">
                    →
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <IconWrap>
                  <IconShield />
                </IconWrap>
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-600">SECURITY</p>
                  <p className="mt-2 text-sm text-slate-700">
                    Role-based permissions enforced. Inactive admin sessions time out automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Centres + Create + Activity */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* Centres */}
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur sm:p-8">
            <SectionTitle
              icon={<IconCentres />}
              kicker="YOUR CENTRES"
              title="Open a centre dashboard"
              subtitle="Each centre has its own people, terms, sessions, attendance and reports."
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {centres.length === 0 ? (
                <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="text-sm font-semibold text-slate-900">No centres yet</p>
                  <p className="mt-1 text-sm text-slate-700">Create your first centre to start inviting users.</p>
                </div>
              ) : (
                centres.map((c, idx) => (
                  <Link
                    key={c.id}
                    href={`/app/admin/clubs/${c.id}`}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="p-4">
                      <CentreThumb index={idx % 2} />

                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                          <p className="mt-1 text-xs text-slate-600">Created {formatDate(c.created_at)}</p>
                        </div>

                        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-900 font-semibold">
                          {initials(c.name)}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-slate-700">Open dashboard</p>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition group-hover:bg-slate-100">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Create + Activity feed */}
          <div className="grid gap-6">
            <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur sm:p-8">
              <SectionTitle icon={<IconPlus />} kicker="CREATE" title="Add a new Club Centre" subtitle="Example: Club Centre 1, Club Centre 2, Club Centre 3…" />

              <form onSubmit={createCentre} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-800">Centre name</label>
                  <input
                    value={centreName}
                    onChange={(e) => setCentreName(e.target.value)}
                    placeholder="Club Centre 1"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Creating…" : "Create centre"}
                </button>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold tracking-widest text-slate-600">WORKFLOW</p>
                  <p className="mt-2 text-sm text-slate-700">
                    Terms → People → Sessions → Attendance → Progress → Reports
                  </p>
                </div>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur sm:p-8">
              <SectionTitle icon={<IconBolt />} kicker="ACTIVITY" title="Recent updates" subtitle="This will later be connected to real audit logs." />
              <div className="mt-5 space-y-3">
                {activitySeed.map((a) => (
                  <ActivityRow key={a.title} title={a.title} desc={a.desc} when={a.when} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer security note */}
        <div className="mt-6 rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur">
          <div className="flex items-start gap-3">
            <IconWrap>
              <IconShield />
            </IconWrap>
            <div>
              <p className="text-xs font-semibold tracking-widest text-slate-600">ACCESS CONTROL</p>
              <p className="mt-2 text-sm text-slate-700">
                Admin visibility is role-based. Inactive sessions auto-timeout, and logout is always available.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
