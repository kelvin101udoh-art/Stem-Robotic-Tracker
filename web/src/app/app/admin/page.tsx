// web/src/app/app/admin/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminGuard } from "@/lib/admin/admin-guard";

import { useRef } from "react";



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

function genClubCode(prefix = "CLB") {
  // e.g. CLB-8K3QZP2H (8 chars)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoids confusing 0/O/1/I
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += chars[bytes[i] % chars.length];
  return `${prefix}-${out}`;
}

function prettifySupabaseError(e: any) {
  const msg = (e?.message || "").toString();
  const hint = (e?.hint || "").toString();
  const details = (e?.details || "").toString();

  const combined = [msg, hint, details].filter(Boolean).join(" • ");

  // Make the common DB error friendlier

  if (combined.toLowerCase().includes("club_code") && combined.toLowerCase().includes("not-null")) {
    return {
      title: "Database constraint error",
      message:
        "Your database requires a centre code (club_code). Creation now generates it automatically. If you still see this, check legacy rows/migrations.",
      details: combined,
    };
  }


  return {
    title: "Something went wrong",
    message: msg || "We couldn’t complete that action. Please try again.",
    details: combined || undefined,
  };
}



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


  const inputRef = useRef<HTMLInputElement | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const blurCloseTimer = useRef<any>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalDetails, setModalDetails] = useState<string | null>(null);

  function openErrorModal(title: string, message: string, details?: string) {
    setModalTitle(title);
    setModalMessage(message);
    setModalDetails(details || null);
    setModalOpen(true);
  }




  useEffect(() => {
    // Ctrl/Cmd + K focuses search like a real app
    function onKey(e: KeyboardEvent) {
      const isK = e.key.toLowerCase() === "k";
      if ((e.ctrlKey || e.metaKey) && isK) {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);





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

  const filteredCentres = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return centres;

    const tokens = q.split(/\s+/).filter(Boolean);
    return centres.filter((c) => {
      const hay = `${c.name || ""}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }, [centres, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const topMatches = useMemo(() => filteredCentres.slice(0, 6), [filteredCentres]);


  function resetAlerts() {
    setMsg("");
    setError("");
    // Optional: close previous modal when starting a new action
    // setModalOpen(false);
  }




  async function loadCentres(opts?: { silent?: boolean }) {
    const silent = !!opts?.silent;
    resetAlerts();

    const started = new Date();
    setRefreshStartedAt(started);
    setLoading(true);

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("clubs")
        .select("id, name, created_at")
        .eq("owner_id", user.id)          // ✅ tenant filter
        .is("deleted_at", null)           // ✅ hide soft-deleted
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rows = (data || []) as ClubCentreRow[];
      setCentres(rows);

      if (!centreName) setCentreName(makeDefaultCentreName(rows.length));
      setLastRefreshAt(new Date());
    } catch (e: any) {
      const pretty = prettifySupabaseError(e);
      setError(pretty.details || pretty.message);
      if (!silent) openErrorModal(pretty.title, pretty.message, pretty.details);
    } finally {
      setLoading(false);
      setRefreshStartedAt(null);
    }
  }




  useEffect(() => {
    if (checking) return;
    loadCentres({ silent: true }); // ✅ no modal on initial load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);



  async function createCentre(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();

    const name = centreName.trim();
    if (!name) {
      openErrorModal("Missing centre name", "Please enter a centre name.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr) throw userErr;
      if (!user) throw new Error("Not authenticated");

      const userId = user.id; // ✅ now defined

      let created: ClubCentreRow | null = null;
      let lastErr: any = null;

      for (let attempt = 0; attempt < 4; attempt++) {
        const club_code = genClubCode("CLB");

        const { data, error } = await supabase
          .from("clubs")
          .insert({ name, club_code, owner_id: userId }) // ✅ required
          .select("id, name, created_at")
          .single();

        if (!error) {
          created = data as ClubCentreRow;
          break;
        }

        lastErr = error;
        const m = (error?.message || "").toLowerCase();
        if (!m.includes("duplicate") && !m.includes("unique")) break;
      }

      if (!created) throw lastErr || new Error("Could not create centre.");

      setMsg("Club centre created.");
      setCentreName("");
      setQuery("");
      setSearchOpen(false);

      await loadCentres();
      router.push(`/app/admin/clubs/${created.id}`);
    } catch (e: any) {
      const pretty = prettifySupabaseError(e);
      setError(pretty.details || pretty.message);
      openErrorModal(pretty.title, pretty.message, pretty.details);
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
    <main className="relative min-h-screen w-full overflow-x-clip text-slate-900">
      {/* ✅ Premium background that covers full body */}
      <div className="fixed inset-0 -z-10 overflow-clip pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/50" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute -left-40 top-[-120px] h-[520px] w-[520px] rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute -right-40 bottom-[-140px] h-[560px] w-[560px] rounded-full bg-emerald-200/35 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="
  fixed inset-x-0 top-0 z-50
  w-full max-w-[100vw]
  overflow-x-clip overflow-hidden
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


        <div className="relative mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
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
                onClick={() => loadCentres()}
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
          <div className="flex w-full min-w-0 flex-col gap-2 md:flex-1 md:flex-row md:items-center md:justify-end md:gap-3">
            {/* Search */}
            <div className="relative w-full min-w-0 md:w-[420px]">
              <div className="flex w-full min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm">
                <span className="text-slate-500">⌕</span>

                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => {
                    if (blurCloseTimer.current) clearTimeout(blurCloseTimer.current);
                    setSearchOpen(true);
                  }}
                  onBlur={() => {
                    blurCloseTimer.current = setTimeout(() => setSearchOpen(false), 120);
                  }}
                  onKeyDown={(e) => {
                    if (!searchOpen) return;

                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActiveIndex((i) => Math.min(i + 1, Math.max(0, topMatches.length - 1)));
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActiveIndex((i) => Math.max(i - 1, 0));
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setSearchOpen(false);
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const pick = topMatches[activeIndex];
                      if (pick) router.push(`/app/admin/clubs/${pick.id}`);
                    }
                  }}
                  placeholder="Search centres… (Ctrl/K)"
                  className="w-full min-w-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />

                <span className="hidden sm:inline-flex rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">
                  {query ? `${filteredCentres.length} found` : `${centres.length} total`}
                </span>

                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setSearchOpen(false);
                      inputRef.current?.focus();
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              {/* Typeahead dropdown */}
              {searchOpen && query.trim() && (
                <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                  {topMatches.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-600">
                      No matches. Try a different keyword.
                    </div>
                  ) : (
                    <div className="py-1">
                      <div className="px-4 py-2 text-[11px] font-semibold tracking-widest text-slate-500">
                        RESULTS
                      </div>

                      {topMatches.map((c, idx) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => router.push(`/app/admin/clubs/${c.id}`)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={[
                            "flex w-full items-center justify-between px-4 py-2 text-left text-sm",
                            idx === activeIndex ? "bg-slate-50" : "bg-white",
                          ].join(" ")}
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{c.name}</div>
                            <div className="text-xs text-slate-500">Created {formatDate(c.created_at)}</div>
                          </div>
                          <span className="text-slate-400">↵</span>
                        </button>
                      ))}

                      <div className="px-4 py-2 text-[11px] text-slate-500">
                        Tip: use ↑ ↓ then Enter • Esc to close • Ctrl/Cmd+K to focus
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Desktop actions (RESTORED) */}
            <div className="hidden items-center gap-2 md:flex">
              <button
                type="button"
                onClick={() => loadCentres()}
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

      <div aria-hidden className="h-[112px] md:h-[88px]" />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        {/* ✅ Two-card layout (left = everything centres, right = create) */}
        <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
          {/* LEFT: one big card (hero + list) */}
          <div className="rounded-[28px] border border-slate-200/70 bg-white/85 p-5 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur sm:p-7">
            {/* Hero row */}
            <div className="grid gap-6">
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


                {/* Analytics summary (TV KPI cards) */}
                <div className="relative mt-5 overflow-hidden rounded-3xl border border-slate-200 p-4">
                  {/* Control-room background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800" />
                  <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(#ffffff_1px,transparent_1px)] [background-size:22px_22px]" />
                  <div className="absolute -left-24 -top-20 h-[320px] w-[320px] rounded-full bg-indigo-500/20 blur-3xl" />
                  <div className="absolute -right-24 bottom-[-120px] h-[320px] w-[320px] rounded-full bg-emerald-500/20 blur-3xl" />

                  {/* Content grid (IMPORTANT: keep cards inside this) */}
                  <div className="relative grid gap-3 sm:grid-cols-3">
                    {/* TOTAL CENTRES */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]">
                      {/* subtle “TV bezel” */}
                      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30" />

                      <div className="relative flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold tracking-widest text-slate-300/80">TOTAL CENTRES</p>
                          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{centres.length}</p>
                          <p className="mt-1 text-xs text-slate-300/80">All centres in your account</p>
                        </div>

                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white shadow-inner">
                          🏫
                        </div>
                      </div>

                      <div className="relative mt-4">
                        <div className="flex items-center justify-between text-[11px] text-slate-300/80">
                          <span>Capacity</span>
                          <span className="font-semibold text-white">{centres.length > 0 ? "Active" : "Empty"}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-black/40">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-indigo-400 to-sky-400"
                            style={{ width: centres.length ? "78%" : "12%" }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* VISIBLE */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]">
                      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-400/10 via-transparent to-black/30" />

                      <div className="relative flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold tracking-widest text-slate-300/80">VISIBLE</p>
                          <p className="mt-2 text-3xl font-semibold tracking-tight text-white">{filteredCentres.length}</p>
                          <p className="mt-1 text-xs text-slate-300/80">Matching your search</p>
                        </div>

                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white shadow-inner">
                          🔎
                        </div>
                      </div>

                      <div className="relative mt-4">
                        <div className="flex items-center justify-between text-[11px] text-slate-300/80">
                          <span>Match rate</span>
                          <span className="font-semibold text-white">
                            {centres.length ? Math.round((filteredCentres.length / centres.length) * 100) : 0}%
                          </span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-black/40">
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-lime-400"
                            style={{
                              width: centres.length
                                ? `${Math.min(100, Math.max(6, Math.round((filteredCentres.length / centres.length) * 100)))}%`
                                : "6%",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* STATUS */}
                    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]">
                      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-400/10 via-transparent to-black/30" />

                      <div className="relative flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold tracking-widest text-slate-300/80">STATUS</p>

                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={[
                                "inline-flex h-2.5 w-2.5 rounded-full",
                                loading ? "bg-amber-400 animate-pulse" : "bg-emerald-400",
                              ].join(" ")}
                            />
                            <p className="text-lg font-semibold text-white">{loading ? "Syncing…" : "Ready"}</p>
                          </div>

                          <p className="mt-1 text-xs text-slate-300/80">
                            {loading ? "Updating centre list" : "All systems operational"}
                          </p>
                        </div>

                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white shadow-inner">
                          ⚡
                        </div>
                      </div>

                      <div className="relative mt-4 rounded-2xl border border-white/10 bg-black/35 px-3 py-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-300/80">
                          <span>Last refresh</span>
                          <span className="font-semibold text-white">{relativeFrom(lastRefreshAt, now)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-300/80">
                          <span>Time</span>
                          <span className="font-semibold text-white">{formatClock(lastRefreshAt)}</span>
                        </div>

                        {loading && refreshStartedAt ? (
                          <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-200">
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

                {/*
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
                    */}

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

          <div className="relative overflow-hidden rounded-[28px] p-5 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] sm:p-7">
            {/* Rainbow background (no borders) */}
            <div className="absolute inset-0 bg-gradient-to-br from-rose-200 via-amber-200 via-emerald-200 via-sky-200 to-violet-200" />
            {/* Soft glass overlay for readability */}
            <div className="absolute inset-0 bg-white/65 backdrop-blur-xl" />
            {/* Optional sparkle texture */}
            <div className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:18px_18px]" />

            {/* Content */}
            <div className="relative">
              <p className="text-xs font-semibold tracking-widest text-slate-600">CREATE</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                Add a new Club Centre
              </h2>
              <p className="mt-2 text-sm text-slate-700">
                Use a clear name your team will recognise instantly. Example: Club Centre 1, Club Centre 2, Club Centre 3…
              </p>

              <form onSubmit={createCentre} className="mt-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-800">Centre name</label>
                  <input
                    value={centreName}
                    onChange={(e) => setCentreName(e.target.value)}
                    placeholder="Club Centre 1"
                    className="mt-1 w-full rounded-2xl border border-white/60 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-white focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="cursor-pointer inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Creating…" : "Create centre"}
                </button>

                {/* Keep inner cards clean (optional: make them glass too) */}
                <div className="rounded-3xl bg-white/75 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold tracking-widest text-slate-600">SECURE BY DESIGN</p>
                  <p className="mt-2 text-sm text-slate-700">
                    Access is restricted to authorised administrators, with built-in safeguards to ensure account integrity. Idle sessions time out automatically.
                  </p>
                </div>

                <div className="rounded-3xl bg-white/75 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold tracking-widest text-slate-600">VISUAL PREVIEW</p>
                  <p className="mt-2 text-sm text-slate-700">
                    Your centre dashboards use consistent, clean templates so every site runs the same way.
                  </p>

                  <div className="mt-4 grid gap-3">
                    <div className="relative h-32 overflow-hidden rounded-2xl bg-white shadow-sm">
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
                      <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
                        Centre dashboard template
                      </div>
                    </div>

                    <div className="relative h-32 overflow-hidden rounded-2xl bg-white shadow-sm">
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
                      <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
                        Reporting-ready layout
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>




        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 p-5">
              <div>
                <p className="text-xs font-semibold tracking-widest text-rose-600">ERROR</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">{modalTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            <div className="px-5 pb-5">
              <p className="text-sm text-slate-700">{modalMessage}</p>

              {modalDetails ? (
                <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                    Technical details
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-600">
                    {modalDetails}
                  </pre>
                </details>
              ) : null}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </main>
  );
}
