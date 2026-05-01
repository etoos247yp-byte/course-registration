import { describe, it, expect } from 'vitest';
import { parseDOB6, formatKDate } from '../kdate';

describe('parseDOB6', () => {
  it('parses 070318 as 2007-03-18', () => {
    expect(parseDOB6('070318')).toBe('2007-03-18');
  });
  it('parses 990318 as 1999-03-18', () => {
    expect(parseDOB6('990318')).toBe('1999-03-18');
  });
  it('parses 250101 as 2025-01-01', () => {
    expect(parseDOB6('250101')).toBe('2025-01-01');
  });
  it('parses 310101 as 1931-01-01 (boundary)', () => {
    expect(parseDOB6('310101')).toBe('1931-01-01');
  });
  it('returns null for invalid length', () => {
    expect(parseDOB6('07031')).toBeNull();
    expect(parseDOB6('0703180')).toBeNull();
  });
  it('returns null for invalid date', () => {
    expect(parseDOB6('070230')).toBeNull();
    expect(parseDOB6('071332')).toBeNull();
  });
});

describe('formatKDate', () => {
  it('formats ISO to M/D (요일) HH:mm', () => {
    expect(formatKDate('2026-05-02T23:59:00')).toBe('5/2 (토) 23:59');
  });
});
