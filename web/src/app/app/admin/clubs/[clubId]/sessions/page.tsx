//  web/src/app/app/admin/clubs/[clubId]/sessions/page.tsx


"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAdminGuard } from "@/lib/admin/admin-guard";

type SessionStatus = "planned" | "open" | "closed";

type SessionRow = {
  id: string;
  club_id: string;
  title: string | null;
  starts_at: string | null;
  duration_minutes: number | null;
  status?: SessionStatus | null;
  term_id?: string | null;
  created_at?: string | null;
};

type TermRow = {
  id: string;
  club_id: string;
  is_active?: boolean | null;
  created_at?: string | null;
};

type StudentRow = {
  id: string;
  club_id: string;
  full_name: string;
};

type ParticipantRow = {
  session_id: string;
  student_id: string;
};

function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusChip(s?: SessionStatus | null) {
  const k = s ?? "planned";
  if (k === "open") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  if (k === "closed") return "border-slate-200 bg-slate-50 text-slate-700";
  return "border-indigo-200 bg-indigo-50 text-indigo-900";
}

export default function SessionsMvpPage() {
  const router = useRouter();
  const params = useParams<{ clubId: string }>();
  const clubId = params.clubId;

  const { checking, supabase } = useAdminGuard({ idleMinutes: 20 });

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const [terms, setTerms] = useState<TermRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);

  const [selectedSessionId, setSelectedSessionId] = useState<string>("");

  // Create form
  const [title, setTitle] = useState("Session MVP Test");
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // Participant picker
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState<Record<string, boolean>>({});

  const selectedSession = useMemo(
    () => sessions.find((s) => s.id === selectedSessionId) ?? null,
    [sessions, selectedSessionId]
  );

  const selectedTermId = useMemo(() => {
    const active = terms.find((t) => t.is_active);
    return active?.id ?? terms[0]?.id ?? null;
  }, [terms]);

  const participantIdsForSelected = useMemo(() => {
    if (!selectedSessionId) return new Set<string>();
    const set = new Set<string>();
    participants.forEach((p) => {
      if (p.session_id === selectedSessionId) set.add(p.student_id);
    });
    return set;
  }, [participants, selectedSessionId]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => s.full_name.toLowerCase().includes(q));
  }, [students, studentQuery]);

  function flash(text: string, ms = 1200) {
    setMsg(text);
    window.setTimeout(() => setMsg(""), ms);
  }

  async function loadAll() {
    setLoading(true);
    setMsg("");

    try {
      // terms (optional but recommended)
      const tRes = await supabase
        .from("terms")
        .select("id, club_id, is_active, created_at")
        .eq("club_id", clubId)
        .order("created_at", { ascending: true })
        .limit(50);

      // sessions
      const sRes = await supabase
        .from("sessions")
        .select("id, club_id, title, starts_at, duration_minutes, status, term_id, created_at")
        .eq("club_id", clubId)
        .order("starts_at", { ascending: false })
        .limit(200);

      // students
      const stRes = await supabase
        .from("students")
        .select("id, club_id, full_name")
        .eq("club_id", clubId)
        .order("full_name", { ascending: true })
        .limit(500);

      // participants (for all sessions in this club)
      const pRes = await supabase
        .from("session_participants")
        .select("session_id, student_id")
        .eq("club_id", clubId)
        .limit(2000);

      if (tRes.error) throw tRes.error;
      if (sRes.error) throw sRes.error;
      if (stRes.error) throw stRes.error;
      if (pRes.error) throw pRes.error;

      setTerms((tRes.data ?? []) as TermRow[]);
      const ss = (sRes.data ?? []) as SessionRow[];
      setSessions(ss);
      setStudents((stRes.data ?? []) as StudentRow[]);
      setParticipants((pRes.data ?? []) as ParticipantRow[]);

      // select a sensible default session (open first, else latest)
      const open = ss.find((x) => x.status === "open");
      setSelectedSessionId((prev) => prev || open?.id || ss[0]?.id || "");
      setSelectedStudentIds({});
    } catch (e: any) {
      // If RLS blocks or not admin, return to club
      router.replace(`/app/admin/clubs/${clubId}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (checking) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, clubId]);

  async function createPlannedSession() {
    if (!selectedTermId) {
      flash("No term found. Create a term first.");
      return;
    }

    try {
      const { data: u } = await supabase.auth.getUser();
      const createdBy = u.user?.id ?? null;

      const res = await supabase
        .from("sessions")
        .insert({
          club_id: clubId,
          term_id: selectedTermId,
          title: title.trim() || null,
          starts_at: new Date().toISOString(),
          duration_minutes: durationMinutes,
          status: "planned",
          created_by: createdBy,
        } as any)
        .select("id, club_id, title, starts_at, duration_minutes, status, term_id, created_at")
        .single();

      if (res.error) throw res.error;

      flash("Session created (planned) ✓");
      setSelectedSessionId(res.data.id);
      await loadAll();
    } catch (e: any) {
      flash(e?.message ? `Create failed: ${e.message}` : "Create failed (check RLS).", 1800);
    }
  }

  async function addParticipants() {
    if (!selectedSession) return;

    const status = (selectedSession.status ?? "planned") as SessionStatus;
    if (status !== "planned") {
      flash("Participants can only be edited while session is planned.");
      return;
    }

    const picked = Object.entries(selectedStudentIds)
      .filter(([, v]) => v)
      .map(([id]) => id);

    if (!picked.length) {
      flash("Pick at least 1 learner.");
      return;
    }

    try {
      const payload = picked.map((student_id) => ({
        club_id: clubId,
        session_id: selectedSession.id,
        student_id,
      }));

      const res = await supabase.from("session_participants").insert(payload as any);
      if (res.error) throw res.error;

      flash("Participants added ✓");
      setSelectedStudentIds({});
      await loadAll();
    } catch (e: any) {
      flash(e?.message ? `Add failed: ${e.message}` : "Add failed (check RLS/lock).", 1800);
    }
  }

  async function openSession() {
    if (!selectedSession) return;
    const status = (selectedSession.status ?? "planned") as SessionStatus;

    if (status !== "planned") {
      flash("Only planned sessions can be opened.");
      return;
    }

    if (participantIdsForSelected.size === 0) {
      flash("Add participants first (register needs learners).");
      return;
    }

    try {
      const res = await supabase
        .from("sessions")
        .update({ status: "open" } as any)
        .eq("id", selectedSession.id)
        .eq("club_id", clubId);

      if (res.error) throw res.error;

      flash("Session opened ✓");
      await loadAll();
    } catch (e: any) {
      flash(e?.message ? `Open failed: ${e.message}` : "Open failed (check RLS).", 1800);
    }
  }

  async function closeSession() {
    if (!selectedSession) return;
    const status = (selectedSession.status ?? "planned") as SessionStatus;

    if (status !== "open") {
      flash("Only open sessions can be closed.");
      return;
    }

    try {
      const res = await supabase
        .from("sessions")
        .update({ status: "closed" } as any)
        .eq("id", selectedSession.id)
        .eq("club_id", clubId);

      if (res.error) throw res.error;

      flash("Session closed ✓");
      await loadAll();
    } catch (e: any) {
      flash(e?.message ? `Close failed: ${e.message}` : "Close failed (check RLS).", 1800);
    }
  }

  function togglePick(studentId: string) {
    setSelectedStudentIds((prev) => ({ ...prev, [studentId]: !prev[studentId] }));
  }

  if (checking || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-100">
        <div className="mx-auto max-w-[1200px] px-4 py-10">
          <div className="h-10 w-72 rounded-2xl bg-slate-200 animate-pulse" />
          <div className="mt-6 h-[680px] rounded-3xl border border-slate-200 bg-white animate-pulse" />
        </div>
      </main>
    );
  }

  const selectedStatus = (selectedSession?.status ?? "planned") as SessionStatus;
  const participantCount = participantIdsForSelected.size;

  return (
    <main className="relative min-h-screen w-full overflow-x-clip text-slate-900">
      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-100" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#0f172a_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="absolute -left-56 top-[-220px] h-[640px] w-[640px] rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute -right-72 top-[60px] h-[700px] w-[700px] rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8 relative">
          <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Sessions</div>
            <div className="text-xs text-slate-600">Plan → Participants → Open → Close</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/app/admin/clubs/${clubId}`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
            >
              Back
            </Link>

            <Link
              href={`/app/admin/clubs/${clubId}/attendance/register`}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Go to Register
            </Link>

            <button
              type="button"
              onClick={loadAll}
              className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {msg ? (
          <div className="mb-4 rounded-[18px] border border-slate-200 bg-white/70 p-3 text-sm text-slate-700">
            {msg}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-12">
          {/* LEFT: sessions list */}
          <div className="lg:col-span-4">
            <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)]">
              <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                <div className="text-sm font-semibold text-slate-900">Sessions</div>
                <div className="mt-0.5 text-xs text-slate-600">{sessions.length} total</div>
              </div>

              <div className="max-h-[70vh] overflow-auto divide-y divide-slate-200">
                {sessions.length ? (
                  sessions.map((s) => {
                    const selected = s.id === selectedSessionId;
                    const st = (s.status ?? "planned") as SessionStatus;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSessionId(s.id)}
                        className={cx(
                          "w-full px-5 py-4 text-left hover:bg-indigo-50/40 sm:px-6",
                          selected && "bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {s.title || "Untitled session"}
                            </div>
                            <div className="mt-0.5 text-xs text-slate-600">{fmtDateTime(s.starts_at)}</div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <span className={cx("rounded-full border px-2.5 py-1 text-[11px] font-semibold", statusChip(st))}>
                              {st.toUpperCase()}
                            </span>
                            {selected ? (
                              <span className="rounded-full border border-slate-900 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white">
                                Selected
                              </span>
                            ) : (
                              <span className="text-slate-400">›</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-6 py-10 text-center">
                    <div className="text-sm font-semibold text-slate-900">No sessions yet</div>
                    <div className="mt-1 text-sm text-slate-600">Create your first planned session.</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: create + manage */}
          <div className="lg:col-span-8">
            {/* Create planned session */}
            <div className="rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                <div className="text-sm font-semibold text-slate-900">Create planned session</div>
                <div className="mt-0.5 text-xs text-slate-600">
                  Participants can be edited only while <span className="font-semibold">planned</span>.
                </div>
              </div>

              <div className="px-5 py-5 sm:px-6">
                <div className="grid gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-8">
                    <label className="text-xs font-semibold text-slate-600">Title</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      placeholder="e.g., Week 2 — Build & Challenge"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-xs font-semibold text-slate-600">Duration (mins)</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Math.max(15, Number(e.target.value || 0)))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                      min={15}
                      step={5}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={createPlannedSession}
                    className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Create planned session
                  </button>

                  <div className="text-xs text-slate-600">
                    Term selected: <span className="font-semibold text-slate-900">{selectedTermId ? "OK" : "None"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected session control */}
            <div className="mt-6 rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold tracking-widest text-slate-500">SELECTED SESSION</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {selectedSession?.title || (sessions.length ? "Untitled session" : "No session selected")}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {selectedSession ? `Starts: ${fmtDateTime(selectedSession.starts_at)} • Duration: ${selectedSession.duration_minutes ?? 90} mins` : "—"}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={cx("rounded-full border px-3 py-1 text-xs font-semibold", statusChip(selectedStatus))}>
                        {selectedStatus.toUpperCase()}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        Participants: <span className="ml-2 text-slate-900">{participantCount}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={openSession}
                      disabled={!selectedSession || selectedStatus !== "planned"}
                      className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Open session
                    </button>

                    <button
                      type="button"
                      onClick={closeSession}
                      disabled={!selectedSession || selectedStatus !== "open"}
                      className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      Close session
                    </button>

                    <Link
                      href={`/app/admin/clubs/${clubId}/attendance/register`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60"
                    >
                      Open register
                    </Link>
                  </div>
                </div>
              </div>

              {/* Participant picker (only when planned) */}
              <div className="px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Participants</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {selectedStatus === "planned"
                        ? "Pick learners to attach to this session."
                        : "Locked (session is open/closed)."}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addParticipants}
                    disabled={!selectedSession || selectedStatus !== "planned"}
                    className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-indigo-50/60 disabled:opacity-50"
                  >
                    Add selected learners
                  </button>
                </div>

                <div className="mt-4">
                  <input
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    placeholder="Search student name…"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    Tip: add participants while planned, then open session to lock the list.
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-12 gap-2 bg-slate-50 px-4 py-2 text-[11px] font-semibold tracking-widest text-slate-500">
                    <div className="col-span-7">LEARNER</div>
                    <div className="col-span-3">IN SESSION</div>
                    <div className="col-span-2 text-right">PICK</div>
                  </div>

                  <div className="divide-y divide-slate-200 max-h-[420px] overflow-auto">
                    {filteredStudents.map((st) => {
                      const inSession = participantIdsForSelected.has(st.id);
                      const picked = !!selectedStudentIds[st.id];

                      return (
                        <div key={st.id} className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-indigo-50/30">
                          <div className="col-span-7 min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">{st.full_name}</div>
                            <div className="mt-0.5 text-xs text-slate-500">ID: {st.id.slice(0, 8)}…</div>
                          </div>

                          <div className="col-span-3 flex items-center">
                            {inSession ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-900">
                                Attached
                              </span>
                            ) : (
                              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                Not yet
                              </span>
                            )}
                          </div>

                          <div className="col-span-2 flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => togglePick(st.id)}
                              disabled={!selectedSession || selectedStatus !== "planned" || inSession}
                              className={cx(
                                "cursor-pointer inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold transition",
                                picked ? "bg-slate-900 text-white hover:bg-slate-800" : "border border-slate-200 bg-white text-slate-900 hover:bg-indigo-50/60",
                                (!selectedSession || selectedStatus !== "planned" || inSession) && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {inSession ? "Locked" : picked ? "Picked ✓" : "Pick"}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {!filteredStudents.length ? (
                      <div className="px-4 py-8 text-center text-sm text-slate-600">No students found.</div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  Register UI uses <span className="font-semibold text-slate-900">session_participants</span> to display learners.
                </div>
              </div>
            </div>

            {/* Navigation hint */}
            <div className="mt-6 rounded-[18px] border border-slate-200 bg-white/70 p-4 text-sm text-slate-700">
              Next: we’ll add <span className="font-semibold text-slate-900">session_activities</span> (planned checklist for the coach) and{" "}
              <span className="font-semibold text-slate-900">session_evidence</span> (notes/photos/videos).
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
