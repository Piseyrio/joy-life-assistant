# Architecture — JOY LIFE ASSISTANT

## Principles
1. Offline-first / local-only — SQLite on device is the source of truth.
2. UTC integers in DB — display in `Asia/Phnom_Penh`.
3. Stable unique IDs, foreign keys ON, indexes, transactions for related writes.
4. Notifications are derived: reconcile OS schedule from pending `reminders` rows; no duplicates.
5. Backups are user-owned files. Crypto is `@noble/*` only (no homemade ciphers).
6. Core never imports an AI client or network SDK.

## Layout
```
app/                 Expo Router screens
src/db/              schema, client, SQL migrations
src/services/        tasks, projects, notes, reminders, backup, lock
src/ai/              optional future AiProvider interface only
src/theme/           Dark Modern Blue
src/utils/           dates, quiet hours, ids, crypto helpers
__tests__/           Jest (Node) unit tests
docs/
```

## Data model
- **projects** — name, color, archived_at (archive instead of delete)
- **tasks** — status, priority, due_at, project_id
- **notes** — title, body, optional project_id / task_id
- **reminders** — kind, fire_at, status, notification_id, local_date_key
- **task_activity** — append-only
- **settings** — JSON blob including quiet hours, evening review, lastBackupAt, lockEnabled
- **notification_history** — scheduled / snoozed / cancelled / reconciled events

## Backup file
JSON envelope: magic, formatVersion, appVersion, createdAt, counts, kdf=scrypt, salt, nonce, ciphertext (AES-256-GCM), sha256 checksum of ciphertext. Restore verifies checksum → decrypt → validate payload version/tables → merge or empty-replace.

## Permissions (Android)
POST_NOTIFICATIONS (API 33+), SCHEDULE_EXACT_ALARM / USE_EXACT_ALARM (API 31+), USE_BIOMETRIC / USE_FINGERPRINT as required by local-auth, READ/WRITE via document picker/share only when the user exports or picks a file.
