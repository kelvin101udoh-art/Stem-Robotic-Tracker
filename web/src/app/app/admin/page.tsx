// web/src/app/app/admin/page.tsx
"use client";

import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Club Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage access, maintain consistency, and oversee club activity.
            </p>
          </div>

          <Link
            href="/app/admin/invites"
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Invite users
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        {/* Quick stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active teachers", value: "—" },
            { label: "Students enrolled", value: "—" },
            { label: "Parents linked", value: "—" },
            { label: "Sessions logged", value: "—" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Main panels */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Access & roles */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Access & roles</h2>
            <p className="mt-2 text-sm text-slate-600">
              Invite teachers, students, and parents to your club using secure
              role-based links.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li>• Teachers manage sessions and notes</li>
              <li>• Students track progress and projects</li>
              <li>• Parents view weekly summaries</li>
            </ul>

            <Link
              href="/app/admin/invites"
              className="mt-5 inline-flex text-sm font-medium text-slate-900 underline underline-offset-4 hover:text-slate-700 cursor-pointer"
            >
              Manage invitations →
            </Link>
          </div>

          {/* Programme consistency */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Programme consistency</h2>
            <p className="mt-2 text-sm text-slate-600">
              Maintain consistent delivery across cohorts and terms.
            </p>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">
                Coming next
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Session templates, challenge libraries, and delivery tracking.
              </p>
            </div>
          </div>

          {/* Reporting & oversight */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Oversight & reporting</h2>
            <p className="mt-2 text-sm text-slate-600">
              Review high-level progress without accessing individual session
              logs.
            </p>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">
                Planned capability
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Cohort health summaries and progress snapshots.
              </p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            This dashboard is designed for club administrators only. All access
            and data visibility are controlled by role-based permissions.
          </p>
        </div>
      </section>
    </main>
  );
}
