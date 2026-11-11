# Architecture — JOY LIFE ASSISTANT (Half 1)

## Principles
1. **Offline-first / local-only** — all data in SQLite on device.
2. **UTC integers in DB** — display in `Asia/Phnom_Penh`.
3. **Stable unique IDs** — UUID strings; foreign keys ON; indexes; transactions for related updates.
4. **Notifications are derived state** — SQLite is source of truth; reconciliation rebuilds the OS schedule safely.

## Stack
| Layer | Choice |
|-------|--------|
| UI | React Native + Expo Router |
| Language | TypeScript (strict) |
| DB | expo-sqlite + Drizzle ORM |
| Migrations | Drizzle SQL migrations applied at startup |
| Notifications | expo-notifications (local channels/categories) |
| Time | date-fns + date-fns-tz |

## Module layout
```
app/                  Expo Router screens
src/db/               schema, client, migrations
src/services/         tasks, reminders, settings, reconciliation
src/theme/            Dark Modern Blue tokens
src/utils/            dates, quiet hours, ids
src/components/       shared UI
__tests__/            unit tests
docs/                 product + architecture + plans + checklist
```

## Data model (Half 1)

### projects
Prepared for Half 2 UI only.

### tasks
Inbox/Today source. Status, priority, due_at (UTC ms), timestamps.

### reminders
Scheduled reminder rows linked to tasks (kind, fire_at, status, repeat index).

### task_activity
Append-only history for create/update/complete/cancel/snooze.

### settings
Key/value JSON-ish settings: quiet hours, evening review, reminder frequency, etc.

### notification_history
Audit of notifications that were scheduled/fired/cancelled/acted on.

## Reminder pipeline
1. User sets due date/time (or snoozes).
2. Service writes `reminders` rows inside a transaction.
3. Scheduler maps rows → `expo-notifications` schedule calls (exact when allowed).
4. Quiet hours shift fire times forward when needed.
5. On app start / settings change: **reconcile** — cancel OS notifications not in DB; schedule missing ones; never duplicate.
6. DONE/CANCELLED → cancel all related OS + mark reminder rows cancelled.

## Permissions (Android)
- `POST_NOTIFICATIONS` (API 33+)
- `SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM` (API 31+) with fallback to inexact
- Battery optimization / auto-start guidance for ColorOS (documented in-app)

## Security / privacy
No network calls required at runtime. No analytics. No accounts. No remote sync in Half 1.

## Build note
Requires a **development build** or release APK. Expo Go is not supported for this feature set.
