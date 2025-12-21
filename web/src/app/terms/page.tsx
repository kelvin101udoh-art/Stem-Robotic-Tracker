// app/terms/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Terms of Use • STEM Club Tracker",
  description: "Prototype terms of use for the STEM Club Tracker platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
          <div className="leading-tight">
            <h1 className="text-lg font-semibold">Terms of Use</h1>
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

          <div className="mt-6 grid gap-6 text-sm leading-7 text-slate-700">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">Prototype notice</p>
              <p className="mt-1 text-slate-700">
                This Platform is a prototype. Features may change, mock data may be shown, and
                availability is not guaranteed.
              </p>
            </div>

            <section>
              <h2 className="text-base font-semibold text-slate-900">1. Acceptance</h2>
              <p className="mt-2">
                By using this Platform, you agree to these Terms. If you do not agree, do not use
                the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">2. Intended use</h2>
              <p className="mt-2">
                The Platform is designed to help STEM clubs and learning programmes record session
                activity, track progress, and generate parent-friendly summaries.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">3. User responsibilities</h2>
              <ul className="mt-2 list-disc pl-5">
                <li>Use the Platform lawfully and respectfully.</li>
                <li>Do not upload confidential or unnecessary sensitive data.</li>
                <li>
                  Ensure you have appropriate permissions before uploading any student data or
                  artefacts.
                </li>
                <li>Do not attempt to break, reverse engineer, or misuse the Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">4. Safeguarding and children</h2>
              <p className="mt-2">
                Where the Platform involves children, clubs/schools are responsible for safeguarding
                and obtaining required permissions. We recommend using minimal identifiers and
                avoiding unnecessary personal details.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">5. AI / automated outputs</h2>
              <p className="mt-2">
                The Platform may provide automated summaries or suggestions. These are provided for
                assistance only and should be reviewed by a mentor/teacher before use.
              </p>
              <p className="mt-2">
                Outputs are not medical, legal, or professional advice.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">6. Intellectual property</h2>
              <p className="mt-2">
                The Platform’s code, design, and branding are owned by the Platform creator unless
                otherwise stated. You retain ownership of the content you upload (e.g., photos,
                artefacts), but you grant us permission to process it to provide the Platform’s
                features.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">7. Availability and changes</h2>
              <p className="mt-2">
                We may modify, pause, or discontinue features at any time, especially during the
                prototype stage.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">8. Disclaimers</h2>
              <p className="mt-2">
                The Platform is provided “as is” and “as available”. We do not guarantee that the
                Platform will be error-free, uninterrupted, or suitable for a specific purpose.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">9. Limitation of liability</h2>
              <p className="mt-2">
                To the maximum extent permitted by law, we are not liable for any indirect or
                consequential loss arising from the use of the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">10. Contact</h2>
              <p className="mt-2">
                Questions about these Terms?{" "}
                <span className="text-slate-600">Add your contact email later.</span>
              </p>
            </section>

            <div className="pt-2">
              <Link
                href="/privacy"
                className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
              >
                Read Privacy Policy →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
