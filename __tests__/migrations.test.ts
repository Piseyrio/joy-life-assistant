import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const migrationPath = path.join(__dirname, '../src/db/migrations/0000_init.sql');

describe('migrations', () => {
  it('applies init SQL and enables foreign keys', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const db = new Database(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec(sql);

    const v2 = fs.readFileSync(path.join(__dirname, '../src/db/migrations/0001_notes_archive.sql'), 'utf8');
    db.exec('ALTER TABLE projects ADD COLUMN archived_at integer;');
    db.exec(v2);

    const tables = (
      db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all() as {
        name: string;
      }[]
    ).map((r) => r.name);

    expect(tables).toEqual(
      expect.arrayContaining([
        'projects',
        'tasks',
        'notes',
        'reminders',
        'task_activity',
        'settings',
        'notification_history',
      ]),
    );

    const fk = db.pragma('foreign_keys', { simple: true });
    expect(fk).toBe(1);

    // indexes exist
    const indexes = (
      db.prepare(`SELECT name FROM sqlite_master WHERE type='index'`).all() as { name: string }[]
    ).map((r) => r.name);
    expect(indexes).toEqual(expect.arrayContaining(['idx_tasks_due_at', 'idx_reminders_task']));

    db.close();
  });

  it('is idempotent with IF NOT EXISTS', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    const db = new Database(':memory:');
    db.exec(sql);
    expect(() => db.exec(sql)).not.toThrow();
    db.close();
  });
});
