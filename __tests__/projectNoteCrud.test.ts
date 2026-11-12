import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

function openDb() {
  const init = fs.readFileSync(path.join(__dirname, '../src/db/migrations/0000_init.sql'), 'utf8');
  const v2 = fs.readFileSync(path.join(__dirname, '../src/db/migrations/0001_notes_archive.sql'), 'utf8');
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(init);
  db.exec('ALTER TABLE projects ADD COLUMN archived_at integer;');
  db.exec(v2);
  return db;
}

describe('project and note CRUD', () => {
  it('creates, archives a project and attaches tasks', () => {
    const db = openDb();
    const now = Date.now();
    const pid = randomUUID();
    db.prepare(
      `INSERT INTO projects (id, name, color, archived_at, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?)`,
    ).run(pid, 'Home', '#3B9EFF', now, now);

    const tid = randomUUID();
    db.prepare(
      `INSERT INTO tasks (id, title, notes, status, priority, project_id, due_at, completed_at, created_at, updated_at)
       VALUES (?, ?, NULL, 'TODO', 'MEDIUM', ?, NULL, NULL, ?, ?)`,
    ).run(tid, 'Paint', pid, now, now);

    const count = (
      db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE project_id = ?`).get(pid) as { c: number }
    ).c;
    expect(count).toBe(1);

    db.prepare(`UPDATE projects SET archived_at = ?, updated_at = ? WHERE id = ?`).run(
      now + 1,
      now + 1,
      pid,
    );
    const archived = db.prepare(`SELECT archived_at FROM projects WHERE id = ?`).get(pid) as {
      archived_at: number;
    };
    expect(archived.archived_at).toBeTruthy();
    db.close();
  });

  it('creates and searches notes linked to a project', () => {
    const db = openDb();
    const now = Date.now();
    const pid = randomUUID();
    db.prepare(
      `INSERT INTO projects (id, name, color, archived_at, created_at, updated_at) VALUES (?, ?, ?, NULL, ?, ?)`,
    ).run(pid, 'Work', '#55C7E8', now, now);
    const nid = randomUUID();
    db.prepare(
      `INSERT INTO notes (id, title, body, project_id, task_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, ?, ?)`,
    ).run(nid, 'Wifi password', 'home-net 1234', pid, now, now);

    const found = db
      .prepare(`SELECT title FROM notes WHERE body LIKE ?`)
      .get('%home-net%') as { title: string };
    expect(found.title).toBe('Wifi password');
    db.close();
  });

  it('computes progress ignoring cancelled tasks', () => {
    const items = [
      { status: 'TODO' },
      { status: 'DONE' },
      { status: 'DONE' },
      { status: 'CANCELLED' },
    ];
    const openish = items.filter((t) => t.status !== 'CANCELLED');
    const done = openish.filter((t) => t.status === 'DONE').length;
    const total = openish.length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    expect({ total, done, pct }).toEqual({ total: 3, done: 2, pct: 67 });
  });
});
