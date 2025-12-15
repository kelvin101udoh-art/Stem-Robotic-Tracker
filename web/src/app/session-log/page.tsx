'use client';

import { useMemo, useState } from 'react';
import { mockChallenges, mockStudents, type SessionEntry } from '@/data/mock';
import { generateInsight } from '@/lib/insights';
import { buildWeeklySummary } from '@/lib/weeklySummary';

export default function LogPage() {
  const [student, setStudent] = useState('');
  const [challenge, setChallenge] = useState('');
  const [score, setScore] = useState('');
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<SessionEntry[]>([]);

  const canSave = useMemo(() => Boolean(student && challenge), [student, challenge]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!student || !challenge) return;

    const createdAt = new Date().toLocaleString();
    const entry: SessionEntry = { student, challenge, score, note, createdAt };
    setEntries(prev => [entry, ...prev]);

    setScore('');
    setNote('');
  }

  const weekly = useMemo(() => buildWeeklySummary(entries, mockStudents, 'Weekly summary (generated)'), [entries]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-slate-50">
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white grid place-items-center shadow-sm">
              <span className="text-sm font-bold">SR</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Session Log</p>
              <p className="text-xs text-slate-500 -mt-0.5">Challenge logging + AI insights (Month 3)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a href="/" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
              ← Home
            </a>
            <a href="/student-demo" className="rounded-xl px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition">
              Student demo →
            </a>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Form */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h1 className="text-lg font-semibold text-slate-900">Log Challenge Result</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Month 3: Capture entries + generate explainable insights (rule-based).
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Student</label>
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={student}
                    onChange={e => setStudent(e.target.value)}
                  >
                    <option value="">Select student</option>
                    {mockStudents.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Challenge</label>
                  <select
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={challenge}
                    onChange={e => setChallenge(e.target.value)}
                  >
                    <option value="">Select challenge</option>
                    {mockChallenges.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-900">Score / Time</label>
                    <input
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={score}
                      onChange={e => setScore(e.target.value)}
                      placeholder="e.g. 38.2s or 87/100 or Completed"
                    />
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-900">Quick tip</label>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                      Use “38.2s” for time-trial trend insights.
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Notes</label>
                  <textarea
                    className="min-h-[110px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Short coaching note (what improved / what to practice next)"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canSave}
                  className={[
                    'rounded-2xl px-5 py-3 text-sm font-semibold transition inline-flex items-center justify-center',
                    canSave ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md' : 'bg-slate-200 text-slate-500 cursor-not-allowed',
                  ].join(' ')}
                >
                  Save entry (mock)
                  <span className="ml-2" aria-hidden="true">→</span>
                </button>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700">AI ethics note</p>
                  <p className="mt-1 text-sm text-blue-800">
                    Insights are explainable and advisory only. They do not replace teacher judgement.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Entries + AI */}
          <div className="lg:col-span-7 grid gap-6">
            {/* Weekly Summary (auto-generated) */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Weekly Progress Summary (auto-generated)</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Automation preview: generates student statements from session logs.
                </p>
              </div>
              <div className="p-6 grid gap-4">
                {weekly.students.map(s => (
                  <div key={s.student} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{s.student}</p>
                        <p className="text-xs text-slate-600">{s.entriesCount} entries logged</p>
                      </div>

                      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border bg-white text-slate-700 border-slate-200">
                        {s.insight.label}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-700">{s.highlight}</p>
                    <p className="mt-1 text-xs text-slate-500">Reason: {s.insight.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Log Table */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Session Log</h2>
                  <p className="mt-1 text-sm text-slate-600">Newest entries appear at the top.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm text-slate-700">
                  Total: <span className="font-semibold text-slate-900">{entries.length}</span>
                </div>
              </div>

              <div className="p-6">
                {entries.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                    <div className="mx-auto h-12 w-12 rounded-2xl bg-white border border-slate-200 grid place-items-center">
                      <span className="text-lg">🧾</span>
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900">No entries yet</h3>
                    <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                      Log your first result to generate an insight and weekly summary.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="grid grid-cols-12 bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                      <div className="col-span-3 px-4 py-3">Student</div>
                      <div className="col-span-4 px-4 py-3">Challenge</div>
                      <div className="col-span-2 px-4 py-3">Score/Time</div>
                      <div className="col-span-3 px-4 py-3">AI Insight</div>
                    </div>

                    <ul className="divide-y divide-slate-200">
                      {entries.map((e, i) => {
                        const insight = generateInsight(e.student, entries);
                        return (
                          <li key={i} className="grid grid-cols-12 text-sm">
                            <div className="col-span-3 px-4 py-3 font-semibold text-slate-900">{e.student}</div>
                            <div className="col-span-4 px-4 py-3 text-slate-700">
                              <p>{e.challenge}</p>
                              <p className="text-xs text-slate-500 line-clamp-1">{e.note || '—'}</p>
                            </div>
                            <div className="col-span-2 px-4 py-3">
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                {e.score || '—'}
                              </span>
                            </div>
                            <div className="col-span-3 px-4 py-3">
                              <p className="text-xs font-semibold text-slate-900">{insight.label}</p>
                              <p className="text-xs text-slate-500 line-clamp-2">{insight.reason}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Month 3: mock logic only (in-memory). Month 4/5: connect Supabase + real persistence.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
