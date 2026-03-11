"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type InviteRole = "teacher" | "student" | "parent";
type UserRole = "club_admin" | "teacher" | "student" | "parent";

type ProfileRow = {
  id: string;
  club_id: string;
  role: UserRole;
  full_name: string | null;
};

type InviteRow = {
  id: string;
  club_id: string;
  role: InviteRole;
  email: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  created_by: string;
};

function randomToken(len = 32) {
  // URL-safe token
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function addDaysISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function AdminInvitesPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [clubCode, setClubCode] = useState<string>("");

  const [invites, setInvites] = useState<InviteRow[]>([]);

  const [role, setRole] = useState<InviteRole>("teacher");
  const [email, setEmail] = useState("");
  const [days, setDays] = useState(7);

  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  function resetAlerts() {
    setMsg("");
    setError("");
  }

  function buildInviteLink(token: string) {
    // Uses current origin (safe for Vercel)
    if (typeof window === "undefined") return `/accept-invite?token=${token}`;
    return `${window.location.origin}/accept-invite?token=${token}`;
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setMsg("Invite link copied.");
    } catch {
      setError("Could not copy. Please copy manually.");
    }
  }

  async function load() {
    resetAlerts();
    setLoading(true);

    try {
      // 1) Must be signed in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/get-started");
        return;
      }

      // 2) Load admin profile (RLS should allow admin to read own profile)
      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("id, club_id, role, full_name")
        .eq("id", user.id)
        .single();

      if (profErr) throw profErr;

      if (!prof?.club_id) throw new Error("No club assigned. Please contact support.");
      if (prof.role !== "club_admin") {
        router.replace("/app"); // non-admins should not be here
        return;
      }

      setProfile(prof as ProfileRow);

      // 3) Fetch club_code for display (your clubs policies allow authenticated SELECT)
      const { data: club, error: clubErr } = await supabase
        .from("clubs")
        .select("club_code")
        .eq("id", prof.club_id)
        .single();

      if (clubErr) throw clubErr;
      setClubCode((club?.club_code || "").toString());

      // 4) Load invites for this club (requires admin policy)
      const { data: invs, error: invErr } = await supabase
        .from("invites")
        .select("id, club_id, role, email, token, expires_at, used_at, created_at, created_by")
        .eq("club_id", prof.club_id)
        .order("created_at", { ascending: false });

      if (invErr) throw invErr;

      setInvites((invs || []) as InviteRow[]);
    } catch (e: any) {
      setError(e?.message || "Could not load invites.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();

    if (!profile?.club_id) return setError("Missing club context.");
    if (!email.trim()) return setError("Please enter an email.");
    if (!email.includes("@") || !email.includes(".")) return setError("Please enter a valid email.");

    setLoading(true);
    try {
      const token = randomToken(40);
      const expiresAt = addDaysISO(Math.max(1, Math.min(30, days)));

      // current user for created_by
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be signed in.");

      const { error: insErr } = await supabase.from("invites").insert({
        club_id: profile.club_id,
        role,
        email: email.trim().toLowerCase(),
        token,
        expires_at: expiresAt,
        created_by: user.id,
      });

      if (insErr) throw insErr;

      setMsg("Invite created.");
      setEmail("");
      await load();
    } catch (e: any) {
      setError(e?.message || "Could not create invite.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <span className="text-sm font-bold">ST</span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Admin • Invites</div>
              <div className="text-xs text-slate-500">
                Club: <span className="font-medium">{clubCode || "—"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/app/admin"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Back to admin
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          {/* Create invite */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
            <p className="text-xs font-semibold tracking-widest text-slate-500">INVITE USERS</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Create an invite link
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Invite a teacher, student, or parent. The link is single-use and expires automatically.
            </p>

            {error ? (
              <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-semibold text-rose-800">Error</p>
                <p className="mt-1 text-sm text-rose-700">{error}</p>
              </div>
            ) : null}

            {msg ? (
              <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">Update</p>
                <p className="mt-1 text-sm text-emerald-700">{msg}</p>
              </div>
            ) : null}

            <form onSubmit={createInvite} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Invite email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="name@school.org"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as InviteRole)}
                    className="mt-1 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Expires in (days)</label>
                  <input
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    type="number"
                    min={1}
                    max={30}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
                  />
                  <p className="mt-1 text-xs text-slate-500">1 to 30 days.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 transition"
              >
                {loading ? "Creating…" : "Create invite"}
              </button>
            </form>
          </div>

          {/* Invites list */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
            <p className="text-xs font-semibold tracking-widest text-slate-500">INVITES</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">Recent invites</h2>
            <p className="mt-2 text-sm text-slate-600">
              Copy and share the invite link. Once used, it cannot be reused.
            </p>

            {loading ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Loading…
              </div>
            ) : invites.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No invites yet.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {invites.map((inv) => {
                  const link = buildInviteLink(inv.token);
                  const expired = new Date(inv.expires_at).getTime() < Date.now();

                  return (
                    <div key={inv.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900">{inv.email}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            Role: <span className="font-medium text-slate-700">{inv.role}</span> •{" "}
                            Expires:{" "}
                            <span className="font-medium text-slate-700">
                              {new Date(inv.expires_at).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {inv.used_at ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                              Used
                            </span>
                          ) : expired ? (
                            <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700">
                              Expired
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 break-all">
                        {link}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copy(link)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer transition"
                        >
                          Copy invite link
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold tracking-widest text-slate-500">NOTE</p>
              <p className="mt-2 text-sm text-slate-600">
                Invites are single-use. When a user accepts an invite, the system sets <span className="font-medium">used_at</span>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">© {new Date().getFullYear()} STEMTrack</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/privacy" className="text-slate-600 hover:text-slate-900 cursor-pointer">Privacy</Link>
            <Link href="/terms" className="text-slate-600 hover:text-slate-900 cursor-pointer">Terms</Link>
            <Link href="/cookies" className="text-slate-600 hover:text-slate-900 cursor-pointer">Cookies</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
