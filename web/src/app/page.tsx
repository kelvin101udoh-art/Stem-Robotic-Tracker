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
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200 blur-3xl opacity-40" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-200 blur-3xl opacity-40" />
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-12 gap-10 items-center">
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

              {/* NEW: low-friction link (added, nothing removed) */}
              <div className="mt-3">
                <a
                  href="/session-log"
                  className="text-sm underline text-blue-700 hover:text-blue-800"
                >
                  Try logging a challenge →
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

            {/* Right column unchanged */}
            {/* ...rest of your file stays exactly the same */}

