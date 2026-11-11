import { addDays } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { APP_TIMEZONE } from './dates';

function parseHHmm(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { h, m };
}

function minutesOfDay(h: number, m: number): number {
  return h * 60 + m;
}

/** Returns true if local time falls inside quiet hours (supports overnight windows). */
export function isInQuietHours(
  utcMs: number,
  quietStart: string,
  quietEnd: string,
): boolean {
  const local = toZonedTime(new Date(utcMs), APP_TIMEZONE);
  const current = minutesOfDay(local.getHours(), local.getMinutes());
  const start = minutesOfDay(parseHHmm(quietStart).h, parseHHmm(quietStart).m);
  const end = minutesOfDay(parseHHmm(quietEnd).h, parseHHmm(quietEnd).m);

  if (start === end) return false;
  if (start < end) {
    return current >= start && current < end;
  }
  // Overnight e.g. 22:00–07:00
  return current >= start || current < end;
}

/**
 * If fireAt is inside quiet hours, shift to quietEnd on the same local day
 * (or next day if overnight window and fire is after midnight start).
 */
export function adjustForQuietHours(
  fireAtUtcMs: number,
  quietStart: string,
  quietEnd: string,
): number {
  if (!isInQuietHours(fireAtUtcMs, quietStart, quietEnd)) {
    return fireAtUtcMs;
  }

  const local = toZonedTime(new Date(fireAtUtcMs), APP_TIMEZONE);
  const { h, m } = parseHHmm(quietEnd);
  const start = parseHHmm(quietStart);
  const current = minutesOfDay(local.getHours(), local.getMinutes());
  const startMin = minutesOfDay(start.h, start.m);
  const endMin = minutesOfDay(h, m);

  let endLocal = new Date(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
    h,
    m,
    0,
    0,
  );

  // Overnight quiet hours: if currently after start (e.g. 23:00), end is next calendar morning
  if (startMin > endMin && current >= startMin) {
    endLocal = addDays(endLocal, 1);
  }

  return fromZonedTime(endLocal, APP_TIMEZONE).getTime();
}
