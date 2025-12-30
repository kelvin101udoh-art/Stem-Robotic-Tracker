// web/src/app/app/admin/clubs/[clubId]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAdminGuard } from "@/lib/admin/admin-guard";

type KPI = { label: string; value: string; hint?: string; icon?: string };
type Club = { id: string; name: string };

function formatTitle(name?: string) {
  const n = (name || "").trim();
  return n ? n : "Club centre";
}

export default function ClubCentreDashboardPage() {
  const router = useRouter();
  const params = useParams<{ clubId: string }>();
  const clubId = params.clubId;

  const { checking, supabase, logout } = useAdminGuard({ idleMinutes: 15 });

  const [loading, setLoading] = useState(true);
  const [club, setClub] = useState<Club | null>(null);

  const kpis: KPI[] = useMemo(
    () => [
      { label: "Active teachers", value: "—", hint: "staffed this term", icon: "👩🏽‍🏫" },
      { label: "Students enrolled", value: "—", hint: "active cohort", icon: "🧒🏽" },
      { label: "Parents linked", value: "—", hint: "accounts connected", icon: "👨‍👩‍👧‍👦" },
      { label: "Sessions logged", value: "—", hint: "this term", icon: "🗓️" },
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
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="h-10 w-72 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="mt-6 h-[520px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-clip text-slate-900">
      {/* Premium background */}
      <div className="fixed inset-0 -z-10 overflow-clip pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/50" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute -left-40 top-[-120px] h-[520px] w-[520px] rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute -right-40 bottom-[-140px] h-[560px] w-[560px] rounded-full bg-emerald-200/35 blur-3xl" />
      </div>

      {/* Header (fixed + mobile safe) */}
      <header
        className="
          fixed inset-x-0 top-0 z-50
          w-full max-w-[100vw]
          overflow-x-clip overflow-hidden
          border-b border-white/30
          bg-white/65 backdrop-blur-xl
        "
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-20 h-[320px] w-[320px] rounded-full bg-sky-300/25 blur-3xl" />
          <div className="absolute right-0 -top-20 h-[340px] w-[340px] rounded-full bg-emerald-300/20 blur-3xl" />
        </div>

        <div className="relative mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-slate-500">
              ADMIN • {formatTitle(club?.name)}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              Club Command Centre
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Everything here is scoped to this centre.
              <span className="ml-2 hidden sm:inline-flex rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-700">
                ID: {clubId}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/app/admin"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              ← Back
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
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div aria-hidden className="h-[118px] md:h-[92px]" />

      {/* Body */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        {/* KPI “Control room” */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-widest text-slate-500">OVERVIEW</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Centre health at a glance
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Track staffing, enrolment, parent links, and session delivery.
              </p>
            </div>

            <div className="text-sm font-semibold text-slate-700">
              Centre: <span className="text-slate-900">{formatTitle(club?.name)}</span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-widest text-slate-500">{k.label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{k.value}</p>
                    {k.hint ? <p className="mt-1 text-xs text-slate-500">{k.hint}</p> : null}
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-lg">
                    {k.icon || "•"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
          {/* Left column */}
          <div className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur sm:p-7">
            <p className="text-xs font-semibold tracking-widest text-slate-500">QUICK ACTIONS</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">Manage this centre</h3>
            <p className="mt-1 text-sm text-slate-600">
              Jump straight to the core areas. (We’ll wire these routes next.)
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                { t: "People", d: "Teachers, students, parents", icon: "👥", href: `/app/admin/clubs/${clubId}/people` },
                { t: "Terms", d: "Term structure & lessons", icon: "📚", href: `/app/admin/clubs/${clubId}/terms` },
                { t: "Sessions", d: "Weekly delivery calendar", icon: "🗓️", href: `/app/admin/clubs/${clubId}/sessions` },
                { t: "Attendance", d: "Quick register + notes", icon: "✅", href: `/app/admin/clubs/${clubId}/attendance` },
                { t: "Gallery", d: "Student builds & uploads", icon: "🖼️", href: `/app/admin/clubs/${clubId}/gallery` },
                { t: "Reports", d: "Funder-ready summaries", icon: "📈", href: `/app/admin/clubs/${clubId}/reports` },
              ].map((x) => (
                <Link
                  key={x.t}
                  href={x.href}
                  className="group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{x.t}</p>
                      <p className="mt-1 text-xs text-slate-600">{x.d}</p>
                    </div>
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-lg">
                      {x.icon}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-slate-500">Open</p>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition group-hover:bg-slate-50">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Setup checklist */}
            <div className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur sm:p-7">
              <p className="text-xs font-semibold tracking-widest text-slate-500">SETUP</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Centre checklist</h3>
              <p className="mt-1 text-sm text-slate-600">
                Make sure the basics are ready before delivery starts.
              </p>

              <div className="mt-4 space-y-3">
                {[
                  "Add at least 1 teacher",
                  "Create Term 1 (weeks + lesson list)",
                  "Create your first session schedule",
                  "Enrol students (or import list)",
                  "Enable parent access (optional)",
                ].map((t) => (
                  <div key={t} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="mt-0.5 h-5 w-5 rounded-md border border-slate-300 bg-slate-50" />
                    <p className="text-sm text-slate-700">{t}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur sm:p-7">
              <p className="text-xs font-semibold tracking-widest text-slate-500">RECENT</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">Latest updates</h3>
              <p className="mt-1 text-sm text-slate-600">
                This will show the last actions taken in this centre.
              </p>

              <div className="mt-4 space-y-3">
                {[
                  { a: "Created centre", b: "Centre created and ready", t: "Just now" },
                  { a: "Next step", b: "Add teacher + term schedule", t: "Today" },
                  { a: "Tip", b: "Use Sessions to map weeks", t: "This week" },
                ].map((x, i) => (
                  <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{x.a}</p>
                        <p className="mt-1 text-xs text-slate-600">{x.b}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{x.t}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder for your “Facebook-like” blocks */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur sm:p-7">
          <p className="text-sm font-semibold text-slate-900">Next: Your full dashboard blocks</p>
          <p className="mt-1 text-sm text-slate-600">
            Paste the “Facebook-like” centre feed blocks here. Every query must be filtered by{" "}
            <span className="font-semibold">{clubId}</span>.
          </p>
        </div>
      </section>
    </main>
  );
}
