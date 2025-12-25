// web/src/app/app/admin/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type KPI = { label: string; value: string; hint?: string };
type Action = { title: string; desc: string; href: string; meta?: string };
type Module = { title: string; desc: string; pills: string[]; href: string; cta: string };

type UserRole = "club_admin" | "teacher" | "student" | "parent";
type ModalTone = "error" | "success" | "info";

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
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-slate-900/40"
      />
      <div className={`relative w-full max-w-md rounded-3xl border p-6 shadow-xl ring-1 ring-slate-200/60 ${toneStyles.box}`}>
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

/**
 * ✅ RULES IMPLEMENTED
 * 1) Page opens only if an active Supabase session exists AND profiles.role === "club_admin" AND is_active = true.
 * 2) Idle timeout: if no activity for IDLE_TIMEOUT_MS → auto sign out + redirect to /get-started.
 * 3) Logout button present.
 * 4) Sidebar nav to all admin modules (routes under /app/admin/*).
 */
export default function AdminPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  // ====== Config ======
  const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes (change if you want)

  // ====== UI State ======
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [clubName, setClubName] = useState<string>("Your Club");
  const [termLabel, setTermLabel] = useState<string>("Current term");

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

  // ====== Auth Guard ======
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

        // Load profile
        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role, is_active, club_id, full_name")
          .eq("id", userId)
          .single();

        if (profileErr) throw profileErr;

        if (!profile || profile.is_active === false) {
          await supabase.auth.signOut();
          router.replace("/get-started");
          return;
        }

        if (profile.role !== "club_admin") {
          // If a non-admin hits admin route, send them to their correct dashboard
          router.replace(routeForRole(profile.role as UserRole));
          return;
        }

        // Optional: fetch club name + current term label (safe try)
        if (profile.club_id) {
          const { data: club } = await supabase
            .from("clubs")
            .select("name")
            .eq("id", profile.club_id)
            .single();

          if (!cancelled && club?.name) setClubName(club.name);

          // If you later create a "terms" table, load the active term here.
          // For now: keep as placeholder.
        }

        if (!cancelled) setCheckingAuth(false);
      } catch (e: any) {
        if (!cancelled) {
          // fail-safe: route away
          router.replace("/get-started");
        }
      } finally {
        if (!cancelled) setCheckingAuth(false);
      }
    }

    guard();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  // ====== Idle Timeout Auto-Logout ======
  const idleTimerRef = useRef<number | null>(null);

  async function forceLogout(reason?: "idle" | "manual") {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      if (reason === "idle") {
        // show once (optional)
        openModal("info", "Session ended", "You were signed out due to inactivity. Please sign in again.");
      }
      router.replace("/get-started");
    }
  }

  function resetIdleTimer() {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      forceLogout("idle");
    }, IDLE_TIMEOUT_MS);
  }

  useEffect(() => {
    if (checkingAuth) return;

    // Start timer
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

  // ====== Nav Map (your requested routes) ======
  const nav = useMemo(
    () => [
      { section: "Overview", items: [{ label: "Admin overview", href: "/app/admin/overview" }] },

      {
        section: "Structure",
        items: [
          { label: "Clubs", href: "/app/admin/clubs" },
          { label: "Terms", href: "/app/admin/terms" },
        ],
      },

      {
        section: "People",
        items: [
          { label: "Students", href: "/app/admin/people/students" },
          { label: "Parents", href: "/app/admin/people/parents" },
          { label: "Teachers", href: "/app/admin/people/teachers" },
        ],
      },

      {
        section: "Enrollment",
        items: [{ label: "Enrollment inbox", href: "/app/admin/enrollment/inbox" }],
      },

      {
        section: "Access",
        items: [{ label: "Invites", href: "/app/admin/invites" }],
      },

      {
        section: "Delivery",
        items: [
          { label: "Sessions", href: "/app/admin/sessions" },
          { label: "Attendance", href: "/app/admin/attendance" },
        ],
      },

      {
        section: "Learning",
        items: [
          { label: "Progress", href: "/app/admin/progress" },
          { label: "Evidence", href: "/app/admin/evidence" },
        ],
      },

      {
        section: "Insights",
        items: [
          { label: "Insights", href: "/app/admin/insights" },
          { label: "Reports", href: "/app/admin/reports" },
        ],
      },

      {
        section: "Settings",
        items: [{ label: "Admin settings", href: "/app/admin/settings" }],
      },
    ],
    []
  );

  // ====== Dashboard content (your provided structure) ======
  const kpis: KPI[] = [
    { label: "Active teachers", value: "—", hint: "staffed this term" },
    { label: "Students enrolled", value: "—", hint: "active cohort" },
    { label: "Parents linked", value: "—", hint: "accounts connected" },
    { label: "Sessions logged", value: "—", hint: "this term" },
  ];

  const setupActions: Action[] = [
    {
      title: "Create / switch term",
      desc: "Define Term 1–3 dates, goals, and cohort structure.",
      href: "/app/admin/terms",
      meta: "Terms 1, 2, 3",
    },
    {
      title: "Invite teachers",
      desc: "Send secure role-based invite links for coaches.",
      href: "/app/admin/invites?role=teacher",
      meta: "Role-based access",
    },
    {
      title: "Enroll students & link parents",
      desc: "Approve enrollment forms and connect parent accounts.",
      href: "/app/admin/enrollment/inbox",
      meta: "Enrollment inbox",
    },
    {
      title: "Create your first session",
      desc: "Plan Robotics/Coding sessions with objectives and templates.",
      href: "/app/admin/sessions/new",
      meta: "Robotics • Coding",
    },
    {
      title: "Take attendance today",
      desc: "Quick-mark attendance and flag learners at risk.",
      href: "/app/admin/attendance",
      meta: "Fast check-in",
    },
    {
      title: "Export impact report",
      desc: "Generate funder/parent-ready term summaries.",
      href: "/app/admin/reports",
      meta: "PDF / CSV",
    },
  ];

  const modules: Module[] = [
    {
      title: "Clubs & terms",
      desc: "Set up your club centre, cohorts, and term structure for consistent delivery.",
      pills: ["Club profile", "Terms 1–3", "Cohorts"],
      href: "/app/admin/terms",
      cta: "Manage terms →",
    },
    {
      title: "Invites & access",
      desc: "Secure links for students, parents, and teachers with expiry and audit trail.",
      pills: ["Invite links", "Expiry control", "Audit log"],
      href: "/app/admin/invites",
      cta: "Manage invites →",
    },
    {
      title: "Enrollment inbox",
      desc: "Review enrollment forms, approve access, and keep records clean.",
      pills: ["Pending approvals", "Role assignment", "History"],
      href: "/app/admin/enrollment/inbox",
      cta: "Open inbox →",
    },
    {
      title: "Sessions",
      desc: "Plan and run sessions with objectives and evidence capture.",
      pills: ["Planner", "Templates", "Evidence"],
      href: "/app/admin/sessions",
      cta: "View sessions →",
    },
    {
      title: "Attendance",
      desc: "Mark attendance fast, track trends, and identify learners at risk early.",
      pills: ["Today view", "Trends", "At-risk flags"],
      href: "/app/admin/attendance",
      cta: "Open attendance →",
    },
    {
      title: "Insights & reports",
      desc: "Turn activity into insights for parents, schools, and funders.",
      pills: ["Engagement", "Learning growth", "Exports"],
      href: "/app/admin/insights",
      cta: "View insights →",
    },
  ];

  // ====== Loading guard UI ======
  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Loading admin dashboard…</h1>
              <p className="mt-1 text-sm text-slate-600">Checking your session and permissions.</p>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">Preparing your workspace…</div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <AppModal open={modalOpen} tone={modalTone} title={modalTitle} message={modalMsg} onClose={() => setModalOpen(false)} />

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Admin • {clubName} • {termLabel}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">Club Command Centre</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage access, run sessions, and turn activity into evidence and impact reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/app/admin/invites"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Invite users
            </Link>

            <Link
              href="/app/admin/sessions/new"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition cursor-pointer"
            >
              Create session
            </Link>

            <button
              type="button"
              onClick={() => forceLogout("manual")}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
              title="Sign out"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Layout: Sidebar + Content */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-widest text-slate-500">ADMIN NAVIGATION</p>

            <div className="mt-4 space-y-5">
              {nav.map((group) => (
                <div key={group.section}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.section}</p>
                  <div className="mt-2 space-y-1">
                    {group.items.map((item) => {
                      const active = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block rounded-xl px-3 py-2 text-sm transition cursor-pointer ${
                            active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Security</p>
              <p className="mt-1 text-sm text-slate-700">
                This admin area auto-logs out after <span className="font-semibold">{Math.round(IDLE_TIMEOUT_MS / 60000)} minutes</span>{" "}
                of inactivity.
              </p>
            </div>
          </aside>

          {/* Main content */}
          <div>
            {/* KPI row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpis.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                  <div className="mt-2 flex items-baseline justify-between gap-3">
                    <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
                    {item.hint ? <p className="text-xs text-slate-500">{item.hint}</p> : null}
                  </div>
                </div>
              ))}
            </div>

            {/* Main grid: Next actions + Cohort health */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-base font-semibold">Next actions</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Follow the recommended flow: Terms → People → Sessions → Attendance → Insights.
                    </p>
                  </div>
                  <Link
                    href="/app/admin/overview"
                    className="text-sm font-medium text-slate-900 underline underline-offset-4 hover:text-slate-700 cursor-pointer"
                  >
                    View full admin map →
                  </Link>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {setupActions.map((a) => (
                    <Link
                      key={a.title}
                      href={a.href}
                      className="group rounded-2xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{a.desc}</p>
                          {a.meta ? (
                            <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {a.meta}
                            </p>
                          ) : null}
                        </div>
                        <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 group-hover:bg-slate-100 transition">
                          →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-semibold">Cohort health</h2>
                <p className="mt-2 text-sm text-slate-600">
                  High-level signals to spot gaps early (without digging into every session).
                </p>

                <div className="mt-4 space-y-3">
                  <SignalRow label="Attendance trend" value="—" hint="last 4 sessions" />
                  <SignalRow label="Evidence captured" value="—" hint="photos/notes" />
                  <SignalRow label="Sessions staffed" value="—" hint="planned vs delivered" />
                  <SignalRow label="Learners at risk" value="—" hint="missed 2+ sessions" />
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Insight → Decision</p>
                  <p className="mt-1 text-sm text-slate-700">
                    Use insights to adjust staffing, difficulty, timing, or parent engagement—then export a term report.
                  </p>
                </div>
              </div>
            </div>

            {/* Modules grid */}
            <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {modules.map((m) => (
                <div key={m.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-base font-semibold capitalize">{m.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{m.desc}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {m.pills.map((p) => (
                      <span
                        key={p}
                        className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  <Link
                    href={m.href}
                    className="mt-5 inline-flex text-sm font-medium text-slate-900 underline underline-offset-4 hover:text-slate-700 cursor-pointer"
                  >
                    {m.cta}
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-600">
                Admin visibility is role-based. Teachers manage sessions and notes; students track progress; parents view summaries.
                Access is controlled through secure invite links and permissions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SignalRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      </div>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
