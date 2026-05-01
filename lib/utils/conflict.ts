import type { Course } from '@/lib/types';

export function findConflict(candidate: Course, registered: Course[]): Course | null {
  for (const r of registered) {
    if (r.id === candidate.id) continue;
    for (const m of candidate.meetings) {
      if (r.meetings.some((rm) => rm.day === m.day && rm.block === m.block)) return r;
    }
  }
  return null;
}
