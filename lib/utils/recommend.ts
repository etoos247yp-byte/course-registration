import type { Student, Subject, LevelTag } from '@/lib/types';

export function isRecommendedForStudent(
  student: Student,
  courseSubject: Subject,
  level: LevelTag,
): boolean {
  if (level === '전체') return true;
  const grade = student.diagnostic[courseSubject];
  if (!grade) return false;
  const gradeNum = parseInt(grade, 10);
  if (Number.isNaN(gradeNum)) return false;
  const m = level.match(/^(\d)/);
  if (!m) return false;
  const courseGrade = parseInt(m[1], 10);
  if (level.includes('이하')) return gradeNum >= courseGrade;
  if (level.includes('-')) {
    const m2 = level.match(/-(\d)/);
    const upper = m2 ? parseInt(m2[1], 10) : courseGrade;
    return gradeNum >= courseGrade && gradeNum <= upper;
  }
  return gradeNum === courseGrade;
}
