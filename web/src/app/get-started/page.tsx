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
  fullName: string; // profiles.full_name
  email: string;
  password: string;
};

type LoginState = {
  email: string;
  password: string;
};

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

/** Make a short readable prefix from club name (e.g., "MDX STEM Club" -> "MDX") */
function clubPrefix(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);

  const first = (words[0] || "CLUB").toUpperCase();
  return first.slice(0, 3).padEnd(3, "X"); // always 3 chars
}

/** Random part (uppercase base36) */
function randomChunk(len = 5) {
  // e.g., "7K4P2"
  return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}

/** Final code like "MDX-7K4P2" */
function generateClubCode(clubName: string) {
  return `${clubPrefix(clubName)}-${randomChunk(5)}`;
}

export default function GetStartedPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("register");

  const [register, setRegister] = useState<RegisterState>({
    clubName: "",
    fullName: "",
    email: "",
    password: "",
  });

  const [login, setLogin] = useState<LoginState>({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Show generated club code after successful registration
  const [createdClubCode, setCreatedClubCode] = useState<string>("");

  const valueTiles = useMemo(
    () => [
      {
        title: "Owner overview",
        desc: "See cohorts, progress consistency, and programme coverage in one view.",
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
    setCreatedClubCode("");
  }

  function updateLogin<K extends keyof LoginState>(key: K, value: LoginState[K]) {
    setLogin((s) => ({ ...s, [key]: value }));
    resetAlerts();
  }

  async function createClubWithUniqueCode(clubName: string) {
    // Try a few times in case club_code unique collision
    for (let i = 0; i < 6; i++) {
      const code = generateClubCode(clubName);

      const { data, error } = await supabase
        .from("clubs")
        .insert({ name: clubName, club_code: code })
        .select("id, club_code")
        .single();

      if (!error && data?.id) return data;

      // If it's a duplicate code, retry; otherwise throw
      const msg = (error as any)?.message?.toLowerCase?.() || "";
      const isDup =
        msg.includes("duplicate") ||
        msg.includes("unique") ||
        msg.includes("club_code") ||
        (error as any)?.code === "23505"; // Postgres unique violation

      if (!isDup) throw error;
    }

    throw new Error("Could not generate a unique club code. Please try again.");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();
    setCreatedClubCode("");

    // ✅ Validation
    if (!register.clubName.trim()) return setError("Please enter your club name.");
    if (!register.fullName.trim()) return setError("Please enter your full name.");
    if (!register.email.trim()) return setError("Please enter your email.");
    if (register.password.trim().length < 6) return setError("Password must be at least 6 characters.");

    setLoading(true);

    try {
      const clubName = register.clubName.trim();

      // 1) Create auth user
      const { error: signUpError } = await supabase.auth.signUp({
        email: register.email.trim(),
        password: register.password.trim(),
      });
      if (signUpError) throw signUpError;

      // 2) Sign in right away so inserts pass your RLS policies
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: register.email.trim(),
        password: register.password.trim(),
      });

      // If email confirmation is enabled, sign-in may fail here.
      if (signInError || !signInData.user?.id) {
        setMsg("Account created. Please confirm your email, then return here to log in.");
        return;
      }

      const userId = signInData.user.id;

      // 3) Create club with an auto-generated unique code
      const clubRow = await createClubWithUniqueCode(clubName);
      setCreatedClubCode(clubRow.club_code);

      // 4) Create/Upsert profile
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          club_id: clubRow.id,
          role: "club_admin" as UserRole,
          full_name: register.fullName.trim(),
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (profileError) throw profileError;

      setMsg("Admin account created. Your club code is ready.");
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

    setLoading(true);

    try {
      // 1) Sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: login.email.trim(),
        password: login.password.trim(),
      });
      if (signInError) throw signInError;

      const userId = signInData.user?.id;
      if (!userId) throw new Error("Login failed. Please try again.");

      // 2) Fetch profile role and redirect
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error("Profile not found. Please contact your club admin.");
      if (profile.is_active === false) {
        await supabase.auth.signOut();
        throw new Error("This account is inactive. Please contact your club admin.");
      }

      const role = (profile.role as UserRole) || "student";
      setMsg("Login successful. Redirecting…");
      router.push(routeForRole(role));
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!createdClubCode) return;
    try {
      await navigator.clipboard.writeText(createdClubCode);
      setMsg("Club code copied to clipboard.");
    } catch {
      setMsg("Could not copy automatically. Please select and copy the club code.");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      {/* Top bar */}
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <span className="text-sm font-bold">ST</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">STEMTrack</div>
              <div className="text-xs text-slate-500">Get started • Club admin</div>
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
                ? "Create the first admin for your club. We’ll automatically generate a unique club code."
                : "Sign in with your email and password. You’ll be redirected based on your role."}
            </p>

            {/* Switch */}
            <div className="mt-5 grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  resetAlerts();
                  setCreatedClubCode("");
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
                  setCreatedClubCode("");
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
                <p className="text-sm font-semibold text-emerald-800">Update</p>
                <p className="mt-1 text-sm text-emerald-700">{msg}</p>
              </div>
            ) : null}

            {/* Success panel for generated club code */}
            {mode === "register" && createdClubCode ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold tracking-widest text-slate-500">YOUR CLUB CODE</p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">{createdClubCode}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Save this. You’ll use it to invite teachers, students, and parents.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={copyCode}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/app/admin")}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Go to dashboard
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* FORMS */}
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
                  <p className="mt-1 text-xs text-slate-500">
                    We’ll generate your club code automatically after you register.
                  </p>
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
                    placeholder="you@yourclub.com"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

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
                This page matches your schema: <span className="font-medium">clubs</span> (id, name, club_code, created_at)
                → <span className="font-medium">profiles</span> (id, club_id, role, full_name, is_active, created_at, updated_at).
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
