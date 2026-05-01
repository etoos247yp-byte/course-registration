import { describe, it, expect } from 'vitest';
import { formatKRW } from '../krw';

describe('formatKRW', () => {
  it('returns 무료 for 0', () => expect(formatKRW(0)).toBe('무료'));
  it('formats 100000 as 100,000원', () => expect(formatKRW(100000)).toBe('100,000원'));
});
