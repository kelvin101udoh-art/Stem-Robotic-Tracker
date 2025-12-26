// web/src/app/app/admin/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type KPI = { label: string; value: string; hint?: string; delta?: string; tone?: "slate" | "emerald" | "indigo" | "amber" };
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
          title: "text-rose-900",
          text: "text-rose-800",
          btn: "bg-rose-600 hover:bg-rose-700",
        }
      : tone === "success"
      ? {
          box: "border-emerald-200 bg-emerald-50",
          title: "text-emerald-900",
          text: "text-emerald-800",
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
      <button type="button" aria-label="Close dialog" onClick={onClose} className="absolute inset-0 bg-black/55" />
      <div className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl ring-1 ring-white/40 ${toneStyles.box}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${toneStyles.title}`}>{title}</p>
            <p className={`mt-2 text-sm ${toneStyles.text}`}>{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${toneStyles.btn}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

/** Minimal inline icon set (no deps) */
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
    | "chev"
    | "spark";
  className?: string;
}) {
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
          <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="m5 8 7 5 7-5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
        </svg>
      );
    case "sessions":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M7 3v3M17 3v3M4.5 9h15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
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
          <path d="M7 4h10a2 2 0 0 1 2 2v14H5V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" />
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
          <path d="M7 3h7l3 3v15a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" />
          <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M8 12h8M8 16h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" stroke="currentColor" strokeWidth="1.7" />
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
          <path d="M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z" stroke="currentColor" strokeWidth="1.7" />
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
    case "spark":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 14l4-4 4 5 4-9 4 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

function toneAccent(tone: KPI["tone"]) {
  // Just Tailwind classes—gives that “designed” feel.
  switch (tone) {
    case "emerald":
      return { bar: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "indigo":
      return { bar: "bg-indigo-500", chip: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    case "amber":
      return { bar: "bg-amber-500", chip: "bg-amber-50 text-amber-800 border-amber-200" };
    default:
      return { bar: "bg-slate-900", chip: "bg-slate-50 text-slate-700 border-slate-200" };
  }
}

function StatCard({ item }: { item: KPI }) {
  const a = toneAccent(item.tone);
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200/50 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className={`absolute left-0 top-0 h-full w-1.5 ${a.bar}`} />
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>

        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="text-2xl font-semibold text-slate-900">{item.value}</p>

          {item.delta ? (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${a.chip}`}>
              <Icon name="spark" className="h-4 w-4" />
              {item.delta}
            </span>
          ) : null}
        </div>

        {item.hint ? <p className="mt-2 text-xs text-slate-500">{item.hint}</p> : null}
      </div>

      {/* subtle “shine” */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-40 w-40 rounded-full bg-slate-100 blur-2xl opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
      {children}
    </span>
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
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm ring-1 ring-slate-200/40 transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{desc}</p>
          {meta ? (
            <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {meta}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 mt-1 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition group-hover:bg-slate-100">
          <Icon name="chev" className="h-4 w-4" />
        </span>
      </div>

      {/* gradient accent */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-400 opacity-0 transition group-hover:opacity-100" />
    </Link>
  );
}

function MiniSignal({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
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
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <Icon name={icon} className="h-5 w-5" />
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

function BrandMark() {
  // A lightweight “hero visual” so the page doesn't feel empty.
  return (
    <svg viewBox="0 0 420 180" className="h-28 w-full" fill="none">
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#0f172a" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="g2" x1="1" x2="0" y1="0" y2="1">
          <stop stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#f8fafc" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="420" height="180" rx="22" fill="url(#g2)" />
      <circle cx="70" cy="60" r="44" fill="url(#g1)" opacity="0.95" />
      <circle cx="132" cy="120" r="34" fill="url(#g1)" opacity="0.35" />
      <circle cx="360" cy="40" r="52" fill="url(#g1)" opacity="0.12" />

      <path
        d="M36 62l20-20 18 22 20-44 24 34"
        stroke="#0f172a"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      <path
        d="M205 62h165"
        stroke="#0f172a"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.18"
      />
      <path
        d="M205 92h140"
        stroke="#0f172a"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.14"
      />
      <path
        d="M205 122h110"
        stroke="#0f172a"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.10"
      />
    </svg>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  // ===== Auth + session rules =====
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

        if (!cancelled) setTermLabel("Term 1"); // placeholder until terms table is wired
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

  const kpis: KPI[] = [
    { label: "Active teachers", value: "—", hint: "staffed this term", delta: "Ready", tone: "indigo" },
    { label: "Students enrolled", value: "—", hint: "active cohort", delta: "Next", tone: "emerald" },
    { label: "Parents linked", value: "—", hint: "accounts connected", delta: "Track", tone: "amber" },
    { label: "Sessions logged", value: "—", hint: "this term", delta: "Build", tone: "slate" },
  ];

  const quickActions = useMemo(
    () => [
      { title: "Invite users", desc: "Role-based links with expiry.", href: "/app/admin/invites", icon: "invites" as const },
      { title: "Create session", desc: "Plan objectives + evidence.", href: "/app/admin/sessions/new", icon: "sessions" as const },
      { title: "Take attendance", desc: "Fast check-in for today.", href: "/app/admin/attendance", icon: "attendance" as const },
      { title: "Enrollment inbox", desc: "Approve new joins.", href: "/app/admin/enrollment/inbox", icon: "people" as const },
    ],
    []
  );

  const tasksFeed = useMemo(
    () => [
      { title: "Create / switch term", desc: "Define dates, goals, cohorts.", href: "/app/admin/terms", meta: "Terms 1–3" },
      { title: "Invite teachers", desc: "Secure links for mentors/coaches.", href: "/app/admin/invites?role=teacher", meta: "Expiry + audit trail" },
      { title: "Enroll students & link parents", desc: "Approve joins and connect accounts.", href: "/app/admin/enrollment/inbox", meta: "Clean onboarding workflow" },
      { title: "Export impact report", desc: "Parent/funder-ready summaries.", href: "/app/admin/reports", meta: "PDF / CSV exports" },
    ],
    []
  );

  const spotlight = useMemo(
    () => [
      { title: "Consistency", desc: "Standardise delivery across terms.", href: "/app/admin/terms", pills: ["Cohorts", "Templates", "Term goals"] },
      { title: "Evidence", desc: "Turn activity into visible proof.", href: "/app/admin/evidence", pills: ["Notes", "Photos", "Portfolio"] },
      { title: "Governance", desc: "Secure roles + club isolation.", href: "/app/admin/invites", pills: ["Expiry", "Audit log", "Permissions"] },
    ],
    []
  );

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="h-10 w-56 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[300px_1fr_360px]">
            <div className="h-[520px] rounded-3xl bg-white border border-slate-200 animate-pulse" />
            <div className="h-[520px] rounded-3xl bg-white border border-slate-200 animate-pulse" />
            <div className="h-[520px] rounded-3xl bg-white border border-slate-200 animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-slate-900">
      <AppModal open={modalOpen} tone={modalTone} title={modalTitle} message={modalMsg} onClose={() => setModalOpen(false)} />

      {/* Background aesthetic */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35] [background-image:radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="pointer-events-none fixed -left-40 top-16 -z-10 h-[520px] w-[520px] rounded-full bg-slate-200/50 blur-3xl" />
      <div className="pointer-events-none fixed -right-48 top-24 -z-10 h-[520px] w-[520px] rounded-full bg-slate-200/40 blur-3xl" />

      {/* Top app bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
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

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
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
              className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition"
              title="Notifications"
              onClick={() => openModal("info", "Notifications", "Notifications panel is coming next.")}
            >
              <Icon name="bell" className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => forceLogout("manual")}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 transition"
              title="Logout"
            >
              <Icon name="logout" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr_360px]">
          {/* Left rail */}
          <aside className="hidden lg:block">
            <div className="rounded-3xl border border-slate-200 bg-white/80 backdrop-blur p-4 shadow-sm ring-1 ring-slate-200/50">
              <p className="px-2 text-xs font-semibold tracking-widest text-slate-500">NAVIGATION</p>

              <nav className="mt-3 space-y-1">
                {nav.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                        active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`${active ? "text-white" : "text-slate-700 group-hover:text-slate-900"}`}>
                        <Icon name={item.icon} className="h-5 w-5" />
                      </span>
                      <span className="truncate">{item.label}</span>
                      {active ? <span className="ml-auto h-2 w-2 rounded-full bg-white/90" /> : null}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Security</p>
                <p className="mt-1 text-sm text-slate-700">
                  Auto sign-out after <span className="font-semibold">{Math.round(IDLE_TIMEOUT_MS / 60000)} mins</span> inactivity.
                </p>
              </div>
            </div>
          </aside>

          {/* Center column */}
          <div className="space-y-6">
            {/* Hero card (adds “visual” immediately) */}
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-slate-200/60">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-widest text-slate-500">ADMIN COMMAND CENTRE</p>
                  <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                    Run your club like a product.
                  </h1>
                  <p className="mt-2 text-sm text-slate-600 max-w-xl">
                    A clean operational view for STEM clubs: roles, sessions, attendance, and evidence—ready for parents, schools, and funders.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Pill>Role-based access</Pill>
                    <Pill>Evidence capture</Pill>
                    <Pill>Exportable impact</Pill>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {quickActions.map((a) => (
                      <Link
                        key={a.title}
                        href={a.href}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50 transition"
                      >
                        <Icon name={a.icon} className="h-4 w-4" />
                        <span className="whitespace-nowrap">{a.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="w-full md:w-[360px]">
                  <BrandMark />
                </div>
              </div>

              <div className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-slate-200/60 blur-3xl" />
            </div>

            {/* KPI row */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpis.map((k) => (
                <StatCard key={k.label} item={k} />
              ))}
            </div>

            {/* Feed / tasks */}
            <div className="rounded-[28px] border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-slate-200/60">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Recommended next steps</h2>
                  <p className="mt-1 text-sm text-slate-600">Terms → People → Sessions → Attendance → Insights.</p>
                </div>
                <Link href="/app/admin/overview" className="text-sm font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-700">
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
              {spotlight.map((m) => (
                <div
                  key={m.title}
                  className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{m.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{m.desc}</p>
                    </div>
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
                      <Icon name="spark" className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {m.pills.map((p) => (
                      <Pill key={p}>{p}</Pill>
                    ))}
                  </div>

                  <Link
                    href={m.href}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900 underline underline-offset-4 hover:text-slate-700"
                  >
                    Open <Icon name="chev" className="h-4 w-4" />
                  </Link>

                  <div className="pointer-events-none absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-slate-200/70 blur-3xl opacity-0 transition group-hover:opacity-100" />
                </div>
              ))}
            </div>
          </div>

          {/* Right rail */}
          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-slate-200/60">
              <p className="text-xs font-semibold tracking-widest text-slate-500">CLUB STATUS</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{clubName}</p>
              <p className="mt-1 text-sm text-slate-600">
                Keep delivery consistent and evidence-ready across the term.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href="/app/admin/terms" className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm hover:bg-slate-50 transition">
                  <p className="text-xs font-semibold text-slate-900">Terms</p>
                  <p className="mt-1 text-xs text-slate-600">Dates & cohorts</p>
                </Link>
                <Link href="/app/admin/clubs" className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm hover:bg-slate-50 transition">
                  <p className="text-xs font-semibold text-slate-900">Club</p>
                  <p className="mt-1 text-xs text-slate-600">Profile & code</p>
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-slate-200/60">
              <p className="text-xs font-semibold tracking-widest text-slate-500">COHORT HEALTH</p>
              <p className="mt-2 text-sm text-slate-600">High-level signals (no deep logs required).</p>

              <div className="mt-4 space-y-2">
                <MiniSignal label="Attendance trend" value="—" hint="last 4 sessions" />
                <MiniSignal label="Evidence captured" value="—" hint="photos/notes" />
                <MiniSignal label="Sessions staffed" value="—" hint="planned vs delivered" />
                <MiniSignal label="Learners at risk" value="—" hint="missed 2+ sessions" />
              </div>

              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold tracking-widest text-slate-500">INSIGHT → DECISION</p>
                <p className="mt-2 text-sm text-slate-700">
                  Adjust staffing, difficulty, or schedule—then export a term report for funders.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white/80 backdrop-blur p-6 shadow-sm ring-1 ring-slate-200/60">
              <p className="text-xs font-semibold tracking-widest text-slate-500">SHORTCUTS</p>
              <div className="mt-3 grid gap-2">
                <Shortcut href="/app/admin/people/students" icon="people" title="Students" desc="Manage learners" />
                <Shortcut href="/app/admin/people/teachers" icon="people" title="Teachers" desc="Mentors & coaches" />
                <Shortcut href="/app/admin/invites" icon="invites" title="Invites" desc="Secure role links" />
                <Shortcut href="/app/admin/reports" icon="reports" title="Reports" desc="Export impact" />
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
