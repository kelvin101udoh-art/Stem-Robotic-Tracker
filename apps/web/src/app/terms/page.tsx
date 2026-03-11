// app/terms/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Terms of Use • STEM Club Tracker",
  description: "Terms of use for the STEM Club Tracker platform.",
};

const COMPANY_NAME = "STEMTrack";
const CONTACT_EMAIL = "kelvin101udoh@gmail.com"; // change later

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
          <div className="leading-tight">
            <h1 className="text-lg font-semibold">Terms of Use</h1>
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Beta / testing status</p>
            <p className="mt-1">
              The Platform may evolve quickly. Features may change or be removed. Data may be processed
              in real accounts for testing and operational use.
            </p>
          </div>

          <div className="mt-8 grid gap-7 text-sm leading-7 text-slate-700">
            <section>
              <h2 className="text-base font-semibold text-slate-900">1. Agreement</h2>
              <p className="mt-2">
                By using {COMPANY_NAME} (the “Platform”), you agree to these Terms. If you do not agree,
                do not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">2. Who the Platform is for</h2>
              <p className="mt-2">
                The Platform is designed for STEM clubs, learning centres, schools, mentors, students,
                and parents to track learning progress and share structured updates.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">3. Accounts and access</h2>
              <ul className="mt-2 list-disc pl-5">
                <li>You are responsible for maintaining the confidentiality of your login details.</li>
                <li>Access may be role-based (e.g., parent/student/mentor/admin).</li>
                <li>We may suspend accounts for misuse or security reasons.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">4. Acceptable use</h2>
              <ul className="mt-2 list-disc pl-5">
                <li>Do not upload unlawful, harmful, or abusive content.</li>
                <li>Do not upload sensitive personal data unless absolutely necessary.</li>
                <li>Do not attempt to disrupt or reverse engineer the Platform.</li>
                <li>Use the Platform only in line with your organisation’s safeguarding policies.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">5. Safeguarding and children</h2>
              <p className="mt-2">
                If the Platform is used to process information about children, the club/school is responsible
                for permissions, notices, and safeguarding compliance. We recommend using IDs/initials where possible.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">6. User content</h2>
              <p className="mt-2">
                You retain ownership of content you upload (e.g., photos, notes, artefacts). You grant us a limited
                licence to host, store, and process that content only to operate the Platform and provide features.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">7. Automated summaries / AI</h2>
              <p className="mt-2">
                The Platform may generate summaries or suggestions to support mentors and parents. These outputs:
              </p>
              <ul className="mt-2 list-disc pl-5">
                <li>May be incomplete or incorrect.</li>
                <li>Should be reviewed by a responsible adult/mentor before being relied upon.</li>
                <li>Are provided as assistance, not professional advice.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">8. Availability</h2>
              <p className="mt-2">
                We aim for stable availability, but we do not guarantee uninterrupted service. Planned maintenance
                may occur, and beta features may change.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">9. Disclaimers</h2>
              <p className="mt-2">
                The Platform is provided “as is” and “as available”. We do not guarantee that the Platform will
                be error-free or meet every requirement.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">10. Limitation of liability</h2>
              <p className="mt-2">
                To the maximum extent permitted by law, we are not liable for indirect or consequential loss arising
                from use of the Platform. Nothing in these Terms limits liability where it cannot be limited by law.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">11. Termination</h2>
              <p className="mt-2">
                We may suspend or terminate access if these Terms are violated or if needed for security.
                You may stop using the Platform at any time.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">12. Contact</h2>
              <p className="mt-2">
                Questions? Contact <span className="font-semibold">{CONTACT_EMAIL}</span>.
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
                href="/cookies"
                className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
              >
                Cookie Notice →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
