// web/src/app/app/admin/clubs/[clubId]/sessions/page.tsx
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

type EvidenceType = "note" | "image" | "video" | "ai_summary";

type EvidenceRow = {
  id: string;
  club_id: string;
  session_id: string;
  type: EvidenceType;
  content: string | null; // note text OR storage path
  meta?: any | null;
  created_at: string;
  created_by: string | null;
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

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, "_");
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

  // Evidence MVP
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidence, setEvidence] = useState<EvidenceRow[]>([]);
  const [noteText, setNoteText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({}); // path -> signedUrl

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
      const tRes = await supabase
        .from("terms")
        .select("id, club_id, is_active, created_at")
        .eq("club_id", clubId)
        .order("created_at", { ascending: true })
        .limit(50);

      const sRes = await supabase
        .from("sessions")
        .select("id, club_id, title, starts_at, duration_minutes, status, term_id, created_at")
        .eq("club_id", clubId)
        .order("starts_at", { ascending: false })
        .limit(200);

      const stRes = await supabase
        .from("students")
        .select("id, club_id, full_name")
        .eq("club_id", clubId)
        .order("full_name", { ascending: true })
        .limit(500);

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

      const open = ss.find((x) => x.status === "open");
      setSelectedSessionId((prev) => prev || open?.id || ss[0]?.id || "");
      setSelectedStudentIds({});
    } catch (e: any) {
      router.replace(`/app/admin/clubs/${clubId}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadEvidence(sessionId: string) {
    if (!sessionId) {
      setEvidence([]);
      return;
    }

    setEvidenceLoading(true);
    try {
      const res = await supabase
        .from("session_evidence")
        .select("id, club_id, session_id, type, content, meta, created_at, created_by")
        .eq("club_id", clubId)
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (res.error) throw res.error;

      const rows = (res.data ?? []) as EvidenceRow[];
      setEvidence(rows);

      // Prefetch signed URLs for image evidence
      const imageRows = rows.filter((r) => r.type === "image" && r.content);
      const missing = imageRows.filter((r) => r.content && !signedUrls[r.content]);

      if (missing.length) {
        const next: Record<string, string> = {};
        for (const r of missing) {
          const path = r.content!;
          const { data, error } = await supabase.storage
            .from("session-evidence")
            .createSignedUrl(path, 60 * 30);

          if (!error && data?.signedUrl) next[path] = data.signedUrl;
        }
        if (Object.keys(next).length) setSignedUrls((p) => ({ ...p, ...next }));
      }
    } catch (e: any) {
      flash(e?.message ? `Evidence load failed: ${e.message}` : "Evidence load failed.", 1800);
    } finally {
      setEvidenceLoading(false);
    }
  }

  useEffect(() => {
    if (checking) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checking, clubId]);

  useEffect(() => {
    if (!selectedSessionId) return;
    loadEvidence(selectedSessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId]);

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

  async function addNote() {
    if (!selectedSession) return;
    const text = noteText.trim();
    if (!text) {
      flash("Type a note first.");
      return;
    }

    try {
      const { data: u } = await supabase.auth.getUser();
      const createdBy = u.user?.id ?? null;

      const res = await supabase
        .from("session_evidence")
        .insert({
          club_id: clubId,
          session_id: selectedSession.id,
          type: "note",
          content: text,
          meta: null,
          created_by: createdBy,
        } as any)
        .select("id, club_id, session_id, type, content, meta, created_at, created_by")
        .single();

      if (res.error) throw res.error;

      setNoteText("");
      flash("Note saved ✓");
      setEvidence((prev) => [res.data as EvidenceRow, ...prev]);
    } catch (e: any) {
      flash(e?.message ? `Save note failed: ${e.message}` : "Save note failed.", 1800);
    }
  }

  async function uploadImages(files: FileList | null) {
    if (!selectedSession) return;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const createdBy = u.user?.id ?? null;

      const max = Math.min(files.length, 5);
      const created: EvidenceRow[] = [];

      for (let i = 0; i < max; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        // 1) create evidence row (get ID)
        const ins = await supabase
          .from("session_evidence")
          .insert({
            club_id: clubId,
            session_id: selectedSession.id,
            type: "image",
            content: null,
            meta: { fileName: file.name, size: file.size, mime: file.type },
            created_by: createdBy,
          } as any)
          .select("id, club_id, session_id, type, content, meta, created_at, created_by")
          .single();

        if (ins.error) throw ins.error;

        const evidenceId = ins.data.id as string;
        const path = `club/${clubId}/session/${selectedSession.id}/${evidenceId}/${safeName(file.name)}`;

        // 2) upload
        const up = await supabase.storage.from("session-evidence").upload(path, file, {
          upsert: false,
          contentType: file.type,
        });
        if (up.error) throw up.error;

        // 3) update row with storage path
        const upd = await supabase
          .from("session_evidence")
          .update({ content: path } as any)
          .eq("id", evidenceId)
          .eq("club_id", clubId)
          .select("id, club_id, session_id, type, content, meta, created_at, created_by")
          .single();

        if (upd.error) throw upd.error;

        // 4) signed url for display
        const { data: signed, error: sErr } = await supabase.storage
          .from("session-evidence")
          .createSignedUrl(path, 60 * 30);

        if (!sErr && signed?.signedUrl) setSignedUrls((p) => ({ ...p, [path]: signed.signedUrl }));

        created.push(upd.data as EvidenceRow);
      }

      if (created.length) {
        flash("Images uploaded ✓");
        setEvidence((prev) => [...created.reverse(), ...prev]);
      } else {
        flash("No valid images selected.");
      }
    } catch (e: any) {
      flash(e?.message ? `Upload failed: ${e.message}` : "Upload failed.", 2000);
    } finally {
      setUploading(false);
    }
  }

  async function deleteEvidence(row: EvidenceRow) {
    try {
      if (row.type === "image" && row.content) {
        await supabase.storage.from("session-evidence").remove([row.content]);
      }

      const res = await supabase.from("session_evidence").delete().eq("id", row.id).eq("club_id", clubId);
      if (res.error) throw res.error;

      flash("Deleted ✓");
      setEvidence((prev) => prev.filter((x) => x.id !== row.id));
    } catch (e: any) {
      flash(e?.message ? `Delete failed: ${e.message}` : "Delete failed.", 1800);
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
          <div className="mb-4 rounded-[18px] border border-slate-200 bg-white/70 p-3 text-sm text-slate-700">{msg}</div>
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
                            <div className="truncate text-sm font-semibold text-slate-900">{s.title || "Untitled session"}</div>
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
                      {selectedSession
                        ? `Starts: ${fmtDateTime(selectedSession.starts_at)} • Duration: ${selectedSession.duration_minutes ?? 90} mins`
                        : "—"}
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
                      {selectedStatus === "planned" ? "Pick learners to attach to this session." : "Locked (session is open/closed)."}
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
                  <div className="mt-2 text-xs text-slate-500">Tip: add participants while planned, then open session to lock the list.</div>
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

                    {!filteredStudents.length ? <div className="px-4 py-8 text-center text-sm text-slate-600">No students found.</div> : null}
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-600">
                  Register UI uses <span className="font-semibold text-slate-900">session_participants</span> to display learners.
                </div>
              </div>
            </div>

            {/* Evidence MVP */}
            <div className="mt-6 rounded-[22px] border border-slate-200 bg-white shadow-[0_16px_48px_-34px_rgba(2,6,23,0.35)] overflow-hidden">
              <div className="border-b border-slate-200 bg-gradient-to-r from-transparent via-indigo-50/60 to-transparent px-5 py-4 sm:px-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Session Evidence</div>
                    <div className="mt-0.5 text-xs text-slate-600">Notes + photos for proof, reporting and parent visibility.</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => selectedSessionId && loadEvidence(selectedSessionId)}
                    className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-indigo-50/60"
                  >
                    Refresh evidence
                  </button>
                </div>
              </div>

              <div className="px-5 py-5 sm:px-6">
                {!selectedSession ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">Select a session to attach evidence.</div>
                ) : (
                  <>
                    <div className="grid gap-3 lg:grid-cols-12">
                      <div className="lg:col-span-8">
                        <label className="text-xs font-semibold text-slate-600">Quick note</label>
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          rows={3}
                          placeholder="e.g., Learners completed the gear-train build; teamwork improved; 2 students led the demo…"
                          className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={addNote}
                            disabled={!noteText.trim()}
                            className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                          >
                            Save note
                          </button>
                          <div className="text-xs text-slate-600">
                            {evidenceLoading ? "Loading…" : `Stored in session_evidence • ${evidence.length} item(s)`}
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-4">
                        <label className="text-xs font-semibold text-slate-600">Upload photos (max 5)</label>
                        <div className="mt-1 rounded-xl border border-slate-200 bg-white p-3">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={uploading}
                            onChange={(e) => uploadImages(e.target.files)}
                            className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800 disabled:opacity-60"
                          />
                          <div className="mt-2 text-xs text-slate-500">
                            Bucket: <span className="font-semibold">session-evidence</span> • Private
                          </div>
                          {uploading ? <div className="mt-2 text-xs font-semibold text-slate-700">Uploading…</div> : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between gap-3 bg-slate-50 px-4 py-2">
                        <div className="text-[11px] font-semibold tracking-widest text-slate-500">EVIDENCE FEED</div>
                        <div className="text-xs text-slate-600">{evidenceLoading ? "Loading…" : `${evidence.length} item(s)`}</div>
                      </div>

                      <div className="divide-y divide-slate-200">
                        {evidence.length ? (
                          evidence.map((ev) => {
                            const isImage = ev.type === "image" && ev.content;
                            const imgUrl = isImage ? signedUrls[ev.content as string] : null;

                            return (
                              <div key={ev.id} className="px-4 py-4 hover:bg-indigo-50/20">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                                        {ev.type.toUpperCase()}
                                      </span>
                                      <span className="text-xs text-slate-500">{fmtDateTime(ev.created_at)}</span>
                                    </div>

                                    <div className="mt-2">
                                      {ev.type === "note" ? (
                                        <div className="text-sm text-slate-900 whitespace-pre-wrap">{ev.content}</div>
                                      ) : isImage ? (
                                        <div className="flex items-center gap-3">
                                          <div className="h-16 w-24 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                            {imgUrl ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img src={imgUrl} alt="Session evidence" className="h-full w-full object-cover" />
                                            ) : (
                                              <div className="h-full w-full animate-pulse bg-slate-200" />
                                            )}
                                          </div>
                                          <div className="min-w-0">
                                            <div className="text-sm font-semibold text-slate-900 truncate">
                                              {(ev.meta?.fileName as string) || "Photo"}
                                            </div>
                                            <div className="mt-0.5 text-xs text-slate-600 truncate">{ev.content}</div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-sm text-slate-700">{ev.content || "—"}</div>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => deleteEvidence(ev)}
                                    className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-rose-50"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="px-4 py-8 text-center text-sm text-slate-600">No evidence yet — add a note or upload a photo.</div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-600">
                      Paths are stored like{" "}
                      <span className="font-semibold text-slate-900">club/{clubId}/session/{selectedSession.id}/…</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Navigation hint */}
            <div className="mt-6 rounded-[18px] border border-slate-200 bg-white/70 p-4 text-sm text-slate-700">
              Next: we’ll add <span className="font-semibold text-slate-900">session_activities</span> (planned checklist for the coach) and
              later automate <span className="font-semibold text-slate-900">open → close</span>.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
