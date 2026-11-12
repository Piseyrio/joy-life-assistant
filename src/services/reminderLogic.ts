import type { AppSettings } from '../types/models';
import {
  addHoursUtc,
  addMinutesUtc,
  getLocalDateKey,
  localHHmmToNextUtcMs,
  nowUtcMs,
} from '../utils/dates';
import { adjustForQuietHours } from '../utils/quietHours';

export type PlannedReminder = {
  kind: 'DEADLINE' | 'REPEAT_30M' | 'REPEAT_2H' | 'NEXT_MORNING' | 'SNOOZE' | 'EVENING_REVIEW';
  fireAt: number;
  repeatIndex: number;
  localDateKey: string;
  taskId: string | null;
};

const MAX_REPEATS_PER_TASK_PER_DAY = 3;

export function planTaskReminders(params: {
  taskId: string;
  dueAt: number;
  settings: AppSettings;
  existingRepeatCountForDay?: number;
  now?: number;
}): PlannedReminder[] {
  const now = params.now ?? nowUtcMs();
  const { taskId, dueAt, settings } = params;
  const planned: PlannedReminder[] = [];

  const deadlineFire = adjustForQuietHours(
    dueAt,
    settings.quietHoursStart,
    settings.quietHoursEnd,
  );
  if (deadlineFire > now) {
    planned.push({
      kind: 'DEADLINE',
      fireAt: deadlineFire,
      repeatIndex: 0,
      localDateKey: getLocalDateKey(deadlineFire),
      taskId,
    });
  }

  let repeatsUsed = params.existingRepeatCountForDay ?? 0;

  if (settings.reminderRepeatsEnabled && deadlineFire > now) {
    const candidates: { kind: PlannedReminder['kind']; at: number }[] = [
      { kind: 'REPEAT_30M', at: addMinutesUtc(dueAt, 30) },
      { kind: 'REPEAT_2H', at: addHoursUtc(dueAt, 2) },
    ];

    for (const c of candidates) {
      if (repeatsUsed >= MAX_REPEATS_PER_TASK_PER_DAY) break;
      const fireAt = adjustForQuietHours(c.at, settings.quietHoursStart, settings.quietHoursEnd);
      if (fireAt <= now) continue;
      // Count only repeat kinds toward the max-3 rule
      repeatsUsed += 1;
      planned.push({
        kind: c.kind,
        fireAt,
        repeatIndex: repeatsUsed,
        localDateKey: getLocalDateKey(fireAt),
        taskId,
      });
    }
  }

  if (settings.nextMorningEnabled && dueAt <= now) {
    // Overdue / past due → next morning nudge
    const morning = localHHmmToNextUtcMs(settings.nextMorningTime, now);
    const fireAt = adjustForQuietHours(morning, settings.quietHoursStart, settings.quietHoursEnd);
    planned.push({
      kind: 'NEXT_MORNING',
      fireAt,
      repeatIndex: 0,
      localDateKey: getLocalDateKey(fireAt),
      taskId,
    });
  } else if (settings.nextMorningEnabled) {
    // If due late in evening past quiet start, also schedule next morning
    const afterQuiet = adjustForQuietHours(dueAt, settings.quietHoursStart, settings.quietHoursEnd);
    if (afterQuiet !== dueAt) {
      const morning = localHHmmToNextUtcMs(settings.nextMorningTime, afterQuiet);
      planned.push({
        kind: 'NEXT_MORNING',
        fireAt: morning,
        repeatIndex: 0,
        localDateKey: getLocalDateKey(morning),
        taskId,
      });
    }
  }

  return planned;
}

export function planSnooze(params: {
  taskId: string;
  snoozeMinutes: number | 'tomorrow';
  settings: AppSettings;
  now?: number;
  existingRepeatCountForDay?: number;
}): PlannedReminder | null {
  const now = params.now ?? nowUtcMs();
  const repeatsUsed = params.existingRepeatCountForDay ?? 0;
  if (repeatsUsed >= MAX_REPEATS_PER_TASK_PER_DAY && params.snoozeMinutes !== 'tomorrow') {
    // Still allow tomorrow snooze as a fresh day
  }

  let raw: number;
  if (params.snoozeMinutes === 'tomorrow') {
    raw = localHHmmToNextUtcMs(params.settings.nextMorningTime, addHoursUtc(now, 12));
  } else {
    raw = addMinutesUtc(now, params.snoozeMinutes);
  }

  const fireAt = adjustForQuietHours(
    raw,
    params.settings.quietHoursStart,
    params.settings.quietHoursEnd,
  );

  const dateKey = getLocalDateKey(fireAt);
  const isSameDaySnooze = params.snoozeMinutes !== 'tomorrow';
  if (isSameDaySnooze && repeatsUsed >= MAX_REPEATS_PER_TASK_PER_DAY) {
    return null;
  }

  return {
    kind: 'SNOOZE',
    fireAt,
    repeatIndex: isSameDaySnooze ? repeatsUsed + 1 : 0,
    localDateKey: dateKey,
    taskId: params.taskId,
  };
}

export function planEveningReview(settings: AppSettings, now = nowUtcMs()): PlannedReminder | null {
  if (!settings.eveningReviewEnabled) return null;
  const raw = localHHmmToNextUtcMs(settings.eveningReviewTime, now);
  const fireAt = adjustForQuietHours(raw, settings.quietHoursStart, settings.quietHoursEnd);
  return {
    kind: 'EVENING_REVIEW',
    fireAt,
    repeatIndex: 0,
    localDateKey: getLocalDateKey(fireAt),
    taskId: null,
  };
}

export function canScheduleAnotherRepeat(existingCount: number): boolean {
  return existingCount < MAX_REPEATS_PER_TASK_PER_DAY;
}

export { MAX_REPEATS_PER_TASK_PER_DAY };
