'use client';
import { useState } from 'react';


export default function LoginPage() {
const [email, setEmail] = useState('');
const [pwd, setPwd] = useState('');
function fakeLogin(e: React.FormEvent) {
e.preventDefault();
alert('This is a UI‑only mock in Month 1. Auth connects in Month 2.');
}
return (
<main className="min-h-screen grid place-items-center p-6">
<form onSubmit={fakeLogin} className="w-full max-w-sm border rounded-2xl p-6 grid gap-4">
<h1 className="text-lg font-semibold">Teacher Login</h1>
<input className="border rounded px-3 py-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
<input className="border rounded px-3 py-2" placeholder="Password" type="password" value={pwd} onChange={e=>setPwd(e.target.value)} />
<button className="bg-black text-white rounded px-4 py-2">Sign in</button>
<p className="text-xs text-gray-500">Month 1: This page is visual only. Next month we wire Supabase Auth (magic link + MFA for staff).</p>
</form>
</main>
);
}