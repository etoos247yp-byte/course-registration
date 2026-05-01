import { describe, it, expect } from 'vitest';
import { dDay } from '../dday';

describe('dDay', () => {
  it('counts days from now to target', () => {
    expect(dDay(new Date('2026-04-28'), new Date('2026-06-04'))).toBe(37);
  });
  it('returns 0 on the day', () => {
    expect(dDay(new Date('2026-06-04'), new Date('2026-06-04'))).toBe(0);
  });
  it('returns negative after target', () => {
    expect(dDay(new Date('2026-06-05'), new Date('2026-06-04'))).toBe(-1);
  });
});
