import { desc, eq, like, or } from 'drizzle-orm';
import { getDb } from '../db/client';
import { notes, type Note } from '../db/schema';
import { createId } from '../utils/ids';
import { nowUtcMs } from '../utils/dates';

export type CreateNoteInput = {
  title: string;
  body?: string;
  projectId?: string | null;
  taskId?: string | null;
};

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const title = input.title.trim();
  if (!title) throw new Error('Note title is required');
  const now = nowUtcMs();
  const row: Note = {
    id: createId(),
    title,
    body: input.body?.trim() ?? '',
    projectId: input.projectId ?? null,
    taskId: input.taskId ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await getDb().insert(notes).values(row);
  return row;
}

export async function updateNote(
  id: string,
  input: Partial<CreateNoteInput>,
): Promise<Note> {
  const existing = await getNote(id);
  if (!existing) throw new Error('Note not found');
  const patch: Partial<Note> = { updatedAt: nowUtcMs() };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.body !== undefined) patch.body = input.body;
  if (input.projectId !== undefined) patch.projectId = input.projectId;
  if (input.taskId !== undefined) patch.taskId = input.taskId;
  await getDb().update(notes).set(patch).where(eq(notes.id, id));
  const next = await getNote(id);
  if (!next) throw new Error('Note missing after update');
  return next;
}

export async function deleteNote(id: string): Promise<void> {
  await getDb().delete(notes).where(eq(notes.id, id));
}

export async function getNote(id: string): Promise<Note | null> {
  const rows = await getDb().select().from(notes).where(eq(notes.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listNotes(): Promise<Note[]> {
  return getDb().select().from(notes).orderBy(desc(notes.updatedAt));
}

export async function searchNotes(query: string): Promise<Note[]> {
  const q = query.trim();
  if (!q) return listNotes();
  const pattern = `%${q}%`;
  return getDb()
    .select()
    .from(notes)
    .where(or(like(notes.title, pattern), like(notes.body, pattern)))
    .orderBy(desc(notes.updatedAt));
}
