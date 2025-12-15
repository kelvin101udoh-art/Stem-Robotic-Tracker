'use client';

import { useMemo, useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && pwd.trim().length > 0;
  }, [email, pwd]);

  function fakeLogin(e: React.FormEvent) {
    e.preventDefault();
    alert('This is a UI-only mock in Month 1. Auth connects in Month 2.');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-slate-50">
      {/* Top bar */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white grid place-items-center shadow-sm">
              <span className="text-sm font-bold">SR</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">STEM Robotics</p>
              <p className="text-xs text-slate-500 -mt-0.5">Progress Tracker</p>
            </div>
          </a>

          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            ← Back to Home
          </a>
        </div>
      </header>

      {/* Body */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14">
        <div className="grid lg:grid-cols-12 gap-8 items-center">
          {/* Left: marketing panel */}
          <div className="lg:col-span-6">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm p-8">
              {/* subtle accents */}
              <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-blue-200 blur-3xl opacity-40" />
              <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-indigo-200 blur-3xl opacity-40" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Teacher access • Demo UI
                </div>

                <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                  Sign in to your teacher dashboard
                </h1>

                <p className="mt-4 text-slate-600 max-w-xl">
                  Log challenges quickly, build student portfolios automatically, and generate parent-friendly progress updates.
                </p>

                <div className="mt-6 grid sm:grid-cols-3 gap-3">
                  {[
                    { k: 'Quick logging', v: 'Under 30 seconds' },
                    { k: 'Portfolios', v: 'Notes + badges' },
                    { k: 'Insights', v: 'Cohort trends' },
                  ].map(card => (
                    <div key={card.k} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{card.k}</p>
                      <p className="mt-1 text-xs text-slate-600">{card.v}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700">Month 1 status</p>
                  <p className="mt-1 text-sm text-blue-800">
                    This page is UI-only. Next month we wire Supabase Auth (magic link + MFA for staff).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: login card */}
          <div className="lg:col-span-6">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 md:p-8 border-b border-slate-100">
                <h2 className="text-xl font-semibold text-slate-900">Teacher Login</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Use your staff account to access logging and reports.
                </p>
              </div>

              <form onSubmit={fakeLogin} className="p-6 md:p-8 grid gap-4">
                {/* Email */}
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-slate-900">Email</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="name@school.org"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    inputMode="email"
                  />
                </div>

                {/* Password */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-900">Password</label>
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                    >
                      {showPwd ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    type={showPwd ? 'text' : 'password'}
                    value={pwd}
                    onChange={e => setPwd(e.target.value)}
                    autoComplete="current-password"
                  />

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">Demo UI — no real authentication yet.</p>
                    <a href="#" className="text-xs font-semibold text-blue-700 hover:text-blue-800 underline">
                      Forgot password?
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={[
                    'inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition',
                    canSubmit
                      ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-md'
                      : 'bg-slate-200 text-slate-500 cursor-not-allowed',
                  ].join(' ')}
                >
                  Sign in
                  <span className="ml-2" aria-hidden="true">→</span>
                </button>

                {/* Bottom note */}
                <div className="pt-2 text-xs text-slate-500">
                  By signing in, you agree to the club’s data handling policy (demo text).
                </div>
              </form>
            </div>

            {/* Small help row */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-slate-600">
              <p>
                Need access? <span className="font-semibold text-slate-900">Ask the club admin</span>.
              </p>
              <a href="/student-demo" className="font-semibold text-blue-700 hover:text-blue-800 underline">
                View student demo →
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
