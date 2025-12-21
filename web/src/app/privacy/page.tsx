// app/privacy/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy • STEM Club Tracker",
  description: "Prototype privacy policy for the STEM Club Tracker platform.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
          <div className="leading-tight">
            <h1 className="text-lg font-semibold">Privacy Policy</h1>
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
                This platform is currently a prototype. Screens may use mock data. If and when
                real authentication and storage are enabled, this policy will be updated to reflect
                the exact data flows.
              </p>
            </div>

            <section>
              <h2 className="text-base font-semibold text-slate-900">1. Who we are</h2>
              <p className="mt-2">
                “STEM Club Tracker” (the “Platform”) is a prototype project intended to help STEM
                clubs record learning progress and share parent-friendly updates.
              </p>
              <p className="mt-2">
                <span className="font-semibold">Contact:</span>{" "}
                <span className="text-slate-600">Add your email later (e.g. hello@yourdomain.com)</span>
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">2. What data we may collect</h2>
              <p className="mt-2">
                Depending on what features are enabled, the Platform may collect:
              </p>
              <ul className="mt-2 list-disc pl-5">
                <li>
                  <span className="font-semibold">Account data</span> (e.g., email, role) if login is enabled.
                </li>
                <li>
                  <span className="font-semibold">Session/activity data</span> (e.g., attendance, challenges, notes).
                </li>
                <li>
                  <span className="font-semibold">Student artefacts</span> (e.g., photos, code snippets, build uploads) if uploads are enabled.
                </li>
                <li>
                  <span className="font-semibold">Usage data</span> (e.g., basic analytics) to improve the Platform.
                </li>
              </ul>

              <p className="mt-3 text-slate-600">
                We aim to collect the minimum needed to deliver the features.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">3. Children’s data</h2>
              <p className="mt-2">
                STEM clubs often involve children. If the Platform processes data about children,
                it should only be used with appropriate permissions from the organising school/club
                and in line with safeguarding policies.
              </p>
              <p className="mt-2">
                We recommend clubs avoid uploading unnecessary personal data and use initials or
                IDs where possible.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">4. How we use data</h2>
              <ul className="mt-2 list-disc pl-5">
                <li>To provide and improve the Platform’s features and user experience.</li>
                <li>To generate progress summaries and parent-friendly outputs (where enabled).</li>
                <li>To maintain safety, prevent abuse, and secure the Platform.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">5. AI and automated summaries</h2>
              <p className="mt-2">
                Some features may generate automated summaries or suggestions. These are intended
                as assistance, not decisions. Outputs should be reviewed by a mentor/teacher before
                being relied upon or shared.
              </p>
              <p className="mt-2">
                Where possible, the Platform should label what is <span className="font-semibold">observed</span>{" "}
                (logged by humans) vs <span className="font-semibold">inferred</span> (generated).
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">6. Sharing and third parties</h2>
              <p className="mt-2">
                We do not sell personal data. Data may be processed by service providers used to run
                the Platform (e.g., hosting, database, storage). When enabled, these providers may
                include platforms such as Vercel and Supabase.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">7. Data retention</h2>
              <p className="mt-2">
                We keep data only as long as needed for the Platform’s purpose. For prototypes, we
                recommend not storing sensitive data and regularly clearing test data.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">8. Your rights</h2>
              <p className="mt-2">
                Depending on your location, you may have rights to access, correct, or delete
                personal data. If login is enabled, we will provide a method to request deletion.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">9. Security</h2>
              <p className="mt-2">
                We use reasonable security practices appropriate for a prototype. For production
                use, additional controls should be added (e.g., role-based access, audit logs, and
                stronger policies).
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-slate-900">10. Changes to this policy</h2>
              <p className="mt-2">
                We may update this policy as the Platform evolves. The “Last updated” date will be
                revised accordingly.
              </p>
            </section>

            <div className="pt-2">
              <Link
                href="/terms"
                className="text-sm font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900"
              >
                Read Terms of Use →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
