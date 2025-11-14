export type Challenge = { name: string; type: 'time_trial'|'maze'|'sumo'|'build'; rubric: {criteria:{key:string; max:number}[]}; is_active: boolean };


export async function loadChallenges(): Promise<Challenge[]> {
const res = await fetch('/mock/challenges.json');
return res.json();
}