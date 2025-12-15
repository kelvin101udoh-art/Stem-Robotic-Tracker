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


<a href="/student-demo" className="text-sm underline">View sample student profile →</a>


export default function Home() {
return (
<main className="min-h-screen flex flex-col">
<header className="p-6 border-b">
<div className="max-w-5xl mx-auto flex items-center justify-between">
<h1 className="text-2xl font-bold">STEM Robotics Progress Tracker</h1>
<a className="text-sm underline" href="/login">Teacher Login</a>
</div>
</header>
<section className="max-w-5xl mx-auto p-6 grid gap-4">
<h2 className="text-xl font-semibold">Capture once, reuse everywhere.</h2>
<p className="text-gray-600">Log challenge results in seconds. Auto‑build student portfolios. Share term highlights with parents.</p>
<div className="grid sm:grid-cols-3 gap-4">
{[
{title:'Quick Capture',desc:'Stopwatch + score + rubric in <30s'},
{title:'Student Portfolios',desc:'Timeline of results & badges'},
{title:'Manager Insights',desc:'Cohort trends & dashboards'}
].map((c)=> (
<div key={c.title} className="border rounded-xl p-4">
<h3 className="font-medium">{c.title}</h3>
<p className="text-sm text-gray-600">{c.desc}</p>
</div>
))}
</div>
</section>
<footer className="mt-auto p-6 text-center text-xs text-gray-500">© {new Date().getFullYear()} Kelvin Edet</footer>
</main>
);
}