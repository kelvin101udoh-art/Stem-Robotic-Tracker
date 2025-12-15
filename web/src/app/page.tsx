import Image from "next/image";

/* 
export default function Home() {
 return (
   <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
     <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
       <Image
         className="dark:invert"
         src="/next.svg"
         alt="Next.js logo"
         width={100}
         height={20}
         priority
       />
       <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
         <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
           To get started, edit the page.tsx file.
         </h1>
         <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
           Looking for a starting point or more instructions? Head over to{" "}
           <a
             href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
             className="font-medium text-zinc-950 dark:text-zinc-50"
           >
             Templates
           </a>{" "}
           or the{" "}
           <a
             href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
             className="font-medium text-zinc-950 dark:text-zinc-50"
           >
             Learning
           </a>{" "}
           center.
         </p>
       </div>
       <a href="/log" className="text-sm underline">Try logging a challenge →</a>

       <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
         <a
           className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
           href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
           target="_blank"
           rel="noopener noreferrer"
         >
           <Image
             className="dark:invert"
             src="/vercel.svg"
             alt="Vercel logomark"
             width={16}
             height={16}
           />
           Deploy Now
         </a>
         <a
           className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
           href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
           target="_blank"
           rel="noopener noreferrer"
         >
           Documentation
         </a>
       </div>
     </main>
   </div>
 );
}

*/


export default function Home() {
  return (
    <main className="min-h-screen flex flex-col font-sans bg-gradient-to-b from-white via-white to-slate-50">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white grid place-items-center shadow-sm">
              <span className="text-sm font-bold">SR</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">STEM Robotics</p>
              <p className="text-xs text-slate-500 -mt-0.5">Progress Tracker</p>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#proof" className="hover:text-slate-900">Why it helps</a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/student-demo"
              className="hidden sm:inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              View demo
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition"
            >
              Teacher Login
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* soft background accents */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200 blur-3xl opacity-40" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-200 blur-3xl opacity-40" />
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-12 gap-10 items-center">
            {/* Left: copy */}
            <div className="md:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Built for STEM clubs • Robotics instructors • Parents
              </div>

              <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                Capture once, reuse everywhere.
              </h1>

              <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-2xl">
                Log challenge results in seconds, auto-build student portfolios, and share term highlights with parents —
                without messy spreadsheets.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
                <a
                  href="/log"
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition"
                >
                  Start Tracking Now
                  <span className="ml-2">→</span>
                </a>

                <a
                  href="/student-demo"
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition"
                >
                  View sample student profile
                </a>
              </div>

              {/* quick trust row */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-900">Under 30s</p>
                  <p className="text-slate-600">to log a challenge</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-900">Auto portfolios</p>
                  <p className="text-slate-600">results + badges</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 hidden sm:block">
                  <p className="font-semibold text-slate-900">Insights</p>
                  <p className="text-slate-600">club trends & reports</p>
                </div>
              </div>
            </div>

            {/* Right: mock “preview card” */}
            <div className="md:col-span-5">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Today’s Quick Log</p>
                  <span className="text-xs text-slate-500">Live preview</span>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Student</p>
                    <p className="text-sm font-semibold text-slate-900">Aisha Okoro</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Challenge</p>
                    <p className="text-sm font-semibold text-slate-900">Maze Solve</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">Score</p>
                      <p className="text-sm font-semibold text-slate-900">86</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">Badge</p>
                      <p className="text-sm font-semibold text-slate-900">Problem Solver</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-xs text-blue-700 font-semibold">Tip</p>
                    <p className="text-sm text-blue-800">
                      Add a short note — it becomes part of the student’s portfolio timeline.
                    </p>
                  </div>

                  <button className="rounded-2xl px-4 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition">
                    Save entry
                  </button>

                  <p className="text-xs text-slate-500">
                    *This is a UI preview — connect Supabase later for real data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 md:px-6 py-14">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Everything you need to run a stronger STEM club
            </h2>
            <p className="mt-2 text-slate-600 max-w-2xl">
              Designed for quick logging, clear progress evidence, and simple reporting.
            </p>
          </div>

          <a
            href="/student-demo"
            className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition w-fit"
          >
            See the demo profile →
          </a>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Quick Capture",
              desc: "Stopwatch + score + rubric in under 30 seconds.",
              icon: "⚡",
            },
            {
              title: "Student Portfolios",
              desc: "Automatic timeline of results, notes, and badges.",
              icon: "📘",
            },
            {
              title: "Manager Insights",
              desc: "Cohort trends, attendance, and performance summaries.",
              icon: "📈",
            },
            {
              title: "Parent-Friendly Sharing",
              desc: "Term highlights you can share confidently.",
              icon: "👨‍👩‍👧‍👦",
            },
            {
              title: "Standardised Rubrics",
              desc: "Make judging consistent across instructors.",
              icon: "✅",
            },
            {
              title: "Competition Ready",
              desc: "Track challenges like line follower, maze solve, and sumo.",
              icon: "🏁",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="h-11 w-11 rounded-2xl bg-slate-100 grid place-items-center text-lg">
                {c.icon}
              </div>
              <h3 className="mt-4 font-semibold text-lg text-slate-900">{c.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{c.desc}</p>
              <div className="mt-4 h-px bg-slate-100" />
              <p className="mt-4 text-xs text-slate-500">
                Built for evidence, reporting, and progress tracking.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">How it works</h2>
          <p className="mt-2 text-slate-600 max-w-2xl">
            A simple workflow that stays consistent each session.
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Select student + challenge",
                desc: "Pick from your class list and today’s activity.",
              },
              {
                step: "02",
                title: "Log score + quick note",
                desc: "Save a result and capture what they improved.",
              },
              {
                step: "03",
                title: "Portfolio updates automatically",
                desc: "Parents & instructors can see progress over time.",
              },
            ].map((s) => (
              <div key={s.step} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs font-semibold text-slate-500">STEP {s.step}</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof / CTA */}
      <section id="proof" className="border-t bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-14">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
            <div className="grid md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-8">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Ready to make progress measurable?
                </h2>
                <p className="mt-2 text-slate-600 max-w-2xl">
                  Start with a simple prototype flow today, then connect your database when you’re ready.
                </p>
              </div>
              <div className="md:col-span-4 flex md:justify-end">
                <a
                  href="/log"
                  className="w-full md:w-auto inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition"
                >
                  Start Tracking Now →
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Kelvin Edet • STEM Robotics Progress Tracker
        </div>
      </footer>
    </main>
  );
}
