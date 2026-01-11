// web/src/app/app/dev/billing/page.tsx

"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useKiKiBillingStats } from "@/lib/kiki/useKikiBilling";

export default function DevBillingPage() {
  const supabase = useMemo(() => createClient(), []);
  const { loading, stats } = useKiKiBillingStats();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Dev · KiKi Billing</h1>
            <p className="mt-1 text-sm text-slate-600">
              Internal usage panel (pilot cost control).
            </p>
          </div>

          <button
            onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/dev-login"))}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-8">
        {loading || !stats ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 animate-pulse">
            <div className="h-4 w-48 rounded bg-slate-200" />
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="h-20 rounded-xl bg-slate-100" />
              <div className="h-20 rounded-xl bg-slate-100" />
              <div className="h-20 rounded-xl bg-slate-100" />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
              Pilot usage (mode: chat only)
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Chats used today</div>
                <div className="text-lg font-semibold text-slate-900">{stats.chatsUsedToday}</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Remaining today</div>
                <div className="text-lg font-semibold text-slate-900">{stats.chatsRemaining}</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Tokens (this week)</div>
                <div className="text-lg font-semibold text-slate-900">
                  {stats.tokensThisWeek.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
