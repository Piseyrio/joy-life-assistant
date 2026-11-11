import { and, desc, eq, isNull } from 'drizzle-orm';
import { getDb } from '../db/client';
import { projects, tasks, type Project, type Task } from '../db/schema';
import { createId } from '../utils/ids';
import { nowUtcMs } from '../utils/dates';

export async function createProject(name: string, color = '#3B9EFF'): Promise<Project> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Project name is required');
  const now = nowUtcMs();
  const row: Project = {
    id: createId(),
    name: trimmed,
    color,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().insert(projects).values(row);
  return row;
}

export async function updateProject(
  id: string,
  input: { name?: string; color?: string },
): Promise<Project> {
  const db = getDb();
  const existing = await getProject(id);
  if (!existing) throw new Error('Project not found');
  const patch: Partial<Project> = { updatedAt: nowUtcMs() };
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.color !== undefined) patch.color = input.color;
  await db.update(projects).set(patch).where(eq(projects.id, id));
  const next = await getProject(id);
  if (!next) throw new Error('Project missing after update');
  return next;
}

export async function archiveProject(id: string): Promise<void> {
  await getDb()
    .update(projects)
    .set({ archivedAt: nowUtcMs(), updatedAt: nowUtcMs() })
    .where(eq(projects.id, id));
}

export async function unarchiveProject(id: string): Promise<void> {
  await getDb()
    .update(projects)
    .set({ archivedAt: null, updatedAt: nowUtcMs() })
    .where(eq(projects.id, id));
}

export async function getProject(id: string): Promise<Project | null> {
  const rows = await getDb().select().from(projects).where(eq(projects.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listProjects(includeArchived = false): Promise<Project[]> {
  const db = getDb();
  if (includeArchived) {
    return db.select().from(projects).orderBy(desc(projects.updatedAt));
  }
  return db
    .select()
    .from(projects)
    .where(isNull(projects.archivedAt))
    .orderBy(desc(projects.updatedAt));
}

export async function listProjectTasks(projectId: string): Promise<Task[]> {
  return getDb()
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(desc(tasks.updatedAt));
}

export function projectProgress(items: Task[]): { total: number; done: number; pct: number } {
  const openish = items.filter((t) => t.status !== 'CANCELLED');
  const done = openish.filter((t) => t.status === 'DONE').length;
  const total = openish.length;
  return { total, done, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export { and, eq };
