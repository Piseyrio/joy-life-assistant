import { eq } from 'drizzle-orm';
import { getDb } from '../db/client';
import { settings } from '../db/schema';
import { AppSettings, DEFAULT_SETTINGS } from '../types/models';
import { nowUtcMs } from '../utils/dates';

const SETTINGS_KEY = 'app_settings';

export async function getSettings(): Promise<AppSettings> {
  const db = getDb();
  const rows = await db.select().from(settings).where(eq(settings.key, SETTINGS_KEY)).limit(1);
  if (!rows.length) {
    await saveSettings(DEFAULT_SETTINGS);
    return { ...DEFAULT_SETTINGS };
  }
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(rows[0].value) } as AppSettings;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(next: AppSettings): Promise<void> {
  const db = getDb();
  const value = JSON.stringify(next);
  const updatedAt = nowUtcMs();
  const existing = await db.select().from(settings).where(eq(settings.key, SETTINGS_KEY)).limit(1);
  if (existing.length) {
    await db.update(settings).set({ value, updatedAt }).where(eq(settings.key, SETTINGS_KEY));
  } else {
    await db.insert(settings).values({ key: SETTINGS_KEY, value, updatedAt });
  }
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const next = { ...current, ...partial };
  await saveSettings(next);
  return next;
}
