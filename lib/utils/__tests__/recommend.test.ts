import { describe, it, expect } from 'vitest';
import { isRecommendedForStudent } from '../recommend';
import type { Student } from '@/lib/types';

const s: Student = { id:'s', name:'a', dob:'2007-03-18', cohortId:'co', diagnostic:{ 국어:'3등급', 수학:'4등급', 영어:'2등급', 탐구:'3등급' }, electives:{} };

describe('isRecommendedForStudent', () => {
  it('matches range like 3-4등급', () => {
    expect(isRecommendedForStudent(s, '국어', '3-4등급')).toBe(true);
    expect(isRecommendedForStudent(s, '국어', '1-2등급')).toBe(false);
  });
  it('matches 이하 like 5등급 이하', () => {
    expect(isRecommendedForStudent(s, '수학', '5등급 이하')).toBe(false);
    expect(isRecommendedForStudent(s, '수학', '3등급 이하')).toBe(true);
  });
  it('전체 always recommended', () => {
    expect(isRecommendedForStudent(s, '영어', '전체')).toBe(true);
  });
});
