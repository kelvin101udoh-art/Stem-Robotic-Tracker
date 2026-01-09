"use client";

import { useAdminGuard } from "@/lib/admin/admin-guard";
import { useKiKiBillingStats } from "@/lib/kiki/useKikiBilling";

export default function KiKiBillingCard({ clubId }: { clubId: string }) {
  const { supabase } = useAdminGuard({ idleMinutes: 15 });
  const { loading, stats } = useKiKiBillingStats(supabase, clubId);

  if (loading || !stats) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="mt-3 h-6 w-24 bg-slate-200 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
        KiKi AI — Pilot Usage
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Chats used today</div>
          <div className="text-lg font-semibold text-slate-900">
            {stats.chatsUsedToday}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Remaining today</div>
          <div className="text-lg font-semibold text-slate-900">
            {stats.chatsRemaining}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Tokens (this week)</div>
          <div className="text-lg font-semibold text-slate-900">
            {stats.tokensThisWeek.toLocaleString()}
          </div>
        </div>
      </div>

      {stats.chatsRemaining === 0 && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Daily pilot limit reached. Upgrade to continue using KiKi today.
        </div>
      )}
    </div>
  );
}
