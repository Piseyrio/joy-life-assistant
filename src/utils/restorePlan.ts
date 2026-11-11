/** Merge restore never overwrites existing IDs. */
export function planMerge(incomingIds: string[], existingIds: Set<string>): {
  insert: string[];
  skip: string[];
} {
  const insert: string[] = [];
  const skip: string[] = [];
  for (const id of incomingIds) {
    if (existingIds.has(id)) skip.push(id);
    else insert.push(id);
  }
  return { insert, skip };
}

export function canReplaceEmpty(existingRecordCount: number): boolean {
  return existingRecordCount === 0;
}

export function daysSinceBackup(lastBackupAt: number | null, now = Date.now()): number | null {
  if (lastBackupAt == null) return null;
  return Math.floor((now - lastBackupAt) / (24 * 60 * 60 * 1000));
}

export function needsBackupReminder(lastBackupAt: number | null, now = Date.now()): boolean {
  if (lastBackupAt == null) return true;
  return daysSinceBackup(lastBackupAt, now)! >= 7;
}
