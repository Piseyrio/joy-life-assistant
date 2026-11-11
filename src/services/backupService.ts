import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDb, getSqlite } from '../db/client';
import {
  notificationHistory,
  notes,
  projects,
  reminders,
  settings,
  taskActivity,
  tasks,
} from '../db/schema';
import { nowUtcMs } from '../utils/dates';
import {
  APP_VERSION,
  BackupEnvelope,
  BackupPayload,
  decryptEnvelope,
  encryptPayload,
  parseEnvelope,
} from '../utils/backupCrypto';
import { updateSettings } from './settingsService';
import { reconcileNotifications } from './reminderService';
export { daysSinceBackup, needsBackupReminder } from '../utils/restorePlan';

export type RestoreMode = 'merge' | 'replace_empty';

export type RestorePreview = {
  counts: Record<string, number>;
  appVersion: string;
  createdAt: number;
  existingCounts: Record<string, number>;
  canReplaceEmpty: boolean;
};

function countsFromTables(tables: BackupPayload['tables']): Record<string, number> {
  return {
    projects: tables.projects.length,
    tasks: tables.tasks.length,
    notes: tables.notes.length,
    reminders: tables.reminders.length,
    task_activity: tables.task_activity.length,
    settings: tables.settings.length,
    notification_history: tables.notification_history.length,
  };
}

export async function exportSnapshot(): Promise<BackupPayload> {
  const db = getDb();
  const [p, t, n, r, a, s, h] = await Promise.all([
    db.select().from(projects),
    db.select().from(tasks),
    db.select().from(notes),
    db.select().from(reminders),
    db.select().from(taskActivity),
    db.select().from(settings),
    db.select().from(notificationHistory),
  ]);
  const tables: BackupPayload['tables'] = {
    projects: p,
    tasks: t,
    notes: n,
    reminders: r,
    task_activity: a,
    settings: s,
    notification_history: h,
  };
  return {
    version: 1,
    appVersion: APP_VERSION,
    createdAt: nowUtcMs(),
    counts: countsFromTables(tables),
    tables,
  };
}

export async function createEncryptedBackupFile(password: string): Promise<string> {
  const snapshot = await exportSnapshot();
  const envelope = encryptPayload(snapshot, password);
  const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  if (!dir) throw new Error('No file directory available');
  const path = `${dir}joy-life-assistant-${snapshot.createdAt}.joybackup`;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(envelope, null, 2));
  await updateSettings({ lastBackupAt: snapshot.createdAt });
  return path;
}

export async function shareBackup(password: string): Promise<void> {
  const path = await createEncryptedBackupFile(password);
  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(path, {
      mimeType: 'application/json',
      dialogTitle: 'Save Joy backup',
    });
  }
}

export async function pickBackupFile(): Promise<string> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', '*/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]?.uri) {
    throw new Error('No file selected');
  }
  return result.assets[0].uri;
}

export async function readEnvelopeFromUri(uri: string): Promise<BackupEnvelope> {
  const raw = await FileSystem.readAsStringAsync(uri);
  return parseEnvelope(raw);
}

export async function previewRestore(uri: string, password: string): Promise<RestorePreview> {
  const env = await readEnvelopeFromUri(uri);
  const payload = decryptEnvelope(env, password);
  const existing = await exportSnapshot();
  const existingCounts = existing.counts;
  const totalExisting = Object.values(existingCounts).reduce((a, b) => a + b, 0);
  return {
    counts: payload.counts,
    appVersion: payload.appVersion,
    createdAt: payload.createdAt,
    existingCounts,
    canReplaceEmpty: totalExisting === 0,
  };
}

async function countAll(): Promise<number> {
  const snap = await exportSnapshot();
  return Object.values(snap.counts).reduce((a, b) => a + b, 0);
}

function rowId(row: unknown): string | null {
  if (row && typeof row === 'object' && 'id' in row && typeof (row as { id: unknown }).id === 'string') {
    return (row as { id: string }).id;
  }
  if (row && typeof row === 'object' && 'key' in row && typeof (row as { key: unknown }).key === 'string') {
    return (row as { key: string }).key;
  }
  return null;
}

export async function restoreBackup(
  uri: string,
  password: string,
  mode: RestoreMode,
): Promise<{ inserted: number; skipped: number }> {
  const env = await readEnvelopeFromUri(uri);
  const payload = decryptEnvelope(env, password);

  if (mode === 'replace_empty') {
    const n = await countAll();
    if (n > 0) {
      throw new Error('Database is not empty. Choose merge, or restore only on a fresh install.');
    }
  }

  const sqlite = await getSqlite();
  let inserted = 0;
  let skipped = 0;

  const toDbRow = (rec: Record<string, unknown>): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rec)) {
      const snake = k.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
      out[snake] = v ?? null;
    }
    return out;
  };

  const insertTable = async (
    table: string,
    rows: unknown[],
    idColumn: 'id' | 'key',
  ) => {
    for (const row of rows) {
      const rec = toDbRow(row as Record<string, unknown>);
      const id = rec[idColumn];
      if (typeof id !== 'string') {
        skipped += 1;
        continue;
      }
      const existing = await sqlite.getFirstAsync<{ c: number }>(
        `SELECT COUNT(*) as c FROM ${table} WHERE ${idColumn} = ?`,
        [id],
      );
      if ((existing?.c ?? 0) > 0) {
        skipped += 1;
        continue;
      }
      const cols = Object.keys(rec);
      const placeholders = cols.map(() => '?').join(',');
      const sql = `INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`;
      await sqlite.runAsync(
        sql,
        cols.map((c) => rec[c] as string | number | null),
      );
      inserted += 1;
    }
  };

  // Order respects FKs
  await sqlite.execAsync('BEGIN');
  try {
    await insertTable('projects', payload.tables.projects, 'id');
    await insertTable('tasks', payload.tables.tasks, 'id');
    await insertTable('notes', payload.tables.notes, 'id');
    await insertTable('reminders', payload.tables.reminders, 'id');
    await insertTable('task_activity', payload.tables.task_activity, 'id');
    await insertTable('settings', payload.tables.settings, 'key');
    await insertTable('notification_history', payload.tables.notification_history, 'id');
    await sqlite.execAsync('COMMIT');
  } catch (e) {
    await sqlite.execAsync('ROLLBACK');
    throw e;
  }

  await reconcileNotifications();
  void rowId;
  return { inserted, skipped };
}

