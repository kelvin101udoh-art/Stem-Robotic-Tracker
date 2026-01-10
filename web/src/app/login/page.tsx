// web/src/app/login/page.tsx

// Remove "use client";

import { Suspense } from 'react';
import LoginForm from './login-form'; // Import the new component

// The main page is now a Server Component
export default function LoginPage() {
  return (
    // Wrap the client component in a Suspense boundary
    <Suspense fallback={<div>Loading login form...</div>}>
      <LoginForm />
    </Suspense>
  );
}
