"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

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
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [checking, setChecking] = useState(true);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function guard() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data.session;

        if (!session?.user) {
          router.replace("/get-started");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role,is_active")
          .eq("id", session.user.id)
          .single();

        if (!profile || profile.is_active === false) {
          await supabase.auth.signOut();
          router.replace("/get-started");
          return;
        }

        if (profile.role !== "club_admin") {
          router.replace(routeForRole(profile.role as UserRole));
          return;
        }

        if (!cancelled) setAdminUserId(session.user.id);
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

  return { checking, adminUserId, supabase };
}
