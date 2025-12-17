import Image from "next/image";

// app/page.tsx
import Link from "next/link";

const navItems = [
  { label: "How it works", href: "#how" },
  { label: "Proof", href: "#proof" },
  { label: "Capability", href: "#capability" },
  { label: "Outputs", href: "#outputs" },
  { label: "Roles", href: "#roles" },
];

const valueTiles = [
  {
    title: "Proof-ready Evidence",
    desc: "Evidence packets with artefacts, outcomes, and skill tags — not scattered photos.",
    icon: "🧾",
  },
  {
    title: "Capability OS",
    desc: "Track strengths, role affinity, and readiness across time — beyond completion.",
    icon: "🧠",
  },
  {
    title: "AI Session Intelligence",
    desc: "Explainable insights + next-step suggestions from session logs (Month 3 foundation).",
    icon: "🤖",
  },
];

const howSteps = [
  {
    k: "1",
    title: "Capture signals",
    desc: "Attendance + activity + quick capability signals (debugging, teamwork, persistence).",
  },
  {
    k: "2",
    title: "Compile proof",
    desc: "Auto-group session records into evidence packets with notes and artefacts.",
  },
  {
    k: "3",
    title: "Model capability",
    desc: "Role affinity + trajectory + readiness indicators, updated over time.",
  },
  {
    k: "4",
    title: "Generate outputs",
    desc: "Parent summaries, school reports, competition portfolios, progress PDFs.",
  },
  {
    k: "5",
    title: "Guide next actions",
    desc: "Next-session suggestions: difficulty, reinforcement, and role rotation prompts.",
  },
];

const proofCards = [
  {
    title: "Evidence Packets",
    desc: "Structured proof: objective → outcome → improvement.",
    bullets: ["Objective + outcome", "Mentor micro-notes", "Skill tags", "Confidence markers"],
  },
  {
    title: "Artefact Vault",
    desc: "Attach real artefacts to progress: photos, builds, code.",
    bullets: ["Photo/video capture", "Build snapshots", "Code snippets", "Iteration trail"],
  },
  {
    title: "Skill Tags",
    desc: "Evidence-backed skills (signals), not vague checklists.",
    bullets: ["Debugging", "Systems thinking", "Collaboration", "Spatial reasoning"],
  },
  {
    title: "Proof Exports",
    desc: "Shareable outputs designed for parents and organisations.",
    bullets: ["Parent summary", "School report", "Competition pack", "Progress PDF"],
  },
];

const capabilityCards = [
  {
    title: "Capability Signals",
    desc: "Capture growth predictors, not just completion.",
    bullets: ["Persistence", "Curiosity", "Adaptability", "Team dynamics"],
  },
  {
    title: "Role Affinity Map",
    desc: "See emerging strengths across roles.",
    bullets: ["Builder", "Debugger", "Designer", "Explainer"],
  },
  {
    title: "Trajectory Model",
    desc: "Surface acceleration vs plateaus with prompts.",
    bullets: ["Acceleration zones", "Plateau alerts", "Context notes", "Growth prompts"],
  },
  {
    title: "Readiness",
    desc: "Future-facing indicators (not grades).",
    bullets: ["Pathway readiness", "Leadership readiness", "Innovation readiness", "Collaboration maturity"],
  },
];

const outputs = [
  { title: "Parent Summary", desc: "Jargon-free progress + next steps." },
  { title: "School Report", desc: "Structured enrichment evidence." },
  { title: "Competition Portfolio", desc: "Artefacts + improvements packaged for showcase." },
  { title: "Progress PDF", desc: "Longitudinal proof trail across terms." },
];

const roles = [
  {
    title: "Student",
    desc: "Artefacts, strengths, role growth, and next steps.",
    tags: ["Profile", "Artefacts", "Trajectory"],
    href: "/student-demo",
  },
  {
    title: "Parent",
    desc: "Proof summaries + clear growth signals.",
    tags: ["Weekly summary", "Highlights", "Support tips"],
    href: "/student-demo",
  },
  {
    title: "Teacher",
    desc: "Log fast, generate insights, keep delivery consistent.",
    tags: ["Session log", "Signals", "Next steps"],
    href: "/session-log",
  },
  {
    title: "Admin",
    desc: "Standardise templates, cohorts, and reporting.",
    tags: ["Templates", "Cohorts", "Exports"],
    href: "/challenges",
  },
];

function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={className}>
      <div className="mx-auto max-w-6xl px-4 md:px-6 py-14">{children}</div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold tracking-widest text-slate-500">{eyebrow}</p>
      <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">{title}</h2>
      {desc ? <p className="mt-3 text-slate-600">{desc}</p> : null}
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
      {children}
    </span>
  );
}

function Card({
  title,
  desc,
  bullets,
}: {
  title: string;
  desc: string;
  bullets?: string[];
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>

      {bullets?.length ? (
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-2 inline-block h-2 w-2 rounded-full bg-slate-300" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-slate-50 text-slate-900">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 md:px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white grid place-items-center shadow-sm">
              <span className="text-sm font-bold">SR</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">STEM Robotics</p>
              <p className="text-xs text-slate-500 -mt-0.5">Proof + Capability</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
            {navItems.map((it) => (
              <a key={it.href} href={it.href} className="hover:text-slate-900">
                {it.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/student-demo"
              className="hidden sm:inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              View Demo
            </Link>

            <Link
              href="/session-log"
              className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* soft accents */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200 blur-3xl opacity-35" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-200 blur-3xl opacity-35" />
        </div>

        <div className="mx-auto max-w-6xl px-4 md:px-6 py-16 md:py-20">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <div className="flex flex-wrap gap-2">
                <Pill>Built for STEM clubs</Pill>
                <Pill>Proof-first</Pill>
                <Pill>AI foundations</Pill>
              </div>

              <h1 className="mt-4 text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
                Turn STEM learning into proof + a capability trajectory.
              </h1>

              <p className="mt-4 text-lg text-slate-600 max-w-2xl">
                Evidence packets + capability profiles that show who a learner is becoming — not just what they did.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:items-center">
                <Link
                  href="/session-log"
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200 transition"
                >
                  Get Started <span className="ml-2">→</span>
                </Link>

                <Link
                  href="/student-demo"
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition"
                >
                  View Demo
                </Link>

                <Link
                  href="/login"
                  className="text-sm text-slate-600 underline hover:text-slate-900"
                >
                  Teacher Login →
                </Link>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                Built for STEM clubs, learning centres, and schools.
              </p>
            </div>

            {/* HERO PREVIEW (keeps existing style) */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-slate-200 bg-white shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Preview</p>
                  <span className="text-xs text-slate-500">Proof + Capability</span>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Evidence Packet</p>
                    <p className="text-sm font-semibold text-slate-900">Maze Solve • Outcome + Note</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">Skill Tag</p>
                      <p className="text-sm font-semibold text-slate-900">Debugging</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs text-slate-500">Role Signal</p>
                      <p className="text-sm font-semibold text-slate-900">Builder</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-xs text-blue-700 font-semibold">AI Suggestion (demo)</p>
                    <p className="text-sm text-blue-800 mt-1">
                      Increase difficulty by one step and rotate roles to strengthen collaboration.
                    </p>
                  </div>

                  <Link
                    href="/session-log"
                    className="rounded-2xl px-4 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition text-center"
                  >
                    Open Session Log →
                  </Link>

                  <p className="text-xs text-slate-500">
                    Month 3: explainable rule-based insights. Later: ML when data is real.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE STRIP */}
      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          {valueTiles.map((t) => (
            <div key={t.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-11 w-11 rounded-2xl bg-slate-100 grid place-items-center text-lg">
                {t.icon}
              </div>
              <p className="mt-4 text-base font-semibold text-slate-900">{t.title}</p>
              <p className="mt-2 text-sm text-slate-600">{t.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* THE GAP (Before → After) */}
      <Section>
        <SectionHeader
          eyebrow="The gap"
          title="Before → After"
          desc="Replace informal updates with structured proof and a capability model."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold tracking-widest text-slate-500">BEFORE</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Photos + WhatsApp + gut feeling</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex gap-2"><span className="mt-2 inline-block h-2 w-2 rounded-full bg-slate-300" /> Evidence scattered across devices</li>
              <li className="flex gap-2"><span className="mt-2 inline-block h-2 w-2 rounded-full bg-slate-300" /> Inconsistent mentor judgement</li>
              <li className="flex gap-2"><span className="mt-2 inline-block h-2 w-2 rounded-full bg-slate-300" /> Hard to show progress over time</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold tracking-widest text-slate-500">AFTER</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Verifiable proof + capability trajectory</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex gap-2"><span className="mt-2 inline-block h-2 w-2 rounded-full bg-slate-300" /> Evidence packets (artefacts + outcomes)</li>
              <li className="flex gap-2"><span className="mt-2 inline-block h-2 w-2 rounded-full bg-slate-300" /> Signals → role affinity → readiness</li>
              <li className="flex gap-2"><span className="mt-2 inline-block h-2 w-2 rounded-full bg-slate-300" /> AI suggestions for next actions</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS (5 steps) */}
      <Section id="how" className="bg-white">
        <SectionHeader
          eyebrow="How it works"
          title="5-step workflow"
          desc="Fast to log. Structured outputs. Capability intelligence over time."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {howSteps.map((s) => (
            <div key={s.k} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                  {s.k}
                </div>
                <p className="text-sm font-semibold text-slate-900">{s.title}</p>
              </div>
              <p className="mt-3 text-sm text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* PROOF ENGINE */}
      <Section id="proof" className="bg-slate-50">
        <SectionHeader
          eyebrow="Proof Engine"
          title="Proof-ready evidence structure"
          desc="Evidence is usable: shareable, defensible, and consistent."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {proofCards.map((c) => (
            <Card key={c.title} title={c.title} desc={c.desc} bullets={c.bullets} />
          ))}
        </div>
      </Section>

      {/* CAPABILITY OS */}
      <Section id="capability">
        <SectionHeader
          eyebrow="Capability OS"
          title="Capability intelligence"
          desc="Signals → role affinity → trajectory → readiness."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {capabilityCards.map((c) => (
            <Card key={c.title} title={c.title} desc={c.desc} bullets={c.bullets} />
          ))}
        </div>
      </Section>

      {/* OUTPUTS */}
      <Section id="outputs" className="bg-slate-50">
        <SectionHeader
          eyebrow="Outputs"
          title="Outputs that people can use"
          desc="Clear formats for parents, schools, and competitions."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {outputs.map((o) => (
            <div key={o.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-base font-semibold text-slate-900">{o.title}</p>
              <p className="mt-2 text-sm text-slate-600">{o.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ROLES */}
      <Section id="roles">
        <SectionHeader
          eyebrow="Roles"
          title="Role-based views"
          desc="Same model, different UI per stakeholder."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {roles.map((r) => (
            <div key={r.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-semibold text-slate-900">{r.title}</p>
                <Link
                  href={r.href}
                  className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 transition"
                >
                  Open →
                </Link>
              </div>

              <p className="mt-2 text-sm text-slate-600">{r.desc}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {r.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA BAND */}
      <Section className="bg-slate-900 text-white">
        <div className="grid gap-8 md:grid-cols-12 md:items-center">
          <div className="md:col-span-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Build proof. Track capability. Generate outputs.
            </h2>
            <p className="mt-2 text-slate-200">
              Start with the session log → see proof + insight flow immediately.
            </p>
          </div>

          <div className="md:col-span-4 flex md:justify-end gap-3">
            <Link
              href="/student-demo"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white border border-white/25 hover:bg-white/10 transition"
            >
              View Demo
            </Link>
            <Link
              href="/session-log"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-100 transition"
            >
              Get Started →
            </Link>
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 md:px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} STEM Robotics Proof + Capability • Kelvin Edet
          </p>

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
