// apps/mobile/src/core/timetable.ts

import type { TrackBranch } from 'stemtrack-sdk';

export interface ScheduledSession {
  id: string;
  title: string;
  subject: string;
  startTime: string; // "HH:MM" 24h format
  endTime: string;   // "HH:MM" 24h format
  branch: TrackBranch;
}

const DEFAULT_TIMETABLES: Record<TrackBranch, ScheduledSession[]> = {
  ROBOTICS_CLUB: [
    {
      id: 'session-maths-0900',
      title: 'Year 4 • Maths',
      subject: 'Mathematics',
      startTime: '09:00',
      endTime: '10:00',
      branch: 'ROBOTICS_CLUB',
    },
    {
      id: 'session-english-1015',
      title: 'Year 4 • English',
      subject: 'English & Literacy',
      startTime: '10:15',
      endTime: '11:15',
      branch: 'ROBOTICS_CLUB',
    },
    {
      id: 'session-robotics-1330',
      title: 'Robotics Practical',
      subject: 'STEM & Engineering',
      startTime: '13:30',
      endTime: '15:00',
      branch: 'ROBOTICS_CLUB',
    },
  ],
  SEND_PROVISION: [
    {
      id: 'session-send-0900',
      title: 'Morning Regulation Check-In',
      subject: 'Zones of Regulation',
      startTime: '09:00',
      endTime: '09:45',
      branch: 'SEND_PROVISION',
    },
    {
      id: 'session-send-1000',
      title: 'Targeted Literacy Intervention',
      subject: 'EHCP Communication',
      startTime: '10:00',
      endTime: '11:00',
      branch: 'SEND_PROVISION',
    },
    {
      id: 'session-send-1315',
      title: 'Sensory & Co-Regulation Lab',
      subject: 'EHCP Social & Emotional',
      startTime: '13:15',
      endTime: '14:30',
      branch: 'SEND_PROVISION',
    },
  ],
  EARLY_YEARS: [
    {
      id: 'session-eyfs-0900',
      title: 'Phonics Carpet Time',
      subject: 'Communication & Language',
      startTime: '09:00',
      endTime: '09:45',
      branch: 'EARLY_YEARS',
    },
    {
      id: 'session-eyfs-1000',
      title: 'Outdoor Continuous Provision',
      subject: 'Physical & Exploratory Play',
      startTime: '10:00',
      endTime: '11:30',
      branch: 'EARLY_YEARS',
    },
    {
      id: 'session-eyfs-1300',
      title: 'Creative & Roleplay Studio',
      subject: 'Expressive Arts & Design',
      startTime: '13:00',
      endTime: '14:45',
      branch: 'EARLY_YEARS',
    },
  ],
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function getTodayTimetable(branch: TrackBranch): ScheduledSession[] {
  return DEFAULT_TIMETABLES[branch] ?? DEFAULT_TIMETABLES.ROBOTICS_CLUB;
}

export function formatTimeWindow(slot: ScheduledSession): string {
  return `${slot.startTime} – ${slot.endTime}`;
}

export function matchSessionToCurrentTime(
  sessions: ScheduledSession[],
  now: Date = new Date()
): { session: ScheduledSession; isExactMatch: boolean } {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 1. Exact active slot match
  const exact = sessions.find(
    (s) =>
      currentMinutes >= toMinutes(s.startTime) &&
      currentMinutes <= toMinutes(s.endTime)
  );
  if (exact) {
    return { session: exact, isExactMatch: true };
  }

  // 2. Next upcoming slot today
  const upcoming = sessions.find((s) => toMinutes(s.startTime) > currentMinutes);
  if (upcoming) {
    return { session: upcoming, isExactMatch: false };
  }

  // 3. Fallback to the last slot of the day
  return { session: sessions[sessions.length - 1], isExactMatch: false };
}