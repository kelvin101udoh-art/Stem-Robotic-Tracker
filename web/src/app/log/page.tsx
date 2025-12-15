'use client';

import { useMemo, useState } from 'react';

const mockStudents = ['Aisha Okoro', 'Ben Li', 'Chloe Ahmed'];
const mockChallenges = ['Line Follower Time Trial', 'Maze Solve', 'Sumo Bot'];

type Entry = {
  student: string;
  challenge: string;
  score: string;
  note: string;
  createdAt: string;
};

export default function LogPage() {
  const [student, setStudent] = useState('');
  const [challenge, setChallenge] = useState('');
  const [score, setScore] = useState('');
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);

  const canSave = useMemo(() => Boolean(student && challenge), [student, challenge]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!student || !challenge) return;

    const createdAt = new Date().toLocaleString();
    setEntries(prev => [{ student, challenge, score, note, createdAt }, ...prev]);

    setScore('');
    setNote('');
  }

  function clearForm() {
    setStudent('');
    setChallenge('');
    setScore('');
    setNote('');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white grid place-items-center shadow-sm">
              <span className="text-sm font-bold">SR</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">Session Log</p>
              <p className="text-xs text-slate-500 -mt-0.5">Log a challenge result (mock)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left: Form card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h1 className="text-lg md:text-xl font-semibold text-slate-900">Log Challenge Result</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Capture a student’s performance in seconds. This is <span className="font-semibold">mock-only</span> (stored in memory).
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 grid gap-4">
                {/* Student */}
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Student</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={student}
                    onChange={e => setStudent(e.target.value)}
                  >
                    <option value="">Select student</option>
                    {mockStudents.map(s => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {!student && (
                    <p className="text-xs text-slate-500">
                      Tip: pick a student to enable saving.
                    </p>
                  )}
                </div>

                {/* Challenge */}
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Challenge</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={challenge}
                    onChange={e => setChallenge(e.target.value)}
                  >
                    <option value="">Select challenge</option>
                    {mockChallenges.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {!challenge && (
                    <p className="text-xs text-slate-500">
                      Choose the activity you ran today.
                    </p>
                  )}
                </div>

                {/* Score + Notes */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-900">Score / Time</label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={score}
                      onChange={e => setScore(e.target.value)}
                      placeholder="e.g. 35.2s or 87/100"
                    />
                    <p className="text-xs text-slate-500">
                      Optional (you can log notes only).
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-900">Quick badge</label>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                      {score?.includes('s') ? '🏁 Time Trial' : score ? '✅ Scored' : '—'}
                    </div>
                    <p className="text-xs text-slate-500">
                      Mock indicator (auto from input).
                    </p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Notes</label>
                  <textarea
                    className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Short comment about performance (e.g., improved turning accuracy, better obstacle detection...)"
                  />
                  <p className="text-xs text-slate-500">
                    Keep it short — this will appear in the portfolio timeline.
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:items-center">
                  <button
                    type="submit"
                    disabled={!canSave}
                    className={[
                      'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition',
                      canSave
                        ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed',
                    ].join(' ')}
                  >
                    Save entry (mock)
                    <span className="ml-2" aria-hidden="true">→</span>
                  </button>

                  <button
                    type="button"
                    onClick={clearForm}
                    className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition"
                  >
                    Clear
                  </button>
                </div>

                {/* Footer note */}
                <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs text-blue-800">
                    Month 2: This is mock logic only (kept in memory). Next month we’ll connect it to Supabase.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Entries */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Session log</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Latest entries appear at the top.
                  </p>
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
                      Log your first challenge result on the left. This will become the student’s portfolio timeline later.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="grid grid-cols-12 bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                      <div className="col-span-4 px-4 py-3">Student</div>
                      <div className="col-span-4 px-4 py-3">Challenge</div>
                      <div className="col-span-2 px-4 py-3">Score/Time</div>
                      <div className="col-span-2 px-4 py-3">When</div>
                    </div>

                    <ul className="divide-y divide-slate-200">
                      {entries.map((e, i) => (
                        <li key={i} className="grid grid-cols-12 gap-0 text-sm">
                          <div className="col-span-4 px-4 py-3">
                            <p className="font-semibold text-slate-900">{e.student}</p>
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {e.note || '—'}
                            </p>
                          </div>

                          <div className="col-span-4 px-4 py-3">
                            <p className="text-slate-900">{e.challenge}</p>
                            <p className="text-xs text-slate-500">Session entry</p>
                          </div>

                          <div className="col-span-2 px-4 py-3">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {e.score || '—'}
                            </span>
                          </div>

                          <div className="col-span-2 px-4 py-3 text-xs text-slate-600">
                            {e.createdAt}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Small helper row */}
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {[
                { k: 'Fast input', v: 'Select + save in seconds' },
                { k: 'Consistent evidence', v: 'Same structure every week' },
                { k: 'Portfolio-ready', v: 'Notes feed progress timeline' },
              ].map(card => (
                <div key={card.k} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{card.k}</p>
                  <p className="mt-1 text-sm text-slate-600">{card.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-10" />
      </section>
    </main>
  );
}
