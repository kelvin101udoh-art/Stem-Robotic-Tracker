// app/page.tsx
import Link from "next/link";

const navItems = [
  { label: "Benefits", href: "#benefits" },
  { label: "Who it’s for", href: "#who" },
  { label: "What you get", href: "#get" },
  { label: "FAQ", href: "#faq" },
];

const benefitCards = [
  {
    title: "Less admin for mentors",
    desc: "Capture essentials quickly. No long forms. No end-of-day reports.",
  },
  {
    title: "Clear for parents",
    desc: "Plain-language updates: what happened, what improved, what to do next.",
  },
  {
    title: "Consistency for clubs",
    desc: "Keep progress structured across terms—even when staff rotate.",
  },
];

const whoCards = [
  {
    title: "Parents",
    desc: "Understand progress without STEM jargon. Simple, trustworthy updates.",
    pills: ["Plain language", "Weekly highlights", "Progress over time"],
  },
  {
    title: "Students",
    desc: "Build a showcase: what you made, what you learned, what you improved.",
    pills: ["My builds", "My goals", "My improvements"],
  },
  {
    title: "Mentors",
    desc: "Keep sessions flowing while saving the moments that matter.",
    pills: ["Quick logging", "Coach notes", "Session continuity"],
  },
  {
    title: "Club leads",
    desc: "Standardise delivery and reporting without extra admin capacity.",
    pills: ["Consistency", "Oversight", "Simple exports later"],
  },
];

const whatYouGet = [
  {
    title: "Progress snapshots",
    desc: "Simple view of growth over time—skills, confidence, and milestones.",
  },
  {
    title: "Build gallery",
    desc: "Photos, code snippets, and project highlights in one place (student-led).",
  },
  {
    title: "Weekly highlights",
    desc: "Short summaries designed for parents (no technical overload).",
  },
  {
    title: "Coach notes (optional)",
    desc: "Lightweight notes mentors can use to guide the next session.",
  },
];

const faqs = [
  {
    q: "Will this be easy for parents?",
    a: "Yes. Parent/student views use plain language. Club tools can stay behind mentor/admin access.",
  },
  {
    q: "Do mentors need to log lots of data?",
    a: "No. The workflow is designed to work with small inputs. Students can upload project evidence themselves.",
  },
  {
    q: "Is this production-ready already?",
    a: "It’s a prototype. It shows the flow using sample screens and mock data. You can connect Supabase later.",
  },
  {
    q: "Can a small club use this?",
    a: "Yes. It’s intentionally lightweight so clubs don’t need extra admin staff.",
  },
];

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
      {children}
    </span>
  );
}

function SectionTitle({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold tracking-widest text-slate-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        {title}
      </h2>
      {desc ? <p className="mt-3 text-sm text-slate-600 sm:text-base">{desc}</p> : null}
    </div>
  );
}

function Card({
  title,
  desc,
  pills,
}: {
  title: string;
  desc: string;
  pills?: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
      {pills?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {pills.map((p) => (
            <Pill key={p}>{p}</Pill>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SimplePreview() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Parent view preview</div>
        <span className="text-xs text-slate-500">plain language</span>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">This week</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">Project highlight</div>
          <p className="mt-2 text-sm text-slate-600">
            Built a simple racing car and improved turning control. Practised teamwork and
            troubleshooting.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Pill>Project</Pill>
            <Pill>Improvement</Pill>
            <Pill>Confidence up</Pill>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Progress</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">Getting stronger at</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {["Problem solving", "Teamwork", "Building confidence"].map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold text-slate-500">Gallery</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">My builds</div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Students can upload photos/code so mentors don’t chase evidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleTiles() {
  const tiles = [
    {
      title: "Parent preview",
      desc: "See simple weekly highlights and progress snapshots.",
      href: "/parent-demo",
    },
    {
      title: "Student preview",
      desc: "See a personal showcase of builds and improvements.",
      href: "/student-demo",
    },
    {
      title: "Mentor preview",
      desc: "See lightweight logging and coach notes (prototype screens).",
      href: "/mentor-demo",
    },
    {
      title: "Club owner preview",
      desc: "See how clubs keep progress consistent across terms.",
      href: "/club-demo",
    },
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Explore the prototype</div>
        <span className="text-xs text-slate-500">role-based previews</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link
            key={t.title}
            href={t.href}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50"
          >
            <div className="text-sm font-semibold text-slate-900">{t.title}</div>
            <p className="mt-1 text-sm text-slate-600">{t.desc}</p>
            <p className="mt-3 text-xs font-medium text-slate-700 underline underline-offset-4">
              Open preview →
            </p>
          </Link>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Prototype mode: UI + mock data. Database wiring can come later.
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-slate-900" />
            <div className="leading-tight">
              <div className="text-sm font-semibold">STEM Club Tracker</div>
              <div className="text-xs text-slate-500">Simple progress • Clear updates</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((it) => (
              <a key={it.href} href={it.href} className="text-sm text-slate-600 hover:text-slate-900">
                {it.label}
              </a>
            ))}
          </nav>

          {/* Prototype-friendly: no “Get started” or “View demo” buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <a href="#who" className="text-sm text-slate-700 underline underline-offset-4">
              Explore roles
            </a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pt-14 sm:pt-18">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap gap-2">
              <Pill>Parents</Pill>
              <Pill>Students</Pill>
              <Pill>Mentors</Pill>
              <Pill>Club leads</Pill>
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Keep STEM learning organised—without extra paperwork.
            </h1>

            <p className="mt-4 text-base text-slate-600 sm:text-lg">
              Track activities, improvements, and projects in a clean way that parents understand
              and clubs can run with.
            </p>

            {/* Prototype-friendly: no strong CTA. Just gentle navigation. */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#who"
                className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Explore who it’s for
              </a>
              <a
                href="#get"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                See what you get
              </a>
            </div>

            {/* Role previews: honest prototype navigation */}
            <div className="mt-6">
              <RoleTiles />
            </div>
          </div>

          <SimplePreview />
        </div>
      </section>

      {/* BENEFITS */}
      <section id="benefits" className="mx-auto max-w-6xl px-4 pt-16">
        <SectionTitle
          eyebrow="BENEFITS"
          title="Simple for families. Practical for clubs."
          desc="Clear outcomes without exposing internal complexity on the homepage."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {benefitCards.map((b) => (
            <Card key={b.title} title={b.title} desc={b.desc} />
          ))}
        </div>
      </section>

      {/* WHO */}
      <section id="who" className="mx-auto max-w-6xl px-4 pt-16">
        <SectionTitle
          eyebrow="WHO IT’S FOR"
          title="Role-based clarity"
          desc="Each stakeholder sees what they need—without noise."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {whoCards.map((w) => (
            <Card key={w.title} title={w.title} desc={w.desc} pills={w.pills} />
          ))}
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section id="get" className="mx-auto max-w-6xl px-4 pt-16">
        <SectionTitle
          eyebrow="WHAT YOU GET"
          title="The essentials"
          desc="Progress, projects, and parent-friendly updates."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whatYouGet.map((x) => (
            <div key={x.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold">{x.title}</div>
              <p className="mt-2 text-sm text-slate-600">{x.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-4 pb-16 pt-16">
        <SectionTitle eyebrow="FAQ" title="Quick answers" desc="Short and simple." />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <summary className="cursor-pointer list-none text-base font-semibold text-slate-900">
                <span className="flex items-center justify-between gap-4">
                  {f.q}
                  <span className="text-slate-400 transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>

        {/* Prototype-friendly footer note instead of CTA buttons */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Prototype focus: clarity first.
              </h2>
              <p className="mt-3 text-sm text-slate-600 sm:text-base">
                This homepage stays simple for families. Role previews show the flow using mock data.
              </p>
            </div>
            <div className="flex flex-wrap justify-start gap-3 md:justify-end">
              <a
                href="#who"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Explore roles
              </a>
              <a
                href="#get"
                className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                See what you get
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            © {new Date().getFullYear()} STEM Club Tracker. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {navItems.map((it) => (
              <a key={it.href} href={it.href} className="text-slate-600 hover:text-slate-900">
                {it.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
