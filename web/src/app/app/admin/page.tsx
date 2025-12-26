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

/* ----------------------------- inline icons ----------------------------- */

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
      {children}
    </span>
  );
}

function IconBuilding() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 21V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17" stroke="currentColor" strokeWidth="1.6" />
      <path d="M18 9h2a2 2 0 0 1 2 2v10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 6h4M8 10h4M8 14h4M8 18h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

function IconSparkles() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l1.2 4.1L17 7l-3.8 1-1.2 4-1.2-4L7 7l3.8-.9L12 2z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19 12l.8 2.7L22 15l-2.2.6L19 18l-.8-2.4L16 15l2.2-.3L19 12z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l7 4v6c0 5-3 9-7 10C8 21 5 17 5 12V6l7-4z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.2 12l1.9 1.9L15 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 5l12 7-12 7V5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 7h7M8 11h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ----------------------------- visuals ----------------------------- */

function HeroArt() {
  return (
    <svg viewBox="0 0 520 320" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="rgb(15,23,42)" stopOpacity="0.10" />
          <stop offset="1" stopColor="rgb(15,23,42)" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="g2" x1="0" x2="1" y1="1" y2="0">
          <stop offset="0" stopColor="rgb(15,23,42)" stopOpacity="0.12" />
          <stop offset="1" stopColor="rgb(15,23,42)" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="520" height="320" rx="28" fill="url(#g1)" />
      <circle cx="110" cy="110" r="78" fill="url(#g2)" />
      <circle cx="420" cy="70" r="50" fill="url(#g2)" />
      <circle cx="410" cy="240" r="86" fill="url(#g2)" />

      <rect x="70" y="160" width="180" height="110" rx="18" fill="white" opacity="0.9" />
      <rect x="95" y="185" width="120" height="10" rx="5" fill="rgb(15,23,42)" opacity="0.38" />
      <rect x="95" y="210" width="150" height="10" rx="5" fill="rgb(15,23,42)" opacity="0.26" />
      <rect x="95" y="235" width="90" height="10" rx="5" fill="rgb(15,23,42)" opacity="0.18" />

      <rect x="270" y="120" width="190" height="150" rx="18" fill="white" opacity="0.9" />
      <rect x="295" y="150" width="140" height="10" rx="5" fill="rgb(15,23,42)" opacity="0.38" />
      <rect x="295" y="175" width="120" height="10" rx="5" fill="rgb(15,23,42)" opacity="0.26" />
      <rect x="295" y="200" width="150" height="10" rx="5" fill="rgb(15,23,42)" opacity="0.20" />
      <rect x="295" y="225" width="90" height="10" rx="5" fill="rgb(15,23,42)" opacity="0.14" />
    </svg>
  );
}

function ImageCard({
  src,
  label,
}: {
  src: string;
  label: string;
}) {
  return (
    <div className="relative h-32 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        onError={(e) => {
          (e.currentTarget as any).style.display = "none";
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/25 to-transparent" />
      <div className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
        {label}
      </div>
    </div>
  );
}

/* ----------------------------- page ----------------------------- */

export default function AdminHomePage() {
  const router = useRouter();
  const { checking, supabase, logout } = useAdminGuard({ idleMinutes: 15 });

  const [loading, setLoading] = useState(false);
  const [centres, setCentres] = useState<ClubCentreRow[]>([]);
  const [centreName, setCentreName] = useState("");

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const templates = useMemo(
    () => [
      { name: "After-school Club", desc: "Typical weekly programme centre structure", preset: "After-school Centre" },
      { name: "Primary School", desc: "Simple centre naming + clean organisation", preset: "Primary Centre" },
      { name: "Secondary School", desc: "Multi-cohort friendly centre naming", preset: "Secondary Centre" },
      { name: "Multi-site Network", desc: "Set up multiple centres fast for scaling", preset: "Network Centre" },
    ],
    []
  );

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
      {/* Background (image + readable overlay) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/admin/hero.png')" }}
        />
        <div className="absolute inset-0 bg-white/78" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/75 to-white/95" />
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
        {/* Hero block */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <div className="flex items-start gap-3">
                <IconWrap>
                  <IconSparkles />
                </IconWrap>
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-600">CENTRES HUB</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    Build a multi-centre STEM network — without admin chaos
                  </h1>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                This dashboard only manages <span className="font-semibold">Centres</span>. Create multiple centres (Centre 1, 2, 3…)
                then open one to run operations inside that centre.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold tracking-widest text-slate-600">CENTRES</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{centres.length}</p>
                  <p className="mt-1 text-xs text-slate-600">total created</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold tracking-widest text-slate-600">DEFAULT NAMING</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Club Centre 1…</p>
                  <p className="mt-1 text-xs text-slate-600">auto suggestion</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold tracking-widest text-slate-600">SECURITY</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">Session timeout</p>
                  <p className="mt-1 text-xs text-slate-600">idle logout enabled</p>
                </div>
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

            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
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
                <HeroArt />
              </div>
            </div>
          </div>
        </div>

        {/* Enrichment row (visual gallery + checklist) */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* Left: Centres list + gallery */}
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <IconWrap>
                  <IconBuilding />
                </IconWrap>
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-600">YOUR CENTRES</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                    Select a centre
                  </h2>
                  <p className="mt-2 text-sm text-slate-700">
                    Open a centre to manage its internal operations. This page stays strictly for centre creation + selection.
                  </p>
                </div>
              </div>

              <div className="hidden md:flex gap-2">
                <ImageCard src="/images/admin/centre-1.png" label="Centre view preview" />
                <ImageCard src="/images/admin/centre-2.png" label="Admin layout preview" />
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {centres.length === 0 ? (
                <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="text-sm font-semibold text-slate-900">No centres yet</p>
                  <p className="mt-1 text-sm text-slate-700">
                    Create your first centre to start. You can add more later (Centre 2, Centre 3…).
                  </p>
                </div>
              ) : (
                centres.map((c) => (
                  <Link
                    key={c.id}
                    href={`/app/admin/clubs/${c.id}`}
                    className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                          <p className="mt-1 text-xs text-slate-600">Created {formatDate(c.created_at)}</p>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-900 font-semibold">
                          {initials(c.name)}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-slate-700">Open centre</p>
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition group-hover:bg-slate-100">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Templates (enrichment) */}
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold tracking-widest text-slate-600">CENTRE TEMPLATES</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">Quick naming presets</h3>
              <p className="mt-1 text-sm text-slate-700">Click to pre-fill the centre name before creating.</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {templates.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setCentreName(t.preset)}
                    className="text-left rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition"
                  >
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="mt-1 text-sm text-slate-700">{t.desc}</p>
                    <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      Use preset
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Create + onboarding checklist + resources */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur sm:p-8">
              <div className="flex items-start gap-3">
                <IconWrap>
                  <IconPlus />
                </IconWrap>
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-600">CREATE</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Add a new centre</h2>
                  <p className="mt-2 text-sm text-slate-700">Example: Club Centre 1, Club Centre 2, Club Centre 3…</p>
                </div>
              </div>

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

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold tracking-widest text-slate-600">TIP</p>
                  <p className="mt-2 text-sm text-slate-700">
                    Keep naming consistent (e.g., “School A Centre”, “School B Centre”) for clean multi-site management.
                  </p>
                </div>
              </form>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur sm:p-8">
              <div className="flex items-start gap-3">
                <IconWrap>
                  <IconShield />
                </IconWrap>
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-600">ONBOARDING</p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">Centres-only checklist</h3>
                  <p className="mt-2 text-sm text-slate-700">
                    These steps keep this page focused: create centres and select one.
                  </p>
                </div>
              </div>

              <ul className="mt-5 space-y-3 text-sm text-slate-800">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Create your first centre
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />
                  Add additional centres (optional)
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />
                  Open a centre to continue setup
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />
                  Keep naming standards consistent across sites
                </li>
              </ul>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold tracking-widest text-slate-600">SECURITY NOTE</p>
                <p className="mt-2 text-sm text-slate-700">
                  Idle timeout is enabled and logout is always available.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur sm:p-8">
              <div className="flex items-start gap-3">
                <IconWrap>
                  <IconBook />
                </IconWrap>
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-600">RESOURCES</p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">Docs & demo</h3>
                  <p className="mt-2 text-sm text-slate-700">Adds credibility and a premium feel, even at MVP stage.</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">Watch a 60s walkthrough</p>
                    <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800">
                      <IconPlay /> Demo
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700">
                    (Placeholder for your YouTube/loom video later.)
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Help centre</p>
                  <p className="mt-1 text-sm text-slate-700">
                    Add FAQs and “How to create centres” docs later (great for product credibility).
                  </p>
                  <p className="mt-2 text-xs text-slate-600">
                    Suggested route: <span className="font-semibold">/help</span> (optional)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-6 rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur">
          <p className="text-sm text-slate-700">
            This page is intentionally limited to centre creation and selection. All operational features live inside a selected centre.
          </p>
        </div>
      </section>
    </main>
  );
}
