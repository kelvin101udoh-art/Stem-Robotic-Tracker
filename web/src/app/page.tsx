// app/page.tsx
import Link from "next/link";

const navItems = [
  { label: "How it works", href: "#how" },
  { label: "3-Tap Logger", href: "#three-tap" },
  { label: "Proof Engine", href: "#proof" },
  { label: "Capability OS", href: "#capability" },
  { label: "Architecture", href: "#architecture" },
  { label: "Onboarding", href: "#onboarding" },
];

const hero = {
  headline: "Minimum effort logging. Proof-ready outputs. Capability trajectories.",
  subtext:
    "A lightweight STEM tracking system built for real clubs: quick signals, student-led artefacts, and labelled AI synthesis—so you can show impact without admin overload.",
  bullets: [
    "3 taps to log a capability signal (seconds, not forms)",
    "Students attach artefacts (photos/code/builds) so evidence isn’t staff work",
    "AI compiles proof packets + updates capability (clearly marked as inferred)",
  ],
};

const valueTiles = [
  {
    title: "3-Tap Logging",
    desc: "Capture a signal in seconds. No checklists. No required fields.",
    badge: "Fast",
  },
  {
    title: "Proof Engine",
    desc: "Auto evidence packets, skill tags, and exports that stand on their own.",
    badge: "Credible",
  },
  {
    title: "Capability OS",
    desc: "Role affinity + trajectory + readiness—built from signals over time.",
    badge: "Future-facing",
  },
];

const howSteps = [
  { k: "01", title: "Select learner", desc: "Tap a name. No deep navigation." },
  { k: "02", title: "Tap a signal", desc: "Debugging, persistence, collaboration, etc." },
  { k: "03", title: "Optional artefact", desc: "Student attaches photo/code/build snapshot." },
  { k: "04", title: "Auto compile proof", desc: "Evidence packets update lazily as inputs appear." },
  { k: "05", title: "Update capability", desc: "Roles + trajectory adjust with confidence scoring." },
];

const proofCards = [
  {
    title: "Lazy Evidence Packets",
    desc: "Evidence updates automatically from signals + artefacts—no “write the report” workflow.",
    bullets: ["Objective → Outcome", "Artefacts attached", "Skill tags", "Confidence shown"],
  },
  {
    title: "Artefact Vault",
    desc: "Keep real artefacts linked to development: builds, code, images, iteration trails.",
    bullets: ["Photos/videos", "Code snapshots", "Build history", "Iteration trail"],
  },
  {
    title: "Proof Exports",
    desc: "One-click outputs designed to be shared, understood, and defended.",
    bullets: ["Parent-safe summary", "School-ready report", "Competition pack", "Progress PDF"],
  },
  {
    title: "Confidence Scoring",
    desc: "Low logging ≠ failure. Outputs still work; confidence simply adjusts transparently.",
    bullets: ["No punishment", "Works with gaps", "Transparent confidence", "Encourages lightweight habits"],
  },
];

const capabilityCards = [
  {
    title: "Capability Signals",
    desc: "Capture patterns of thinking and behaviour—not just completion.",
    bullets: ["Persistence", "Curiosity", "Adaptability", "Team dynamics"],
  },
  {
    title: "Role Affinity Map",
    desc: "See emerging roles in teams: Builder, Debugger, Designer, Explainer…",
    bullets: ["Emerging strengths", "Team fit", "Role rotation prompts", "Mentoring focus"],
  },
  {
    title: "Trajectory Model",
    desc: "Detect acceleration and plateaus; learn what helps each learner progress faster.",
    bullets: ["Acceleration zones", "Stagnation alerts", "Context insights", "Growth prompts"],
  },
  {
    title: "Readiness Maps",
    desc: "Future-facing indicators (not grades): pathway, leadership, collaboration maturity.",
    bullets: ["Pathway readiness", "Leadership readiness", "Innovation readiness", "Collaboration maturity"],
  },
];

const onboardingPoints = [
  { title: "No required fields", desc: "Log one signal and stop. The system still works." },
  { title: "Staff time protected", desc: "Seconds of input. Automation does synthesis." },
  { title: "Gaps are expected", desc: "Confidence adjusts; outputs remain usable." },
  { title: "Start tiny", desc: "One signal per learner per week is enough (recommended baseline)." },
];

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

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{desc}</p>
      {bullets?.length ? (
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          {bullets.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ThreeTapMock() {
  const students = ["Idris", "Shara", "David", "Finley"];
  const signals = ["Debugging", "Persistence", "Collaboration", "Systems thinking"];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">3-Tap Signal Logger</div>
          <p className="mt-1 text-sm text-slate-600">
            Tap learner → tap signal → optional artefact. Done.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
          UI mock
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
          <div className="text-xs font-semibold tracking-widest text-slate-500">TAP 1</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {students.map((n) => (
              <button
                key={n}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition"
                type="button"
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
          <div className="text-xs font-semibold tracking-widest text-slate-500">TAP 2</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {signals.map((s) => (
              <button
                key={s}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition"
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
          <div className="text-xs font-semibold tracking-widest text-slate-500">TAP 3 (OPTIONAL)</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Add photo", "Add code", "Add build"].map((x) => (
              <button
                key={x}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition"
                type="button"
              >
                {x}
              </button>
            ))}
            <button
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 transition"
              type="button"
            >
              Done ✅
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Pill>Evidence packet updates</Pill>
          <Pill>Capability profile updates</Pill>
          <Pill>Confidence adjusts</Pill>
          <Pill>AI next action (labelled)</Pill>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Automation runs even if you only do Tap 1 + Tap 2.
        </p>
      </div>
    </div>
  );
}

function ArchitecturePanel() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">Architecture (Passive + Inferred)</div>
          <p className="mt-1 text-sm text-slate-600">
            Tiny signals + student artefacts → automation → labelled AI summaries → proof-ready outputs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill>Signal capture</Pill>
          <Pill>Artefact vault</Pill>
          <Pill>Inference labelled</Pill>
          <Pill>Confidence scoring</Pill>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        {[
          {
            t: "CAPTURE",
            items: ["3-tap signal logger (staff)", "Artefacts (student-led)", "Optional imports (rosters/challenges)"],
          },
          {
            t: "DATA",
            items: ["Supabase / Postgres (signals)", "Object storage (artefacts)", "Event ledger (audit trail)"],
          },
          {
            t: "AUTOMATION",
            items: ["Evidence compiler (lazy packets)", "Capability modeler (trajectory)", "Confidence scoring (no punishment)"],
          },
          {
            t: "OUTPUTS",
            items: ["Parent-safe summaries", "School-ready reports", "Competition portfolios + PDFs", "Next-action suggestions (labelled)"],
          },
        ].map((col) => (
          <div key={col.t} className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
            <div className="text-xs font-semibold tracking-widest text-slate-500">{col.t}</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {col.items.map((it) => (
                <li key={it} className="flex gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
                  {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="text-xs font-semibold text-slate-500">INFERENCE TRANSPARENCY</div>
        <p className="mt-2 text-sm text-slate-600">
          AI summaries are marked as <span className="font-semibold">inferred</span>. Human-logged signals and artefacts are marked as{" "}
          <span className="font-semibold">observed</span>.
        </p>
      </div>
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
              <div className="text-sm font-semibold">STEM Proof + Capability</div>
              <div className="text-xs text-slate-500">Minimal effort • Maximum credibility</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((it) => (
              <a key={it.href} href={it.href} className="text-sm text-slate-600 hover:text-slate-900">
                {it.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#three-tap"
              className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
            >
              View demo
            </a>
            <Link
              href="/session-log"
              className="inline-flex rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-4 pt-12 sm:pt-16">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <div className="flex flex-wrap gap-2">
              <Pill>3-tap signals</Pill>
              <Pill>Student artefacts</Pill>
              <Pill>AI inferred (labelled)</Pill>
              <Pill>Confidence scoring</Pill>
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              {hero.headline}
            </h1>
            <p className="mt-4 text-base text-slate-600 sm:text-lg">{hero.subtext}</p>

            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              {hero.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/session-log"
                className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Get started
              </Link>
              <a
                href="#three-tap"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                See 3-tap demo
              </a>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Built for STEM clubs, learning centres, and school enrichment.
            </p>
          </div>

          {/* Right panel: compact “what shows up” */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Output preview</div>
                <span className="text-xs text-slate-500">proof + trajectory</span>
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Observed</div>
                  <div className="mt-1 text-sm font-semibold">Signal</div>
                  <p className="mt-2 text-sm text-slate-600">Debugging improved (tap)</p>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Passive</div>
                  <div className="mt-1 text-sm font-semibold">Artefact</div>
                  <p className="mt-2 text-sm text-slate-600">Student attaches build photo/code (optional)</p>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Inferred (labelled)</div>
                  <div className="mt-1 text-sm font-semibold">AI next action</div>
                  <p className="mt-2 text-sm text-slate-600">
                    Increase difficulty by one step; rotate roles to strengthen collaboration.
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500">Export</div>
                  <div className="mt-1 text-sm font-semibold">Proof-ready PDF</div>
                  <p className="mt-2 text-sm text-slate-600">Parent summary + capability trajectory</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Pill>Observed</Pill>
                <Pill>Inferred</Pill>
                <Pill>Confidence-adjusted</Pill>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE STRIP */}
      <section className="mx-auto max-w-6xl px-4 pt-10">
        <div className="grid gap-4 md:grid-cols-3">
          {valueTiles.map((t) => (
            <div key={t.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold">{t.title}</div>
                <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                  {t.badge}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-6xl px-4 pt-16">
        <SectionTitle
          eyebrow="HOW IT WORKS"
          title="A workflow that stays lightweight"
          desc="Designed so you can stop early and still generate value."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-5">
          {howSteps.map((s) => (
            <div key={s.k} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-10 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white">
                  {s.k}
                </div>
                <div className="text-sm font-semibold text-slate-900">{s.title}</div>
              </div>
              <p className="mt-3 text-sm text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3-TAP LOGGER */}
      <section id="three-tap" className="mx-auto max-w-6xl px-4 pt-16">
        <SectionTitle eyebrow="3-TAP LOGGER" title="See the logger UI" desc="Tap → tap → optional artefact. Done." />
        <div className="mt-8">
          <ThreeTapMock />
        </div>
      </section>

      {/* PROOF ENGINE */}
      <section id="proof" className="mx-auto max-w-6xl px-4 pt-16">
        <SectionTitle
          eyebrow="PROOF ENGINE"
          title="Proof outputs without report-writing"
          desc="Evidence compiles lazily from signals + artefacts (and labels AI inferences)."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {proofCards.map((c) => (
            <Card key={c.title} title={c.title} desc={c.desc} bullets={c.bullets} />
          ))}
        </div>
      </section>

      {/* CAPABILITY OS */}
      <section id="capability" className="mx-auto max-w-6xl px-4 pt-16">
        <SectionTitle
          eyebrow="CAPABILITY OS"
          title="Track who learners are becoming"
          desc="Roles + trajectory over time—confidence-adjusted and transparent."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {capabilityCards.map((c) => (
            <Card key={c.title} title={c.title} desc={c.desc} bullets={c.bullets} />
          ))}
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section id="architecture" className="mx-auto max-w-6xl px-4 pt-16">
        <SectionTitle
          eyebrow="ARCHITECTURE"
          title="Passive + inferred by design"
          desc="Automation does synthesis so staff don’t carry the evidence burden."
        />
        <div className="mt-8">
          <ArchitecturePanel />
        </div>
      </section>

      {/* ONBOARDING */}
      <section id="onboarding" className="mx-auto max-w-6xl px-4 pb-16 pt-16">
        <SectionTitle
          eyebrow="ONBOARDING"
          title="Start tiny, still win"
          desc="Recommended baseline: one signal per learner per week."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {onboardingPoints.map((p) => (
            <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">{p.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{p.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Ready to try it in your flow?
              </h2>
              <p className="mt-3 text-sm text-slate-600 sm:text-base">
                Go to Session Log and run a quick test entry. AI inferences should be labelled as inferred.
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Observed = human logged. Inferred = AI summarised. Confidence shows how strong the evidence is.
              </p>
            </div>
            <div className="flex flex-wrap justify-start gap-3 md:justify-end">
              <a
                href="#three-tap"
                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                See 3-tap demo
              </a>
              <Link
                href="/session-log"
                className="inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Open Session Log
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            © {new Date().getFullYear()} STEM Proof + Capability. All rights reserved.
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
