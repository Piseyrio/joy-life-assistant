import { and, gte, isNotNull, lte, ne } from 'drizzle-orm';
import { addDays, startOfDay, endOfDay } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { getDb } from '../db/client';
import { tasks, type Task } from '../db/schema';
import { APP_TIMEZONE, getLocalDateKey, toPhnomPenh } from '../utils/dates';

function startOfLocalDayUtc(utcMs: number): number {
  const local = toPhnomPenh(utcMs);
  return fromZonedTime(startOfDay(local), APP_TIMEZONE).getTime();
}

function endOfLocalDayUtc(utcMs: number): number {
  const local = toPhnomPenh(utcMs);
  return fromZonedTime(endOfDay(local), APP_TIMEZONE).getTime();
}

export type AgendaDay = {
  dateKey: string;
  label: string;
  tasks: Task[];
};

export async function getDayAgenda(utcMs = Date.now()): Promise<AgendaDay> {
  const start = startOfLocalDayUtc(utcMs);
  const end = endOfLocalDayUtc(utcMs);
  const rows = await getDb()
    .select()
    .from(tasks)
    .where(
      and(
        isNotNull(tasks.dueAt),
        gte(tasks.dueAt, start),
        lte(tasks.dueAt, end),
        ne(tasks.status, 'CANCELLED'),
      ),
    );
  const sorted = rows.sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));
  return {
    dateKey: getLocalDateKey(utcMs),
    label: getLocalDateKey(utcMs),
    tasks: sorted,
  };
}

export async function getWeekAgenda(utcMs = Date.now()): Promise<AgendaDay[]> {
  const startLocal = startOfDay(toPhnomPenh(utcMs));
  const days: AgendaDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dayLocal = addDays(startLocal, i);
    const dayUtc = fromZonedTime(dayLocal, APP_TIMEZONE).getTime();
    days.push(await getDayAgenda(dayUtc));
  }
  return days;
}
