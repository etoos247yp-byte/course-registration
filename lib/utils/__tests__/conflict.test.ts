import { describe, it, expect } from 'vitest';
import { findConflict } from '../conflict';
import type { Course } from '@/lib/types';

const c1: Course = { id:'a', code:'a', cohortId:'co', subject:'국어', sub:'독서', type:'개념기출', level:'1-2등급', instructor:'k', textbook:'t', duration:10, season:'1', meetings:[{day:'월',block:'A'}], concept:'', objective:'' };
const c2: Course = { ...c1, id:'b', code:'b', meetings:[{day:'월',block:'B'}] };
const c3: Course = { ...c1, id:'c', code:'c', meetings:[{day:'월',block:'A'}] };

describe('findConflict', () => {
  it('returns null when no overlap', () => {
    expect(findConflict(c2, [c1])).toBeNull();
  });
  it('returns the overlapping course', () => {
    expect(findConflict(c3, [c1])?.id).toBe('a');
  });
  it('ignores self', () => {
    expect(findConflict(c1, [c1])).toBeNull();
  });
});
