import { describe, it, expect } from 'vitest';
import { parseShortDate, formatDisplay, calculateAutoCloseDate } from '../date-shorthand';

describe('parseShortDate', () => {
  const year = 2026;

  describe('month/day shorthand', () => {
    it('parses 5/12 as 2026-05-12T00:00', () => {
      expect(parseShortDate('5/12', year)).toBe('2026-05-12T00:00');
    });
    it('parses 5-12 as 2026-05-12T00:00', () => {
      expect(parseShortDate('5-12', year)).toBe('2026-05-12T00:00');
    });
    it('parses 5/12 14 as 2026-05-12T14:00', () => {
      expect(parseShortDate('5/12 14', year)).toBe('2026-05-12T14:00');
    });
    it('parses 5/12 14:30 as 2026-05-12T14:30', () => {
      expect(parseShortDate('5/12 14:30', year)).toBe('2026-05-12T14:30');
    });
    it('parses 5-12 14:30 as 2026-05-12T14:30', () => {
      expect(parseShortDate('5-12 14:30', year)).toBe('2026-05-12T14:30');
    });
    it('parses 12/25 as 2026-12-25T00:00', () => {
      expect(parseShortDate('12/25', year)).toBe('2026-12-25T00:00');
    });
  });

  describe('numeric input', () => {
    it('parses 0512 as 2026-05-12T00:00', () => {
      expect(parseShortDate('0512', year)).toBe('2026-05-12T00:00');
    });
    it('parses 1225 as 2026-12-25T00:00', () => {
      expect(parseShortDate('1225', year)).toBe('2026-12-25T00:00');
    });
    it('parses 051214 as 2026-05-12T14:00', () => {
      expect(parseShortDate('051214', year)).toBe('2026-05-12T14:00');
    });
    it('parses 05121430 as 2026-05-12T14:30', () => {
      expect(parseShortDate('05121430', year)).toBe('2026-05-12T14:30');
    });
  });

  describe('natural language shortcuts', () => {
    it('parses today as current date 00:00 by default', () => {
      const result = parseShortDate('today', year);
      expect(result).not.toBeNull();
      expect(result!.endsWith('T00:00')).toBe(true);
    });
    it('parses tomorrow as next day 00:00 by default', () => {
      const result = parseShortDate('tomorrow', year);
      expect(result).not.toBeNull();
      expect(result!.endsWith('T00:00')).toBe(true);
    });
    it('parses 오늘 as current date 00:00 by default', () => {
      const result = parseShortDate('오늘', year);
      expect(result).not.toBeNull();
      expect(result!.endsWith('T00:00')).toBe(true);
    });
    it('parses 내일 as next day 00:00 by default', () => {
      const result = parseShortDate('내일', year);
      expect(result).not.toBeNull();
      expect(result!.endsWith('T00:00')).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('returns null for empty string', () => {
      expect(parseShortDate('', year)).toBeNull();
    });
    it('returns null for whitespace only', () => {
      expect(parseShortDate('   ', year)).toBeNull();
    });
    it('returns null for invalid date like 13/01', () => {
      expect(parseShortDate('13/01', year)).toBeNull();
    });
    it('returns null for invalid date like 2/30', () => {
      expect(parseShortDate('2/30', year)).toBeNull();
    });
    it('returns null for random text', () => {
      expect(parseShortDate('hello', year)).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('pads single-digit month and day in shorthand', () => {
      expect(parseShortDate('3/5', year)).toBe('2026-03-05T00:00');
    });
    it('strips surrounding whitespace', () => {
      expect(parseShortDate('  5/12  ', year)).toBe('2026-05-12T00:00');
    });
  });

  describe('start vs end defaulting', () => {
    it('defaults to 00:00 for start type when no time specified', () => {
      expect(parseShortDate('5/12', year, 'start')).toBe('2026-05-12T00:00');
    });
    it('defaults to 23:59 for end type when no time specified', () => {
      expect(parseShortDate('5/12', year, 'end')).toBe('2026-05-12T23:59');
    });
    it('defaults 0512 to 00:00 for start type', () => {
      expect(parseShortDate('0512', year, 'start')).toBe('2026-05-12T00:00');
    });
    it('defaults 0512 to 23:59 for end type', () => {
      expect(parseShortDate('0512', year, 'end')).toBe('2026-05-12T23:59');
    });
    it('registers explicit time regardless of type (shorthand)', () => {
      expect(parseShortDate('5/12 14:30', year, 'start')).toBe('2026-05-12T14:30');
      expect(parseShortDate('5/12 14:30', year, 'end')).toBe('2026-05-12T14:30');
    });
    it('registers explicit time regardless of type (8-digit)', () => {
      expect(parseShortDate('05121430', year, 'start')).toBe('2026-05-12T14:30');
      expect(parseShortDate('05121430', year, 'end')).toBe('2026-05-12T14:30');
    });
    it('registers explicit hour regardless of type (6-digit)', () => {
      expect(parseShortDate('051214', year, 'start')).toBe('2026-05-12T14:00');
      expect(parseShortDate('051214', year, 'end')).toBe('2026-05-12T14:00');
    });
    it('defaults shortcuts to 00:00 for start type', () => {
      const result = parseShortDate('today', year, 'start');
      expect(result!.endsWith('T00:00')).toBe(true);
    });
    it('defaults shortcuts to 23:59 for end type', () => {
      const result = parseShortDate('today', year, 'end');
      expect(result!.endsWith('T23:59')).toBe(true);
    });
  });
});

describe('formatDisplay', () => {
  it('formats datetime-local to Korean readable format', () => {
    expect(formatDisplay('2026-05-12T14:30')).toBe('2026년 05월 12일 14:30');
  });
  it('returns input as-is when no T present', () => {
    expect(formatDisplay('2026-05-12')).toBe('2026-05-12');
  });
});

describe('calculateAutoCloseDate', () => {
  it('adds 9 days to May 1st', () => {
    expect(calculateAutoCloseDate('2026-05-01')).toBe('2026-05-10T23:59');
  });
  it('adds 9 days crossing month boundary', () => {
    expect(calculateAutoCloseDate('2026-01-25')).toBe('2026-02-03T23:59');
  });
  it('adds 9 days crossing year boundary', () => {
    expect(calculateAutoCloseDate('2026-12-28')).toBe('2027-01-06T23:59');
  });
  it('returns empty string for empty input', () => {
    expect(calculateAutoCloseDate('')).toBe('');
  });
  it('returns empty string for invalid input', () => {
    expect(calculateAutoCloseDate('not-a-date')).toBe('');
  });
});
