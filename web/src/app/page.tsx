import Image from "next/image";

// app/page.tsx
import Link from "next/link";

type Role = {
  title: string;
  description: string;
  href: string;
  tag: string;
};

type FeatureGroup = {
  title: string;
  bullets: string[];
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <Hero />

      {/* WHO IT'S FOR */}
      <Section>
        <SectionHeader
          eyebrow="Who it’s for"
          title="Built for everyone involved in a robotics club"
          subtitle="The platform supports club operations end-to-end: smoother sessions, clearer progress, and better communication."
        />
        <AudienceRow />
      </Section>

      {/* PAIN → OUTCOME */}
      <Section className="bg-slate-50">
        <SectionHeader
          eyebrow="Pain → Outcome"
          title="Fix the real problems that create burnout"
          subtitle="Robotics sessions don’t fail because kids can’t learn. They fail when delivery becomes inconsistent and hard to manage."
        />
        <PainToOutcome />
      </Section>

      {/* HOW IT WORKS */}
      <Section>
        <SectionHeader
          eyebrow="How it works"
          title="A simple workflow mentors can actually maintain"
          subtitle="Attendance and activities go in. Progress summaries and next-session plans come out."
        />
        <HowItWorks />
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Month 3 focus (AI foundations)</p>
          <p className="mt-1">
            Insights are explainable and rule-based for now (safe + transparent). Later months can evolve into ML once you have real data.
          </p>
        </div>
      </Section>

      {/* FEATURES */}
      <Section className="bg-slate-50">
        <SectionHeader
          eyebrow="Features"
          title="Everything you need to run sessions smoothly"
          subtitle="Designed around mentor relief, retention, parent clarity, and club-wide reporting."
        />
        <FeatureGrid />
      </Section>

      {/* ROLE ENTRY */}
      <Section>
        <SectionHeader
          eyebrow="Role-based access"
          title="Each role sees what they need"
          subtitle="Students, parents, teachers, and admins all have a clear view — without clutter."
        />
        <RoleEntry />
      </Section>

      {/* WHY CLUBS CHOOSE THIS */}
      <Section className="bg-slate-900 text-white">
        <ForClubsCTA />
      </Section>

      {/* FINAL CTA */}
      <FinalCTA />

      <Footer />
    </main>
  );
}

/* ----------------------------- Components ----------------------------- */

function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white shadow-sm">
            SR
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold text-slate-900">STEM Robotics</span>
            <span className="block text-xs text-slate-500 -mt-0.5">Progress Tracker</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-700 md:flex">
          <a href="#how-it-works" className="hover:text-slate-900">How it works</a>
          <a href="#features" className="hover:text-slate-900">Features</a>
          <a href="#for-clubs" className="hover:text-slate-900">For Clubs</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/student-demo"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
          >
            View Demo
          </Link>
          <Link
            href="/session-log"
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Start Free
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="border-b border-slate-200">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Built for STEM clubs • learning centres • after-school programmes
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Run smoother robotics sessions — without burnout.
          </h1>

          <p className="mt-4 text-lg text-slate-700">
            Attendance + session activities go in. Your platform generates progress evidence, parent-friendly updates,
            and next-session plans — so delivery stays consistent even when mentors change.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/session-log"
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-200 transition"
            >
              Start Free
            </Link>
            <Link
              href="/student-demo"
              className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
            >
              View Demo
            </Link>
          </div>

          <p className="mt-4 text-sm text-slate-600">
            Micro trust: Built for real club operations — not generic school admin tools.
          </p>
        </div>

        {/* Right preview */}
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">A quick preview</p>
          <div className="mt-4 grid gap-3">
            <PreviewCard title="1) Mark attendance" desc="Present/Absent in seconds." />
            <PreviewCard title="2) Assign session activity" desc="Pick from your term library." />
            <PreviewCard title="3) Auto insights + summaries" desc="Progress statements generated from logs." />
            <PreviewCard title="4) Term outcomes" desc="Evidence you can share with parents & managers." />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition"
            >
              Teacher Login
            </Link>
            <Link
              href="/session-log"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition"
            >
              Try Session Log →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mx-auto max-w-6xl px-4 py-14">{children}</div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="text-sm font-semibold text-slate-600">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
      {subtitle ? <p className="mt-3 text-slate-700">{subtitle}</p> : null}
    </div>
  );
}

/* WHO IT’S FOR */
function AudienceRow() {
  const items = [
    { title: "Club Leads", desc: "Consistency, reporting, growth confidence.", icon: "🏫" },
    { title: "Teachers/Mentors", desc: "Less stress, faster handover, clarity.", icon: "🧑‍🏫" },
    { title: "Parents", desc: "Weekly updates that make sense.", icon: "👨‍👩‍👧‍👦" },
    { title: "Students", desc: "Visible progress and “what’s next.”", icon: "🤖" },
  ];

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-4">
      {items.map((i) => (
        <div key={i.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100">
            <span className="text-lg">{i.icon}</span>
          </div>
          <p className="mt-3 font-semibold">{i.title}</p>
          <p className="mt-2 text-sm text-slate-600">{i.desc}</p>
        </div>
      ))}
    </div>
  );
}

/* PAIN → OUTCOME */
function PainToOutcome() {
  const rows = [
    { pain: "Mentors forget where sessions ended.", outcome: "Session memory + next-session suggestions." },
    { pain: "Different mentors teach differently.", outcome: "Term library + consistent delivery flow." },
    { pain: "Students fall behind quietly.", outcome: "Attendance + history exposes catch-up needs early." },
    { pain: "Parents ask: “What did my child do?”", outcome: "Auto weekly summaries + shareable snapshots." },
    { pain: "Scaling from 20 to 50 becomes chaos.", outcome: "Central records + reporting for growth." },
  ];

  return (
    <div className="mt-8 grid gap-4">
      {rows.map((r) => (
        <div
          key={r.pain}
          className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2"
        >
          <div>
            <p className="text-sm font-semibold text-slate-600">Pain</p>
            <p className="mt-1 font-semibold">{r.pain}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600">Outcome</p>
            <p className="mt-1 text-slate-800">{r.outcome}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* HOW IT WORKS */
function HowItWorks() {
  const steps = [
    { title: "1) Mark attendance", desc: "Present/Absent for the session." },
    { title: "2) Assign today’s activity", desc: "Pick from your term activity library." },
    { title: "3) Generate insights", desc: "Explainable progress labels + reasons (Month 3)." },
    { title: "4) Share outcomes", desc: "Parent-friendly summaries and exports (coming next)." },
  ];

  return (
    <div id="how-it-works" className="mt-8 grid gap-4 md:grid-cols-4">
      {steps.map((s) => (
        <div key={s.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-semibold">{s.title}</p>
          <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
        </div>
      ))}
    </div>
  );
}

/* FEATURES */
function FeatureGrid() {
  const groups: FeatureGroup[] = [
    {
      title: "Mentor Relief",
      bullets: ["One-tap last session summary", "Next-step suggestions", "Catch-up prompts for missed sessions"],
    },
    {
      title: "Session Operations",
      bullets: ["Term activity library", "Attendance-linked logging", "Simple mentor handover flow"],
    },
    {
      title: "Progress & Outcomes",
      bullets: ["Progress labels + reasons", "Student timeline (demo)", "Milestones students understand"],
    },
    {
      title: "Parent Communication",
      bullets: ["Weekly summary generation", "Clear snapshots without jargon", "Term overview (coming soon)"],
    },
    {
      title: "Club Management",
      bullets: ["Admin view for cohorts", "Reporting + export roadmap", "Evidence-friendly records"],
    },
  ];

  return (
    <div id="features" className="mt-8 grid gap-4 md:grid-cols-3">
      {groups.map((g) => (
        <div key={g.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold">{g.title}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {g.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-2 inline-block h-2 w-2 rounded-full bg-slate-900" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ROLE ENTRY (2x2) */
function RoleEntry() {
  const roles: Role[] = [
    { title: "Student", tag: "Progress", description: "See what you did, what improved, and what’s next.", href: "/student-demo" },
    { title: "Parent", tag: "Updates", description: "Weekly summaries and term outcomes at a glance.", href: "/student-demo" },
    { title: "Teacher", tag: "Session Flow", description: "Mark attendance, log results, generate insights.", href: "/session-log" },
    { title: "Admin", tag: "Reporting", description: "Manage terms, templates, cohorts, and exports.", href: "/challenges" },
  ];

  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      {roles.map((r) => (
        <div key={r.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="text-lg font-semibold">{r.title} View</p>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {r.tag}
            </span>
          </div>
          <p className="mt-2 text-slate-700">{r.description}</p>
          <div className="mt-4">
            <Link
              href={r.href}
              className="inline-flex rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
            >
              Open {r.title}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

/* WHY CLUBS CHOOSE THIS + CTA */
function ForClubsCTA() {
  return (
    <div id="for-clubs" className="mx-auto max-w-6xl px-4 py-14">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm font-semibold text-slate-300">For STEM club buyers</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Stop running sessions from memory and spreadsheets.
          </h2>
          <p className="mt-3 text-slate-200">
            Reduce mentor stress, keep delivery consistent, improve retention, and give parents clear updates —
            with a system that remembers every session and guides what happens next.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/session-log"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition"
            >
              Start Free
            </Link>
            <Link
              href="/student-demo"
              className="rounded-2xl border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              View Demo
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/15 bg-white/5 p-6">
          <p className="text-sm font-semibold text-slate-200">Why clubs choose this</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            <li>• Designed to reduce mentor stress (week 1 value)</li>
            <li>• Consistent delivery across mentors and groups</li>
            <li>• Parent-ready weekly updates without extra admin</li>
            <li>• Early catch-up signals that protect retention</li>
            <li>• Evidence-friendly reporting for operations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* FINAL CTA */
function FinalCTA() {
  return (
    <section className="border-t border-slate-200 bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 md:p-10 shadow-sm">
          <div className="grid gap-6 md:grid-cols-12 md:items-center">
            <div className="md:col-span-8">
              <p className="text-sm font-semibold text-slate-600">Final CTA</p>
              <h3 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                Try it now with a simple session log.
              </h3>
              <p className="mt-2 text-slate-700">
                Log results in seconds and see progress insights instantly. No setup required.
              </p>
            </div>
            <div className="md:col-span-4 md:flex md:justify-end">
              <Link
                href="/session-log"
                className="w-full md:w-auto inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition"
              >
                Start Free →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* FOOTER */
function Footer() {
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} STEM Robotics Progress Tracker • Built by Kelvin Edet
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link className="text-slate-700 hover:text-slate-900" href="/login">Teacher Login</Link>
            <Link className="text-slate-700 hover:text-slate-900" href="/student-demo">Demo</Link>
            <Link className="text-slate-700 hover:text-slate-900" href="/session-log">Session Log</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
