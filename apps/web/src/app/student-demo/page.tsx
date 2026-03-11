const attempts = [
  { challenge: 'Line Follower', score: '38.2s', term: 'Autumn 1', status: 'Completed' },
  { challenge: 'Maze Solve', score: 'Completed', term: 'Autumn 1', status: 'Completed' },
  { challenge: 'Sumo Bot', score: 'Top 3', term: 'Autumn 2', status: 'Achievement' },
];

export default function StudentDemo() {
  const progressPct = 70;

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
              <p className="text-sm font-semibold text-slate-900">Student Profile</p>
              <p className="text-xs text-slate-500 -mt-0.5">Demo view</p>
            </div>
          </div>

          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            ← Back to Home
          </a>
        </div>
      </header>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Left: profile card */}
          <div className="lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-500">Student</p>

                <div className="mt-3 flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white grid place-items-center shadow-sm">
                    <span className="font-bold">AO</span>
                  </div>

                  <div className="min-w-0">
                    <h1 className="text-xl font-semibold text-slate-900">Aisha Okoro</h1>
                    <p className="text-sm text-slate-600">Year: Y6 • Cohort: Robotics Club</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">
                        Consistent attendance
                      </span>
                      <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                        Portfolio active
                      </span>
                      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Improving fast
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div className="p-6 grid gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">Overall Progress</h2>
                  <span className="text-sm font-semibold text-slate-900">{progressPct}%</span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-3 rounded-full"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <p className="text-xs text-slate-500">
                  Approx. {progressPct}% of term challenges completed (demo).
                </p>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Challenges</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">3</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Badges</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">2</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">Rank</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">Top 3</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold text-blue-700">Coach note</p>
                  <p className="mt-1 text-sm text-blue-800">
                    Aisha improved steering control and obstacle planning. Next focus: consistent line sensing calibration.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: recent challenges */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Recent Challenges</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    A quick overview of the latest logged results (demo data).
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm text-slate-700">
                  Term: <span className="font-semibold text-slate-900">Autumn</span>
                </div>
              </div>

              <div className="p-6">
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  {/* table header */}
                  <div className="grid grid-cols-12 bg-slate-50 text-xs font-semibold text-slate-600 border-b border-slate-200">
                    <div className="col-span-5 px-4 py-3">Challenge</div>
                    <div className="col-span-3 px-4 py-3">Term</div>
                    <div className="col-span-2 px-4 py-3">Result</div>
                    <div className="col-span-2 px-4 py-3">Status</div>
                  </div>

                  {/* rows */}
                  <ul className="divide-y divide-slate-200">
                    {attempts.map((a, i) => (
                      <li key={i} className="grid grid-cols-12 text-sm">
                        <div className="col-span-5 px-4 py-3">
                          <p className="font-semibold text-slate-900">{a.challenge}</p>
                          <p className="text-xs text-slate-500">Robotics challenge</p>
                        </div>

                        <div className="col-span-3 px-4 py-3 text-slate-700">
                          {a.term}
                        </div>

                        <div className="col-span-2 px-4 py-3">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {a.score}
                          </span>
                        </div>

                        <div className="col-span-2 px-4 py-3">
                          <span
                            className={[
                              'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border',
                              a.status === 'Achievement'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-blue-50 border-blue-200 text-blue-700',
                            ].join(' ')}
                          >
                            {a.status}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom CTA */}
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Next step</p>
                    <p className="text-sm text-slate-600">
                      Try logging a new result to see how it appears in the session log.
                    </p>
                  </div>
                  <a
                    href="/session-log"
                    className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition"
                  >
                    Go to Session Log →
                  </a>
                </div>
              </div>
            </div>

            {/* Mini cards */}
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {[
                { k: 'Evidence-ready', v: 'Progress is visible over time' },
                { k: 'Parent friendly', v: 'Clear updates without jargon' },
                { k: 'Coach insights', v: 'Notes support improvement plans' },
              ].map(card => (
                <div key={card.k} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{card.k}</p>
                  <p className="mt-1 text-sm text-slate-600">{card.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-10" />
      </section>
    </main>
  );
}
