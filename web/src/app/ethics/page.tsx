export default function EthicsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-slate-50">
      <div className="max-w-3xl mx-auto p-6 md:p-10 grid gap-4">
        <a href="/" className="text-sm underline text-slate-700">← Back to Home</a>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">AI Ethics Note (Month 3)</h1>
          <p className="mt-2 text-sm text-slate-600">
            This platform generates explainable learning insights to support instructors.
            It does not make automated decisions about students.
          </p>

          <ul className="mt-4 text-sm text-slate-700 list-disc pl-5 grid gap-2">
            <li><b>Human-in-the-loop:</b> teachers interpret insights and decide next steps.</li>
            <li><b>Transparency:</b> insights show the reason (e.g., time improved by %).</li>
            <li><b>Fairness:</b> “Not enough data” is returned when evidence is insufficient.</li>
            <li><b>Privacy:</b> demo data only; real data will follow consent rules.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
