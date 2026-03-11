// web/src/app/app/teacher/onboarding/profile/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "../_ui/OnboardingShell";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { nextStep, TEACHER_ONBOARDING } from "@/lib/teacher/onboarding";

export default function ProfilePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [roleTitle, setRoleTitle] = useState("STEM Instructor");
  const [experienceLevel, setExperienceLevel] = useState("Intermediate");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const supabase = supabaseBrowser();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        router.replace("/login");
        return;
      }

      const { data } = await supabase
        .from("teacher_profiles")
        .select("full_name, phone, role_title, experience_level, bio")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setRoleTitle(data.role_title ?? "STEM Instructor");
        setExperienceLevel(data.experience_level ?? "Intermediate");
        setBio(data.bio ?? "");
      }
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
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        role_title: roleTitle.trim() || null,
        experience_level: experienceLevel.trim() || null,
        bio: bio.trim() || null,
        onboarding_step: nextStep(TEACHER_ONBOARDING.profile),
      })
      .eq("id", user.id);

    router.replace("/app/teacher/onboarding/club");
    setSaving(false);
  }

  return (
    <OnboardingShell
      title="Professional profile"
      subtitle="This becomes your identity inside the club dashboard and parent-facing evidence reports."
      stepLabel="Step 2 of 5"
    >
      <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-xs font-semibold tracking-widest text-slate-500">FULL NAME</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="Full name"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold tracking-widest text-slate-500">PHONE (OPTIONAL)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="+44..."
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold tracking-widest text-slate-500">ROLE TITLE</label>
            <input
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-slate-200"
              placeholder="STEM Instructor"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-semibold tracking-widest text-slate-500">EXPERIENCE LEVEL</label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-xs font-semibold tracking-widest text-slate-500">BIO (OPTIONAL)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="min-h-[110px] rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            placeholder="Short professional bio..."
          />
        </div>

        <button
          onClick={continueNext}
          disabled={saving || !fullName.trim()}
          className="h-11 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </OnboardingShell>
  );
}
