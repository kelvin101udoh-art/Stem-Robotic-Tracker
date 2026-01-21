// web/src/app/app/admin/clubs/[clubId]/sessions/layout.tsx


import { ReactNode } from "react";

export default function SessionsLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen w-full overflow-x-clip text-slate-900">
      {/* Enterprise background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Base */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100" />

        {/* Atmospheric layers */}
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_20%_0%,rgba(99,102,241,0.18),transparent_60%),radial-gradient(900px_500px_at_90%_10%,rgba(34,211,238,0.14),transparent_55%),radial-gradient(700px_500px_at_30%_90%,rgba(16,185,129,0.10),transparent_55%)]" />

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,rgba(15,23,42,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.12)_1px,transparent_1px)] [background-size:56px_56px]" />

        {/* Noise */}
        <div className="absolute inset-0 opacity-[0.05] [background-image:url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22400%22 height=%22400%22 filter=%22url(%23n)%22 opacity=%220.35%22/%3E%3C/svg%3E')]" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(2,6,23,0.10)_100%)]" />
      </div>

      {children}
    </main>
  );
}
