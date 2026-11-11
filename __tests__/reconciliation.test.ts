/**
 * Pure reconciliation helpers — SQLite is source of truth; OS ids must match pending rows.
 */

export function findOrphanOsIds(
  pendingNotificationIds: Array<string | null | undefined>,
  osIds: string[],
): string[] {
  const known = new Set(pendingNotificationIds.filter((id): id is string => Boolean(id)));
  return osIds.filter((id) => !known.has(id));
}

export function needsReschedule(
  reminder: { notificationId: string | null; fireAt: number },
  osIds: Set<string>,
  now: number,
): boolean {
  if (reminder.fireAt <= now) return false;
  if (!reminder.notificationId) return true;
  return !osIds.has(reminder.notificationId);
}

describe('notification reconciliation', () => {
  it('finds OS orphans not present in SQLite pending rows', () => {
    const orphans = findOrphanOsIds(['a', null, 'b'], ['a', 'b', 'c', 'd']);
    expect(orphans).toEqual(['c', 'd']);
  });

  it('does not report duplicates when ids already match', () => {
    const orphans = findOrphanOsIds(['a', 'b'], ['a', 'b']);
    expect(orphans).toEqual([]);
  });

  it('reschedules missing handles and skips past-due', () => {
    const now = 1_000_000;
    expect(needsReschedule({ notificationId: null, fireAt: now + 1000 }, new Set(), now)).toBe(true);
    expect(needsReschedule({ notificationId: 'x', fireAt: now + 1000 }, new Set(['x']), now)).toBe(
      false,
    );
    expect(needsReschedule({ notificationId: 'x', fireAt: now + 1000 }, new Set(), now)).toBe(true);
    expect(needsReschedule({ notificationId: 'x', fireAt: now - 1 }, new Set(), now)).toBe(false);
  });

  it('cancels on completion means no pending ids remain for task', () => {
    const pendingAfterDone: string[] = [];
    const osIds = ['old-1', 'old-2'];
    const orphans = findOrphanOsIds(pendingAfterDone, osIds);
    expect(orphans).toEqual(['old-1', 'old-2']);
  });
});
