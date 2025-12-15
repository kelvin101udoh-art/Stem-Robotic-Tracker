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
    // Main container ensures the footer is pushed to the bottom of the screen
    <main className="min-h-screen flex flex-col font-sans">
      
      {/* Header/Navigation Bar */}
      <header className="p-4 md:p-6 border-b bg-white shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            STEM Robotics Progress Tracker
          </h1>
          {/* Use a clear call-to-action button style for login */}
          <a
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition duration-150"
          >
            Teacher Login
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-700 text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
            Capture once, reuse everywhere.
          </h2>
          <p className="max-w-2xl mx-auto text-blue-100 mb-10 text-lg md:text-xl">
            Log challenge results in seconds. Auto‑build student portfolios. Share term highlights with parents.
          </p>
          
          {/* Demo Section (formerly smaple2) - Centered with inline content border */}
          <div className="flex justify-center mb-10">
            {/* The span wraps tightly around the text, allowing the border to fit the word width */}
            <span className="inline-block border-2 border-blue-300 bg-blue-600 rounded-lg px-4 py-2 shadow-md">
              <a href="/student-demo" className="text-sm font-medium hover:underline">
                View sample student profile →
              </a>
            </span>
          </div>

          {/* Centered Call-to-Action Button */}
          <div className="flex justify-center">
            <button className="bg-white hover:bg-gray-100 text-blue-700 font-bold py-3 px-8 rounded-lg shadow-lg transition duration-150 transform hover:scale-105">
              Start Tracking Now
            </button>
          </div>
          
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Quick Capture', desc: 'Stopwatch + score + rubric in <30s' },
            { title: 'Student Portfolios', desc: 'Timeline of results & badges' },
            { title: 'Manager Insights', desc: 'Cohort trends & dashboards' }
          ].map((c) => (
            <div key={c.title} className="border border-gray-200 rounded-xl p-6 shadow-sm bg-white hover:shadow-md transition duration-300">
              {/* Optional: Add an icon here for a more professional look */}
              <h3 className="font-semibold text-lg mb-2 text-gray-800">{c.title}</h3>
              <p className="text-sm text-gray-500">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer (Pushed to bottom using mt-auto on the main container) */}
      <footer className="mt-auto p-6 text-center text-xs text-gray-500 border-t">
        © {new Date().getFullYear()} Kelvin Edet
      </footer>
    </main>
  );
}
