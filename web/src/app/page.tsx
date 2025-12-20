
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




// Drop-in replacement for your current SimplePreview()
// - Removes "Parent Weekly Summary" + all family language
// - Repositions as a CLUB OWNER product panel (competitor-safe, still powerful)
// - Tight spacing, aligned tags, consistent borders, clean grid

function SimplePreview() {
  const opsPills = ["Quick capture", "Student uploads", "Term consistency"];
  const buyerPills = ["Club-ready", "Staff-proof", "Audit-friendly"];

  const kpis = [
    { label: "Sessions captured", value: "24", hint: "this term" },
    { label: "Learners active", value: "38", hint: "current cohort" },
    { label: "Projects stored", value: "112", hint: "gallery items" },
    { label: "Coach notes", value: "56", hint: "lightweight" },
  ];

  const features = [
    {
      title: "Standardised club delivery",
      desc: "Run every group with the same structure—activities, outcomes, and follow-ups stay consistent across mentors.",
      tags: ["Templates", "Term plan", "Consistency"],
    },
    {
      title: "Evidence-ready project library",
      desc: "Keep builds, photos, and code together per learner and per cohort—easy to review when needed.",
      tags: ["Gallery", "Artifacts", "History"],
    },
    {
      title: "Continuity when staff rotate",
      desc: "New mentors pick up instantly with context: what was taught, what improved, and what to focus on next.",
      tags: ["Handover", "Notes", "Continuity"],
    },
    {
      title: "Owner-level oversight",
      desc: "See progress at a glance across cohorts—spot who needs support and which sessions are performing best.",
      tags: ["Overview", "Cohorts", "Visibility"],
    },
  ];

  return (
    <aside className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest text-slate-500">CLUB OWNER VIEW</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">
            Operations dashboard for STEM clubs
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Designed to keep delivery consistent, reduce admin, and keep progress reviewable—without
            jargon.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {buyerPills.map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <span className="shrink-0 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
          Sample layout
        </span>
      </div>

      {/* KPI strip */}
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold text-slate-500">{k.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{k.value}</p>
            <p className="mt-1 text-xs text-slate-500">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        {/* Top row: Ops signals + Focus */}
        <div className="grid gap-3 sm:grid-cols-2">
          {/* Ops Signals */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">Operational advantage</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  Lightweight capture that doesn’t slow sessions
                </p>
              </div>
              <span className="shrink-0 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                Low admin
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Mentors save only the essentials. Learners attach builds and media themselves. The club
              stays organised even when weeks get busy.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {opsPills.map((t) => (
                <Pill key={t}>{t}</Pill>
              ))}
            </div>
          </div>

          {/* Focus Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">Owner focus</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">What’s happening across cohorts</p>

            <div className="mt-3 space-y-2">
              {[
                { label: "Cohort A", note: "On track • strong build completion" },
                { label: "Cohort B", note: "Needs support • low uploads this week" },
                { label: "Cohort C", note: "Improving • consistent mentoring notes" },
              ].map((x) => (
                <div
                  key={x.label}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm font-semibold text-slate-900">{x.label}</span>
                  <span className="text-xs text-slate-600">{x.note}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600">Next club action</p>
              <p className="mt-1 text-xs text-slate-600">
                Prompt uploads for Cohort B and reuse the “Week 6 build template” to keep delivery
                consistent.
              </p>
            </div>
          </div>
        </div>

        {/* Feature grid */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{f.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
                </div>
                <span className="shrink-0 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Included
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {f.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold tracking-widest text-slate-500">POSITIONING</p>
          <p className="mt-2 text-sm text-slate-600">
            Most tools stop at attendance, chat, and billing. This platform is built for club
            delivery quality: structure, continuity, and a clean record of progress over time.
          </p>
        </div>
      </div>
    </aside>
  );
}


// New content for this section (replace your RoleTiles بالكامل)
// NOT role cards anymore.
// Now: "Why clubs switch" — product differentiators + outcomes (buyer-first), competitor-safe.

function RoleTiles() {
  const differentiators = [
    {
      eyebrow: "DELIVERY SYSTEM",
      title: "Run every cohort the same way",
      desc:
        "Turn your programme into a repeatable system—templates, weekly flow, and outcomes stay consistent even when staff rotate.",
      tags: ["Programme templates", "Term structure", "Cohort consistency"],
    },
    {
      eyebrow: "CLUB OPERATIONS",
      title: "Keep admin low, quality high",
      desc:
        "Capture only the essentials and keep everything organised automatically—so mentors focus on teaching, not paperwork.",
      tags: ["Light capture", "Auto organisation", "Less admin"],
    },
    {
      eyebrow: "STUDENT PORTFOLIO",
      title: "Projects stay attached to progress",
      desc:
        "A clean archive of builds, artifacts, and improvements—easy to review for learner growth and club performance over time.",
      tags: ["Project library", "Artifacts", "Progress history"],
    },
    {
      eyebrow: "OWNER OVERSIGHT",
      title: "See what’s working across the club",
      desc:
        "A simple owner view that highlights cohort health, follow-through, and where support is needed—without exposing internal complexity.",
      tags: ["Cohort health", "Visibility", "Consistency checks"],
    },
  ];

  const competitorContrast = [
    { left: "Attendance + chat", right: "A structured delivery system" },
    { left: "Notes scattered in WhatsApp", right: "Organised, reviewable records" },
    { left: "Hard to prove learning", right: "Projects linked to progress" },
    { left: "Staff changes break continuity", right: "Built-in handover and structure" },
  ];

  return (
    <section className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-widest text-slate-500">
            WHY CLUBS CHOOSE THIS
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">
            A club operating system — not another tracker
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Built for STEM club owners who want consistent delivery, low admin load, and a clean
            record of progress and projects across cohorts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Owner-first
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Low admin
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            Consistency at scale
          </span>
        </div>
      </div>

      {/* Differentiator cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {differentiators.map((d) => (
          <div
            key={d.title}
            className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div>
              <p className="text-xs font-semibold tracking-widest text-slate-500">{d.eyebrow}</p>
              <p className="mt-2 text-base font-semibold text-slate-900">{d.title}</p>
              <p className="mt-2 text-sm text-slate-600">{d.desc}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {d.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Competitor-safe comparison (no names, no secret sauce) */}
      <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest text-slate-500">
              POSITIONING
            </p>
            <p className="mt-2 text-base font-semibold text-slate-900">
              What most tools do vs what you actually need
            </p>
          </div>
          <span className="mt-2 inline-flex w-fit items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 sm:mt-0">
            Competitor-safe summary
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {competitorContrast.map((row) => (
            <div
              key={row.left}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">Typical</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{row.left}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">This platform</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{row.right}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold tracking-widest text-slate-500">CLUB PROMISE</p>
          <p className="mt-2 text-sm text-slate-600">
            Deliver a consistent STEM programme, keep admin light, and maintain a clear progress +
            project record across cohorts — without turning mentoring into paperwork.
          </p>
        </div>
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
