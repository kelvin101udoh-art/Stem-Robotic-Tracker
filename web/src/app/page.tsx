
// app/page.tsx
import Link from "next/link";
import Image from "next/image";


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



function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Image
          src="/logo.svg"
          alt="STEM Club Tracker logo"
          fill
          className="object-contain p-1"
          priority
        />
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <span className="text-xs font-extrabold tracking-tight text-slate-900">SR</span>
        </div>
      </div>

      <div className="leading-tight">
        <div className="text-sm font-semibold text-slate-900">STEMTrack</div>
        <div className="text-xs text-slate-500">Simple progress • Clear updates</div>
      </div>
    </div>
  );
}


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

// Drop-in replacement: SimplePreview + RoleTiles
// Assumes you already have <Pill /> in the same file.

function SimplePreview() {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest text-slate-500">SAMPLE OUTPUT</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">Parent Weekly Summary</h3>
          <p className="mt-1 text-sm text-slate-600">
            Short, plain-language updates — built for families. Clear enough to read in 30 seconds.
          </p>
        </div>

        <span className="shrink-0 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Example format
        </span>
      </div>

      {/* Body */}
      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        {/* Highlight */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-500">This week</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Racing car build — turning control improved
              </p>
            </div>

            <span className="shrink-0 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              Progress
            </span>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            Built a simple racing car and practised troubleshooting. Teamwork stayed strong during testing,
            and steering accuracy improved by the end.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Pill>Project</Pill>
            <Pill>Improvement</Pill>
            <Pill>Confidence</Pill>
          </div>

          {/* Micro “read time / session meta” to feel real */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
              Week 3 • Autumn term
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
              45 mins
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
              Robotics basics
            </span>
          </div>
        </div>

        {/* Two-column */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* Skills */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">Getting stronger at</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Key improvements</p>
              </div>
              <span className="text-xs text-slate-500">Summary</span>
            </div>

            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {[
                { label: "Problem solving", level: "Strong" },
                { label: "Teamwork", level: "Improving" },
                { label: "Confidence", level: "Growing" },
              ].map((x) => (
                <li key={x.label} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
                    {x.label}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                    {x.level}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-700">Next small focus</p>
              <p className="mt-1 text-xs text-slate-600">
                Practise smoother turns by testing wheel alignment positions and comparing results.
              </p>
            </div>
          </div>

          {/* Gallery */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">Build gallery</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Recent uploads</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                Student-led
              </span>
            </div>

            {/* “real product” placeholders */}
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="relative h-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <div className="absolute inset-0 grid place-items-center text-xs text-slate-400">
                  photo
                </div>
              </div>
              <div className="relative h-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <div className="absolute inset-0 grid place-items-center text-xs text-slate-400">
                  build
                </div>
              </div>
              <div className="relative h-14 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <div className="absolute inset-0 grid place-items-center text-xs text-slate-400">
                  code
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Learners can upload photos or code snippets, so mentors don’t need to chase evidence.
            </p>

            {/* A tiny “status row” makes it feel like an app */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Uploads:</span> 3 this week
              </div>
              <div className="text-xs text-slate-500">Last update: 2 days ago</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer note (keeps it honest as prototype) */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs text-slate-600">
          Prototype sample. Wording, layout, and outputs can be tailored to your club style.
        </p>
      </div>
    </aside>
  );
}

function RoleTiles() {
  const roles = [
    {
      title: "Student",
      desc: "Profile, progress, builds, and recent challenges.",
      points: ["Portfolio", "Progress timeline", "Challenges"],
      icon: "🎒",
      status: "Preview",
    },
    {
      title: "Parent",
      desc: "Weekly highlights and progress snapshots in plain language.",
      points: ["Weekly summary", "Simple language", "Support tips"],
      icon: "👨‍👩‍👧‍👦",
      status: "Preview",
    },
    {
      title: "Teacher",
      desc: "Lightweight session capture and coach notes.",
      points: ["Quick capture", "Notes", "Continuity"],
      icon: "🧑‍🏫",
      status: "Prototype",
    },
    {
      title: "Admin",
      desc: "Club-level overview for consistency and reporting.",
      points: ["Oversight", "Consistency", "Export-ready"],
      icon: "🧭",
      status: "Prototype",
    },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest text-slate-500">ROLE VIEWS</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Role-based views built for clarity
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Each role sees only what they need — clean, focused, and easy to use.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Family-friendly
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Club-ready structure
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {roles.map((r) => (
          <div
            key={r.title}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-lg">
                  {r.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-900">{r.title} view</p>
                  <p className="mt-1 text-sm text-slate-600">{r.desc}</p>
                </div>
              </div>

              <span className="shrink-0 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {r.status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {r.points.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {p}
                </span>
              ))}
            </div>

            {/* Subtle CTA that doesn’t “promise” functionality */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Note:</span> Screens can be connected
                to routes when finalised.
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* One clean note only */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs text-slate-600">
          This section shows the role structure (what each user sees). Deep workflow details are kept
          inside the app to avoid confusion on the public homepage.
        </p>
      </div>
    </section>
  );
}





export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <BrandMark />
          </Link>

          {/* Main navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((it) => (
              <a
                key={it.href}
                href={it.href}
                className="text-sm text-slate-600 hover:text-slate-900"
              >
                {it.label}
              </a>
            ))}
          </nav>

          {/* Right-side action (prototype-safe) */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Get Started
            </button>
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
              <div className="text-sm font-semibold text-slate-900">{x.title}</div>
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

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Prototype focus: clarity first.
              </h2>
              <p className="mt-3 text-sm text-slate-600 sm:text-base">
                Use the role previews to navigate real prototype pages. Keep iterating from there.
              </p>
            </div>
            <div className="flex flex-wrap justify-start gap-3 md:justify-end">

              <Link
                href="#"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Get Started
              </Link>
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
