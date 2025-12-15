'use client';
import type { Challenge } from '@/data/mock';
import { loadChallenges } from '@/data/mock';

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 border border-slate-200 bg-slate-50 rounded-full text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

export default async function ChallengesPage() {
  let rows: Challenge[] = [];
  let errorMsg: string | null = null;

  try {
    rows = await loadChallenges();
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : 'Failed to load challenges.';
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-slate-900">Challenge Templates</h1>
            <p className="text-sm text-slate-600">Reusable templates used for session logging and rubrics.</p>
          </div>

          <div className="flex items-center gap-2">
            <a
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
              href="/"
            >
              ← Back
            </a>

            {/* Vercel-safe refresh (no client JS needed) */}
            <a
              className="rounded-xl px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition"
              href="/challenges"
            >
              Refresh
            </a>
          </div>
        </div>

        {errorMsg ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">Could not load challenges</p>
            <p className="text-sm text-red-700 mt-1">{errorMsg}</p>
            <p className="text-xs text-red-700 mt-2">
              Tip: If loadChallenges uses <b>fs</b> or reads local JSON, it must run server-side (this page does).
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-white border border-slate-200 grid place-items-center">
              <span className="text-lg">📄</span>
            </div>
            <h2 className="mt-4 font-semibold text-slate-900">No templates found</h2>
            <p className="mt-2 text-sm text-slate-600">
              Add templates to your mock source and refresh this page.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-4 py-3">Name</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Rubric Criteria</th>
                    <th className="text-left px-4 py-3">Active</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {rows.map((c) => (
                    <tr key={c.name} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">{c.name}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {String(c.type).replace('_', ' ')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {c.rubric.criteria.map((cr) => (
                            <Badge key={cr.key}>
                              {cr.key} / {cr.max}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border',
                            c.is_active
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-slate-100 border-slate-200 text-slate-700',
                          ].join(' ')}
                        >
                          {c.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 mt-2">
          Month 1: Data loaded from a mock source. Month 2: switch to Supabase DB + RLS.
        </p>
      </div>
    </main>
  );
}
