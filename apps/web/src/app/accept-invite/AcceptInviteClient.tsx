// /web/src/app/accept-invite/AcceptInviteClient.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type InviteRole = "teacher" | "student" | "parent";
type UserRole = "club_admin" | "teacher" | "student" | "parent";

type InviteRow = {
  id: string;
  club_id: string;
  role: InviteRole;
  email: string;
  token: string;
  expires_at: string;
  used_at: string | null;
};

function routeForRole(role: UserRole) {
  switch (role) {
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

function isExpired(expiresAtISO: string) {
  const exp = new Date(expiresAtISO).getTime();
  return Number.isNaN(exp) ? true : Date.now() > exp;
}

export default function AcceptInviteClient() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const token = params.get("token")?.trim() || "";

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteRow | null>(null);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  function resetAlerts() {
    setMsg("");
    setError("");
  }

  function validateInvite(row: InviteRow) {
    if (!row.token) return "Invalid invite token.";
    if (row.used_at) return "This invite link has already been used.";
    if (isExpired(row.expires_at)) return "This invite link has expired.";
    return "";
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInvite() {
      resetAlerts();

      if (!token) {
        setError("Missing invite token.");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data, error: invErr } = await supabase
          .from("invites")
          .select("id, club_id, role, email, token, expires_at, used_at")
          .eq("token", token)
          .single();

        if (invErr) throw invErr;

        const row = data as InviteRow;

        const v = validateInvite(row);
        if (v) {
          setInvite(row);
          setError(v);
          setLoading(false);
          return;
        }

        if (!cancelled) setInvite(row);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Could not load invite. Please check the link.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInvite();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function onAccept(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();

    if (!invite) return setError("Invite not loaded.");
    const inviteValidation = validateInvite(invite);
    if (inviteValidation) return setError(inviteValidation);

    if (!fullName.trim()) return setError("Please enter your full name.");
    if (!password.trim() || password.trim().length < 6)
      return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);

    try {
      const email = invite.email.trim().toLowerCase();

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password: password.trim(),
        options: { data: { full_name: fullName.trim() } },
      });

      if (signUpError) throw signUpError;

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password: password.trim(),
        });

      if (signInError || !signInData.user?.id) {
        setMsg(
          "Account created. Please confirm your email, then return to this link to finish setup."
        );
        return;
      }

      const userId = signInData.user.id;

      const role: UserRole = invite.role;

      const { error: profErr } = await supabase.from("profiles").upsert(
        {
          id: userId,
          club_id: invite.club_id,
          role,
          full_name: fullName.trim(),
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (profErr) throw profErr;

      const { error: usedErr } = await supabase
        .from("invites")
        .update({ used_at: new Date().toISOString() })
        .eq("id", invite.id)
        .eq("token", invite.token)
        .is("used_at", null);

      if (usedErr) throw usedErr;

      setMsg("Invite accepted. Redirecting…");
      router.push(routeForRole(role));
    } catch (e: any) {
      setError(e?.message || "Could not accept invite. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const statusPill = (() => {
    if (loading)
      return { label: "Loading…", cls: "bg-slate-50 text-slate-600 border-slate-200" };
    if (error)
      return { label: "Action required", cls: "bg-rose-50 text-rose-700 border-rose-200" };
    return { label: "Invite ready", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  })();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <span className="text-sm font-bold">ST</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">STEMTrack</div>
              <div className="text-xs text-slate-500">Accept invite</div>
            </div>
          </Link>

          <Link
            href="/"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to homepage
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-widest text-slate-500">INVITE</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Join your club workspace
                </h1>
                <p className="mt-2 text-sm text-slate-600">
                  Create your account to access your role dashboard. Your invite controls which
                  role you receive.
                </p>
              </div>

              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusPill.cls}`}
              >
                {statusPill.label}
              </span>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-700">Invite details</p>
              <div className="mt-2 grid gap-2 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Email</span>
                  <span className="font-medium">{invite?.email || "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Role</span>
                  <span className="font-medium">{invite?.role || "—"}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500">Expires</span>
                  <span className="font-medium">
                    {invite?.expires_at ? new Date(invite.expires_at).toLocaleString() : "—"}
                  </span>
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-800">Error</p>
                <p className="mt-1 text-sm text-rose-700">{error}</p>
                <p className="mt-2 text-xs text-rose-700">
                  Ask your club admin to send a new invite if this link is expired or already used.
                </p>
              </div>
            ) : null}

            {msg ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">Update</p>
                <p className="mt-1 text-sm text-emerald-700">{msg}</p>
              </div>
            ) : null}

            <form onSubmit={onAccept} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Email (from invite)</label>
                <input
                  value={invite?.email || ""}
                  readOnly
                  className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none"
                />
                <p className="mt-1 text-xs text-slate-500">
                  This must match the email the admin invited.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  type="text"
                  placeholder="Your full name"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                  <p className="mt-1 text-xs text-slate-500">Min 6 characters.</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Confirm password</label>
                  <input
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !!error || !invite}
                className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Creating your account…" : "Accept invite & create account"}
              </button>

              <p className="text-xs text-slate-500">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="underline underline-offset-4">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline underline-offset-4">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
            <p className="text-xs font-semibold tracking-widest text-slate-500">WHAT HAPPENS NEXT</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              Role access is automatic
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              After you accept the invite, your account is linked to the club and routed to the
              correct dashboard.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                { title: "Teacher", desc: "Log sessions, add notes, keep continuity week to week." },
                { title: "Student", desc: "Track progress, challenges, and build portfolio evidence." },
                { title: "Parent", desc: "See plain-language updates and progress snapshots." },
                { title: "Admin", desc: "Invite roles, manage access, oversee club delivery." },
              ].map((x) => (
                <div key={x.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{x.title} view</p>
                  <p className="mt-1 text-sm text-slate-600">{x.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold tracking-widest text-slate-500">SECURITY NOTE</p>
              <p className="mt-2 text-sm text-slate-600">
                Invites are single-use and expire automatically. After completion, the invite is
                marked as used.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">© {new Date().getFullYear()} STEMTrack</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/privacy" className="text-slate-600 hover:text-slate-900">Privacy</Link>
            <Link href="/terms" className="text-slate-600 hover:text-slate-900">Terms</Link>
            <Link href="/cookies" className="text-slate-600 hover:text-slate-900">Cookies</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
