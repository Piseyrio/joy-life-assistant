import {
  canScheduleAnotherRepeat,
  MAX_REPEATS_PER_TASK_PER_DAY,
  planEveningReview,
  planSnooze,
  planTaskReminders,
} from '../src/services/reminderLogic';
import { DEFAULT_SETTINGS } from '../src/types/models';
import { fromZonedTime } from 'date-fns-tz';

const TZ = 'Asia/Phnom_Penh';
function utcAtLocal(y: number, mo: number, d: number, h: number, mi: number): number {
  return fromZonedTime(new Date(y, mo - 1, d, h, mi, 0, 0), TZ).getTime();
}

describe('reminder scheduling logic', () => {
  const settings = {
    ...DEFAULT_SETTINGS,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    reminderRepeatsEnabled: true,
    nextMorningEnabled: true,
  };

  it('plans deadline + repeat reminders', () => {
    const now = utcAtLocal(2026, 3, 10, 10, 0);
    const dueAt = utcAtLocal(2026, 3, 10, 14, 0);
    const planned = planTaskReminders({
      taskId: 't1',
      dueAt,
      settings,
      now,
    });
    const kinds = planned.map((p) => p.kind);
    expect(kinds).toContain('DEADLINE');
    expect(kinds).toContain('REPEAT_30M');
    expect(kinds).toContain('REPEAT_2H');
  });

  it('respects max 3 repeats per task per day for snooze', () => {
    expect(canScheduleAnotherRepeat(2)).toBe(true);
    expect(canScheduleAnotherRepeat(3)).toBe(false);
    expect(MAX_REPEATS_PER_TASK_PER_DAY).toBe(3);

    const now = utcAtLocal(2026, 3, 10, 10, 0);
    const blocked = planSnooze({
      taskId: 't1',
      snoozeMinutes: 15,
      settings,
      now,
      existingRepeatCountForDay: 3,
    });
    expect(blocked).toBeNull();

    const allowed = planSnooze({
      taskId: 't1',
      snoozeMinutes: 15,
      settings,
      now,
      existingRepeatCountForDay: 2,
    });
    expect(allowed?.kind).toBe('SNOOZE');
  });

  it('plans evening review when enabled', () => {
    const now = utcAtLocal(2026, 3, 10, 10, 0);
    const planned = planEveningReview(settings, now);
    expect(planned?.kind).toBe('EVENING_REVIEW');
    expect(planEveningReview({ ...settings, eveningReviewEnabled: false }, now)).toBeNull();
  });

  it('shifts deadline into quiet-hours end', () => {
    const now = utcAtLocal(2026, 3, 10, 10, 0);
    const dueAt = utcAtLocal(2026, 3, 10, 23, 0);
    const planned = planTaskReminders({ taskId: 't1', dueAt, settings, now });
    const deadline = planned.find((p) => p.kind === 'DEADLINE');
    expect(deadline).toBeTruthy();
    expect(deadline!.fireAt).toBe(utcAtLocal(2026, 3, 11, 7, 0));
  });
});
