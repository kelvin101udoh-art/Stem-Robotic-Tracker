// web/src/app/app/admin/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type KPI = { label: string; value: string; hint?: string };
type ModalTone = "error" | "success" | "info";
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
          box: "border-slate-200 bg-white",
          title: "text-slate-900",
          text: "text-slate-700",
          btn: "bg-slate-900 hover:bg-slate-800",
        };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-black/50"
      />
      <div className={`relative w-full max-w-md rounded-2xl border p-6 shadow-xl ring-1 ring-slate-200/60 ${toneStyles.box}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${toneStyles.title}`}>{title}</p>
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

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name:
    | "home"
    | "people"
    | "invites"
    | "sessions"
    | "attendance"
    | "insights"
    | "reports"
    | "settings"
    | "search"
    | "bell"
    | "logout"
    | "plus"
    | "chev";
  className?: string;
}) {
  // Minimal inline SVGs (no extra deps)
  switch (name) {
    case "home":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "people":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M16 11a4 4 0 1 0-8 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M4 20c1.6-3.4 5-5 8-5s6.4 1.6 8 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "invites":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path d="m5 8 7 5 7-5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      );
    case "sessions":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            d="M7 3v3M17 3v3M4.5 9h15"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M6 6h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
        </svg>
      );
    case "attendance":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            d="M7 4h10a2 2 0 0 1 2 2v14H5V6a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path d="M8 11h8M8 15h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M9 4V2M15 4V2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "insights":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M4 19V5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M8 19v-7M12 19V9M16 19v-10M20 19v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "reports":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M8 12h8M8 16h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M19.4 15a7.9 7.9 0 0 0 .1-2l2-1.2-2-3.5-2.3.6a7.7 7.7 0 0 0-1.6-1L15 4h-6l-.6 2.9a7.7 7.7 0 0 0-1.6 1L4.5 7.3l-2 3.5 2 1.2a7.9 7.9 0 0 0 .1 2l-2 1.2 2 3.5 2.3-.6a7.7 7.7 0 0 0 1.6 1L9 20h6l.6-2.9a7.7 7.7 0 0 0 1.6-1l2.3.6 2-3.5-2-1.2Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "search":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            d="M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path d="M16.5 16.5 21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "bell":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "logout":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M3 12h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="m7 8-4 4 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      );
    case "plus":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "chev":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
}

function StatCard({ item }: { item: KPI }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
        {item.hint ? <p className="text-xs text-slate-500">{item.hint}</p> : null}
      </div>
    </div>
  );
}

function FeedRow({
  title,
  desc,
  href,
  meta,
}: {
  title: string;
  desc: string;
  href: string;
  meta?: string;
}) {
  return (
    <Link href={href} className="group flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition cursor-pointer">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-600">{desc}</p>
        {meta ? <p className="mt-2 text-xs text-slate-500">{meta}</p> : null}
      </div>
      <span className="shrink-0 mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 group-hover:bg-slate-100 transition">
        <Icon name="chev" className="h-4 w-4" />
      </span>
    </Link>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  // ===== Auth rules =====
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [clubName, setClubName] = useState("Your Club");
  const [termLabel, setTermLabel] = useState("Current term");

  // ===== Idle timeout =====
  const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 mins
  const idleTimerRef = useRef<number | null>(null);

  // ===== Modal =====
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

  async function forceLogout(reason?: "idle" | "manual") {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      if (reason === "idle") {
        openModal("info", "Session ended", "You were signed out due to inactivity. Please sign in again.");
      }
      router.replace("/get-started");
    }
  }

  function resetIdleTimer() {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => forceLogout("idle"), IDLE_TIMEOUT_MS);
  }

  // Guard: must be admin + active session
  useEffect(() => {
    let cancelled = false;

    async function guard() {
      setCheckingAuth(true);
      try {
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        const session = sessionData.session;
        if (!session?.user?.id) {
          router.replace("/get-started");
          return;
        }

        const userId = session.user.id;

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role, is_active, club_id")
          .eq("id", userId)
          .single();

        if (profileErr) throw profileErr;

        if (!profile || profile.is_active === false) {
          await supabase.auth.signOut();
          router.replace("/get-started");
          return;
        }

        if (profile.role !== "club_admin") {
          router.replace(routeForRole(profile.role as UserRole));
          return;
        }

        if (profile.club_id) {
          const { data: club } = await supabase.from("clubs").select("name").eq("id", profile.club_id).single();
          if (!cancelled && club?.name) setClubName(club.name);
        }

        if (!cancelled) {
          setTermLabel("Term 1"); // placeholder until terms table is wired
        }
      } catch {
        router.replace("/get-started");
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    }

    guard();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  // Start idle timer after auth check
  useEffect(() => {
    if (checkingAuth) return;

    resetIdleTimer();
    const events: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    const onActivity = () => resetIdleTimer();
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingAuth]);

  // ===== Navigation (Facebook-like left rail) =====
  const nav = useMemo(
    () => [
      { label: "Overview", href: "/app/admin/overview", icon: "home" as const },
      { label: "People", href: "/app/admin/people/students", icon: "people" as const },
      { label: "Invites", href: "/app/admin/invites", icon: "invites" as const },
      { label: "Sessions", href: "/app/admin/sessions", icon: "sessions" as const },
      { label: "Attendance", href: "/app/admin/attendance", icon: "attendance" as const },
      { label: "Insights", href: "/app/admin/insights", icon: "insights" as const },
      { label: "Reports", href: "/app/admin/reports", icon: "reports" as const },
      { label: "Settings", href: "/app/admin/settings", icon: "settings" as const },
    ],
    []
  );

  // ===== Dashboard content =====
  const kpis: KPI[] = [
    { label: "Active teachers", value: "—", hint: "staffed this term" },
    { label: "Students enrolled", value: "—", hint: "active cohort" },
    { label: "Parents linked", value: "—", hint: "accounts connected" },
    { label: "Sessions logged", value: "—", hint: "this term" },
  ];

  const quickActions = useMemo(
    () => [
      { title: "Invite users", desc: "Role-based links with expiry.", href: "/app/admin/invites", icon: "invites" as const },
      { title: "Create session", desc: "Plan objectives + evidence capture.", href: "/app/admin/sessions/new", icon: "sessions" as const },
      { title: "Take attendance", desc: "Fast check-in for today.", href: "/app/admin/attendance", icon: "attendance" as const },
      { title: "Enrollment inbox", desc: "Approve new joins.", href: "/app/admin/enrollment/inbox", icon: "people" as const },
    ],
    []
  );

  const tasksFeed = useMemo(
    () => [
      {
        title: "Create / switch term",
        desc: "Define Term dates, goals, and cohort structure.",
        href: "/app/admin/terms",
        meta: "Terms 1–3",
      },
      {
        title: "Invite teachers",
        desc: "Send secure links for coaches and mentors.",
        href: "/app/admin/invites?role=teacher",
        meta: "Role-based access",
      },
      {
        title: "Enroll students & link parents",
        desc: "Approve enrollments and connect parent accounts.",
        href: "/app/admin/enrollment/inbox",
        meta: "Enrollment inbox",
      },
      {
        title: "Export impact report",
        desc: "Generate parent/funder-ready summary exports.",
        href: "/app/admin/reports",
        meta: "PDF / CSV",
      },
    ],
    []
  );

  const spotlightModules = useMemo(
    () => [
      {
        title: "Consistency",
        desc: "Standardise delivery with templates + term structure.",
        href: "/app/admin/terms",
        pills: ["Terms 1–3", "Cohorts", "Templates"],
      },
      {
        title: "Evidence",
        desc: "Capture notes/photos and turn sessions into proof of learning.",
        href: "/app/admin/evidence",
        pills: ["Notes", "Photos", "Portfolio"],
      },
      {
        title: "Governance",
        desc: "Secure access, audit trail, and role-based separation by club.",
        href: "/app/admin/invites",
        pills: ["Expiry", "Audit log", "Club isolation"],
      },
    ],
    []
  );

  // ===== Loading state =====
  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <span className="text-sm font-bold">ST</span>
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">STEMTrack</div>
                <div className="text-xs text-slate-500">Admin</div>
              </div>
            </div>
            <div className="h-9 w-44 rounded-xl bg-slate-100 animate-pulse" />
          </div>
        </div>

        <section className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr_320px]">
            <div className="h-[480px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" />
            <div className="h-[480px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" />
            <div className="h-[480px] rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <AppModal open={modalOpen} tone={modalTone} title={modalTitle} message={modalMsg} onClose={() => setModalOpen(false)} />

      {/* Top app bar (Facebook-like) */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          {/* Brand */}
          <Link href="/app/admin/overview" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <span className="text-sm font-bold">ST</span>
            </div>
            <div className="hidden leading-tight sm:block">
              <div className="text-sm font-semibold">STEMTrack</div>
              <div className="text-xs text-slate-500">Club Admin</div>
            </div>
          </Link>

          {/* Search */}
          <div className="ml-2 hidden flex-1 sm:block">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                <Icon name="search" className="h-4 w-4" />
              </span>
              <input
                placeholder="Search people, sessions, invites…"
                onChange={() => resetIdleTimer()}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-2.5 text-sm outline-none focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          {/* Right controls */}
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold text-slate-900">{clubName}</p>
              <span className="text-xs text-slate-400">•</span>
              <p className="text-xs font-medium text-slate-600">{termLabel}</p>
            </div>

            <Link
              href="/app/admin/sessions/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
              title="Create session"
            >
              <Icon name="plus" className="h-4 w-4" />
              <span className="hidden sm:inline">New</span>
            </Link>

            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
              title="Notifications"
              onClick={() => openModal("info", "Notifications", "Notifications panel is coming next.")}
            >
              <Icon name="bell" className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => forceLogout("manual")}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
              title="Logout"
            >
              <Icon name="logout" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 3-column app layout */}
      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr_340px]">
          {/* Left rail */}
          <aside className="hidden lg:block">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="px-2 text-xs font-semibold tracking-widest text-slate-500">NAVIGATION</p>

              <nav className="mt-3 space-y-1">
                {nav.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition cursor-pointer ${
                        active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`${active ? "text-white" : "text-slate-700"}`}>
                        <Icon name={item.icon} className="h-5 w-5" />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Security</p>
                <p className="mt-1 text-sm text-slate-700">
                  Auto sign-out after{" "}
                  <span className="font-semibold">{Math.round(IDLE_TIMEOUT_MS / 60000)} minutes</span> inactivity.
                </p>
              </div>
            </div>
          </aside>

          {/* Center: main feed */}
          <div className="space-y-6">
            {/* Welcome / composer-like card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin dashboard</p>
                  <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
                    Club Command Centre
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Fast setup, clean delivery, and evidence-ready reporting—without admin overhead.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {quickActions.map((a) => (
                    <Link
                      key={a.title}
                      href={a.href}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
                    >
                      <Icon name={a.icon} className="h-4 w-4" />
                      <span className="whitespace-nowrap">{a.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* KPI grid */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((k) => (
                <StatCard key={k.label} item={k} />
              ))}
            </div>

            {/* Next actions feed (Facebook-like cards list) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Recommended next steps</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Terms → People → Sessions → Attendance → Insights.
                  </p>
                </div>
                <Link
                  href="/app/admin/overview"
                  className="text-sm font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-700"
                >
                  Admin map
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {tasksFeed.map((t) => (
                  <FeedRow key={t.title} title={t.title} desc={t.desc} href={t.href} meta={t.meta} />
                ))}
              </div>
            </div>

            {/* Spotlight modules */}
            <div className="grid gap-4 md:grid-cols-3">
              {spotlightModules.map((m) => (
                <div key={m.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{m.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{m.desc}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.pills.map((p) => (
                      <Pill key={p}>{p}</Pill>
                    ))}
                  </div>
                  <Link
                    href={m.href}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-700"
                  >
                    Open <Icon name="chev" className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Right rail: “panel stack” like Facebook */}
          <aside className="space-y-6">
            {/* Club status panel */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-widest text-slate-500">CLUB STATUS</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{clubName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Keep delivery consistent across terms and cohorts.
                  </p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-900 text-white">
                  <Icon name="home" className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href="/app/admin/terms" className="rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50 transition">
                  <p className="text-xs font-semibold text-slate-900">Terms</p>
                  <p className="mt-1 text-xs text-slate-600">Set dates & cohorts</p>
                </Link>
                <Link href="/app/admin/clubs" className="rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50 transition">
                  <p className="text-xs font-semibold text-slate-900">Club</p>
                  <p className="mt-1 text-xs text-slate-600">Profile & centre</p>
                </Link>
              </div>
            </div>

            {/* Cohort health */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold tracking-widest text-slate-500">COHORT HEALTH</p>
              <p className="mt-2 text-sm text-slate-600">
                High-level signals (no deep logs required).
              </p>

              <div className="mt-4 space-y-2">
                <MiniSignal label="Attendance trend" value="—" hint="last 4 sessions" />
                <MiniSignal label="Evidence captured" value="—" hint="photos/notes" />
                <MiniSignal label="Sessions staffed" value="—" hint="planned vs delivered" />
                <MiniSignal label="Learners at risk" value="—" hint="missed 2+ sessions" />
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tip</p>
                <p className="mt-1 text-sm text-slate-700">
                  Use Insights to adjust staffing/difficulty, then export a term report.
                </p>
              </div>
            </div>

            {/* Shortcuts */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold tracking-widest text-slate-500">SHORTCUTS</p>
              <div className="mt-3 grid gap-2">
                <Shortcut href="/app/admin/people/students" icon="people" title="Students" desc="Manage learners" />
                <Shortcut href="/app/admin/people/teachers" icon="people" title="Teachers" desc="Mentors & coaches" />
                <Shortcut href="/app/admin/invites" icon="invites" title="Invites" desc="Secure role links" />
                <Shortcut href="/app/admin/reports" icon="reports" title="Reports" desc="Export impact" />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-600">
                Admin access is role-based and club-isolated. If you need multi-club support later, this layout scales cleanly.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function MiniSignal({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      </div>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Shortcut({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: Parameters<typeof Icon>[0]["name"];
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50 transition">
      <div className="flex items-center gap-3 min-w-0">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white">
          <Icon name={icon as any} className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{title}</p>
          <p className="text-xs text-slate-600 truncate">{desc}</p>
        </div>
      </div>
      <span className="shrink-0 text-slate-700 group-hover:text-slate-900">
        <Icon name="chev" className="h-4 w-4" />
      </span>
    </Link>
  );
}
