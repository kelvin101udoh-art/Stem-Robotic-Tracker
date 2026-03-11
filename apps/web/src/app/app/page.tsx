// app/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AppRouterPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function routeUser() {
      // 1️⃣ Get authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/login");
        return;
      }

      // 2️⃣ Load profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        console.error("Profile load error:", error);
        router.replace("/login");
        return;
      }

      // 3️⃣ SMART ROLE REDIRECT (this is your snippet)
      switch (profile.role) {
        case "club_admin":
          router.replace("/app/admin");
          break;
        case "teacher":
          router.replace("/app/teacher");
          break;
        case "student":
          router.replace("/app/student");
          break;
        case "parent":
          router.replace("/app/parent");
          break;
        default:
          router.replace("/login");
      }
    }

    routeUser();
  }, [router, supabase]);

  // Optional: loading state
  return (
    <main className="min-h-screen flex items-center justify-center text-slate-600">
      Redirecting…
    </main>
  );
}
