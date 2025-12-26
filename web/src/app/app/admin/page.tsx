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

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = (parts[0]?.[0] || "C").toUpperCase();
  const b = (parts[1]?.[0] || parts[0]?.[1] || "C").toUpperCase();
  return `${a}${b}`;
}

function makeDefaultCentreName(existingCount: number) {
  return `Club Centre ${existingCount + 1}`;
}

function Icon({
  name,
}: {
  name:
    | "search"
    | "refresh"
    | "logout"
    | "plus"
    | "arrow"
    | "spark"
    | "grid"
    | "shield";
}) {
  const cls = "stroke-current";
  switch (name) {
    case "search":
      return (
        <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" strokeWidth="1.8" />
          <path d="M16.5 16.5 21 21" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "refresh":
      return (
        <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 6v6h-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 18v-6h6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 12a8 8 0 0 0-14.5-4.5L4 12" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M4 12a8 8 0 0 0 14.5 4.5L20 12" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "logout":
      return (
        <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M10 17h-1a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M15 7l5 5-5 5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 12H10" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "plus":
      return (
        <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case "arrow":
      return (
        <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 18l6-6-6-6" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "spark":
      return (
        <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2l1.2 4.1L17 7l-3.8 1-1.2 4-1.2-4L7 7l3.8-.9L12 2z" strokeWidth="1.6" />
          <path d="M19 12l.8 2.7L22 15l-2.2.6L19 18l-.8-2.4L16 15l2.2-.3L19 12z" strokeWidth="1.6" />
        </svg>
      );
    case "grid":
      return (
        <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 4h7v7H4V4zM13 4h7v7h-7V4zM4 13h7v7H4v-7zM13 13h7v7h-7v-7z" strokeWidth="1.7" />
        </svg>
      );
    case "shield":
      return (
        <svg className={cls} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2l7 4v6c0 5-3 9-7 10C8 21 5 17 5 12V6l7-4z" strokeWidth="1.7" />
          <path d="M9.2 12l1.9 1.9L15 10" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={[
        "rounded-[28px] border border-white/50 bg-white/75 shadow-[0_8px_30px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/50 backdrop-blur-xl",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

function Thumb({ src, label }: { src: string; label: string }) {
  return (
    <div className="relative h-28 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        onError={(e) => {
          (e.currentTarget as any).style.display = "none";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/20 to-transparent" />
      <div className="absolute bottom-3 left-3 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-700">
        {label}
      </div>
    </div>
  );
}

export default function AdminHomePage() {
  const router = useRouter();
  const { checking, supabase, logout } = useAdminGuard({ idleMinutes: 15 });

  const [loading, setLoading] = useState(false);
  const [centres, setCentres] = useState<ClubCentreRow[]>([]);
  const [centreName, setCentreName] = useState("");
  const [q, setQ] = useState("");
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
      const { data, error } = await supabase.from("clubs").select("id, name, created_at").order("created_at", {
        ascending: true,
      });
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
      const { data, error } = await supabase.from("clubs").insert({ name }).select("id, name, created_at").single();
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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return centres;
    return centres.filter((c) => c.name.toLowerCase().includes(term));
  }, [centres, q]);

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="px-6 py-8">
          <div className="h-12 w-80 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="mt-6 h-[720px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen text-slate-900">
      {/* Premium background layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
        <div className="absolute -left-28 top-24 h-[520px] w-[520px] rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute -right-32 top-10 h-[520px] w-[520px] rounded-full bg-emerald-200/25 blur-3xl" />
        <div className="absolute left-1/3 bottom-[-220px] h-[620px] w-[620px] rounded-full bg-sky-200/25 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(15,23,42,0.05)_1px,transparent_0)] [background-size:22px_22px] opacity-50" />
      </div>

      {/* Full-width padding (not centered container) */}
      <div className="w-full px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        {/* Top nav */}
        <GlassCard className="px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <span className="text-sm font-bold">ST</span>
              </div>

              <div className="leading-tight">
                <div className="text-sm font-semibold text-slate-900">STEMTrack Admin</div>
                <div className="text-xs text-slate-600">Centres hub • create & select</div>
              </div>

              <div className="ml-2 hidden items-center gap-2 lg:flex">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  <Icon name="grid" /> Dashboard
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  <Icon name="spark" /> Premium UI
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
              <div className="relative w-full sm:w-[360px]">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Icon name="search" />
                </div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search centres…"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-2.5 text-sm font-medium text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="flex w-full gap-2 sm:w-auto">
                <button
                  type="button"
                  onClick={loadCentres}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 sm:w-auto"
                >
                  <Icon name="refresh" />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => logout("manual")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto"
                >
                  <Icon name="logout" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Main layout */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.55fr_0.95fr]">
          {/* LEFT */}
          <div className="space-y-5">
            {/* Hero */}
            <GlassCard className="overflow-hidden">
              <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.2fr_0.9fr] lg:items-center">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-600">GOOD MORNING</p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                    Manage your Club Centres with clarity
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">
                    This hub is intentionally minimal: <span className="font-semibold text-slate-900">create centres</span>,
                    then open one to continue. Keeps multi-site operations clean and scalable.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Pill>Multi-centre support</Pill>
                    <Pill>Separated operations</Pill>
                    <Pill>Funder-ready structure</Pill>
                  </div>

                  {error ? (
                    <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                      <p className="text-sm font-semibold text-rose-800">Error</p>
                      <p className="mt-1 text-sm text-rose-700">{error}</p>
                    </div>
                  ) : null}

                  {msg ? (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-800">Update</p>
                      <p className="mt-1 text-sm text-emerald-700">{msg}</p>
                    </div>
                  ) : null}
                </div>

                <div className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm">
                  <div className="absolute inset-0">
                    <Image
                      src="/images/admin/hero.png"
                      alt=""
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.currentTarget as any).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="relative h-[220px] sm:h-[260px]">
                    <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700">
                        Visual preview
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-700">
                        Centres hub
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Centres list */}
            <GlassCard className="p-5 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-600">YOUR CENTRES</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Open a centre dashboard</h2>
                  <p className="mt-2 text-sm text-slate-700">
                    Select a centre to continue setup. (People, terms, sessions etc. live inside the centre.)
                  </p>
                </div>

                <div className="text-sm font-semibold text-slate-700">
                  Total: <span className="text-slate-900">{filtered.length}</span>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.length === 0 ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:col-span-2 xl:col-span-3">
                    <p className="text-sm font-semibold text-slate-900">No centres found</p>
                    <p className="mt-1 text-sm text-slate-700">
                      Try a different search, or create your first centre on the right.
                    </p>
                  </div>
                ) : (
                  filtered.map((c, idx) => (
                    <Link
                      key={c.id}
                      href={`/app/admin/clubs/${c.id}`}
                      className="group rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <Thumb
                        src={idx % 2 === 0 ? "/images/admin/centre-1.png" : "/images/admin/centre-2.png"}
                        label="Dashboard preview"
                      />

                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                          <p className="mt-1 text-xs text-slate-600">Created {formatDate(c.created_at)}</p>
                        </div>

                        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-900 font-semibold">
                          {initials(c.name)}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-slate-700">Open centre</p>
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition group-hover:bg-slate-100">
                          <Icon name="arrow" />
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </GlassCard>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            {/* Create centre */}
            <GlassCard className="p-5 sm:p-7">
              <p className="text-xs font-semibold tracking-widest text-slate-600">CREATE</p>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">Add a new Club Centre</h3>
              <p className="mt-2 text-sm text-slate-700">
                Example: Club Centre 1, Club Centre 2, Club Centre 3…
              </p>

              <form onSubmit={createCentre} className="mt-5 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-800">Centre name</label>
                  <input
                    value={centreName}
                    onChange={(e) => setCentreName(e.target.value)}
                    placeholder={makeDefaultCentreName(centres.length)}
                    className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  <Icon name="plus" />
                  {loading ? "Creating…" : "Create centre"}
                </button>

                <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-800">
                      <Icon name="shield" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Secure by design</p>
                      <p className="mt-1 text-sm text-slate-700">
                        Admin-only hub. Idle sessions time out automatically. Logout is always available.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </GlassCard>

            {/* Quick presets / feel-full panel */}
            <GlassCard className="p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-widest text-slate-600">SUGGESTIONS</p>
                <span className="text-xs font-semibold text-slate-700">{centres.length} created</span>
              </div>

              <h3 className="mt-2 text-lg font-semibold text-slate-900">Centre naming presets</h3>
              <p className="mt-2 text-sm text-slate-700">
                (These only pre-fill the name — centres remain separate.)
              </p>

              <div className="mt-4 grid gap-3">
                {[
                  { t: "After-school Centre", d: "Default for clubs" },
                  { t: "Primary Centre", d: "Simpler naming" },
                  { t: "Secondary Centre", d: "Future multi-cohort" },
                  { t: "Network Centre", d: "For scaling sites" },
                ].map((x) => (
                  <button
                    key={x.t}
                    type="button"
                    onClick={() => setCentreName(x.t)}
                    className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 transition"
                  >
                    <p className="text-sm font-semibold text-slate-900">{x.t}</p>
                    <p className="mt-1 text-sm text-slate-700">{x.d}</p>
                    <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      Use preset
                    </p>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Footer mini note */}
            <div className="text-xs text-slate-700">
              Note: Operational modules are inside each centre dashboard. This page stays clean (create + select only).
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
