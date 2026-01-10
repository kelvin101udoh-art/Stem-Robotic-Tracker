// web/src/app/dev-login/page.tsx

// Remove "use client";

import { Suspense } from "react";
import DevLoginForm from "./login-form";

export default function DevLoginPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <DevLoginForm />
    </Suspense>
  );
}
