"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useKiKiBillingStats } from "@/lib/kiki/useKikiBilling";

function isDevEmail(email?: string | null) {
  if (!email) return false;

  const allowlist = (process.env.NEXT_PUBLIC_DEV_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length && allowlist.includes(email.toLowerCase())) return true;

  const domain = (process.env.NEXT_PUBLIC_DEV_EMAIL_DOMAIN || "").trim().toLowerCase();
  if (domain && email.toLowerCase().endsWith("@" + domain)) return true;

  return false;
}

export default function DevBillingPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email ?? null;

      if (!email) {
        router.replace("/get-started?next=/app/dev/billing");
        return;
      }

      if (!isDevEmail(email)) {
        router.replace("/404");
        return;
      }

      if (!cancelled) setAllowed(true);
    }

    run().catch(() => router.replace("/404"));

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  const { loading, stats } = useKiKiBillingStats(supabase);

  if (allowed === null) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-5">
          Checking access…
        </div>
      </main>
    );
  }

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

          <Link
            href="/app/admin"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            ← Back to Admin
          </Link>
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

            {stats.chatsRemaining === 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Daily pilot limit reached for chat. Increase limit or upgrade plan.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
