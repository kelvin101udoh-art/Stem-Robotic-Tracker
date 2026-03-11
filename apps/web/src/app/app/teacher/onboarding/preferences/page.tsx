// web/src/app/app/teacher/onboarding/preferences/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "../_ui/OnboardingShell";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { nextStep, TEACHER_ONBOARDING } from "@/lib/teacher/onboarding";

type PrefRow = {
  proof_reminders: boolean;
  checklist_defaults: boolean;
  ai_summaries: boolean;
};

export default function PreferencesPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [clubId, setClubId] = useState<string>("");

  const [proofReminders, setProofReminders] = useState(true);
  const [checklistDefaults, setChecklistDefaults] = useState(true);
  const [aiSummaries, setAiSummaries] = useState(true);

  useEffect(() => {
    const supabase = supabaseBrowser();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        router.replace("/login");
        return;
      }

      // Must have club selected first
      const { data: profile } = await supabase
        .from("teacher_profiles")
        .select("club_id")
        .eq("id", user.id)
        .maybeSingle<{ club_id: string | null }>();

      if (!profile?.club_id) {
        router.replace("/app/teacher/onboarding/club");
        return;
      }

      setClubId(profile.club_id);

      // Load existing preferences (if any)
      const { data: prefs } = await supabase
        .from("teacher_preferences")
        .select("proof_reminders, checklist_defaults, ai_summaries")
        .eq("teacher_id", user.id)
        .eq("club_id", profile.club_id)
        .maybeSingle<PrefRow>();

      if (prefs) {
        setProofReminders(!!prefs.proof_reminders);
        setChecklistDefaults(!!prefs.checklist_defaults);
        setAiSummaries(!!prefs.ai_summaries);
      }

      setLoading(false);
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

    if (!clubId) {
      router.replace("/app/teacher/onboarding/club");
      return;
    }

    // Upsert preferences (RLS enforces: must be teacher + active membership in club_teachers)
    const { error: prefErr } = await supabase.from("teacher_preferences").upsert(
      {
        teacher_id: user.id,
        club_id: clubId,
        proof_reminders: proofReminders,
        checklist_defaults: checklistDefaults,
        ai_summaries: aiSummaries,
      },
      { onConflict: "teacher_id,club_id" }
    );

    if (prefErr) {
      console.error(prefErr);
      setSaving(false);
      return;
    }

    const { error: stepErr } = await supabase
      .from("teacher_profiles")
      .update({
        onboarding_step: nextStep(TEACHER_ONBOARDING.preferences),
      })
      .eq("id", user.id);

    if (stepErr) {
      console.error(stepErr);
      setSaving(false);
      return;
    }

    router.replace("/app/teacher/onboarding/done");
    setSaving(false);
  }

  return (
    <OnboardingShell
      title="Preferences"
      subtitle="These defaults are stored per club and shape live delivery UX and analytics capture."
      stepLabel="Step 4 of 5"
    >
      {loading ? (
        <div className="text-sm text-slate-700">Loading preferences...</div>
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-3">
            <ToggleRow
              title="Proof reminders"
              desc="Prompts to capture photo + note during sessions (improves evidence quality)."
              value={proofReminders}
              onChange={setProofReminders}
            />
            <ToggleRow
              title="Checklist defaults"
              desc="Preloads outcomes per session to standardise execution tracking."
              value={checklistDefaults}
              onChange={setChecklistDefaults}
            />
            <ToggleRow
              title="AI summaries"
              desc="Generates insights from outcomes + proof signals."
              value={aiSummaries}
              onChange={setAiSummaries}
            />
          </div>

          <button
            onClick={continueNext}
            disabled={saving}
            className="h-11 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Finish onboarding"}
          </button>
        </div>
      )}
    </OnboardingShell>
  );
}

function ToggleRow(props: {
  title: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900">{props.title}</div>
        <div className="mt-1 text-sm text-slate-700">{props.desc}</div>
      </div>

      <button
        type="button"
        onClick={() => props.onChange(!props.value)}
        className={[
          "shrink-0 h-9 w-14 rounded-full border transition",
          props.value ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200",
        ].join(" ")}
        aria-pressed={props.value}
      >
        <span
          className={[
            "block h-7 w-7 rounded-full transition translate-y-[3px]",
            props.value ? "bg-white translate-x-[22px]" : "bg-slate-900 translate-x-[4px]",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
