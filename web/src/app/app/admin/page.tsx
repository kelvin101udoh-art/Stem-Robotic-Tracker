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

function Icon({ name }: { name: "home" | "plus" | "building" | "spark" | "book" | "shield" | "logout" | "refresh" }) {
  const common = "stroke-current";
  switch (name) {
    case "home":
      return (
        <svg className={common} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1v-10.5z" strokeWidth="1.8" />
        </svg>
      );
    case "plus":
      return (
        <svg className={common} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case "building":
      return (
        <svg className={common} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 21V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17" strokeWidth="1.7" />
          <path d="M18 9h2a2 2 0 0 1 2 2v10" strokeWidth="1.7" />
          <path d="M8 6h4M8 10h4M8 14h4M8 18h4" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "spark":
      return (
        <svg className={common} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2l1.2 4.1L17 7l-3.8 1-1.2 4-1.2-4L7 7l3.8-.9L12 2z" strokeWidth="1.6" />
          <path d="M19 12l.8 2.7L22 15l-2.2.6L19 18l-.8-2.4L16 15l2.2-.3L19 12z" strokeWidth="1.6" />
        </svg>
      );
    case "book":
      return (
        <svg className={common} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5z" strokeWidth="1.7" />
          <path d="M8 7h7M8 11h7" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "shield":
      return (
        <svg className={common} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2l7 4v6c0 5-3 9-7 10C8 21 5 17 5 12V6l7-4z" strokeWidth="1.7" />
          <path d="M9.2 12l1.9 1.9L15 10" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      );
    case "logout":
      return (
        <svg className={common} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M10 17l-1 0a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M15 7l5 5-5 5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 12H10" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case "refresh":
      return (
        <svg className={common} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 6v6h-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 18v-6h6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M20 12a8 8 0 0 0-14.5-4.5L4 12" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M4 12a8 8 0 0 0 14.5 4.5L20 12" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function SoftPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

function PreviewThumb({ src, label }: { src: string; label: string }) {
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
      <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/30 to-transparent" />
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

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [active, setActive] = useState<"overview" | "centres" | "templates" | "resources">("overview");

  const templates = useMemo(
    () => [
      { title: "After-school Club", desc: "Standard weekly delivery centre preset", preset: "After-school Centre" },
      { title: "Primary School", desc: "Simple centre naming for younger cohorts", preset: "Primary Centre" },
      { title: "Secondary School", desc: "Supports multi-cohort structure later", preset: "Secondary Centre" },
      { title: "Multi-site Network", desc: "Fast setup for scaling across locations", preset: "Network Centre" },
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
          <div className="h-10 w-56 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="mt-6 h-[640px] rounded-[32px] border border-slate-200 bg-white animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden text-slate-900">
      {/* Background image + readable overlay */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/admin/hero.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/75 to-white/95" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        {/* ✅ ONE single app-shell card */}
        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white/85 shadow-xl ring-1 ring-white/60 backdrop-blur">
          {/* Top nav (inside same card) */}
          <div className="flex flex-col gap-3 border-b border-slate-200/70 bg-white/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <span className="text-sm font-bold">ST</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-slate-900">STEMTrack Admin</div>
                <div className="text-xs text-slate-600">Centres hub</div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={loadCentres}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 sm:w-auto"
              >
                <Icon name="refresh" /> Refresh
              </button>

              <button
                type="button"
                onClick={() => logout("manual")}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 sm:w-auto"
              >
                <Icon name="logout" /> Logout
              </button>
            </div>
          </div>

          {/* Body: sidebar + main (still inside same card) */}
          <div className="grid min-h-[680px] grid-cols-1 lg:grid-cols-[280px_1fr]">
            {/* Sidebar */}
            <aside className="border-b border-slate-200/70 bg-white/70 p-4 lg:border-b-0 lg:border-r lg:p-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold tracking-widest text-slate-600">CONTROL</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">Centres only</p>
                <p className="mt-1 text-sm text-slate-700">
                  Create centres and open one. All operational features live inside a selected centre.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <SoftPill>Session timeout</SoftPill>
                  <SoftPill>Multi-centre</SoftPill>
                  <SoftPill>Clean structure</SoftPill>
                </div>
              </div>

              {/* Mobile tabs / Desktop nav */}
              <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
                <SideBtn active={active === "overview"} onClick={() => setActive("overview")} icon="home" label="Overview" />
                <SideBtn active={active === "centres"} onClick={() => setActive("centres")} icon="building" label="Centres" />
                <SideBtn active={active === "templates"} onClick={() => setActive("templates")} icon="spark" label="Templates" />
                <SideBtn active={active === "resources"} onClick={() => setActive("resources")} icon="book" label="Resources" />
              </div>

              <div className="mt-4 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white">
                    <Icon name="shield" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Security</p>
                    <p className="mt-1 text-sm text-slate-700">
                      Idle sessions logout automatically. Manual logout is always available.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main */}
            <div className="p-4 sm:p-6">
              {/* Alerts */}
              {error ? (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-800">Error</p>
                  <p className="mt-1 text-sm text-rose-700">{error}</p>
                </div>
              ) : null}

              {msg ? (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">Update</p>
                  <p className="mt-1 text-sm text-emerald-700">{msg}</p>
                </div>
              ) : null}

              {/* Overview */}
              {active === "overview" ? (
                <div className="space-y-5">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold tracking-widest text-slate-600">WELCOME</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Centres Hub</h1>
                    <p className="mt-2 text-sm text-slate-700">
                      Create multiple club centres and open one to continue setup. This keeps multi-site operations clean and scalable.
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold tracking-widest text-slate-600">TOTAL CENTRES</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">{centres.length}</p>
                        <p className="mt-1 text-xs text-slate-600">created so far</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold tracking-widest text-slate-600">SUGGESTED NAME</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">
                          {makeDefaultCentreName(centres.length)}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">auto naming</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold tracking-widest text-slate-600">NEXT STEP</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900">Create or select</p>
                        <p className="mt-1 text-xs text-slate-600">open a centre dashboard</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                      <PreviewThumb src="/images/admin/centre-1.png" label="Centre preview" />
                      <PreviewThumb src="/images/admin/centre-2.png" label="Admin layout preview" />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold tracking-widest text-slate-600">CREATE</p>
                    <h2 className="mt-2 text-lg font-semibold text-slate-900">Add a new centre</h2>
                    <p className="mt-2 text-sm text-slate-700">Example: Club Centre 1, Club Centre 2, Club Centre 3…</p>

                    <form onSubmit={createCentre} className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
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
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 sm:w-auto"
                      >
                        <Icon name="plus" />
                        {loading ? "Creating…" : "Create centre"}
                      </button>
                    </form>
                  </div>
                </div>
              ) : null}

              {/* Centres */}
              {active === "centres" ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest text-slate-600">YOUR CENTRES</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">Select a centre</h2>
                  <p className="mt-2 text-sm text-slate-700">
                    Click a centre to open its dashboard. (This hub stays centres-only.)
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {centres.length === 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:col-span-2">
                        <p className="text-sm font-semibold text-slate-900">No centres yet</p>
                        <p className="mt-1 text-sm text-slate-700">Create your first centre from Overview.</p>
                      </div>
                    ) : (
                      centres.map((c) => (
                        <Link
                          key={c.id}
                          href={`/app/admin/clubs/${c.id}`}
                          className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                        >
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
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              {/* Templates */}
              {active === "templates" ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest text-slate-600">TEMPLATES</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">Quick centre presets</h2>
                  <p className="mt-2 text-sm text-slate-700">
                    These presets only pre-fill a centre name to speed up setup.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {templates.map((t) => (
                      <button
                        key={t.title}
                        type="button"
                        onClick={() => {
                          setCentreName(t.preset);
                          setActive("overview");
                        }}
                        className="rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50 transition"
                      >
                        <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                        <p className="mt-1 text-sm text-slate-700">{t.desc}</p>
                        <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          Use preset
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Resources */}
              {active === "resources" ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest text-slate-600">RESOURCES</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">Docs & demo placeholders</h2>
                  <p className="mt-2 text-sm text-slate-700">
                    Keep your MVP looking premium: add a Loom/YouTube walkthrough and help docs later.
                  </p>

                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">60-second walkthrough</p>
                      <p className="mt-1 text-sm text-slate-700">(Placeholder — embed later)</p>
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
                        Suggested route: <span className="font-semibold">/demo</span>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Help centre</p>
                      <p className="mt-1 text-sm text-slate-700">FAQs: “How to create centres”, “Naming standards”, “Scaling”</p>
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-700">
                        Suggested route: <span className="font-semibold">/help</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Quick links</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href="/" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                        Back to site
                      </Link>
                      <button
                        type="button"
                        onClick={() => setActive("overview")}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Return to overview
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-6 text-xs text-slate-600">
                <p>
                  Note: This hub is intentionally limited to centre creation + selection. Operational features live inside each centre.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SideBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
        active
          ? "border-slate-300 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
      }`}
    >
      <span className={active ? "text-white" : "text-slate-800"}>
        <Icon name={icon} />
      </span>
      {label}
    </button>
  );
}
