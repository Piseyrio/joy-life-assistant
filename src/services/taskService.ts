import { and, asc, desc, eq, gte, inArray, isNotNull, lt, lte, ne, or, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import { notes, reminders, taskActivity, tasks, type Task } from '../db/schema';
import type { TaskPriority, TaskStatus } from '../types/models';
import { createId } from '../utils/ids';
import { endOfTodayUtcMs, nowUtcMs, startOfTodayUtcMs } from '../utils/dates';

export type CreateTaskInput = {
  title: string;
  notes?: string | null;
  priority?: TaskPriority;
  dueAt?: number | null;
  status?: TaskStatus;
  projectId?: string | null;
};

export type UpdateTaskInput = {
  title?: string;
  notes?: string | null;
  priority?: TaskPriority;
  dueAt?: number | null;
  status?: TaskStatus;
  projectId?: string | null;
};

async function logActivity(taskId: string, action: string, detail?: string): Promise<void> {
  const db = getDb();
  await db.insert(taskActivity).values({
    id: createId(),
    taskId,
    action,
    detail: detail ?? null,
    createdAt: nowUtcMs(),
  });
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const db = getDb();
  const now = nowUtcMs();
  const title = input.title.trim();
  if (!title) throw new Error('Title is required');

  const row: Task = {
    id: createId(),
    title,
    notes: input.notes?.trim() || null,
    status: input.status ?? 'TODO',
    priority: input.priority ?? 'MEDIUM',
    projectId: input.projectId ?? null,
    dueAt: input.dueAt ?? null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  await db.transaction(async (tx) => {
    await tx.insert(tasks).values(row);
    await tx.insert(taskActivity).values({
      id: createId(),
      taskId: row.id,
      action: 'CREATED',
      detail: null,
      createdAt: now,
    });
  });

  return row;
}

export async function quickCapture(title: string): Promise<Task> {
  return createTask({ title, status: 'TODO', priority: 'MEDIUM' });
}

export async function getTask(id: string): Promise<Task | null> {
  const db = getDb();
  const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listInboxTasks(): Promise<Task[]> {
  const db = getDb();
  return db
    .select()
    .from(tasks)
    .where(and(ne(tasks.status, 'DONE'), ne(tasks.status, 'CANCELLED')))
    .orderBy(desc(tasks.updatedAt));
}

export async function listAllActiveTasks(): Promise<Task[]> {
  return listInboxTasks();
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const db = getDb();
  const existing = await getTask(id);
  if (!existing) throw new Error('Task not found');

  const now = nowUtcMs();
  const nextStatus = input.status ?? existing.status;
  const patch: Partial<Task> = {
    updatedAt: now,
  };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.dueAt !== undefined) patch.dueAt = input.dueAt;
  if (input.projectId !== undefined) patch.projectId = input.projectId;
  if (input.status !== undefined) {
    patch.status = input.status;
    if (input.status === 'DONE') patch.completedAt = now;
    if (input.status !== 'DONE') patch.completedAt = null;
  }

  await db.transaction(async (tx) => {
    await tx.update(tasks).set(patch).where(eq(tasks.id, id));
    await tx.insert(taskActivity).values({
      id: createId(),
      taskId: id,
      action: input.status && input.status !== existing.status ? `STATUS_${input.status}` : 'UPDATED',
      detail: JSON.stringify(input),
      createdAt: now,
    });
  });

  const updated = await getTask(id);
  if (!updated) throw new Error('Task missing after update');
  void nextStatus;
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  const db = getDb();
  const existing = await getTask(id);
  if (!existing) return;

  await db.transaction(async (tx) => {
    await tx.insert(taskActivity).values({
      id: createId(),
      taskId: id,
      action: 'DELETED',
      detail: existing.title,
      createdAt: nowUtcMs(),
    });
    // Soft-cancel via status to avoid unexpected hard deletes of history; remove task row only after activity
    // Spec allows delete with confirmation — remove task; keep activity (FK: activity references task).
    // To satisfy FK, delete activity for this task first then task, OR keep task as CANCELLED.
    // Product: delete with confirmation — we cancel + mark deleted activity without hard-deleting history.
    await tx.update(tasks).set({ status: 'CANCELLED', updatedAt: nowUtcMs() }).where(eq(tasks.id, id));
  });
}

/** Hard delete used only when user confirms permanent remove from Inbox. Related rows removed in one transaction. */
export async function permanentlyDeleteTask(id: string): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(reminders).where(eq(reminders.taskId, id));
    await tx.delete(notes).where(eq(notes.taskId, id));
    await tx.delete(taskActivity).where(eq(taskActivity.taskId, id));
    await tx.delete(tasks).where(eq(tasks.id, id));
  });
}

export async function completeTask(id: string): Promise<Task> {
  return updateTask(id, { status: 'DONE' });
}

export async function getTodayDashboard(): Promise<{
  overdue: Task[];
  dueToday: Task[];
  topPriorities: Task[];
  completedToday: Task[];
}> {
  const db = getDb();
  const start = startOfTodayUtcMs();
  const end = endOfTodayUtcMs();
  const now = nowUtcMs();

  const open = await db
    .select()
    .from(tasks)
    .where(and(ne(tasks.status, 'DONE'), ne(tasks.status, 'CANCELLED')));

  const overdue = open
    .filter((t) => t.dueAt != null && t.dueAt < start)
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));

  const dueToday = open
    .filter((t) => t.dueAt != null && t.dueAt >= start && t.dueAt <= end)
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));

  const priorityRank: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const topPriorities = [...open]
    .sort((a, b) => {
      const pr = (priorityRank[a.priority] ?? 9) - (priorityRank[b.priority] ?? 9);
      if (pr !== 0) return pr;
      return (a.dueAt ?? Number.MAX_SAFE_INTEGER) - (b.dueAt ?? Number.MAX_SAFE_INTEGER);
    })
    .slice(0, 3);

  const completedToday = await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.status, 'DONE'),
        isNotNull(tasks.completedAt),
        gte(tasks.completedAt, start),
        lte(tasks.completedAt, end),
      ),
    )
    .orderBy(desc(tasks.completedAt));

  void now;
  return { overdue, dueToday, topPriorities, completedToday };
}

export async function getTaskActivity(taskId: string) {
  const db = getDb();
  return db
    .select()
    .from(taskActivity)
    .where(eq(taskActivity.taskId, taskId))
    .orderBy(desc(taskActivity.createdAt));
}

// Helpers kept for tests / queries
export async function countTasks(): Promise<number> {
  const db = getDb();
  const rows = await db.select({ c: sql<number>`count(*)` }).from(tasks);
  return Number(rows[0]?.c ?? 0);
}

export { and, asc, desc, eq, gte, inArray, lt, lte, or };
