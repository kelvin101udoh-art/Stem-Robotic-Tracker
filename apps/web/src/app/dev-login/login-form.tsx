// web/src/app/dev-login/login-form.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DevLoginForm() {
  const sp = useSearchParams();
  const router = useRouter();
  const nextPath = sp.get("next") || "/app/dev/billing";

  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.user) {
      setErr(error?.message || "Login failed");
      setLoading(false);
      return;
    }

    router.replace(nextPath);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-semibold">Developer Login</h1>
        <p className="mt-1 text-sm text-slate-600">Internal developer access only.</p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <label className="block text-sm font-semibold">Email</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <label className="mt-4 block text-sm font-semibold">Password</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          {err ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {err}
            </div>
          ) : null}

          <button
            onClick={onLogin}
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="mt-3 text-xs text-slate-500">
            Redirect after login: <span className="font-semibold text-slate-700">{nextPath}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
