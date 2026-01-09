// /app/app/dev/billing/page.tsx
"use client";

import { useAdminGuard } from "@/lib/admin/admin-guard";
import { useKiKiBillingStats } from "@/lib/kiki/useKikiBilling";
import { notFound } from "next/navigation";

export default function DevKiKiBillingPage() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.KIKI_DEV_MODE !== "true"
  ) {
    notFound();
  }

  const { supabase } = useAdminGuard({ idleMinutes: 60 });
  const { loading, stats } = useKiKiBillingStats(supabase);

  if (loading || !stats) {
    return (
      <div className="p-6">
        <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="text-xl font-semibold text-slate-900">
        KiKi AI — Developer Usage
      </h1>

      <p className="mt-1 text-sm text-slate-600">
        Internal pilot monitoring (not visible to admins).
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Chats today" value={stats.chatsUsedToday} />
        <Stat label="Remaining" value={stats.chatsRemaining} />
        <Stat label="Tokens (7d)" value={stats.tokensThisWeek.toLocaleString()} />
      </div>

      {stats.chatsRemaining === 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Pilot chat limit reached for today.
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
