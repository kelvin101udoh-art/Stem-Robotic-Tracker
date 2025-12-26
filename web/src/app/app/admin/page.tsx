"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminGuard } from "@/lib/admin/admin-guard";

/* ------------------ Types ------------------ */
type ClubCentreRow = {
  id: string;
  name: string;
  created_at?: string;
};

/* ------------------ Helpers ------------------ */
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
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

/* ------------------ Page ------------------ */
export default function AdminHomePage() {
  const router = useRouter();
  const { checking, supabase, logout } = useAdminGuard({ idleMinutes: 15 });

  const [loading, setLoading] = useState(false);
  const [centres, setCentres] = useState<ClubCentreRow[]>([]);
  const [centreName, setCentreName] = useState("");

  const [error, setError] = useState("");

  async function loadCentres() {
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
      setError(e?.message || "Failed to load centres.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!checking) loadCentres();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);

  async function createCentre(e: React.FormEvent) {
    e.preventDefault();
    if (!centreName.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clubs")
        .insert({ name: centreName.trim() })
        .select("id, name, created_at")
        .single();

      if (error) throw error;

      router.push(`/app/admin/clubs/${data.id}`);
    } catch (e: any) {
      setError(e?.message || "Could not create centre.");
    } finally {
      setLoading(false);
    }
  }

  /* ------------------ Loading ------------------ */
  if (checking) {
    return (
      <main className="min-h-screen bg-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-12 animate-pulse">
          <div className="h-10 w-72 rounded-xl bg-white/10" />
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="h-[480px] rounded-3xl bg-white/10" />
            <div className="h-[480px] rounded-3xl bg-white/10" />
          </div>
        </div>
      </main>
    );
  }

  return (
    /* ================== ROOT BACKGROUND ================== */
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute -top-48 -left-48 h-[700px] w-[700px] rounded-full bg-indigo-500/10 blur-[140px]" />
        <div className="absolute top-1/3 -right-48 h-[600px] w-[600px] rounded-full bg-cyan-400/10 blur-[140px]" />
      </div>

      {/* ================== HEADER ================== */}
      <header className="relative z-20 sticky top-0 backdrop-blur bg-slate-950/70 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/app/admin" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-600 text-white font-bold">
              ST
            </div>
            <div>
              <p className="text-sm font-semibold">STEMTrack</p>
              <p className="text-xs text-slate-400">Admin · Club Centres</p>
            </div>
          </Link>

          <button
            onClick={() => logout("manual")}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ================== CONTENT ================== */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        {/* HERO */}
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl bg-slate-900/70 backdrop-blur border border-white/10 p-8 shadow-xl">
            <p className="text-xs font-semibold tracking-widest text-slate-400">
              ADMIN HOME
            </p>
            <h1 className="mt-2 text-3xl font-semibold">
              Manage multiple club centres
            </h1>
            <p className="mt-3 text-slate-300 leading-relaxed">
              Each centre operates independently — with its own people,
              sessions, attendance, and impact evidence.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Centre-separated data",
                "Role-based access",
                "Evidence-ready reporting",
              ].map((x) => (
                <span
                  key={x}
                  className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300 border border-white/10"
                >
                  {x}
                </span>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="rounded-3xl bg-slate-900/70 backdrop-blur border border-white/10 shadow-xl overflow-hidden">
            <Image
              src="/images/admin/hero.png"
              alt=""
              width={900}
              height={600}
              className="h-full w-full object-cover opacity-90"
            />
          </div>
        </div>

        {/* ================== CENTRES ================== */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* Centres list */}
          <div className="rounded-3xl bg-slate-900/70 backdrop-blur border border-white/10 p-8 shadow-xl">
            <h2 className="text-xl font-semibold">Your centres</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {centres.length === 0 ? (
                <div className="rounded-2xl bg-white/5 p-6 border border-white/10">
                  <p className="text-sm font-semibold">No centres yet</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Create your first club centre to begin.
                  </p>
                </div>
              ) : (
                centres.map((c, idx) => (
                  <Link
                    key={c.id}
                    href={`/app/admin/clubs/${c.id}`}
                    className="group rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition"
                  >
                    <Image
                      src={
                        idx % 2 === 0
                          ? "/images/admin/centre-1.png"
                          : "/images/admin/centre-2.png"
                      }
                      alt=""
                      width={400}
                      height={160}
                      className="h-28 w-full rounded-xl object-cover"
                    />

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{c.name}</p>
                        <p className="text-xs text-slate-400">
                          Created {formatDate(c.created_at)}
                        </p>
                      </div>
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white font-semibold">
                        {initials(c.name)}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Create centre */}
          <div className="rounded-3xl bg-slate-900/70 backdrop-blur border border-white/10 p-8 shadow-xl">
            <h2 className="text-xl font-semibold">Add a new centre</h2>
            <p className="mt-2 text-sm text-slate-400">
              Example: Club Centre 1, Club Centre 2…
            </p>

            <form onSubmit={createCentre} className="mt-6 space-y-4">
              <input
                value={centreName}
                onChange={(e) => setCentreName(e.target.value)}
                placeholder="Club Centre 1"
                className="w-full rounded-xl bg-slate-800 border border-white/10 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold hover:bg-indigo-500 disabled:opacity-60"
              >
                {loading ? "Creating…" : "Create centre"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
