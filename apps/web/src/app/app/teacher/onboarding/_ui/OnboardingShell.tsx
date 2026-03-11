"use client";

import Link from "next/link";
import React from "react";

export default function OnboardingShell(props: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  stepLabel: string;
}) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
          <div className="min-w-0">
            <div className="text-sm font-semibold tracking-tight">Teacher Onboarding</div>
            <div className="mt-0.5 text-xs text-slate-600">
              Secure setup to unlock delivery analytics and evidence workflows.
            </div>
          </div>

          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            {props.stepLabel}
          </span>
        </div>
      </header>

      <section className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="rounded-[26px] border border-slate-200 bg-white/70 shadow-[0_22px_72px_-60px_rgba(2,6,23,0.55)] backdrop-blur overflow-hidden">
          <div className="border-b border-slate-200 bg-[radial-gradient(900px_240px_at_10%_0%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(800px_220px_at_90%_0%,rgba(34,211,238,0.10),transparent_55%)] px-6 py-5">
            <div className="text-lg font-semibold text-slate-900">{props.title}</div>
            <div className="mt-1 text-sm text-slate-700">{props.subtitle}</div>
          </div>

          <div className="p-6">{props.children}</div>

          <div className="border-t border-slate-200 bg-white/60 px-6 py-4 text-xs text-slate-600 flex items-center justify-between">
            <span>STEMTrack • Teacher setup</span>
            <Link href="/app" className="font-semibold text-slate-700 hover:text-slate-900">
              Exit
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
