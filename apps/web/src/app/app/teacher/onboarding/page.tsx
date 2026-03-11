// web/src/app/app/teacher/onboarding/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { stepToPath } from "@/lib/teacher/onboarding";

type TeacherProfile = {
  id: string;
  full_name: string;
  onboarding_step: number;
  onboarding_completed_at: string | null;
};

export default function TeacherOnboardingRouter() {
  const router = useRouter();
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const supabase = supabaseBrowser();

    async function run() {
      setBusy(true);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      // Load profile
      const { data: profile, error } = await supabase
        .from("teacher_profiles")
        .select("id, full_name, onboarding_step, onboarding_completed_at")
        .eq("id", user.id)
        .maybeSingle<TeacherProfile>();

      // If missing, create a row (RLS allows insert own)
      if (!profile && !error) {
        await supabase.from("teacher_profiles").insert({
          id: user.id,
          full_name: user.user_metadata?.full_name ?? "",
          onboarding_step: 0,
        });

        router.replace("/app/teacher/onboarding/welcome");
        return;
      }

      if (profile?.onboarding_completed_at) {
        router.replace("/app/teacher/onboarding/done");
        return;
      }

      router.replace(stepToPath(profile?.onboarding_step ?? 0));
    }

    run().finally(() => setBusy(false));
  }, [router]);

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="rounded-2xl border border-slate-200 bg-white/70 px-6 py-5 text-sm text-slate-700 shadow-[0_18px_56px_-48px_rgba(2,6,23,0.55)]">
        {busy ? "Preparing teacher onboarding..." : "Redirecting..."}
      </div>
    </div>
  );
}
