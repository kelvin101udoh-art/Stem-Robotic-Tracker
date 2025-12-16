'use client';

import { useMemo, useState } from 'react';

const mockStudents = ['Aisha Okoro', 'Ben Li', 'Chloe Ahmed'];
const mockChallenges = ['Line Follower Time Trial', 'Maze Solve', 'Sumo Bot'];

type SessionEntry = {
  student: string;
  challenge: string;
  score: string; // e.g. "38.2s" or "87/100" or "Completed"
  note: string;
  createdAt: string;
};

function parseSeconds(score: string): number | null {
  const m = score.trim().match(/^(\d+(\.\d+)?)s$/i);
  if (!m) return null;
  return Number(m[1]);
}

type Insight = {
  label: 'Improving' | 'Needs practice' | 'Consistent performer' | 'Not enough data';
  reason: string;
};

function generateInsight(student: string, entries: SessionEntry[]): Insight {
  const sEntries = entries.filter(e => e.student === student).slice().reverse(); // oldest -> newest
  if (sEntries.length < 2) {
    return { label: 'Not enough data', reason: 'Log at least 2 sessions to generate a trend insight.' };
  }

  const times = sEntries.map(e => parseSeconds(e.score)).filter((v): v is number => v !== null);
  if (times.length >= 2) {
    const first = times[0];
    const last = times[times.length - 1];
    const change = ((first - last) / first) * 100;

    if (change >= 10) {
      return {
        label: 'Improving',
        reason: `Time reduced from ${first.toFixed(1)}s to ${last.toFixed(1)}s (≈${change.toFixed(0)}% improvement).`,
      };
    }
    if (change <= -10) {
      return {
        label: 'Needs practice',
        reason: `Time increased from ${first.toFixed(1)}s to ${last.toFixed(1)}s. Consider extra calibration practice.`,
      };
    }
    return { label: 'Consistent performer', reason: 'Performance is stable across recent sessions (small variation).' };
  }

  const completedCount = sEntries.filter(e => /completed|top/i.test(e.score)).length;
  if (completedCount >= 2) {
    return { label: 'Consistent performer', reason: `Multiple successful outcomes logged (${completedCount} achievements).` };
  }

  return { label: 'Needs practice', reason: 'Add one more score/time to generate a stronger trend insight.' };
}

function buildWeeklySummary(entries: SessionEntry[]) {
  return mockStudents.map(student => {
    const sEntries = entries.filter(e => e.student === student);
    const insight = generateInsight(student, entries);
    const latest = sEntries[0];

    const highlight = latest
      ? `Latest: ${latest.challenge} — ${latest.score}${latest.note ? ` (“${latest.note}”)` : ''}`
      : 'No sessions logged yet.';

    return { student, entriesCount: sEntries.length, insight, highlight };
  });
}

export default function LogPage() {
  const [student, setStudent] = useState('');
  const [challenge, setChallenge] = useState('');
  const [scoreValue, setScoreValue] = useState(''); // user types: 38.2
  const [scoreUnit, setScoreUnit] = useState<'seconds' | 'points' | 'status'>('seconds');
  const [note, setNote] = useState('');

  const [entries, setEntries] = useState<SessionEntry[]>([]);

  const canSave = useMemo(() => Boolean(student && challenge), [student, challenge]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!student || !challenge) return;

    // Build a nicer score string for storage + AI parsing
    let computedScore = scoreValue.trim();

    if (scoreUnit === 'seconds') {
      // user types "38.2" → store "38.2s"
      computedScore = computedScore ? `${computedScore}s` : '';
    } else if (scoreUnit === 'points') {
      // user types "87" → store "87/100" (example)
      computedScore = computedScore ? `${computedScore}/100` : '';
    } else {
      // status: user types "Completed" or "Top 3"
      computedScore = computedScore;
    }

    setEntries(prev => [
      { student, challenge, score: computedScore, note, createdAt: new Date().toLocaleString() },
      ...prev,
    ]);

    setScoreValue('');
    setNote('');
  }


  const weekly = useMemo(() => buildWeeklySummary(entries), [entries]);

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
              <p className="text-xs text-slate-500 -mt-0.5">AI insights + automation preview (Month 3)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a href="/" className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition">
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left: Form */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h1 className="text-lg md:text-xl font-semibold text-slate-900">Log Challenge Result</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Log sessions and generate explainable insights (rule-based foundation).
                </p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 grid gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Student</label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={challenge}
                    onChange={e => setChallenge(e.target.value)}
                  >
                    <option value="">Select challenge</option>
                    {mockChallenges.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="grid gap-4">
                  <div className="grid md:grid-cols-12 gap-4 items-end">
                    {/* Result */}
                    <div className="md:col-span-8 grid gap-2">
                      <label className="text-sm font-medium text-slate-900">Result</label>

                      <div className="flex gap-2">
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={scoreValue}
                          onChange={(e) => setScoreValue(e.target.value)}
                          placeholder={
                            scoreUnit === 'seconds'
                              ? 'e.g. 38.2'
                              : scoreUnit === 'points'
                                ? 'e.g. 87'
                                : 'e.g. Completed'
                          }
                          inputMode={scoreUnit === 'seconds' || scoreUnit === 'points' ? 'decimal' : 'text'}
                        />

                        <select
                          className="min-w-[140px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={scoreUnit}
                          onChange={(e) => setScoreUnit(e.target.value as any)}
                        >
                          <option value="seconds">Seconds</option>
                          <option value="points">Points</option>
                          <option value="status">Status</option>
                        </select>
                      </div>

                      <p className="text-xs text-slate-500">
                        Tip: choose <b>Seconds</b> to trigger time-trend insights automatically.
                      </p>
                    </div>

                    {/* Save */}
                    <div className="md:col-span-4">
                      <button
                        type="submit"
                        className="w-full rounded-2xl px-5 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition"
                      >
                        Save entry <span className="ml-2">→</span>
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-slate-900">Notes</label>
                    <textarea
                      className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Short coaching note (what improved / what to practice next)"
                    />
                  </div>
                </div>


                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700">AI ethics note</p>
                  <p className="mt-1 text-sm text-blue-800">
                    Insights are explainable and advisory only. They do not replace teacher judgement.
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Right: Weekly Summary + Log */}
          <div className="lg:col-span-7 grid gap-6">
            {/* Weekly Summary (auto-generated) */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-900">Weekly Progress Summary (auto-generated)</h2>
                <p className="mt-1 text-sm text-slate-600">Automation preview: generates progress statements from logs.</p>
              </div>
              <div className="p-6 grid gap-4">
                {weekly.map(s => (
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

            {/* Session Log */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Session log</h2>
                  <p className="mt-1 text-sm text-slate-600">Latest entries appear at the top.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm text-slate-700">
                  Total: <span className="font-semibold text-slate-900">{entries.length}</span>
                </div>
              </div>

              <div className="p-6">
                {entries.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                    <h3 className="font-semibold text-slate-900">No entries yet</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Log at least 2 time-trial scores for Aisha (e.g., 45.0s then 38.2s) to see “Improving”.
                    </p>
                  </div>
                ) : (
                  <ul className="grid gap-3">
                    {entries.map((e, i) => {
                      const insight = generateInsight(e.student, entries);
                      return (
                        <li key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{e.student}</p>
                              <p className="text-sm text-slate-700">{e.challenge}</p>
                              <p className="text-xs text-slate-500 mt-1">{e.createdAt}</p>
                            </div>

                            <div className="text-right">
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                {e.score || '—'}
                              </span>
                              <p className="text-xs font-semibold text-slate-900 mt-2">{insight.label}</p>
                              <p className="text-xs text-slate-500 max-w-[260px]">{insight.reason}</p>
                            </div>
                          </div>

                          {e.note ? (
                            <p className="mt-3 text-xs text-slate-600">Note: {e.note}</p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Month 3: mock logic only (in-memory). Month 4: persist to Supabase.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
