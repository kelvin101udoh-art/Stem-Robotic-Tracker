'use client';
import { useEffect, useState } from 'react';
import type { Challenge } from '@/lib/mock';
import { loadChallenges } from '@/lib/mock';


export default function ChallengesPage(){
const [rows,setRows] = useState<Challenge[]>([]);
useEffect(()=>{ loadChallenges().then(setRows); },[]);
return (
<main className="max-w-5xl mx-auto p-6">
<div className="flex items-center justify-between mb-4">
<h1 className="text-xl font-semibold">Challenge Templates</h1>
<a className="underline text-sm" href="/">← Back</a>
</div>
<div className="overflow-x-auto border rounded-xl">
<table className="min-w-full text-sm">
<thead className="bg-gray-50">
<tr>
<th className="text-left p-3">Name</th>
<th className="text-left p-3">Type</th>
<th className="text-left p-3">Rubric Criteria</th>
<th className="text-left p-3">Active</th>
</tr>
</thead>
<tbody>
{rows.map((c)=> (
<tr key={c.name} className="border-t">
<td className="p-3 font-medium">{c.name}</td>
<td className="p-3">{c.type.replace('_',' ')}</td>
<td className="p-3">
<div className="flex gap-2 flex-wrap">
{c.rubric.criteria.map(cr => (
<span key={cr.key} className="px-2 py-1 border rounded-full text-xs">{cr.key} / {cr.max}</span>
))}
</div>
</td>
<td className="p-3">{c.is_active ? 'Yes' : 'No'}</td>
</tr>
))}
</tbody>
</table>
</div>
<p className="text-xs text-gray-500 mt-3">Month 1: Data loaded from /mock/challenges.json. In Month 2 we switch to Supabase DB + RLS.</p>
</main>
);
}