import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

function openDb() {
  const sql = fs.readFileSync(path.join(__dirname, '../src/db/migrations/0000_init.sql'), 'utf8');
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(sql);
  return db;
}

describe('task CRUD', () => {
  it('creates, updates, completes, and deletes a task with activity', () => {
    const db = openDb();
    const now = Date.now();
    const id = randomUUID();

    db.prepare(
      `INSERT INTO tasks (id, title, notes, status, priority, project_id, due_at, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NULL, ?, NULL, ?, ?)`,
    ).run(id, 'Buy milk', null, 'TODO', 'HIGH', now + 60_000, now, now);

    db.prepare(
      `INSERT INTO task_activity (id, task_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(randomUUID(), id, 'CREATED', null, now);

    const created = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as { title: string };
    expect(created.title).toBe('Buy milk');

    const later = now + 1000;
    db.prepare(`UPDATE tasks SET status = 'DONE', completed_at = ?, updated_at = ? WHERE id = ?`).run(
      later,
      later,
      id,
    );
    db.prepare(
      `INSERT INTO task_activity (id, task_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?)`,
    ).run(randomUUID(), id, 'STATUS_DONE', null, later);

    const done = db.prepare(`SELECT status, completed_at FROM tasks WHERE id = ?`).get(id) as {
      status: string;
      completed_at: number;
    };
    expect(done.status).toBe('DONE');
    expect(done.completed_at).toBe(later);

    const activityCount = (
      db.prepare(`SELECT COUNT(*) as c FROM task_activity WHERE task_id = ?`).get(id) as { c: number }
    ).c;
    expect(activityCount).toBe(2);

    // permanent delete in transaction
    const del = db.transaction((taskId: string) => {
      db.prepare(`DELETE FROM reminders WHERE task_id = ?`).run(taskId);
      db.prepare(`DELETE FROM task_activity WHERE task_id = ?`).run(taskId);
      db.prepare(`DELETE FROM tasks WHERE id = ?`).run(taskId);
    });
    del(id);

    expect(db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id)).toBeUndefined();
    db.close();
  });

  it('enforces foreign keys for reminders', () => {
    const db = openDb();
    expect(() => {
      db.prepare(
        `INSERT INTO reminders (id, task_id, kind, fire_at, status, repeat_index, notification_id, local_date_key, created_at, updated_at)
         VALUES (?, ?, 'DEADLINE', ?, 'PENDING', 0, NULL, '2026-03-10', ?, ?)`,
      ).run(randomUUID(), 'missing-task', Date.now() + 1000, Date.now(), Date.now());
    }).toThrow();
    db.close();
  });
});
