export type Challenge = { name: string; type: 'time_trial'|'maze'|'sumo'|'build'; rubric: {criteria:{key:string; max:number}[]}; is_active: boolean };


export async function loadChallenges(): Promise<Challenge[]> {
const res = await fetch('/mock/challenges.json');
return res.json();
}

export type SessionEntry = {
  student: string;
  challenge: string;
  score: string; // "38.2s" or "87/100" or "Completed"
  note?: string;
  createdAt: string;
};

export const mockStudents = ['Aisha Okoro', 'Ben Li', 'Chloe Ahmed'];

export const mockChallenges = ['Line Follower Time Trial', 'Maze Solve', 'Sumo Bot'];

export const mockEntries: SessionEntry[] = [
  { student: 'Aisha Okoro', challenge: 'Line Follower Time Trial', score: '38.2s', note: 'Better steering control', createdAt: '2026-01-05 16:10' },
  { student: 'Aisha Okoro', challenge: 'Maze Solve', score: 'Completed', note: 'Improved obstacle planning', createdAt: '2026-01-10 16:20' },
  { student: 'Ben Li', challenge: 'Sumo Bot', score: 'Top 3', note: 'Great defensive strategy', createdAt: '2026-01-12 16:05' },
];

