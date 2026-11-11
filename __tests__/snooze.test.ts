import { planSnooze } from '../src/services/reminderLogic';
import { DEFAULT_SETTINGS } from '../src/types/models';
import { fromZonedTime } from 'date-fns-tz';

function utcAtLocal(y: number, mo: number, d: number, h: number, mi: number): number {
  return fromZonedTime(new Date(y, mo - 1, d, h, mi, 0, 0), 'Asia/Phnom_Penh').getTime();
}

describe('snooze', () => {
  const settings = { ...DEFAULT_SETTINGS };

  it('snoozes by 15 / 30 / 60 minutes', () => {
    const now = utcAtLocal(2026, 3, 10, 10, 0);
    expect(planSnooze({ taskId: 't', snoozeMinutes: 15, settings, now })?.fireAt).toBe(
      now + 15 * 60_000,
    );
    expect(planSnooze({ taskId: 't', snoozeMinutes: 30, settings, now })?.fireAt).toBe(
      now + 30 * 60_000,
    );
    expect(planSnooze({ taskId: 't', snoozeMinutes: 60, settings, now })?.fireAt).toBe(
      now + 60 * 60_000,
    );
  });

  it('tomorrow snooze uses next morning time', () => {
    const now = utcAtLocal(2026, 3, 10, 21, 0);
    const planned = planSnooze({
      taskId: 't',
      snoozeMinutes: 'tomorrow',
      settings: { ...settings, nextMorningTime: '08:00' },
      now,
    });
    expect(planned?.kind).toBe('SNOOZE');
    expect(planned!.fireAt).toBeGreaterThan(now);
  });
});
