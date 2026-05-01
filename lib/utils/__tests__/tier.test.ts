import { describe, it, expect } from 'vitest';
import { getTier } from '../tier';

const tiers = [
  { id: 'A' as const, min: 1, max: 3, fee: 0 },
  { id: 'B' as const, min: 4, max: 6, fee: 100000 },
  { id: 'C' as const, min: 7, max: 9, fee: 200000 },
  { id: 'D' as const, min: 10, max: 99, fee: 300000 },
];

describe('getTier', () => {
  it('returns null for 0 courses', () => expect(getTier(0, tiers)).toBeNull());
  it('returns A for 2 courses', () => expect(getTier(2, tiers)?.id).toBe('A'));
  it('returns D for 15 courses', () => expect(getTier(15, tiers)?.id).toBe('D'));
});
