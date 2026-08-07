import { describe, expect, it } from 'vitest';
import { beijingDateKey, formatBeijingTime } from './date-time';

describe('Beijing time', () => {
  it('formats independently of the server timezone', () => {
    expect(formatBeijingTime('2026-08-07T00:00:00.000Z')).toContain('08:00:00');
  });

  it('uses the Beijing calendar date around UTC midnight', () => {
    expect(beijingDateKey('2026-08-06T16:30:00.000Z')).toBe('2026-08-07');
  });
});

