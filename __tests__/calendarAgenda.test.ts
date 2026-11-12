import { formatInPhnomPenh, getLocalDateKey } from '../src/utils/dates';

describe('calendar agenda helpers', () => {
  it('builds a stable local date key in Asia/Phnom_Penh', () => {
    // 2026-03-20 10:00 +07 → same calendar day key
    const utc = Date.UTC(2026, 2, 20, 3, 0, 0);
    expect(getLocalDateKey(utc)).toBe('2026-03-20');
    expect(formatInPhnomPenh(utc, 'yyyy-MM-dd')).toBe('2026-03-20');
  });
});
