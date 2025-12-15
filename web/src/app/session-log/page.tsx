'use client';
import { useState } from 'react';

const mockStudents = ['Aisha Okoro', 'Ben Li', 'Chloe Ahmed'];
const mockChallenges = ['Line Follower Time Trial', 'Maze Solve', 'Sumo Bot'];

export default function LogPage() {
  const [student, setStudent] = useState('');
  const [challenge, setChallenge] = useState('');
  const [score, setScore] = useState('');
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<any[]>([]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!student || !challenge) return;
    setEntries(prev => [...prev, { student, challenge, score, note }]);
    setScore('');
    setNote('');
  }

  return (
    <main className="max-w-3xl mx-auto p-6 grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Log Challenge Result</h1>
        <a href="/" className="text-sm underline">← Home</a>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 border rounded-2xl p-4">
        <label className="grid gap-1 text-sm">
          Student
          <select
            className="border rounded px-3 py-2"
            value={student}
            onChange={e => setStudent(e.target.value)}
          >
            <option value="">Select student</option>
            {mockStudents.map(s => <option key={s}>{s}</option>)}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          Challenge
          <select
            className="border rounded px-3 py-2"
            value={challenge}
            onChange={e => setChallenge(e.target.value)}
          >
            <option value="">Select challenge</option>
            {mockChallenges.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          Score / Time
          <input
            className="border rounded px-3 py-2"
            value={score}
            onChange={e => setScore(e.target.value)}
            placeholder="e.g. 35.2s or 87/100"
          />
        </label>

        <label className="grid gap-1 text-sm">
          Notes
          <textarea
            className="border rounded px-3 py-2"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Short comment about performance"
          />
        </label>

        <button className="bg-black text-white rounded px-4 py-2 text-sm">
          Save (mock)
        </button>
        <p className="text-xs text-gray-500">
          Month 2: This is mock logic only (kept in memory). Next month we’ll connect it to Supabase.
        </p>
      </form>

      {entries.length > 0 && (
        <section className="border rounded-2xl p-4">
          <h2 className="text-sm font-semibold mb-2">Session log (mock)</h2>
          <ul className="grid gap-2 text-sm">
            {entries.map((e, i) => (
              <li key={i} className="border rounded p-2">
                <div><b>{e.student}</b> • {e.challenge}</div>
                <div>Score/Time: {e.score || '—'}</div>
                <div className="text-xs text-gray-600">Note: {e.note || '—'}</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
