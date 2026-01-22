// web/src/app/app/admin/clubs/[clubId]/schedule/layout.tsx

import { ReactNode } from "react";

export default function ScheduleLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen w-full overflow-x-clip text-slate-900">
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-100" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute -left-56 top-[-220px] h-[640px] w-[640px] rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -right-72 top-[60px] h-[700px] w-[700px] rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      {children}
    </main>
  );
}
