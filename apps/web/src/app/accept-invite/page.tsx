// /web/src/app/accept-invite/page.tsx
import { Suspense } from "react";
import AcceptInviteClient from "./AcceptInviteClient";

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-slate-600">
          Loading invite…
        </main>
      }
    >
      <AcceptInviteClient />
    </Suspense>
  );
}
