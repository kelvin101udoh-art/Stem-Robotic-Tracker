import type { SessionEntry } from '@/data/mock';
import { generateInsight } from '@/lib/insights';

export type WeeklySummary = {
  weekLabel: string;
  students: Array<{
    student: string;
    entriesCount: number;
    insight: ReturnType<typeof generateInsight>;
    highlight: string;
  }>;
};

export function buildWeeklySummary(
  entries: SessionEntry[],
  students: string[],
  weekLabel = 'Week summary (demo)'
): WeeklySummary {
  return {
    weekLabel,
    students: students.map(student => {
      const sEntries = entries.filter(e => e.student === student);
      const insight = generateInsight(student, entries);

      const latest = sEntries[0];
      const highlight = latest
        ? `Latest: ${latest.challenge} — ${latest.score}${latest.note ? ` (“${latest.note}”)` : ''}`
        : 'No sessions logged yet.';

      return {
        student,
        entriesCount: sEntries.length,
        insight,
        highlight,
      };
    }),
  };
}
