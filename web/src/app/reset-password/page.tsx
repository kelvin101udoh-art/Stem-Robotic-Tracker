// /web/src/app/reset-password/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type UserRole = "club_admin" | "teacher" | "student" | "parent";

function routeForRole(role: UserRole) {
  switch (role) {
    case "club_admin":
      return "/app/admin";
    case "teacher":
      return "/app/teacher";
    case "student":
      return "/app/student";
    case "parent":
      return "/app/parent";
    default:
      return "/app";
  }
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [ready, setReady] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  function openError(msg: string) {
    setErrorMsg(msg);
    setErrorOpen(true);
  }
  function openSuccess(msg: string) {
    setSuccessMsg(msg);
    setSuccessOpen(true);
  }

  // ✅ IMPORTANT: Recovery links often arrive with tokens in the URL.
  // This call parses the URL and stores the session in the client.
  useEffect(() => {
    let mounted = true;

    async function initFromRecoveryLink() {
      try {
        // supabase-js v2 supports this helper for magic/recovery links
        const { data, error } = await supabase.auth.getSessionFromUrl({
          storeSession: true,
        });

        if (!mounted) return;

        if (error) {
          setHasRecoverySession(false);
          openError("This reset link is invalid or expired. Please request a new one.");
        } else {
          setHasRecoverySession(Boolean(data.session));
        }
      } catch {
        if (!mounted) return;
        setHasRecoverySession(false);
        openError("Unable to open reset link. Please request a new one.");
      } finally {
        if (!mounted) return;
        setReady(true);
      }
    }

    initFromRecoveryLink();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.trim().length < 6) {
      openError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      openError("Passwords do not match. Please confirm your password.");
      return;
    }

    setLoading(true);
    try {
      // ✅ Update password for the currently authenticated recovery session
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      openSuccess("Password updated successfully. Redirecting you to your dashboard…");

      // ✅ Role-aware redirect
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // fallback: go to login
        router.replace("/get-started");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = (profile?.role || "student") as UserRole;

      // Small delay so user sees success modal briefly
      setTimeout(() => router.replace(routeForRole(role)), 900);
    } catch (err: any) {
      openError(err?.message || "Could not update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <span className="text-sm font-bold">ST</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">STEMTrack</div>
              <div className="text-xs text-slate-500">Reset password</div>
            </div>
          </Link>

          <Link
            href="/get-started"
            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Back to login
          </Link>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
          <p className="text-xs font-semibold tracking-widest text-slate-500">SECURITY</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Set a new password
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Choose a strong password to secure your account.
          </p>

          {!ready ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Preparing reset link…
            </div>
          ) : !hasRecoverySession ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-800">Link problem</p>
              <p className="mt-1 text-sm text-rose-700">
                Your reset link is invalid or expired. Please request a new one from the login page.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
                <p className="mt-1 text-xs text-slate-500">Minimum 6 characters.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition disabled:opacity-60"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Error Modal */}
      {errorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <p className="text-sm font-semibold text-slate-900">Error</p>
            <p className="mt-2 text-sm text-slate-600">{errorMsg}</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setErrorOpen(false)}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <p className="text-sm font-semibold text-slate-900">Success</p>
            <p className="mt-2 text-sm text-slate-600">{successMsg}</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSuccessOpen(false)}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
