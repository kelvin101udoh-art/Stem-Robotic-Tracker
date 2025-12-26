"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
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

/* ----------------------------- Tiny inline icons ---------------------------- */

function IconWrap({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
      {children}
    </span>
  );
}

function IconSparkles() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2l1.2 4.1L17 7l-3.8 1  -1.2 4 -1.2-4L7 7l3.8-0.9L12 2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M19 12l0.8 2.7L22 15l-2.2 0.6L19 18l-0.8-2.4L16 15l2.2-0.3L19 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M4.8 13l0.7 2.3 1.9 0.5-1.9 0.5-0.7 2.2-0.7-2.2-1.9-0.5 1.9-0.5 0.7-2.3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconCentres() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 10.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M3 10.5L12 3l9 7.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 21v-6.2a1.3 1.3 0 0 1 1.3-1.3h2.4a1.3 1.3 0 0 1 1.3 1.3V21"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
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
        strokeLinejoin="round"
      />
      <path
        d="M9.2 12l1.9 1.9L15 10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconReport() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 3v4a2 2 0 0 0 2 2h4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12h8M8 16h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------- Visual blocks ------------------------------ */

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
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/30 to-transparent" />
      <div className="absolute bottom-3 left-3 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700 backdrop-blur">
        Dashboard preview
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
      {/* Background image + overlay (keeps cards readable) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/admin/hero.png')" }} />
        <div className="absolute inset-0 bg-white/75" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/70 to-white/95" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      {/* Header (mobile friendly) */}
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
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center">
            <div>
              <div className="flex items-start gap-3">
                <IconWrap>
                  <IconSparkles />
                </IconWrap>
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-600">CLUB CENTRES MANAGER</p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                    Create and manage multiple centres — clean, separated operations
                  </h1>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                Each centre has its own people, terms, sessions, attendance and impact reports — keeping delivery consistent and
                making evidence export simple for schools and funders.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {["Role-based access", "Centre-separated data", "Evidence-ready reporting"].map((x) => (
                  <span
                    key={x}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-800"
                  >
                    {x}
                  </span>
                ))}
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

        {/* Main grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* Centres list */}
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur sm:p-8">
            <SectionTitle
              icon={<IconCentres />}
              kicker="YOUR CENTRES"
              title="Open a centre dashboard"
              subtitle="Click a centre to manage people, terms, sessions, attendance and reports."
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {centres.length === 0 ? (
                <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="text-sm font-semibold text-slate-900">No centres yet</p>
                  <p className="mt-1 text-sm text-slate-700">
                    Create your first Club Centre on the right to start operations.
                  </p>
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

          {/* Create centre */}
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur sm:p-8">
            <SectionTitle
              icon={<IconPlus />}
              kicker="CREATE"
              title="Add a new Club Centre"
              subtitle="Example: Club Centre 1, Club Centre 2, Club Centre 3…"
            />

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
                <div className="flex items-start gap-3">
                  <IconWrap>
                    <IconReport />
                  </IconWrap>
                  <div>
                    <p className="text-xs font-semibold tracking-widest text-slate-600">WHY THIS MATTERS</p>
                    <p className="mt-2 text-sm text-slate-700">
                      Centres keep programmes separated and make reporting cleaner — perfect for schools, parents, and funder-ready evidence.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { t: "Terms", d: "Term 1–3 structure" },
                  { t: "People", d: "Students • Parents • Teachers" },
                  { t: "Sessions", d: "Templates + evidence" },
                  { t: "Reports", d: "Export impact snapshots" },
                ].map((x) => (
                  <div key={x.t} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">{x.t}</p>
                    <p className="mt-1 text-sm text-slate-700">{x.d}</p>
                  </div>
                ))}
              </div>
            </form>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-6 rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-sm ring-1 ring-white/50 backdrop-blur">
          <div className="flex items-start gap-3">
            <IconWrap>
              <IconShield />
            </IconWrap>
            <div>
              <p className="text-xs font-semibold tracking-widest text-slate-600">SECURITY</p>
              <p className="mt-2 text-sm text-slate-700">
                Security is enforced by role-based permissions. Inactive sessions time out automatically, and logout is always available.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
