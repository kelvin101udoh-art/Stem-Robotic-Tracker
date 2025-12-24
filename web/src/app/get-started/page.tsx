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
    confirmPassword: string;
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
    return Math.random().toString(36).slice(2, 2 + len).toUpperCase();
}

/** Final code like "MDX-7K4P2" */
function generateClubCode(clubName: string) {
    return `${clubPrefix(clubName)}-${randomChunk(5)}`;
}

type ModalTone = "error" | "success" | "info";

function AppModal({
    open,
    tone = "info",
    title,
    message,
    onClose,
}: {
    open: boolean;
    tone?: ModalTone;
    title: string;
    message: string;
    onClose: () => void;
}) {
    if (!open) return null;

    const toneStyles =
        tone === "error"
            ? {
                box: "border-rose-200 bg-rose-50",
                title: "text-rose-800",
                text: "text-rose-700",
                btn: "bg-rose-600 hover:bg-rose-700",
            }
            : tone === "success"
                ? {
                    box: "border-emerald-200 bg-emerald-50",
                    title: "text-emerald-800",
                    text: "text-emerald-700",
                    btn: "bg-emerald-600 hover:bg-emerald-700",
                }
                : {
                    box: "border-slate-200 bg-slate-50",
                    title: "text-slate-900",
                    text: "text-slate-700",
                    btn: "bg-slate-900 hover:bg-slate-800",
                };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="app-modal-title"
        >
            {/* Backdrop */}
            <button
                type="button"
                aria-label="Close dialog"
                onClick={onClose}
                className="absolute inset-0 cursor-pointer bg-slate-900/40"
            />

            {/* Modal */}
            <div
                className={`relative w-full max-w-md rounded-3xl border p-6 shadow-xl ring-1 ring-slate-200/60 ${toneStyles.box}`}
            >
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p id="app-modal-title" className={`text-sm font-semibold ${toneStyles.title}`}>
                            {title}
                        </p>
                        <p className={`mt-2 text-sm ${toneStyles.text}`}>{message}</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        Close
                    </button>
                </div>

                <div className="mt-5 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${toneStyles.btn}`}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function GetStartedPage() {
    const router = useRouter();
    const supabase = createClient();

    // ✅ Global modal (for both register + login updates/errors)
    const [modalOpen, setModalOpen] = useState(false);
    const [modalTone, setModalTone] = useState<ModalTone>("info");
    const [modalTitle, setModalTitle] = useState("Update");
    const [modalMsg, setModalMsg] = useState("");

    function openModal(tone: ModalTone, title: string, message: string) {
        setModalTone(tone);
        setModalTitle(title);
        setModalMsg(message);
        setModalOpen(true);
    }

    function resetAlerts() {
        // using a global modal now, so nothing required here
    }

    function openRegError(message: string) {
        openModal("error", "Error", message);
    }

    function openLoginError(message: string) {
        openModal("error", "Error", message);
    }


    // Forgot password modal (independent email input)
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);

    const [mode, setMode] = useState<Mode>("register");

    const [register, setRegister] = useState<RegisterState>({
        clubName: "",
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [login, setLogin] = useState<LoginState>({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);

    // Show generated club code after successful registration
    const [createdClubCode, setCreatedClubCode] = useState<string>("");

    const valueTiles = useMemo(
        () => [
            { title: "Owner overview", desc: "See cohorts, progress consistency, and programme coverage in one view." },
            { title: "Programme templates", desc: "Keep mentors aligned with the same weekly flow and challenge structure." },
            { title: "Project archive", desc: "Projects stay connected to progress for easy review across terms." },
            { title: "Low admin workflow", desc: "Capture essentials only—keep records clean without slowing sessions." },
        ],
        []
    );

    function updateRegister<K extends keyof RegisterState>(key: K, value: RegisterState[K]) {
        setRegister((s) => ({ ...s, [key]: value }));
        setCreatedClubCode("");
    }

    function updateLogin<K extends keyof LoginState>(key: K, value: LoginState[K]) {
        setLogin((s) => ({ ...s, [key]: value }));
    }

    function isSchoolEmail(email: string) {
        const trimmed = email.trim().toLowerCase();
        const parts = trimmed.split("@");
        if (parts.length !== 2) return false;

        const domain = parts[1];

        // Block common personal providers
        const blocked = new Set([
            "gmx.com",
            "googlemail.com",
            "yahoo.com",
            "yahoo.co.uk",
            "outlook.com",
            "hotmail.com",
            "live.com",
            "icloud.com",
            "me.com",
            "aol.com",
            "proton.me",
            "protonmail.com",
            "zoho.com",
        ]);

        if (blocked.has(domain)) return false;

        // Allow institutional-ish domains
        const looksInstitutional =
            domain.endsWith(".ac.uk") ||
            domain.endsWith(".sch.uk") ||
            domain.endsWith(".edu") ||
            domain.endsWith(".com") ||
            domain.endsWith(".net") ||
            domain.endsWith(".org") ||
            domain.endsWith(".homes") ||
            domain.endsWith(".org.uk") ||
            domain.endsWith(".edu.ng") ||
            domain.endsWith(".edu.uk") ||
            domain.includes("school") ||
            domain.includes("academy") ||
            domain.includes("college") ||
            domain.includes("university");

        return looksInstitutional;
    }

    async function createClubWithUniqueCode(clubName: string) {
        for (let i = 0; i < 6; i++) {
            const code = generateClubCode(clubName);

            const { data, error } = await supabase
                .from("clubs")
                .insert({ name: clubName, club_code: code })
                .select("id, club_code")
                .single();

            if (!error && data?.id) return data;

            const msg = (error as any)?.message?.toLowerCase?.() || "";
            const isDup =
                msg.includes("duplicate") ||
                msg.includes("unique") ||
                msg.includes("club_code") ||
                (error as any)?.code === "23505";

            if (!isDup) throw error;
        }

        throw new Error("Could not generate a unique club code. Please try again.");
    }

    async function handleForgotPasswordSubmit() {
        if (!forgotEmail.trim()) {
            openModal("error", "Error", "Please enter your email address.");
            return;
        }

        setForgotLoading(true);
        try {
            const redirectTo =
                typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;

            const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
                redirectTo,
            });

            if (error) throw error;

            setForgotOpen(false);
            setForgotEmail("");
            openModal("success", "Update", "Password reset link sent. Please check your email inbox.");
        } catch (err: any) {
            openModal("error", "Error", err?.message || "Unable to send reset link. Please try again.");
        } finally {
            setForgotLoading(false);
        }
    }

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
        resetAlerts();
        setCreatedClubCode("");

        if (!register.clubName.trim()) return openRegError("Please enter your club name.");
        if (!register.fullName.trim()) return openRegError("Please enter your full name.");

        if (!register.email.trim()) return openRegError("Please enter your email.");
        if (!isSchoolEmail(register.email)) {
            return openRegError("Please use a school/institution email address (no personal emails).");
        }

        if (register.password.trim().length < 6) {
            return openRegError("Password must be at least 6 characters.");
        }
        if (register.password !== register.confirmPassword) {
            return openRegError("Passwords do not match. Please confirm your password.");
        }

        setLoading(true);

        try {
            const origin =
                typeof window !== "undefined" ? window.location.origin : "";

            const { data, error } = await supabase.auth.signUp({
                email: register.email.trim(),
                password: register.password.trim(),
                options: {
                    // ✅ these get stored and we will use them AFTER the user confirms email and logs in
                    data: {
                        club_name: register.clubName.trim(),
                        full_name: register.fullName.trim(),
                    },
                    // ✅ ensures the email link returns to your app
                    emailRedirectTo: `${origin}/get-started?confirmed=1`,
                },
            });

            if (error) throw error;

            // ✅ Email confirmation ON → no session yet (that’s normal)
            // Show update in a modal instead of redirecting silently.

            openModal(
                "success",
                "Update",
                "Account created. Please check your email to confirm your address, then return here to log in."
            );
            setMode("login");



            // Optional: switch UI to login mode automatically
            setMode("login");
        }

        /* catch (err: any) {
            const raw = (err?.message || "").toLowerCase();

            // ✅ specifically handle the email sending problem
            if (raw.includes("error sending confirmation email")) {
                openRegError(
                    "Error sending confirmation email. Please ask the admin to check Supabase Auth email (SMTP) settings and allowed redirect URLs, then try again."
                );
            } else {
                openRegError(err?.message || "Registration failed. Please try again.");
            }


        } 
        */
        catch (err: any) {
            console.log("SIGNUP ERROR:", err);
            console.log("SIGNUP ERROR MESSAGE:", err?.message);
            console.log("SIGNUP ERROR STATUS:", err?.status);
            openModal("error", "Error", err?.message || "Registration failed.");
        }


        finally {
            setLoading(false);
        }
    }


    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        resetAlerts();

        if (!login.email.trim() || !login.password.trim()) {
            return openLoginError("Please enter your email and password.");
        }

        setLoading(true);

        try {
            const { data: signInData, error: signInError } =
                await supabase.auth.signInWithPassword({
                    email: login.email.trim(),
                    password: login.password.trim(),
                });

            if (signInError) throw signInError;

            const userId = signInData.user?.id;
            if (!userId) throw new Error("Login failed. Please try again.");

            // Try load profile
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role, is_active")
                .eq("id", userId)
                .single();

            // ✅ If profile doesn't exist yet, bootstrap it (common after email confirmation flow)
            const notFound =
                (profileError as any)?.code === "PGRST116" ||
                (profileError as any)?.message?.toLowerCase?.().includes("0 rows");

            if (notFound) {
                await bootstrapIfMissing(userId);

                // re-fetch profile
                const { data: createdProfile, error: createdErr } = await supabase
                    .from("profiles")
                    .select("role, is_active")
                    .eq("id", userId)
                    .single();

                if (createdErr) throw createdErr;

                const role = (createdProfile.role as UserRole) || "student";
                openModal("success", "Update", "Login successful. Redirecting…");
                router.push(routeForRole(role));
                return;
            }

            if (profileError) throw profileError;
            if (!profile) throw new Error("Profile not found. Please contact your club admin.");
            if (profile.is_active === false) {
                await supabase.auth.signOut();
                throw new Error("This account is inactive. Please contact your club admin.");
            }

            const role = (profile.role as UserRole) || "student";
            openModal("success", "Update", "Login successful. Redirecting…");
            router.push(routeForRole(role));
        } catch (err: any) {
            const raw = (err?.message || "").toLowerCase();

            if (raw.includes("invalid login credentials")) {
                openLoginError("Invalid login credentials.");
            } else {
                openLoginError(err?.message || "Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }



    async function copyCode() {
        if (!createdClubCode) return;
        try {
            await navigator.clipboard.writeText(createdClubCode);
            openModal("success", "Update", "Club code copied to clipboard.");
        } catch {
            openModal("info", "Update", "Could not copy automatically. Please select and copy the club code.");
        }
    }

    // helper: create club + profile after user logs in (if profile doesn't exist yet)
    async function bootstrapIfMissing(userId: string) {
        // get logged-in user to read user_metadata
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;

        const meta = userData.user?.user_metadata || {};
        const clubName = String(meta.club_name || "").trim();
        const fullName = String(meta.full_name || "").trim();

        if (!clubName || !fullName) {
            throw new Error("Missing setup details. Please contact support.");
        }

        // ✅ create club with autogenerated code (your existing helper)
        const clubRow = await createClubWithUniqueCode(clubName);

        // ✅ create profile
        const { error: profileError } = await supabase.from("profiles").upsert(
            {
                id: userId,
                club_id: clubRow.id,
                role: "club_admin",
                full_name: fullName,
                is_active: true,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
        );

        if (profileError) throw profileError;

        // show the club code
        setCreatedClubCode(clubRow.club_code);
        openModal("success", "Update", "Setup completed. Your club code is ready.");
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
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                    >
                        Back to homepage
                    </Link>
                </div>
            </header>

            {/* ✅ Global modal */}
            <AppModal
                open={modalOpen}
                tone={modalTone}
                title={modalTitle}
                message={modalMsg}
                onClose={() => setModalOpen(false)}
            />

            {/* Forgot password modal */}
            {forgotOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-slate-900">Reset password</h3>
                        <p className="mt-1 text-sm text-slate-600">Enter your email address and we’ll send you a reset link.</p>

                        <div className="mt-4">
                            <label className="text-xs font-semibold text-slate-700">Email address</label>
                            <input
                                type="email"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                placeholder="admin@school.edu"
                                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                            />
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setForgotOpen(false);
                                    setForgotEmail("");
                                }}
                                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleForgotPasswordSubmit}
                                disabled={forgotLoading}
                                className="cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:opacity-60"
                            >
                                {forgotLoading ? "Sending…" : "Send reset link"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                    setCreatedClubCode("");
                                }}
                                className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors ${mode === "register"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                                    }`}
                            >
                                Register
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setMode("login");
                                    setCreatedClubCode("");
                                }}
                                className={`cursor-pointer rounded-xl px-3 py-2 text-sm font-medium transition-colors ${mode === "login"
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                                    }`}
                            >
                                Login
                            </button>
                        </div>

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
                                            className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                                        >
                                            Copy
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => router.push("/app/admin")}
                                            className="cursor-pointer rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
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
                                        placeholder="admin@yourclub.ac.uk"
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                                    />
                                    <p className="mt-1 text-xs text-slate-500">Use a school/institution email address.</p>
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

                                <div>
                                    <label className="text-xs font-semibold text-slate-700">Confirm password</label>
                                    <input
                                        value={register.confirmPassword}
                                        onChange={(e) => updateRegister("confirmPassword", e.target.value)}
                                        type="password"
                                        placeholder="••••••••"
                                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="cursor-pointer inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow disabled:opacity-60"
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
                                        placeholder="you@yourclub.ac.uk"
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
                                    className="cursor-pointer inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow disabled:opacity-60"
                                >
                                    {loading ? "Signing in…" : "Sign in"}
                                </button>

                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-slate-500">Forgot your password?</p>

                                    <button
                                        type="button"
                                        onClick={() => setForgotOpen(true)}
                                        className="cursor-pointer text-xs font-semibold text-slate-700 underline underline-offset-4 hover:text-slate-900 transition"
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* RIGHT: Value Panel */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
                        <p className="text-xs font-semibold tracking-widest text-slate-500">WHAT YOU GET</p>
                        <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">A clean operating view for STEM clubs</h2>
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
                                Built for real club operations: <span className="font-medium">accounts</span>, teams, and roles are organised
                                to keep clubs secure and easy to manage from day one.
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
