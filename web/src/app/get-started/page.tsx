// /web/src/app/get-started/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "register" | "login";

// ✅ Matches your DB enum: public.user_role
type UserRole = "club_admin" | "teacher" | "student" | "parent";

type RegisterState = {
  clubName: string; // clubs.name
  clubCode: string; // clubs.club_code (unique)
  fullName: string; // profiles.full_name
  email: string;
  password: string;
};

type LoginState = {
  email: string;
  password: string;
  clubCode: string; // verify against clubs.club_code
};

const normalizeClubCode = (v: string) => v.trim().toUpperCase();

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

export default function GetStartedPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("register");

  const [register, setRegister] = useState<RegisterState>({
    clubName: "",
    clubCode: "",
    fullName: "",
    email: "",
    password: "",
  });

  const [login, setLogin] = useState<LoginState>({
    email: "",
    password: "",
    clubCode: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const valueTiles = useMemo(
    () => [
      {
        title: "Owner overview",
        desc: "See cohorts, delivery consistency, and programme coverage in one view.",
      },
      {
        title: "Programme templates",
        desc: "Keep mentors aligned with the same weekly flow and challenge structure.",
      },
      {
        title: "Project archive",
        desc: "Projects stay connected to progress for easy review across terms.",
      },
      {
        title: "Low admin workflow",
        desc: "Capture essentials only—keep records clean without slowing sessions.",
      },
    ],
    []
  );

  function resetAlerts() {
    setError("");
    setMsg("");
  }

  function updateRegister<K extends keyof RegisterState>(key: K, value: RegisterState[K]) {
    setRegister((s) => ({ ...s, [key]: value }));
    resetAlerts();
  }

  function updateLogin<K extends keyof LoginState>(key: K, value: LoginState[K]) {
    setLogin((s) => ({ ...s, [key]: value }));
    resetAlerts();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();

    if (!register.clubName.trim()) return setError("Please enter your club name.");
    if (!register.clubCode.trim()) return setError("Please enter your club code.");
    if (!register.fullName.trim()) return setError("Please enter your full name.");
    if (!register.email.trim()) return setError("Please enter your email.");
    if (register.password.trim().length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);

    try {
      const email = register.email.trim().toLowerCase();
      const password = register.password.trim();
      const clubName = register.clubName.trim();
      const clubCode = normalizeClubCode(register.clubCode);
      const fullName = register.fullName.trim();

      // 1) Create auth user
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signUpError) throw signUpError;

      // 2) Ensure we are authenticated for RLS inserts
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If email confirmation is enabled, sign-in may fail until confirmed.
      if (signInError || !signInData.user?.id) {
        setMsg("Account created. Please confirm your email, then return here to log in.");
        return;
      }

      const userId = signInData.user.id;

      // 3) Ensure club exists (clubs.club_code unique)
      // NOTE: This upsert may update the club name if club_code already exists.
      // If you want to prevent that, replace upsert with: insert then select fallback.
      const { data: clubRow, error: clubUpsertError } = await supabase
        .from("clubs")
        .upsert({ name: clubName, club_code: clubCode }, { onConflict: "club_code" })
        .select("id, club_code")
        .single();

      if (clubUpsertError) throw clubUpsertError;
      if (!clubRow?.id) throw new Error("Could not create/find club. Please try again.");

      // 4) Create/Upsert profile (matches: id, club_id, role, full_name, is_active, created_at, updated_at)
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          club_id: clubRow.id,
          role: "club_admin" as UserRole,
          full_name: fullName,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (profileError) throw profileError;

      setMsg("Admin account created. Redirecting…");
      router.push(routeForRole("club_admin"));
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();

    if (!login.email.trim() || !login.password.trim()) return setError("Please enter your email and password.");
    if (!login.clubCode.trim()) return setError("Please enter your club code.");

    setLoading(true);

    try {
      const email = login.email.trim().toLowerCase();
      const password = login.password.trim();
      const provided = normalizeClubCode(login.clubCode);

      // 1) Sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      const userId = signInData.user?.id;
      if (!userId) throw new Error("Login failed. Please try again.");

      // 2) Fetch profile (club_id + role)
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("club_id, role, is_active")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      if (!profile?.club_id) {
        await supabase.auth.signOut();
        throw new Error("No club assigned to this account. Please contact your club admin.");
      }

      // Optional: block inactive accounts
      if (profile.is_active === false) {
        await supabase.auth.signOut();
        throw new Error("This account is not active. Please contact your club admin.");
      }

      // 3) Fetch club_code from clubs table
      const { data: club, error: clubError } = await supabase
        .from("clubs")
        .select("club_code")
        .eq("id", profile.club_id)
        .single();

      if (clubError) throw clubError;

      const expected = normalizeClubCode(club?.club_code || "");
      if (!expected) {
        await supabase.auth.signOut();
        throw new Error("Club code not found for this club. Please contact support.");
      }

      if (expected !== provided) {
        await supabase.auth.signOut();
        throw new Error("Club code does not match this account.");
      }

      // 4) Redirect by role
      const role = (profile.role || "student") as UserRole;
      setMsg("Login successful. Redirecting…");
      router.push(routeForRole(role));
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Top bar */}
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            {/* LOGO */}
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <span className="text-sm font-bold">ST</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">STEMTrack</div>
              <div className="text-xs text-slate-500">Get started • Club access</div>
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
          {/* LEFT: Auth */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
            <p className="text-xs font-semibold tracking-widest text-slate-500">GET STARTED</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {mode === "register" ? "Create club admin account" : "Sign in"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {mode === "register"
                ? "Create the first admin for a club. This creates both the club and your profile."
                : "Sign in with your credentials. Club code is used as an extra verification step."}
            </p>

            {/* Switch */}
            <div className="mt-5 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  resetAlerts();
                }}
                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                  mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  resetAlerts();
                }}
                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                  mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Login
              </button>
            </div>

            {/* Alerts */}
            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-800">Error</p>
                <p className="mt-1 text-sm text-rose-700">{error}</p>
              </div>
            ) : null}

            {msg ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">Message</p>
                <p className="mt-1 text-sm text-emerald-700">{msg}</p>
              </div>
            ) : null}

            {mode === "register" ? (
              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Club name</label>
                  <input
                    value={register.clubName}
                    onChange={(e) => updateRegister("clubName", e.target.value)}
                    type="text"
                    placeholder="MDX STEM Club"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Club code</label>
                  <input
                    value={register.clubCode}
                    onChange={(e) => updateRegister("clubCode", e.target.value)}
                    type="text"
                    placeholder="e.g., MDX-STEM"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                  <p className="mt-1 text-xs text-slate-500">Unique and used for club separation + verification.</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Full name</label>
                  <input
                    value={register.fullName}
                    onChange={(e) => updateRegister("fullName", e.target.value)}
                    type="text"
                    placeholder="Kelvin Edet"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Admin email</label>
                  <input
                    value={register.email}
                    onChange={(e) => updateRegister("email", e.target.value)}
                    type="email"
                    placeholder="admin@yourclub.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <input
                    value={register.password}
                    onChange={(e) => updateRegister("password", e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                  <p className="mt-1 text-xs text-slate-500">Min 6 characters.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Creating…" : "Create admin account"}
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
            ) : (
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Email</label>
                  <input
                    value={login.email}
                    onChange={(e) => updateLogin("email", e.target.value)}
                    type="email"
                    placeholder="admin@yourclub.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    <input
                      value={login.password}
                      onChange={(e) => updateLogin("password", e.target.value)}
                      type="password"
                      placeholder="••••••••"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Club code</label>
                    <input
                      value={login.clubCode}
                      onChange={(e) => updateLogin("clubCode", e.target.value)}
                      type="text"
                      placeholder="e.g., MDX-STEM"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                    />
                </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>

                <p className="text-xs text-slate-500">Password reset can be added later.</p>
              </form>
            )}
          </div>

          {/* RIGHT: Value Panel */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
            <p className="text-xs font-semibold tracking-widest text-slate-500">WHAT YOU GET</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              A clean operating view for STEM clubs
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Owner-level clarity: delivery consistency, learner progress, and project history—without noisy dashboards.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {valueTiles.map((t) => (
                <div key={t.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{t.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold tracking-widest text-slate-500">NOTE</p>
              <p className="mt-2 text-sm text-slate-600">
                This page matches your schema: <span className="font-medium">clubs</span> →{" "}
                <span className="font-medium">profiles</span> (club_id), with enum roles and RLS-friendly inserts.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Club codes are normalized to uppercase for consistent verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">© {new Date().getFullYear()} STEMTrack</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/privacy" className="text-slate-600 hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/terms" className="text-slate-600 hover:text-slate-900">
              Terms
            </Link>
            <Link href="/cookies" className="text-slate-600 hover:text-slate-900">
              Cookies
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
