// web/src/app/app/teacher/onboarding/welcome/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import OnboardingShell from "../_ui/OnboardingShell";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { nextStep, TEACHER_ONBOARDING } from "@/lib/teacher/onboarding";

export default function WelcomePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const supabase = supabaseBrowser();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) router.replace("/login");
      setFullName(auth.user?.user_metadata?.full_name ?? "");
    })();
  }, [router]);

  async function continueNext() {
    setSaving(true);
    const supabase = supabaseBrowser();

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      router.replace("/login");
      return;
    }

    await supabase
      .from("teacher_profiles")
      .upsert(
        { id: user.id, full_name: fullName || "", onboarding_step: nextStep(TEACHER_ONBOARDING.welcome) },
        { onConflict: "id" }
      );

    router.replace("/app/teacher/onboarding/profile");
    setSaving(false);
  }

  return (
    <OnboardingShell
      title="Welcome, Teacher"
      subtitle="Set up your professional profile so sessions can generate clean analytics and evidence proof."
      stepLabel="Step 1 of 5"
    >
      <div className="grid gap-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="text-sm font-semibold text-slate-900">What you’re unlocking</div>
          <div className="mt-1 text-sm text-slate-700">
            Execution tracking (checklists), evidence proof (photos/notes), and auto executive insight.
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold tracking-widest text-slate-500">DISPLAY NAME</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="e.g. Kelvin Udoh"
          />
          <div className="text-xs text-slate-600">
            You can change this later. It’s used in parent-facing reports.
          </div>
        </div>

        <button
          onClick={continueNext}
          disabled={saving}
          className="h-11 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </OnboardingShell>
  );
}
