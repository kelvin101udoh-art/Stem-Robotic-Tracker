// app/privacy/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy • STEM Club Tracker",
  description: "Privacy policy for the STEM Club Tracker platform.",
};

const COMPANY_NAME = "STEM Club Tracker";
const CONTACT_EMAIL = "privacy@yourdomain.com"; // change later
const JURISDICTION = "United Kingdom";

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
          <div className="leading-tight">
            <h1 className="text-lg font-semibold">Privacy Policy</h1>
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
            <p className="font-semibold text-slate-900">Testing / Beta notice</p>
            <p className="mt-1">
              This platform may be used with real account and learning data for testing. We still
              aim to collect and process the minimum data needed, and apply appropriate security
              controls for a beta product.
            </p>
          </div>

          <div className="mt-8 grid gap-7 text-sm leading-7 text-slate-700">
            <section>
              <h2 className="text-base font-semibold text-slate-900">1. Who we are</h2>
              <p className="mt-2">
                {COMPANY_NAME} (the “Platform”, “we”, “us”) provides a tracking and progress
                platform for STEM and robotics clubs.
              </p>
              <p className="mt-2">
                <span className="font-semibold">Contact:</span>{" "}
                <span className="text-slate-900">{CONTACT_EMAIL}</span>
              </p>
              <p className="mt-2">
                <span className="font-semibold">Jurisdiction:</span> {JURISDICTION}
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">2. What data we collect</h2>
              <p className="mt-2">Depending on enabled features, we may collect:</p>
              <ul className="mt-2 list-disc pl-5">
                <li>
                  <span className="font-semibold">Account data</span> (e.g., name, email, role,
                  organisation/club).
                </li>
                <li>
                  <span className="font-semibold">Learner data</span> (e.g., learner name/initials,
                  cohort/group, attendance, challenge attempts, outcomes).
                </li>
                <li>
                  <span className="font-semibold">Coach/mentor notes</span> (optional observations and guidance).
                </li>
                <li>
                  <span className="font-semibold">Uploads / artefacts</span> (e.g., photos/videos, code snippets,
                  project files) if storage is enabled.
                </li>
                <li>
                  <span className="font-semibold">Usage and device data</span> (e.g., logs, basic analytics,
                  approximate location from IP) to secure and improve the Platform.
                </li>
              </ul>

              <p className="mt-3 text-slate-600">
                We recommend clubs avoid unnecessary sensitive personal data and use IDs/initials where practical.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">3. Children’s data and safeguarding</h2>
              <p className="mt-2">
                The Platform may be used for children’s learning records. Clubs/schools are responsible for:
              </p>
              <ul className="mt-2 list-disc pl-5">
                <li>Obtaining required parental/guardian permissions and providing notices.</li>
                <li>Following safeguarding policies and applicable education rules.</li>
                <li>Minimising personal data (use IDs/initials where possible).</li>
              </ul>
              <p className="mt-3">
                If you believe a child’s data has been uploaded without permission, contact us at{" "}
                <span className="font-semibold">{CONTACT_EMAIL}</span>.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">4. How we use data</h2>
              <ul className="mt-2 list-disc pl-5">
                <li>To provide core features (logging, viewing progress, summaries, exports).</li>
                <li>To maintain safety, prevent abuse, and monitor security.</li>
                <li>To improve the Platform’s usability and performance.</li>
                <li>To support onboarding and customer support requests.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">5. Legal bases (UK GDPR / GDPR)</h2>
              <p className="mt-2">
                Where applicable, we process personal data under one or more legal bases, such as:
              </p>
              <ul className="mt-2 list-disc pl-5">
                <li>
                  <span className="font-semibold">Contract</span> (to provide the Platform to clubs/users).
                </li>
                <li>
                  <span className="font-semibold">Legitimate interests</span> (security, improving the Platform,
                  preventing misuse).
                </li>
                <li>
                  <span className="font-semibold">Consent</span> (where required, e.g., certain marketing or
                  optional features).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">6. Supabase and service providers</h2>
              <p className="mt-2">
                We use third-party processors to operate the Platform, which may include:
              </p>
              <ul className="mt-2 list-disc pl-5">
                <li>
                  <span className="font-semibold">Supabase</span> (database, authentication, storage).
                </li>
                <li>
                  <span className="font-semibold">Hosting</span> (e.g., Vercel) to deliver the web application.
                </li>
              </ul>
              <p className="mt-3 text-slate-600">
                These providers process data on our behalf under appropriate contractual terms. Data may be stored
                in regions configured for your Supabase/hosting project.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">7. Sharing</h2>
              <p className="mt-2">
                We do not sell personal data. Data is shared only:
              </p>
              <ul className="mt-2 list-disc pl-5">
                <li>With service providers needed to run the Platform.</li>
                <li>With your club/school users according to their role-based access.</li>
                <li>When required by law or to protect rights, safety, and security.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">8. Data retention</h2>
              <p className="mt-2">
                We retain data for as long as necessary for the Platform’s purpose, then delete or anonymise it where
                feasible. Clubs may request deletion or export of data subject to verification and role permissions.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">9. Security</h2>
              <p className="mt-2">
                We use reasonable security measures such as role-based access, authentication controls, and secure
                storage practices. No system is 100% secure, but we work to protect data from unauthorised access.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">10. Your rights</h2>
              <p className="mt-2">
                Depending on the law that applies to you, you may have rights to access, correct, delete, restrict,
                or object to processing, and to request portability.
              </p>
              <p className="mt-2">
                To make a request, email <span className="font-semibold">{CONTACT_EMAIL}</span>.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">11. Cookies</h2>
              <p className="mt-2">
                We use cookies and similar technologies for essential functionality and, if enabled, analytics.
                See our{" "}
                <Link
                  href="/cookies"
                  className="font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
                >
                  Cookie Notice
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">12. Changes</h2>
              <p className="mt-2">
                We may update this Privacy Policy. Updates will be reflected by the “Last updated” date above.
              </p>
            </section>

            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/terms"
                className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
              >
                Terms of Use →
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
