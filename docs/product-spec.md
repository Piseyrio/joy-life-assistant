# JOY LIFE ASSISTANT — Product Spec (v1.0)

## Product
- **Name:** JOY LIFE ASSISTANT
- **Version:** 1.0
- **Platform:** Android APK (development build / release APK — not Expo Go)
- **Test device:** Realme (ColorOS)
- **Language:** English · friendly tone
- **Timezone:** Asia/Phnom_Penh (display); integer UTC timestamps in SQLite
- **Users:** Single user, fully local, offline-first

## Problem
The user forgets things. Reliable local reminders are the core value.

## Theme — Dark Modern Blue
Background `#111923` · Surface `#192535` · Cards `#1B293A` · Blue `#3B9EFF` · Cyan `#55C7E8` · Text `#F4F7FB` · Secondary `#91A5BC`

## Architecture constraints
LOCAL-ONLY: no backend, no Next.js, no PostgreSQL, no Prisma, no server, no accounts, no analytics, no API keys. Core features work offline.

Stack: React Native, Expo, Expo Router, TypeScript (strict), expo-sqlite, Drizzle ORM + migrations, expo-notifications (local), expo-secure-store, expo-local-authentication, expo-file-system, expo-sharing, expo-document-picker, `@noble/ciphers` + `@noble/hashes`.

Never run destructive database commands. Never delete user data unexpectedly.

## Tables
`projects`, `tasks`, `notes`, `reminders`, `task_activity`, `settings`, `notification_history`

## Navigation
Five bottom tabs: **Today**, **Inbox**, **Projects**, **Calendar**, **Assistant**. Global quick-capture. Settings / profile, notification history, backup/restore, battery guide.

## Features
1. Tasks: full CRUD. Statuses TODO / IN_PROGRESS / DONE / CANCELLED. Priorities LOW / MEDIUM / HIGH / URGENT. Due date/time. Delete with confirmation.
2. Inbox: list, add, edit, priority, due date, **move to a project**.
3. Today: overdue, due today, top 3 priorities, completed today.
4. Projects: create/edit/**archive** (not delete), tasks per project, progress.
5. Notes: body + title, optional link to project or task, search.
6. Calendar: daily and weekly agenda from tasks with due dates.
7. Task activity history.
8. Loading / empty / error / confirmation states; accessible contrast; minimal animation.

## Reminders
Local only. Deadline at due time; optional 30m / 2h repeats; **max 3 repeats per task per day**; next-morning when appropriate; quiet hours default 22:00–07:00; snooze 15/30/60/tomorrow + Done; cancel on DONE/CANCELLED; evening review 20:00; reconcile on start and after settings; Android 12 exact alarm + Android 13 POST_NOTIFICATIONS; ColorOS battery guide; notification history.

## Backup
Versioned encrypted file (scrypt → AES-256-GCM). Checksum + counts. Verify before restore. Merge (skip existing IDs) or replace into empty DB. 7-day backup reminder. Never upload.

## Biometric lock
Optional, off by default. Device biometric with PIN fallback. Does not block notifications.

## AI
**Not implemented.** Assistant tab is a placeholder. A TypeScript `AiProvider` interface exists for a future optional plugin. The core app must never depend on AI or internet.
