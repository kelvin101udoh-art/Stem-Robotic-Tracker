// /web/src/app/get-started/confirm/page.tsx
import Link from "next/link";

export default function ConfirmEmailPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-200/40 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-900 text-white">
            ✓
          </div>
          <h1 className="text-xl font-semibold">Account created</h1>
        </div>

        <p className="mt-4 text-sm text-slate-600 leading-relaxed">
          Your admin account has been created successfully.
        </p>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-700">
            <strong>Next step:</strong> Please check your email and confirm your
            address. Once confirmed, return here to sign in and access your
            dashboard.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/get-started"
            className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            Go to login
          </Link>

          <Link
            href="/"
            className="inline-flex w-full cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Back to homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
