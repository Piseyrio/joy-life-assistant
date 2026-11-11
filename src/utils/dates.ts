import { addDays, addHours, addMinutes, format, startOfDay, endOfDay } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export const APP_TIMEZONE = 'Asia/Phnom_Penh';

export function nowUtcMs(): number {
  return Date.now();
}

export function toPhnomPenh(date: Date | number): Date {
  return toZonedTime(typeof date === 'number' ? new Date(date) : date, APP_TIMEZONE);
}

export function formatInPhnomPenh(utcMs: number, pattern = 'EEE, MMM d · HH:mm'): string {
  return format(toPhnomPenh(utcMs), pattern);
}

export function startOfTodayUtcMs(): number {
  const local = toPhnomPenh(Date.now());
  const startLocal = startOfDay(local);
  return fromZonedTime(startLocal, APP_TIMEZONE).getTime();
}

export function endOfTodayUtcMs(): number {
  const local = toPhnomPenh(Date.now());
  const endLocal = endOfDay(local);
  return fromZonedTime(endLocal, APP_TIMEZONE).getTime();
}

export function parseLocalDateTimeToUtcMs(date: Date, hours: number, minutes: number): number {
  const local = toPhnomPenh(date);
  const withTime = new Date(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
    hours,
    minutes,
    0,
    0,
  );
  return fromZonedTime(withTime, APP_TIMEZONE).getTime();
}

export function localHHmmToNextUtcMs(hhmm: string, fromUtcMs = Date.now()): number {
  const [h, m] = hhmm.split(':').map(Number);
  const local = toPhnomPenh(fromUtcMs);
  let candidate = new Date(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
    h,
    m,
    0,
    0,
  );
  let utc = fromZonedTime(candidate, APP_TIMEZONE).getTime();
  if (utc <= fromUtcMs) {
    candidate = addDays(candidate, 1);
    utc = fromZonedTime(candidate, APP_TIMEZONE).getTime();
  }
  return utc;
}

export function addMinutesUtc(utcMs: number, minutes: number): number {
  return addMinutes(new Date(utcMs), minutes).getTime();
}

export function addHoursUtc(utcMs: number, hours: number): number {
  return addHours(new Date(utcMs), hours).getTime();
}

export function addDaysUtc(utcMs: number, days: number): number {
  return addDays(new Date(utcMs), days).getTime();
}

export function getLocalDateKey(utcMs: number): string {
  return format(toPhnomPenh(utcMs), 'yyyy-MM-dd');
}
