# JOY LIFE ASSISTANT — Product Spec (v1.0 Half 1)

## Product
- **Name:** JOY LIFE ASSISTANT
- **Version:** 1.0
- **Platform:** Android APK (development build / release APK)
- **Test device target:** Realme (ColorOS)
- **Language:** English
- **Personality:** Friendly, encouraging, clear
- **Timezone:** Asia/Phnom_Penh (display); storage uses integer UTC timestamps
- **Users:** Single user, fully local, offline-first

## Problem
The user forgets things. Reliable local reminders are the core value.

## Theme — Dark Modern Blue
| Token | Hex |
|-------|-----|
| Background | `#111923` |
| Surface | `#192535` |
| Cards | `#1B293A` |
| Blue | `#3B9EFF` |
| Cyan | `#55C7E8` |
| Text | `#F4F7FB` |
| Secondary text | `#91A5BC` |

## Architecture constraints
- LOCAL-ONLY: no backend, no Next.js, no PostgreSQL, no Prisma, no server, no accounts, no internet required at runtime, no analytics, no API keys
- Stack: React Native, Expo, Expo Router, TypeScript (strict), expo-sqlite, Drizzle ORM + migrations, expo-notifications (local only)
- Do **not** use Expo Go — use `npx expo run:android` or EAS/local release APK
- Never run destructive database commands; never delete user data unexpectedly

## Half 1 scope

### Navigation
Five bottom tabs:
1. **Today** — dashboard (overdue, due today, top 3 priorities, completed today)
2. **Inbox** — task list CRUD
3. **Projects** — placeholder “Coming in Half 2”
4. **Calendar** — placeholder “Coming in Half 2”
5. **Assistant** — placeholder “Coming in Half 2”

Global **quick-capture** button: type a task in ~5 seconds → lands in Inbox.

### Tasks
- Statuses: `TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`
- Priorities: `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- Inbox: list, add, edit, delete (confirm), set priority, due date/time
- Completion writes `task_activity`
- Loading / empty / error / confirmation states; accessible contrast; minimal animation

### Reminders (local notifications)
- Main deadline reminder at due time
- Optional repeats after 30 minutes and 2 hours; **max 3 repeats per task per day**
- Next-morning reminder when appropriate
- Quiet hours default **22:00–07:00** (configurable)
- Reminder frequency configurable in settings
- Notification actions: Snooze 15m / 30m / 1h / Tomorrow, Done
- Cancel all notifications when task is `DONE` or `CANCELLED`
- Evening review daily at **20:00** (configurable, can disable): “Pick tomorrow's top 3”
- Reconcile scheduled notifications vs SQLite on every app start and after settings changes (no duplicates)
- Handle: permission denied, app restart, device reboot, timezone
- Android 12+: `SCHEDULE_EXACT_ALARM` (explain + graceful fallback if denied)
- Android 13+: `POST_NOTIFICATIONS`
- Realme/ColorOS battery optimization guide screen + open settings button
- Notification history screen

### Tables (Half 1)
`projects` (table only, UI later), `tasks`, `reminders`, `task_activity`, `settings`, `notification_history`

## Out of scope for Half 1
Backup/restore, encryption, biometric lock, Projects UI, Notes, Calendar agenda, AI.

## Real-device checklist
See `docs/device-test-checklist.md`.
