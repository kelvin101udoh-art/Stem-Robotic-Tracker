// app/cookies/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Cookie Notice • STEM Club Tracker",
  description: "Prototype cookie notice for the STEM Club Tracker platform.",
};

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
          <div className="leading-tight">
            <h1 className="text-lg font-semibold">Cookie Notice</h1>
            <p className="text-xs text-slate-500">Prototype version</p>
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
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Last updated:</span>{" "}
            {new Date().toLocaleDateString()}
          </p>

          <div className="mt-6 space-y-6 text-sm leading-7 text-slate-700">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Prototype notice</p>
              <p className="mt-1">
                This prototype may not use cookies beyond what is necessary to run the site. If
                analytics/authentication are added later, this notice will be updated.
              </p>
            </div>

            <section>
              <h2 className="text-base font-semibold text-slate-900">1. What cookies are</h2>
              <p className="mt-2">
                Cookies are small text files stored on your device to help websites function and
                remember preferences.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">2. Cookies we may use</h2>
              <ul className="mt-2 list-disc pl-5">
                <li>
                  <span className="font-semibold">Essential cookies</span> — required for core site
                  functionality (if applicable).
                </li>
                <li>
                  <span className="font-semibold">Analytics cookies</span> — only if enabled later,
                  to understand usage and improve the product.
                </li>
                <li>
                  <span className="font-semibold">Authentication cookies</span> — only if login is
                  enabled later.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">3. Managing cookies</h2>
              <p className="mt-2">
                You can control cookies via your browser settings. Blocking cookies may affect site
                functionality.
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
