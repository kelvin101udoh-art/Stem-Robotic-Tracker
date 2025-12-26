// web/src/app/app/admin/clubs/[clubId]/page.tsx

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAdminGuard } from "@/lib/admin/admin-guard";

type KPI = { label: string; value: string; hint?: string };
type Club = { id: string; name: string };

export default function ClubCentreDashboardPage() {
  const router = useRouter();
  const params = useParams<{ clubId: string }>();
  const clubId = params.clubId;

  const { checking, supabase, logout } = useAdminGuard({ idleMinutes: 15 });

  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<Club | null>(null);

  const kpis: KPI[] = useMemo(
    () => [
      { label: "Active teachers", value: "—", hint: "staffed this term" },
      { label: "Students enrolled", value: "—", hint: "active cohort" },
      { label: "Parents linked", value: "—", hint: "accounts connected" },
      { label: "Sessions logged", value: "—", hint: "this term" },
    ],
    []
  );

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
        // If centre not found (or access issues), kick back to admin home
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

  if (checking || loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="h-10 w-72 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="mt-6 h-[520px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Admin • {club?.name || "Club centre"}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Club Command Centre</h1>
            <p className="mt-1 text-sm text-slate-600">
              This dashboard is now scoped to the selected club centre.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/app/admin"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              ← Back to centres
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
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content (PUT YOUR “OUTSTANDING” DASHBOARD BODY HERE) */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                {item.hint ? <p className="text-xs text-slate-500">{item.hint}</p> : null}
              </div>
            </div>
          ))}
        </div>

        {/* IMPORTANT:
            Replace below with the full “Facebook-like” dashboard blocks you already liked.
            Just paste that whole dashboard layout here, and keep it scoped to clubId. */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold">Next: Paste your full dashboard UI here</p>
          <p className="mt-1 text-sm text-slate-600">
            Everything (people, sessions, attendance, insights) should read/write data filtered by this club centre ID:{" "}
            <span className="font-semibold">{clubId}</span>
          </p>
        </div>
      </section>
    </main>
  );
}
