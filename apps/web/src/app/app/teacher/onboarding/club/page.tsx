// web/src/app/app/teacher/onboarding/club/page.tsx

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import OnboardingShell from "../_ui/OnboardingShell";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { nextStep, TEACHER_ONBOARDING } from "@/lib/teacher/onboarding";

type ClubRow = { id: string; name: string; deleted_at: string | null };
type ClubTeacherRow = { club_id: string; status: string; clubs: ClubRow | null };

export default function ClubPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [clubs, setClubs] = useState<ClubTeacherRow[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>("");

  const activeClubs = useMemo(
    () =>
      clubs
        .filter((x) => x.status === "active" && x.clubs && x.clubs.deleted_at === null)
        .map((x) => x.clubs!)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [clubs]
  );

  useEffect(() => {
    const supabase = supabaseBrowser();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        router.replace("/login");
        return;
      }

      // current selection (if any)
      const { data: profile } = await supabase
        .from("teacher_profiles")
        .select("club_id")
        .eq("id", auth.user.id)
        .maybeSingle<{ club_id: string | null }>();

      if (profile?.club_id) setSelectedClubId(profile.club_id);

      // authorised clubs for this teacher (membership table)
      const { data: rows, error } = await supabase
        .from("club_teachers")
        .select("club_id, status, clubs:clubs(id, name, deleted_at)")
        .eq("teacher_id", auth.user.id);

      if (error) {
        console.error(error);
        setClubs([]);
      } else {
        setClubs((rows ?? []) as unknown as ClubTeacherRow[]);
      }

      setLoading(false);
    })();
  }, [router]);

  async function continueNext() {
    if (!selectedClubId) return;

    setSaving(true);
    const supabase = supabaseBrowser();

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      router.replace("/login");
      return;
    }

    // This update is now protected by RLS: club_id must be an authorised membership
    const { error } = await supabase
      .from("teacher_profiles")
      .update({
        club_id: selectedClubId,
        onboarding_step: nextStep(TEACHER_ONBOARDING.club),
      })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      setSaving(false);
      return;
    }

    router.replace("/app/teacher/onboarding/preferences");
    setSaving(false);
  }

  return (
    <OnboardingShell
      title="Connect to a club"
      subtitle="Select an authorised club workspace. Your sessions and evidence will be written under this club."
      stepLabel="Step 3 of 5"
    >
      <div className="grid gap-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="text-sm font-semibold text-slate-900">Authorised clubs</div>
          <div className="mt-1 text-sm text-slate-700">
            You can only see clubs you’ve been added to as a teacher. (No manual IDs.)
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-slate-700">Loading clubs...</div>
        ) : activeClubs.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="text-sm font-semibold text-amber-950">No club assigned yet</div>
            <div className="mt-1 text-sm text-amber-900">
              Ask the club owner to add you as a teacher (creates a membership row in <code>club_teachers</code>).
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            {activeClubs.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedClubId(c.id)}
                className={[
                  "text-left rounded-2xl border p-4 transition",
                  selectedClubId === c.id
                    ? "border-slate-900 bg-white"
                    : "border-slate-200 bg-white/70 hover:bg-white",
                ].join(" ")}
              >
                <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                <div className="mt-1 text-xs text-slate-600">Club ID: {c.id}</div>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={continueNext}
          disabled={saving || !selectedClubId || activeClubs.length === 0}
          className="h-11 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </OnboardingShell>
  );
}
