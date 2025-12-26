"use client";

import Link from "next/link";
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
      // Assumption: you store centres in `clubs` table (each club = a centre)
      // If you later create a separate `club_centres` table, just swap the table name here.
      const { data, error } = await supabase
        .from("clubs")
        .select("id, name, created_at")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rows = (data || []) as ClubCentreRow[];
      setCentres(rows);

      // auto-suggest a name like "Club Centre 1"
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
      const created = data as ClubCentreRow;

      // Refresh list
      await loadCentres();

      // Go straight into that centre dashboard
      router.push(`/app/admin/clubs/${created.id}`);
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
          <div className="mt-6 h-[420px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/app/admin" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <span className="text-sm font-bold">ST</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">STEMTrack</div>
              <div className="text-xs text-slate-500">Admin • Club centres</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Homepage
            </Link>
            <button
              type="button"
              onClick={() => logout("manual")}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* Left: List */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500">CLUB CENTRES</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Select a centre to manage
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Each centre has its own people, terms, sessions, attendance, and reports.
                </p>
              </div>

              <button
                type="button"
                onClick={loadCentres}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                Refresh
              </button>
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

            <div className="mt-6 grid gap-3">
              {centres.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <p className="text-sm font-semibold text-slate-900">No centres yet</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Create your first Club Centre to start inviting teachers, students and parents.
                  </p>
                </div>
              ) : (
                centres.map((c) => (
                  <Link
                    key={c.id}
                    href={`/app/admin/clubs/${c.id}`}
                    className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                        <p className="mt-1 text-xs text-slate-500">Open centre dashboard</p>
                      </div>
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition group-hover:bg-slate-100">
                        →
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Right: Create */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
            <p className="text-xs font-semibold tracking-widest text-slate-500">CREATE</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">Add a new Club Centre</h2>
            <p className="mt-2 text-sm text-slate-600">
              Example: Club Centre 1, Club Centre 2, Club Centre 3…
            </p>

            <form onSubmit={createCentre} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Centre name</label>
                <input
                  value={centreName}
                  onChange={(e) => setCentreName(e.target.value)}
                  placeholder="Club Centre 1"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
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
                <p className="text-xs font-semibold tracking-widest text-slate-500">TIP</p>
                <p className="mt-1 text-sm text-slate-700">
                  Keep each centre separate for cleaner reporting and better delivery consistency.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
