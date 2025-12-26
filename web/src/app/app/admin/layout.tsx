// web/src/app/app/admin/layout.tsx

"use client";

import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

        {/* Soft radial glow */}
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-[120px]" />

        {/* Noise texture (CSS-only) */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')]" />
      </div>

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
