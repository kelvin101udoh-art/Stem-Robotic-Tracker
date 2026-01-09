// web/src/lib/admin/admin-guard.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

export function useAdminGuard(opts?: { idleMinutes?: number }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const idleMinutes = opts?.idleMinutes ?? 15;
  const IDLE_TIMEOUT_MS = idleMinutes * 60 * 1000;
  const idleTimerRef = useRef<number | null>(null);

  const [checking, setChecking] = useState(true);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  async function logoutAndGoLogin(reason?: "idle" | "manual") {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      const url = reason === "idle" ? "/get-started?reason=idle" : "/get-started";
      router.replace(url);
    }
  }

  function resetIdleTimer() {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => logoutAndGoLogin("idle"), IDLE_TIMEOUT_MS);
  }

  useEffect(() => {
    let cancelled = false;

    async function guard() {
      setChecking(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;

        if (!session?.user?.id) {
          router.replace("/get-started");
          return;
        }

        const userId = session.user.id;

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role, is_active")
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

        if (!cancelled) setAdminUserId(userId);
      } catch {
        router.replace("/get-started");
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    guard();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  useEffect(() => {
    if (checking) return;

    resetIdleTimer();
    const events: Array<keyof WindowEventMap> = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    const onActivity = () => resetIdleTimer();
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking]);

  return {
    checking,
    adminUserId,
    logout: (reason?: "idle" | "manual") => logoutAndGoLogin(reason),
    resetIdleTimer,
    supabase,
  };
}
