import { adjustForQuietHours, isInQuietHours } from '../src/utils/quietHours';
import { fromZonedTime } from 'date-fns-tz';

const TZ = 'Asia/Phnom_Penh';

function utcAtLocal(y: number, mo: number, d: number, h: number, mi: number): number {
  return fromZonedTime(new Date(y, mo - 1, d, h, mi, 0, 0), TZ).getTime();
}

describe('quiet hours', () => {
  it('detects overnight quiet window', () => {
    const late = utcAtLocal(2026, 3, 10, 23, 0);
    const early = utcAtLocal(2026, 3, 11, 6, 0);
    const noon = utcAtLocal(2026, 3, 11, 12, 0);
    expect(isInQuietHours(late, '22:00', '07:00')).toBe(true);
    expect(isInQuietHours(early, '22:00', '07:00')).toBe(true);
    expect(isInQuietHours(noon, '22:00', '07:00')).toBe(false);
  });

  it('shifts fire time to quiet end next morning when overnight', () => {
    const late = utcAtLocal(2026, 3, 10, 23, 30);
    const adjusted = adjustForQuietHours(late, '22:00', '07:00');
    const expected = utcAtLocal(2026, 3, 11, 7, 0);
    expect(adjusted).toBe(expected);
  });

  it('leaves times outside quiet hours unchanged', () => {
    const afternoon = utcAtLocal(2026, 3, 10, 15, 0);
    expect(adjustForQuietHours(afternoon, '22:00', '07:00')).toBe(afternoon);
  });
});
