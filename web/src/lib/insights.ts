import type { SessionEntry } from '@/data/mock';

function parseSeconds(score: string): number | null {
  // supports "38.2s"
  const m = score.trim().match(/^(\d+(\.\d+)?)s$/i);
  if (!m) return null;
  return Number(m[1]);
}

export type Insight = {
  label: 'Improving' | 'Needs practice' | 'Consistent performer' | 'Not enough data';
  reason: string;
};

export function generateInsight(student: string, entries: SessionEntry[]): Insight {
  const sEntries = entries
    .filter(e => e.student === student)
    .slice()
    .reverse(); // oldest -> newest

  if (sEntries.length < 2) {
    return {
      label: 'Not enough data',
      reason: 'Log at least 2 sessions to generate a trend insight.',
    };
  }

  // Look at time-trial improvements if present
  const times = sEntries
    .map(e => parseSeconds(e.score))
    .filter((v): v is number => v !== null);

  if (times.length >= 2) {
    const first = times[0];
    const last = times[times.length - 1];
    const change = ((first - last) / first) * 100;

    if (change >= 10) {
      return {
        label: 'Improving',
        reason: `Time reduced from ${first.toFixed(1)}s to ${last.toFixed(1)}s (≈${change.toFixed(0)}% improvement).`,
      };
    }
    if (change <= -10) {
      return {
        label: 'Needs practice',
        reason: `Time increased from ${first.toFixed(1)}s to ${last.toFixed(1)}s. Consider extra calibration practice.`,
      };
    }
    return {
      label: 'Consistent performer',
      reason: `Performance is stable across sessions (time variation is small).`,
    };
  }

  // Fallback: qualitative status
  const completedCount = sEntries.filter(e => /completed|top/i.test(e.score)).length;
  if (completedCount >= 2) {
    return {
      label: 'Consistent performer',
      reason: `Multiple successful outcomes logged (${completedCount} recent achievements).`,
    };
  }

  return {
    label: 'Needs practice',
    reason: 'Add one more session score/time to generate a stronger trend insight.',
  };
}
