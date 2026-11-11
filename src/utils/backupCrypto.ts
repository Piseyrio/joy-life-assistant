import { gcm } from '@noble/ciphers/aes.js';
import { scrypt } from '@noble/hashes/scrypt.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, randomBytes, utf8ToBytes } from '@noble/hashes/utils.js';

export const BACKUP_MAGIC = 'JOY_LIFE_ASSISTANT_BACKUP';
export const BACKUP_FORMAT_VERSION = 1;
export const APP_VERSION = '1.0.0';

export const SCRYPT_OPTS = { N: 2 ** 14, r: 8, p: 1, dkLen: 32 } as const;

export type BackupPayload = {
  version: number;
  appVersion: string;
  createdAt: number;
  counts: Record<string, number>;
  tables: {
    projects: unknown[];
    tasks: unknown[];
    notes: unknown[];
    reminders: unknown[];
    task_activity: unknown[];
    settings: unknown[];
    notification_history: unknown[];
  };
};

export type BackupEnvelope = {
  magic: string;
  formatVersion: number;
  appVersion: string;
  createdAt: number;
  counts: Record<string, number>;
  kdf: 'scrypt';
  kdfParams: { N: number; r: number; p: number; dkLen: number };
  salt: string;
  nonce: string;
  ciphertext: string;
  checksum: string;
};

function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

function toHex(bytes: Uint8Array): string {
  return bytesToHex(bytes);
}

function fromHex(hex: string): Uint8Array {
  return hexToBytes(hex);
}

export function deriveKey(
  password: string,
  salt: Uint8Array,
  opts: { N: number; r: number; p: number; dkLen: number } = SCRYPT_OPTS,
): Uint8Array {
  return scrypt(password, salt, opts);
}

export function encryptPayload(payload: BackupPayload, password: string): BackupEnvelope {
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters');
  }
  const salt = randomBytes(16);
  const nonce = randomBytes(12);
  const key = deriveKey(password, salt);
  const plain = utf8ToBytes(JSON.stringify(payload));
  const cipher = gcm(key, nonce);
  const ciphertext = cipher.encrypt(plain);
  const checksum = toHex(sha256(ciphertext));
  return {
    magic: BACKUP_MAGIC,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: APP_VERSION,
    createdAt: payload.createdAt,
    counts: payload.counts,
    kdf: 'scrypt',
    kdfParams: { ...SCRYPT_OPTS },
    salt: toHex(salt),
    nonce: toHex(nonce),
    ciphertext: toHex(ciphertext),
    checksum,
  };
}

export function parseEnvelope(raw: string): BackupEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Backup file is not valid JSON');
  }
  const env = parsed as BackupEnvelope;
  if (!env || env.magic !== BACKUP_MAGIC) {
    throw new Error('Not a JOY LIFE ASSISTANT backup');
  }
  if (env.formatVersion !== BACKUP_FORMAT_VERSION) {
    throw new Error(`Unsupported backup version: ${String(env.formatVersion)}`);
  }
  if (!env.salt || !env.nonce || !env.ciphertext || !env.checksum) {
    throw new Error('Backup file is missing crypto fields');
  }
  return env;
}

export function decryptEnvelope(env: BackupEnvelope, password: string): BackupPayload {
  const cipherBytes = fromHex(env.ciphertext);
  const expected = toHex(sha256(cipherBytes));
  if (expected !== env.checksum) {
    throw new Error('Backup checksum failed — file is corrupted');
  }
  const salt = fromHex(env.salt);
  const nonce = fromHex(env.nonce);
  const opts = env.kdfParams ?? SCRYPT_OPTS;
  const key = deriveKey(password, salt, opts);
  try {
    const cipher = gcm(key, nonce);
    const plain = cipher.decrypt(cipherBytes);
    const payload = JSON.parse(bytesToUtf8(plain)) as BackupPayload;
    validatePayload(payload);
    return payload;
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Backup')) throw e;
    throw new Error('Wrong password or corrupted backup');
  }
}

export function validatePayload(payload: BackupPayload): void {
  if (!payload || payload.version !== 1) {
    throw new Error('Unsupported payload version');
  }
  if (!payload.tables) {
    throw new Error('Backup is missing table data');
  }
  const required: Array<keyof BackupPayload['tables']> = [
    'projects',
    'tasks',
    'notes',
    'reminders',
    'task_activity',
    'settings',
    'notification_history',
  ];
  for (const key of required) {
    if (!Array.isArray(payload.tables[key])) {
      throw new Error(`Backup is missing table: ${key}`);
    }
  }
}
