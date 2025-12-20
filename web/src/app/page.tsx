
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

// Drop-in replacements for your homepage
// - Feels like a real product (no “mock data / prototype” tone)
// - Clear language for parents/students
// - Still signals “club-grade” professionalism
// - No “links will be connected” note

function SimplePreview() {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-500">
            FAMILY UPDATE
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            Weekly Summary
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            A clear snapshot of what happened, what improved, and what to try next.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Week 3 • Autumn Term
          </span>
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Ready to share
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        {/* Highlight */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500">This week</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                Racing car build — smoother turning and better control
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                Project complete
              </span>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                Improvement
              </span>
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-600">
            Built a racing car and tested it through short laps. Teamwork improved during
            troubleshooting, and steering accuracy was noticeably better by the end of the session.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Pill>Problem solving</Pill>
            <Pill>Teamwork</Pill>
            <Pill>Confidence</Pill>
          </div>
        </div>

        {/* Two-column */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* Progress */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">Progress snapshot</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Getting stronger at</p>
              </div>
              <span className="text-xs font-medium text-slate-500">last 4 sessions</span>
            </div>

            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {[
                { label: "Problem solving", level: "Strong" },
                { label: "Teamwork", level: "Improving" },
                { label: "Confidence", level: "Growing" },
              ].map((x) => (
                <li key={x.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
                    <span>{x.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600">{x.level}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">Next focus (small step)</p>
              <p className="mt-1 text-xs text-slate-600">
                Practise smoother turns by testing two wheel alignment positions and comparing results.
              </p>
            </div>
          </div>

          {/* Evidence / Gallery */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-slate-500">Project gallery</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">Recent uploads</p>
              </div>
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
                3 items
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
              <div className="h-14 rounded-xl bg-slate-100" />
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">What’s included</p>
              <p className="mt-1 text-xs text-slate-600">
                Photos, short build notes, and optional code snippets — organised for easy review.
              </p>
            </div>
          </div>
        </div>

        {/* Footer row */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">Share with family</p>
            <p className="mt-1 text-sm font-medium text-slate-900">
              Weekly summary format designed to be understood in under 60 seconds.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              Plain language
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              Actionable next step
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function RoleTiles() {
  const roles = [
    {
      title: "Club Owner",
      desc: "Overview of groups, consistency across terms, and quality checks.",
      points: ["Groups overview", "Consistency", "Outputs"],
      icon: "🧭",
      badge: "Buyer view",
    },
    {
      title: "Mentor",
      desc: "Lightweight capture that doesn’t interrupt teaching time.",
      points: ["Quick capture", "Coach notes", "Continuity"],
      icon: "🧑‍🏫",
      badge: "Staff view",
    },
    {
      title: "Parent",
      desc: "Clear weekly summaries and progress snapshots—no jargon.",
      points: ["Weekly summary", "Progress snapshot", "Support tips"],
      icon: "👨‍👩‍👧‍👦",
      badge: "Family view",
    },
    {
      title: "Student",
      desc: "A personal showcase of builds, learning goals, and improvements.",
      points: ["Showcase", "Goals", "Challenges"],
      icon: "🎒",
      badge: "Learner view",
    },
  ];

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-slate-500">ROLE VIEWS</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            Simple views for families — powerful structure for clubs
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Each role sees only what they need. Clubs get consistency; families get clarity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Parent-friendly
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Club-ready
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {roles.map((r) => (
          <div
            key={r.title}
            className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-lg">
                  {r.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-900">{r.title}</p>
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                      {r.badge}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{r.desc}</p>
                </div>
              </div>

              {/* UI affordance — feels real but doesn’t promise navigation */}
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 group-hover:bg-slate-50">
                View
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

            {/* subtle “product” micro-row */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">What this view focuses on</p>
              <p className="mt-1 text-xs text-slate-600">
                Clear information, organised layout, and only the essentials for this role.
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* No “prototype note” — replace with a confident product line */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs text-slate-600">
          Role access is managed by the club, so each person sees the right information automatically.
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
