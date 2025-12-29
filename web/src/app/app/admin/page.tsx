// web/src/app/app/admin/page.tsx
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


function timeGreeting(d: Date) {
  const h = d.getHours();
  if (h >= 5 && h <= 11) return "GOOD MORNING";
  if (h >= 12 && h <= 16) return "GOOD AFTERNOON";
  if (h >= 17 && h <= 20) return "GOOD EVENING";
  return "GOOD NIGHT";
}

function titleCaseName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatClock(d?: Date | null) {
  if (!d) return "—";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function relativeFrom(d?: Date | null, now?: Date) {
  if (!d || !now) return "—";
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 10) return "Just now";
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;

  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
}


/*
function HeroArt() {
  // lightweight inline SVG fallback if /public images not present
  return (
    <svg viewBox="0 0 520 320" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="rgb(2,6,23)" stopOpacity="0.08" />
          <stop offset="1" stopColor="rgb(2,6,23)" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="g2" x1="0" x2="1" y1="1" y2="0">
          <stop offset="0" stopColor="rgb(2,6,23)" stopOpacity="0.10" />
          <stop offset="1" stopColor="rgb(2,6,23)" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="520" height="320" rx="28" fill="url(#g1)" />
      <circle cx="110" cy="110" r="78" fill="url(#g2)" />
      <circle cx="420" cy="70" r="50" fill="url(#g2)" />
      <circle cx="410" cy="240" r="86" fill="url(#g2)" />

      <rect x="70" y="160" width="180" height="110" rx="18" fill="white" opacity="0.88" />
      <rect x="95" y="185" width="120" height="10" rx="5" fill="rgb(2,6,23)" opacity="0.30" />
      <rect x="95" y="210" width="150" height="10" rx="5" fill="rgb(2,6,23)" opacity="0.22" />
      <rect x="95" y="235" width="90" height="10" rx="5" fill="rgb(2,6,23)" opacity="0.16" />

      <rect x="270" y="120" width="190" height="150" rx="18" fill="white" opacity="0.88" />
      <rect x="295" y="150" width="140" height="10" rx="5" fill="rgb(2,6,23)" opacity="0.30" />
      <rect x="295" y="175" width="120" height="10" rx="5" fill="rgb(2,6,23)" opacity="0.22" />
      <rect x="295" y="200" width="150" height="10" rx="5" fill="rgb(2,6,23)" opacity="0.16" />
      <rect x="295" y="225" width="90" height="10" rx="5" fill="rgb(2,6,23)" opacity="0.12" />
    </svg>
  );
}
*/


function CentreThumb({ index }: { index: number }) {
  const src = index === 0 ? "/images/admin/centre-1.png" : "/images/admin/centre-2.png";
  return (
    <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        onError={(e) => {
          (e.currentTarget as any).style.display = "none";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/25 to-transparent" />
      <div className="absolute bottom-3 left-3 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
        Dashboard preview
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold tracking-widest text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function AdminHomePage() {
  const router = useRouter();
  const { checking, supabase, logout } = useAdminGuard({ idleMinutes: 15 });

  const [loading, setLoading] = useState(false);
  const [centres, setCentres] = useState<ClubCentreRow[]>([]);
  const [centreName, setCentreName] = useState("");

  const [fullName, setFullName] = useState<string>("");
  const [now, setNow] = useState<Date>(() => new Date());

  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [refreshStartedAt, setRefreshStartedAt] = useState<Date | null>(null);


  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);


  useEffect(() => {
    let mounted = true;

    async function loadAdminName() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        const user = data.user;
        if (!user) {
          if (mounted) setFullName("");
          return;
        }

        // 1) ✅ FIRST: try profiles table (registration form usually writes here)
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        const profileName = (profile?.full_name || "").trim();
        if (profileName) {
          if (mounted) setFullName(profileName);
          return;
        }

        // 2) Next: try user metadata
        const meta: any = user.user_metadata || {};
        const metaName = (meta.full_name || meta.name || meta.display_name || "").trim();
        if (metaName) {
          if (mounted) setFullName(metaName);
          return;
        }

        // 3) LAST fallback: show nothing (don’t show email id)
        if (mounted) setFullName("");
      } catch {
        if (mounted) setFullName("");
      }
    }

    loadAdminName();
    return () => {
      mounted = false;
    };
  }, [supabase]);


  // ✅ Search
  const [query, setQuery] = useState("");

  function resetAlerts() {
    setMsg("");
    setError("");
  }

  const filteredCentres = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return centres;
    return centres.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [centres, query]);



  async function loadCentres() {
    resetAlerts();

    const started = new Date();
    setRefreshStartedAt(started);
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("clubs")
        .select("id, name, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rows = (data || []) as ClubCentreRow[];
      setCentres(rows);

      // keep a sensible default name
      if (!centreName) setCentreName(makeDefaultCentreName(rows.length));

      // ✅ record successful refresh time
      setLastRefreshAt(new Date());
    } catch (e: any) {
      setError(e?.message || "Could not load club centres.");
    } finally {
      setLoading(false);
      setRefreshStartedAt(null);
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
      setQuery(""); // ✅ nice: clear search after create

      await loadCentres();
      router.push(`/app/admin/clubs/${(data as ClubCentreRow).id}`);
    } catch (e: any) {
      setError(e?.message || "Could not create centre.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="h-12 w-72 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="h-[520px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
            <div className="h-[520px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-slate-900">
      {/* ✅ Premium background that covers full body */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/50" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute -left-40 top-[-120px] h-[520px] w-[520px] rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute -right-40 bottom-[-140px] h-[560px] w-[560px] rounded-full bg-emerald-200/35 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="
  sticky top-0 z-30
  border-b border-white/30
  bg-gradient-to-r
  from-rose-100/70
  via-amber-100/70
  via-emerald-100/70
  to-sky-100/70
  backdrop-blur-xl
">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-20 h-[300px] w-[300px] rounded-full bg-pink-300/30 blur-3xl" />
          <div className="absolute left-1/3 -top-24 h-[280px] w-[280px] rounded-full bg-yellow-200/30 blur-3xl" />
          <div className="absolute right-0 -top-20 h-[320px] w-[320px] rounded-full bg-sky-300/30 blur-3xl" />
        </div>


        <div className="relative mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link href="/app/admin" className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <span className="text-sm font-bold">ST</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">STEMTrack Admin</div>
                <div className="text-xs text-slate-600">Centres hub • create & select</div>
              </div>
            </Link>

            {/* Mobile actions */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={loadCentres}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => logout("manual")}
                className="cursor-pointer rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Search + actions */}
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center md:gap-3">
            <div className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm md:w-[360px]">
              <span className="text-slate-500">⌕</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search centres…"
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear
                </button>
              ) : null}
            </div>

            {/* Desktop actions */}
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={loadCentres}
                className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => logout("manual")}
                className="cursor-pointer rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>


      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        {/* ✅ Two-card layout (left = everything centres, right = create) */}
        <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
          {/* LEFT: one big card (hero + list) */}
          <div className="rounded-[28px] border border-slate-200/70 bg-white/85 p-5 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur sm:p-7">
            {/* Hero row */}
            <div className="flex flex-col grid gap-6 lg:grid-cols-1">
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500">
                  {timeGreeting(now)}
                  {fullName ? <span className="ml-2 text-slate-700">{fullName}</span> : null}
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Manage your Club Centres with clarity
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  Create a centre for each location or programme,: <span className="font-semibold text-slate-900">create centres</span>,
                  then open one to continue setup and manage delivery.  Keeps multi-site operations clean and scalable.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {["Multi-centre support", "Separated operations", "Funder-ready structure"].map((x) => (
                    <span
                      key={x}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm"
                    >
                      {x}
                    </span>
                  ))}
                </div>



                {/* Analytics summary (premium KPI cards) */}
                <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Total centres */}
                    <div className="relative flex h-full min-h-[180px] flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-900 to-slate-600" />
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold tracking-widest text-slate-500">TOTAL CENTRES</p>
                          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{centres.length}</p>
                          <p className="mt-1 text-sm text-slate-600">All centres in your account</p>
                        </div>

                        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-900">
                          🏫
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Capacity</span>
                          <span className="font-semibold text-slate-700">{centres.length > 0 ? "Active" : "Empty"}</span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-slate-900"
                            style={{ width: centres.length ? "78%" : "12%" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Visible centres */}
                    <div className="relative flex h-full min-h-[180px] flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 to-emerald-400" />
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold tracking-widest text-slate-500">VISIBLE</p>
                          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{filteredCentres.length}</p>
                          <p className="mt-1 text-sm text-slate-600">Matching your search</p>
                        </div>

                        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-emerald-50 text-emerald-700">
                          🔎
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Match rate</span>
                          <span className="font-semibold text-emerald-700">
                            {centres.length ? Math.round((filteredCentres.length / centres.length) * 100) : 0}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-emerald-600"
                            style={{
                              width: centres.length
                                ? `${Math.min(100, Math.max(6, Math.round((filteredCentres.length / centres.length) * 100)))}%`
                                : "6%",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="relative flex h-full min-h-[180px] flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:col-span-2 lg:col-span-1">
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-600 to-sky-400" />
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold tracking-widest text-slate-500">STATUS</p>

                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={[
                                "inline-flex h-2.5 w-2.5 rounded-full",
                                loading ? "bg-amber-500" : "bg-emerald-500",
                              ].join(" ")}
                            />
                            <p className="text-xl font-semibold text-slate-900">{loading ? "Syncing…" : "Ready"}</p>
                          </div>

                          <p className="mt-1 text-sm text-slate-600">
                            {loading ? "Updating centre list" : "All systems operational"}
                          </p>
                        </div>

                        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-sky-50 text-sky-700">
                          ⚡
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>Last refresh</span>
                          <span className="font-semibold text-slate-900">
                            {relativeFrom(lastRefreshAt, now)}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
                          <span>Time</span>
                          <span className="font-semibold text-slate-900">
                            {formatClock(lastRefreshAt)}
                          </span>
                        </div>

                        {loading && refreshStartedAt ? (
                          <div className="mt-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                            Refreshing since {formatClock(refreshStartedAt)}
                          </div>
                        ) : null}
                      </div>

                    </div>

                  </div>
                </div>


                {/*<div className="mt-5 grid gap-3 sm:grid-cols-3">
                 // <StatPill label="TOTAL CENTRES" value={`${centres.length}`} />
                 // <StatPill label="VISIBLE" value={`${filteredCentres.length}`} />
                  //<StatPill label="STATUS" value={loading ? "Loading…" : "Ready"} />
                </div>*/}

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

              {/* Hero visual 
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


                <div className="relative h-[170px] sm:h-[210px] lg:h-[190px]">
                   background illustration (doesn't affect layout) 
                 <div className="absolute inset-0 -top-6">
                    <HeroArt /> 
                 </div>
               </div>  


              </div>  */}


            </div>

            {/* Centres header */}
            <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500">YOUR CENTRES</p>
                <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                  Open a centre dashboard
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Select a centre to continue setup. (People, terms, sessions etc. live inside the centre.)
                </p>
              </div>

              <div className="text-sm font-semibold text-slate-700">
                Total: <span className="text-slate-900">{filteredCentres.length}</span>
              </div>
            </div>

            {/* Centres grid */}
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCentres.length === 0 ? (
                <div className="sm:col-span-2 xl:col-span-3 rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm font-semibold text-slate-900">
                    {centres.length === 0 ? "No centres yet" : "No matches found"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {centres.length === 0
                      ? "Create your first Club Centre on the right to start operations."
                      : "Try a different search term."}
                  </p>

                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="cursor-pointer mt-4 inline-flex rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      Clear search
                    </button>
                  ) : null}
                </div>
              ) : (
                filteredCentres.map((c, idx) => (
                  <Link
                    key={c.id}
                    href={`/app/admin/clubs/${c.id}`}
                    className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="p-4">
                      <CentreThumb index={idx % 2} />

                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                          <p className="mt-1 text-xs text-slate-500">Created {formatDate(c.created_at)}</p>
                        </div>

                        <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold">
                          {initials(c.name)}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-slate-600">Open centre</p>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition group-hover:bg-slate-50">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold tracking-widest text-slate-500">QUICK TIPS</p>
              <p className="mt-2 text-sm text-slate-600">
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  <li>• Keep centre names specific (location, school, or programme).</li>
                  <li>• If you run multiple cohorts, create a centre per site to keep records organised.</li>
                  <li>• Open a centre anytime to continue setup and manage delivery.</li>
                </ul>
              </p>
            </div>
          </div>

          {/* RIGHT: create centre card */}
          <div className="rounded-[28px] border border-slate-200/70 bg-white/85 p-5 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur sm:p-7">
            <p className="text-xs font-semibold tracking-widest text-slate-500">CREATE</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">Add a new Club Centre</h2>
            <p className="mt-2 text-sm text-slate-600">Use a clear name your team will recognise instantly. Example: Club Centre 1, Club Centre 2, Club Centre 3…</p>

            <form onSubmit={createCentre} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Centre name</label>
                <input
                  value={centreName}
                  onChange={(e) => setCentreName(e.target.value)}
                  placeholder="Club Centre 1"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Creating…" : "Create centre"}
              </button>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold tracking-widest text-slate-500">SECURE BY DESIGN</p>
                <p className="mt-2 text-sm text-slate-700">
                  Access is restricted to authorised administrators, with built-in safeguards to ensure account integrity.. Idle sessions time out automatically.
                </p>
              </div>

              {/* Replace the old “Centre naming presets” with a visual / trust block */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold tracking-widest text-slate-500">VISUAL PREVIEW</p>
                <p className="mt-2 text-sm text-slate-600">
                  Your centre dashboards use consistent, clean templates so every site runs the same way.
                </p>

                <div className="mt-4 grid gap-3">
                  <div className="relative h-32 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <Image
                      src="/images/admin/centre-1.png"
                      alt=""
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.currentTarget as any).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
                      Centre dashboard template
                    </div>
                  </div>

                  <div className="relative h-32 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <Image
                      src="/images/admin/centre-2.png"
                      alt=""
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.currentTarget as any).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
                      Reporting-ready layout
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
