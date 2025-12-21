// app/cookies/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Cookie Notice • STEM Club Tracker",
  description: "Cookie notice for the STEM Club Tracker platform.",
};

export default function CookiesPage() {
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
          <div className="leading-tight">
            <h1 className="text-lg font-semibold">Cookie Notice</h1>
            <p className="text-xs text-slate-500">Last updated: {lastUpdated}</p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-7 text-sm leading-7 text-slate-700">
            <section>
              <h2 className="text-base font-semibold text-slate-900">1. What cookies are</h2>
              <p className="mt-2">
                Cookies are small text files stored on your device. They help websites function, keep you signed in,
                and remember preferences.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">2. Cookies we use</h2>
              <p className="mt-2">
                The Platform may use the following categories of cookies:
              </p>
              <ul className="mt-2 list-disc pl-5">
                <li>
                  <span className="font-semibold">Essential cookies</span> — required for core functionality (e.g.,
                  security, session management).
                </li>
                <li>
                  <span className="font-semibold">Authentication cookies</span> — used to keep you signed in when
                  login is enabled (e.g., Supabase auth session).
                </li>
                <li>
                  <span className="font-semibold">Analytics cookies</span> — if enabled, to understand usage and
                  improve performance (only where configured and permitted).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">3. Managing cookies</h2>
              <p className="mt-2">
                You can control cookies through your browser settings. Blocking some cookies may affect platform
                features such as login and secure areas.
              </p>
            </section>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/privacy"
                className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
              >
                Privacy Policy →
              </Link>
              <Link
                href="/terms"
                className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
              >
                Terms of Use →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
const COMPANY_NAME = "STEM Club Tracker";
const CONTACT_EMAIL = "kelvin101udoh@gmail.com";