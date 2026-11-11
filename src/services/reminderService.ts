import { and, eq, inArray, ne } from 'drizzle-orm';
import { getDb } from '../db/client';
import { notificationHistory, reminders, tasks, type Reminder } from '../db/schema';
import { createId } from '../utils/ids';
import { getLocalDateKey, nowUtcMs } from '../utils/dates';
import { getSettings } from './settingsService';
import {
  planEveningReview,
  planSnooze,
  planTaskReminders,
  MAX_REPEATS_PER_TASK_PER_DAY,
} from './reminderLogic';
import {
  cancelNotification,
  getAllScheduled,
  scheduleLocalNotification,
  cancelAllScheduled,
} from './notificationService';

async function countRepeatsForTaskDay(taskId: string, localDateKey: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.taskId, taskId),
        eq(reminders.localDateKey, localDateKey),
        inArray(reminders.kind, ['REPEAT_30M', 'REPEAT_2H', 'SNOOZE']),
        ne(reminders.status, 'CANCELLED'),
      ),
    );
  return rows.length;
}

async function logHistory(params: {
  reminderId?: string | null;
  taskId?: string | null;
  title: string;
  body?: string;
  event: string;
}): Promise<void> {
  const db = getDb();
  await db.insert(notificationHistory).values({
    id: createId(),
    reminderId: params.reminderId ?? null,
    taskId: params.taskId ?? null,
    title: params.title,
    body: params.body ?? null,
    event: params.event,
    createdAt: nowUtcMs(),
  });
}

export async function cancelTaskReminders(taskId: string): Promise<void> {
  const db = getDb();
  const rows = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.taskId, taskId), eq(reminders.status, 'PENDING')));

  for (const r of rows) {
    if (r.notificationId) await cancelNotification(r.notificationId);
  }

  const now = nowUtcMs();
  if (rows.length) {
    await db
      .update(reminders)
      .set({ status: 'CANCELLED', updatedAt: now })
      .where(and(eq(reminders.taskId, taskId), eq(reminders.status, 'PENDING')));
  }

  await logHistory({
    taskId,
    title: 'Reminders cancelled',
    event: 'CANCELLED_ALL_FOR_TASK',
  });
}

export async function scheduleRemindersForTask(taskId: string): Promise<Reminder[]> {
  const db = getDb();
  const taskRows = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  const task = taskRows[0];
  if (!task) return [];
  if (task.status === 'DONE' || task.status === 'CANCELLED') {
    await cancelTaskReminders(taskId);
    return [];
  }
  if (task.dueAt == null) {
    await cancelTaskReminders(taskId);
    return [];
  }

  await cancelTaskReminders(taskId);

  const settings = await getSettings();
  const dateKey = getLocalDateKey(task.dueAt);
  const existingRepeats = await countRepeatsForTaskDay(taskId, dateKey);
  const planned = planTaskReminders({
    taskId,
    dueAt: task.dueAt,
    settings,
    existingRepeatCountForDay: existingRepeats,
  });

  const created: Reminder[] = [];
  const now = nowUtcMs();

  for (const p of planned) {
    if (p.kind !== 'DEADLINE' && p.kind !== 'NEXT_MORNING') {
      const repeats = await countRepeatsForTaskDay(taskId, p.localDateKey);
      if (repeats >= MAX_REPEATS_PER_TASK_PER_DAY) continue;
    }

    const reminderId = createId();
    const title = 'Joy reminder';
    const body =
      p.kind === 'EVENING_REVIEW'
        ? "Pick tomorrow's top 3"
        : p.kind === 'NEXT_MORNING'
          ? `Still open: ${task.title}`
          : task.title;

    let notificationId: string | null = null;
    try {
      notificationId = await scheduleLocalNotification({
        title,
        body,
        fireAtUtcMs: p.fireAt,
        data: { reminderId, taskId, kind: p.kind },
      });
    } catch {
      notificationId = null;
    }

    const row: Reminder = {
      id: reminderId,
      taskId,
      kind: p.kind,
      fireAt: p.fireAt,
      status: 'PENDING',
      repeatIndex: p.repeatIndex,
      notificationId,
      localDateKey: p.localDateKey,
      createdAt: now,
      updatedAt: now,
    };
    await db.insert(reminders).values(row);
    await logHistory({
      reminderId,
      taskId,
      title,
      body,
      event: 'SCHEDULED',
    });
    created.push(row);
  }

  return created;
}

export async function snoozeTask(
  taskId: string,
  snooze: 15 | 30 | 60 | 'tomorrow',
): Promise<Reminder | null> {
  const settings = await getSettings();
  const now = nowUtcMs();
  const dateKey = getLocalDateKey(now);
  const existingRepeats = await countRepeatsForTaskDay(taskId, dateKey);
  const planned = planSnooze({
    taskId,
    snoozeMinutes: snooze === 'tomorrow' ? 'tomorrow' : snooze,
    settings,
    now,
    existingRepeatCountForDay: existingRepeats,
  });
  if (!planned) return null;

  // Cancel pending for this task then add snooze
  await cancelTaskReminders(taskId);

  const db = getDb();
  const taskRows = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  const task = taskRows[0];
  const title = 'Joy reminder (snoozed)';
  const body = task?.title ?? 'Task reminder';

  const reminderId = createId();
  let notificationId: string | null = null;
  try {
    notificationId = await scheduleLocalNotification({
      title,
      body,
      fireAtUtcMs: planned.fireAt,
      data: { reminderId, taskId, kind: 'SNOOZE' },
    });
  } catch {
    notificationId = null;
  }

  const row: Reminder = {
    id: reminderId,
    taskId,
    kind: 'SNOOZE',
    fireAt: planned.fireAt,
    status: 'PENDING',
    repeatIndex: planned.repeatIndex,
    notificationId,
    localDateKey: planned.localDateKey,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(reminders).values(row);
  await logHistory({ reminderId, taskId, title, body, event: 'SNOOZED' });
  return row;
}

export async function scheduleEveningReview(): Promise<Reminder | null> {
  const db = getDb();
  const settings = await getSettings();

  // Cancel existing evening review pending
  const existing = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.kind, 'EVENING_REVIEW'), eq(reminders.status, 'PENDING')));
  for (const r of existing) {
    if (r.notificationId) await cancelNotification(r.notificationId);
    await db
      .update(reminders)
      .set({ status: 'CANCELLED', updatedAt: nowUtcMs() })
      .where(eq(reminders.id, r.id));
  }

  const planned = planEveningReview(settings);
  if (!planned) return null;

  const reminderId = createId();
  const title = 'Evening review';
  const body = "Pick tomorrow's top 3";
  let notificationId: string | null = null;
  try {
    notificationId = await scheduleLocalNotification({
      title,
      body,
      fireAtUtcMs: planned.fireAt,
      data: { reminderId, kind: 'EVENING_REVIEW' },
    });
  } catch {
    notificationId = null;
  }

  const now = nowUtcMs();
  const row: Reminder = {
    id: reminderId,
    taskId: null,
    kind: 'EVENING_REVIEW',
    fireAt: planned.fireAt,
    status: 'PENDING',
    repeatIndex: 0,
    notificationId,
    localDateKey: planned.localDateKey,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(reminders).values(row);
  await logHistory({ reminderId, title, body, event: 'SCHEDULED_EVENING_REVIEW' });
  return row;
}

/**
 * Reconcile OS scheduled notifications with SQLite pending reminders.
 * - Cancels OS notifications not referenced by pending rows
 * - Schedules missing notifications for pending rows without notificationId or missing from OS
 * - Avoids duplicates by using reminder.notificationId as the single OS handle
 */
export async function reconcileNotifications(): Promise<{
  cancelledOrphanOs: number;
  rescheduled: number;
  pending: number;
}> {
  const db = getDb();
  const pending = await db.select().from(reminders).where(eq(reminders.status, 'PENDING'));
  const scheduled = await getAllScheduled();
  const osIds = new Set(scheduled.map((s) => s.identifier));
  const knownIds = new Set(
    pending.map((p) => p.notificationId).filter((id): id is string => Boolean(id)),
  );

  let cancelledOrphanOs = 0;
  for (const s of scheduled) {
    if (!knownIds.has(s.identifier)) {
      await cancelNotification(s.identifier);
      cancelledOrphanOs += 1;
    }
  }

  let rescheduled = 0;
  const now = nowUtcMs();
  for (const r of pending) {
    if (r.fireAt <= now) continue;
    const missing = !r.notificationId || !osIds.has(r.notificationId);
    if (!missing) continue;

    if (r.notificationId) {
      await cancelNotification(r.notificationId);
    }

    let title = 'Joy reminder';
    let body = 'You have something coming up';
    if (r.kind === 'EVENING_REVIEW') {
      title = 'Evening review';
      body = "Pick tomorrow's top 3";
    } else if (r.taskId) {
      const taskRows = await db.select().from(tasks).where(eq(tasks.id, r.taskId)).limit(1);
      if (taskRows[0]) body = taskRows[0].title;
    }

    let notificationId: string | null = null;
    try {
      notificationId = await scheduleLocalNotification({
        title,
        body,
        fireAtUtcMs: r.fireAt,
        data: { reminderId: r.id, taskId: r.taskId, kind: r.kind },
      });
      rescheduled += 1;
    } catch {
      notificationId = null;
    }

    await db
      .update(reminders)
      .set({ notificationId, updatedAt: nowUtcMs() })
      .where(eq(reminders.id, r.id));
    await logHistory({
      reminderId: r.id,
      taskId: r.taskId,
      title,
      body,
      event: 'RECONCILED',
    });
  }

  // Ensure evening review exists per settings
  await scheduleEveningReview();

  const stillPending = await db.select().from(reminders).where(eq(reminders.status, 'PENDING'));
  return { cancelledOrphanOs, rescheduled, pending: stillPending.length };
}

export async function listNotificationHistory(limit = 100) {
  const db = getDb();
  const { desc } = await import('drizzle-orm');
  return db
    .select()
    .from(notificationHistory)
    .orderBy(desc(notificationHistory.createdAt))
    .limit(limit);
}

export async function wipeAllOsNotificationsForTests(): Promise<void> {
  await cancelAllScheduled();
}
