// web/src/app/app/admin/clubs/[clubId]/schedule/_islands/_ui.tsx

"use client";

export function cx(...v: Array<string | false | null | undefined>) {
  return v.filter(Boolean).join(" ");
}

export function SectionTitle({ label }: { label: string }) {
  return <div className="text-xs font-semibold tracking-widest text-slate-500">{label}</div>;
}
