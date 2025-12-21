// app/get-started/page.tsx
// ✅ Professional “Get Started” page (Admin Login + buyer-led sales panel)
// - Admin login redirects to /app (change to your real main product route)
// - Looks like a real product onboarding screen (not a prototype)
// - No payments/money talk
// - Works with App Router

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type FormState = {
    email: string;
    password: string;
    clubCode: string;
};

export default function GetStartedPage() {
    const router = useRouter();

    const [form, setForm] = useState<FormState>({
        email: "",
        password: "",
        clubCode: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const tips = useMemo(
        () => [
            {
                title: "Owner overview",
                desc: "See cohort health, delivery consistency, and activity coverage in one place.",
            },
            {
                title: "Programme templates",
                desc: "Keep every mentor aligned with a repeatable weekly flow and challenge structure.",
            },
            {
                title: "Project archive",
                desc: "Projects stay linked to progress—easy to review across learners and terms.",
            },
            {
                title: "Low admin workflow",
                desc: "Capture essentials only. Keep records clean without slowing sessions.",
            },
        ],
        []
    );

    function update<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((s) => ({ ...s, [key]: value }));
        setError("");
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        // Basic validation (keep it simple for now)
        if (!form.email.trim() || !form.password.trim()) {
            setError("Please enter your admin email and password.");
            return;
        }
        if (!form.clubCode.trim()) {
            setError("Please enter your club code.");
            return;
        }

        setLoading(true);

        try {
            // ✅ Replace this with Supabase auth later.
            // For now, treat it as a product walkthrough entry.
            await new Promise((r) => setTimeout(r, 650));

            // Redirect admin to “main product website”
            // Change "/app" to your real dashboard route (e.g., "/dashboard" or "/admin")
            router.push("/app");
        } catch (err) {
            setError("Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
            {/* Top bar */}
            <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-xl bg-slate-900" />
                        <div className="leading-tight">
                            <div className="text-sm font-semibold">STEMTrack</div>
                            <div className="text-xs text-slate-500">Admin access • Owner-led view</div>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/"
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                            Back to homepage
                        </Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
                <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
                    {/* Left: Login card */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
                        <p className="text-xs font-semibold tracking-widest text-slate-500">
                            GET STARTED
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                            Admin login
                        </h1>
                        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                            Sign in as a club admin to open the full product experience and view all
                            functionality in action.
                        </p>

                        {/* Status */}
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                    Owner overview
                                </span>
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                    Cohort consistency
                                </span>
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                                    Clean records
                                </span>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Tip: use any placeholder credentials now; you can wire Supabase auth now.
                            </p>
                        </div>

                        <form onSubmit={onSubmit} className="mt-6 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Email */}
                                <div className="sm:col-span-2">
                                    <label className="text-xs font-semibold text-slate-700">
                                        Admin email
                                    </label>
                                    <input
                                        value={form.email}
                                        onChange={(e) => update("email", e.target.value)}
                                        type="email"
                                        placeholder="admin@yourclub.com"
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                                    />
                                </div>

                                {/* Password */}
                                <div className="sm:col-span-1">
                                    <label className="text-xs font-semibold text-slate-700">
                                        Password
                                    </label>
                                    <input
                                        value={form.password}
                                        onChange={(e) => update("password", e.target.value)}
                                        type="password"
                                        placeholder="••••••••"
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                                    />
                                </div>

                                {/* Club code */}
                                <div className="sm:col-span-1">
                                    <label className="text-xs font-semibold text-slate-700">
                                        Club code
                                    </label>
                                    <input
                                        value={form.clubCode}
                                        onChange={(e) => update("clubCode", e.target.value)}
                                        type="text"
                                        placeholder="e.g., MDX-STEM"
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                                    />
                                </div>
                            </div>

                            {error ? (
                                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                                    <p className="text-sm font-medium text-rose-800">{error}</p>
                                    <p className="mt-1 text-xs text-rose-700">
                                        If you haven’t connected authentication yet, enter any values to continue.
                                    </p>
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
                            >
                                {loading ? "Signing in…" : "Open admin dashboard"}
                            </button>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs text-slate-500">
                                    This page is for club admins only.
                                </p>
                                <p

                                    className="text-xs font-medium text-slate-700 underline underline-offset-4"
                                >
                                    Access all Admin Features →
                                </p>
                            </div>
                        </form>
                    </div>

                    {/* Right: Product value panel */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
                        <p className="text-xs font-semibold tracking-widest text-slate-500">
                            WHAT YOU’LL SEE INSIDE
                        </p>
                        <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
                            A complete club operating view
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                            This is built for STEM club owners: a clean view of programme delivery, learner
                            progress, and project history—without the clutter of generic attendance apps.
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            {tips.map((t) => (
                                <div
                                    key={t.title}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                                    <p className="mt-1 text-sm text-slate-600">{t.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* “Looks real” mini-preview */}
                        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-500">OWNER OVERVIEW</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        Cohort health snapshot
                                    </p>
                                </div>
                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                    Live layout
                                </span>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                                {[
                                    { label: "On track", value: "3" },
                                    { label: "Needs support", value: "1" },
                                    { label: "New cohort", value: "1" },
                                ].map((x) => (
                                    <div
                                        key={x.label}
                                        className="rounded-2xl border border-slate-200 bg-white p-4"
                                    >
                                        <p className="text-xs font-semibold text-slate-500">{x.label}</p>
                                        <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                                            {x.value}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-semibold text-slate-600">
                                    Recommended next step
                                </p>
                                <p className="mt-1 text-sm text-slate-600">
                                    Reuse the Week template for Cohort B and nudge artifact uploads to keep records
                                    complete.
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold tracking-widest text-slate-500">
                                CLARITY PROMISE
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                Clean UI. Role separation. Owner-first navigation. Everything designed to feel
                                professional and easy to demo to schools, parents, and partners.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white">
                <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-600">
                        © {new Date().getFullYear()} STEMTrack
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <Link href="/" className="text-slate-600 hover:text-slate-900">
                            Home
                        </Link>
                        <Link href="/get-started" className="text-slate-600 hover:text-slate-900">
                            Get started
                        </Link>
                        <Link href="/faq" className="text-slate-600 hover:text-slate-900">
                            Faq
                        </Link>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <Link className="text-slate-600 hover:text-slate-900" href="/privacy">Privacy</Link>
                        <Link className="text-slate-600 hover:text-slate-900" href="/terms">Terms</Link>
                        <Link className="text-slate-600 hover:text-slate-900" href="/cookies">Cookies</Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
