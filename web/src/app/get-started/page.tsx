// app/get-started/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

type Mode = "register" | "login";

// Match your DB enum intent (user_role)
type UserRole = "club_admin" | "teacher" | "student" | "parent";

type RegisterState = {
  fullName: string;
  email: string;
  password: string;
  clubName: string;   // NEW (clubs.name)
  clubCode: string;   // (clubs.club_code)
  role: "club_admin"; // FIXED to match enum user_role
};

type LoginState = {
  email: string;
  password: string;
  clubCode: string;   // user enters club_code, we verify via clubs table
};

export default function GetStartedPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [mode, setMode] = useState<Mode>("register");

  const [register, setRegister] = useState<RegisterState>({
  fullName: "",
  email: "",
  password: "",
  clubName: "",
  clubCode: "",
  role: "club_admin",
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
      { title: "Owner overview", desc: "See cohorts, progress consistency, and programme coverage in one view." },
      { title: "Programme templates", desc: "Keep mentors aligned with the same weekly flow and challenge structure." },
      { title: "Project archive", desc: "Projects stay connected to progress for easy review across terms." },
      { title: "Low admin workflow", desc: "Capture essentials only—keep records clean without slowing sessions." },
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

  if (!register.fullName.trim()) return setError("Please enter your full name.");
  if (!register.email.trim()) return setError("Please enter your email.");
  if (register.password.trim().length < 6)
    return setError("Password must be at least 6 characters.");
  if (!register.clubName.trim()) return setError("Please enter your club name.");
  if (!register.clubCode.trim()) return setError("Please enter your club code.");

  setLoading(true);

  try {
    // 1) Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: register.email.trim(),
      password: register.password.trim(),
      options: {
        data: {
          full_name: register.fullName.trim(),
          role: register.role, // "club_admin"
        },
      },
    });
    if (signUpError) throw signUpError;

    const userId = data.user?.id;

    // If email confirmation is ON, Supabase may not return a session immediately.
    // For smooth testing, turn email confirmation OFF temporarily,
    // OR move club/profile creation to a server route.
    if (!userId) {
      setMsg(
        "Account created. Please confirm your email to continue (email confirmation is enabled)."
      );
      return;
    }

    // 2) Create club row
    const { data: clubRow, error: clubError } = await supabase
      .from("clubs")
      .insert({
        name: register.clubName.trim(),
        club_code: register.clubCode.trim(),
      })
      .select("id")
      .single();

    if (clubError) throw clubError;
    const clubId = clubRow?.id;
    if (!clubId) throw new Error("Club creation failed. Please try again.");

    // 3) Create profile row linked to club_id
    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      club_id: clubId,
      role: "club_admin",
      full_name: register.fullName.trim(),
      is_active: true,
    });

    if (profileError) throw profileError;

    setMsg("Account created. Redirecting…");

    // ✅ Smart redirect (club_admin → admin dashboard)
    router.push("/app/admin");
  } catch (err: any) {
    setError(err?.message || "Registration failed. Please try again.");
  } finally {
    setLoading(false);
  }
}


  async function handleLogin(e: React.FormEvent) {
  e.preventDefault();
  resetAlerts();

  if (!login.email.trim() || !login.password.trim()) {
    return setError("Please enter your email and password.");
  }
  if (!login.clubCode.trim()) {
    return setError("Please enter your club code.");
  }

  setLoading(true);

  try {
    // 1) Sign in
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: login.email.trim(),
      password: login.password.trim(),
    });
    if (signInError) throw signInError;

    const userId = data.user?.id;
    if (!userId) throw new Error("Login failed. Please try again.");

    // 2) Read profile to get club_id + role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("club_id, role, is_active")
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;

    if (profile?.is_active === false) {
      await supabase.auth.signOut();
      throw new Error("This account is inactive. Please contact your club admin.");
    }

    const clubId = profile?.club_id;
    if (!clubId) {
      await supabase.auth.signOut();
      throw new Error("No club is linked to this account. Please contact your club admin.");
    }

    // 3) Verify club_code from clubs table
    const { data: club, error: clubError } = await supabase
      .from("clubs")
      .select("club_code")
      .eq("id", clubId)
      .single();

    if (clubError) throw clubError;

    const expected = (club?.club_code || "").trim().toLowerCase();
    const provided = login.clubCode.trim().toLowerCase();

    if (!expected || expected !== provided) {
      await supabase.auth.signOut();
      throw new Error("Club code does not match this account.");
    }

    setMsg("Login successful. Redirecting…");

    // ✅ Smart redirect logic (paste here)
    switch (profile.role) {
      case "club_admin":
        router.push("/app/admin");
        break;
      case "teacher":
        router.push("/app/teacher");
        break;
      case "student":
        router.push("/app/student");
        break;
      case "parent":
        router.push("/app/parent");
        break;
      default:
        router.push("/app");
        break;
    }
  } catch (err: any) {
    setError(err?.message || "Login failed. Please try again.");
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
              <div className="text-xs text-slate-500">Get started • Admin access</div>
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

      {/* Content */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          {/* Auth Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
            <p className="text-xs font-semibold tracking-widest text-slate-500">GET STARTED</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {mode === "register" ? "Create club admin account" : "Sign in"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {mode === "register"
                ? "Create your club and admin account. This matches your Supabase tables (clubs + profiles)."
                : "Sign in and we’ll route you to the correct dashboard based on your role."}
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
                  mode === "register"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
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
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
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
                <p className="text-sm font-semibold text-emerald-800">Success</p>
                <p className="mt-1 text-sm text-emerald-700">{msg}</p>
              </div>
            ) : null}

            {mode === "register" ? (
              <form onSubmit={handleRegister} className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Full name</label>
                  <input
                    value={register.fullName}
                    onChange={(e) => updateRegister("fullName", e.target.value)}
                    type="text"
                    placeholder="Kelvin Edet"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Club name</label>
                    <input
                      value={register.clubName}
                      onChange={(e) => updateRegister("clubName", e.target.value)}
                      type="text"
                      placeholder="e.g., MDX Robotics Club"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Club code</label>
                    <input
                      value={register.clubCode}
                      onChange={(e) => updateRegister("clubCode", e.target.value)}
                      type="text"
                      placeholder="e.g., MDX-STEM"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                    />
                    <p className="mt-1 text-xs text-slate-500">Must be unique.</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Admin email</label>
                  <input
                    value={register.email}
                    onChange={(e) => updateRegister("email", e.target.value)}
                    type="email"
                    placeholder="admin@yourclub.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <input
                    value={register.password}
                    onChange={(e) => updateRegister("password", e.target.value)}
                    type="password"
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                  <p className="mt-1 text-xs text-slate-500">Min 6 characters.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                >
                  {loading ? "Creating…" : "Create club + admin account"}
                </button>

                <p className="text-xs text-slate-500">
                  By continuing, you agree to our{" "}
                  <Link href="/terms" className="underline underline-offset-4">Terms</Link> and{" "}
                  <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>.
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
                    placeholder="you@yourclub.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
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
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Club code</label>
                    <input
                      value={login.clubCode}
                      onChange={(e) => updateLogin("clubCode", e.target.value)}
                      type="text"
                      placeholder="e.g., MDX-STEM"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
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

                <p className="text-xs text-slate-500">Password reset flow can be added later.</p>
              </form>
            )}
          </div>

          {/* Value Panel */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
            <p className="text-xs font-semibold tracking-widest text-slate-500">WHAT YOU GET</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              A clean operating view for STEM clubs
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Owner-level clarity: progress consistency, delivery tracking, and project history—without noisy dashboards.
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
              <p className="text-xs font-semibold tracking-widest text-slate-500">MATCHED TO YOUR SCHEMA</p>
              <p className="mt-2 text-sm text-slate-600">
                Register creates a row in <span className="font-semibold">clubs</span>, then writes your
                <span className="font-semibold"> profiles.club_id</span>. Login verifies the club code via
                <span className="font-semibold"> clubs.club_code</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
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
