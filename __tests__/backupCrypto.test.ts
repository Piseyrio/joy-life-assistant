import {
  decryptEnvelope,
  encryptPayload,
  parseEnvelope,
  type BackupPayload,
} from '../src/utils/backupCrypto';
import { canReplaceEmpty, needsBackupReminder, planMerge } from '../src/utils/restorePlan';

function samplePayload(): BackupPayload {
  return {
    version: 1,
    appVersion: '1.0.0',
    createdAt: 1_700_000_000_000,
    counts: {
      projects: 1,
      tasks: 1,
      notes: 0,
      reminders: 0,
      task_activity: 0,
      settings: 0,
      notification_history: 0,
    },
    tables: {
      projects: [{ id: 'p1', name: 'Home' }],
      tasks: [{ id: 't1', title: 'Milk', projectId: 'p1' }],
      notes: [],
      reminders: [],
      task_activity: [],
      settings: [],
      notification_history: [],
    },
  };
}

describe('backup encryption', () => {
  it('round-trips with the correct password', () => {
    const payload = samplePayload();
    const env = encryptPayload(payload, 'correct-horse');
    expect(env.magic).toBe('JOY_LIFE_ASSISTANT_BACKUP');
    expect(env.kdf).toBe('scrypt');
    const back = decryptEnvelope(env, 'correct-horse');
    expect(back.tables.tasks[0]).toEqual(payload.tables.tasks[0]);
  });

  it('rejects a wrong password', () => {
    const env = encryptPayload(samplePayload(), 'correct-horse');
    expect(() => decryptEnvelope(env, 'wrong-password')).toThrow(/Wrong password|corrupted/i);
  });

  it('rejects a corrupted file (checksum)', () => {
    const env = encryptPayload(samplePayload(), 'correct-horse');
    env.ciphertext = env.ciphertext.slice(0, -4) + 'abcd';
    expect(() => decryptEnvelope(env, 'correct-horse')).toThrow(/checksum|corrupted/i);
  });

  it('rejects truncated JSON', () => {
    expect(() => parseEnvelope('{not-json')).toThrow();
  });
});

describe('restore without overwriting', () => {
  it('skips existing IDs and inserts new ones', () => {
    const plan = planMerge(['a', 'b', 'c'], new Set(['b']));
    expect(plan.insert).toEqual(['a', 'c']);
    expect(plan.skip).toEqual(['b']);
  });

  it('replace is only allowed on an empty database', () => {
    expect(canReplaceEmpty(0)).toBe(true);
    expect(canReplaceEmpty(3)).toBe(false);
  });
});

describe('7-day backup reminder', () => {
  it('nudges when never backed up or older than 7 days', () => {
    const now = Date.UTC(2026, 2, 20);
    expect(needsBackupReminder(null, now)).toBe(true);
    expect(needsBackupReminder(now - 8 * 86400000, now)).toBe(true);
    expect(needsBackupReminder(now - 2 * 86400000, now)).toBe(false);
  });
});
