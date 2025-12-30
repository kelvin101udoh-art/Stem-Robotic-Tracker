// web/src/app/app/admin/layout.tsx
"use client";

import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-clip">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('/noise.png')] bg-repeat" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
