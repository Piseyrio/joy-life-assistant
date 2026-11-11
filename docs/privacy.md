# Privacy — JOY LIFE ASSISTANT

JOY LIFE ASSISTANT is a **single-user, fully local** Android app. It is designed so the core product never needs the internet.

## What stays on the phone
- SQLite database in the app’s **private storage** (`joy_life_assistant.db`)
- Settings, tasks, projects, notes, reminders, activity, notification history
- Optional encrypted backup files **only where you save them** (share sheet / file picker)
- Optional app-lock preference and related flags in **expo-secure-store** (on-device)

## What this app does not do
- No accounts, login, or cloud sync
- No analytics, crash telemetry, advertising, or tracking SDKs
- No API keys and no calls to AI or other remote services
- No uploading of backups or task data
- No background network requirement after install

Internet is used **only if you choose** to download the app, install an update, or share a backup file through an app you pick. The finished APK works offline.

## Notifications
Reminders use **local** Android notifications (`expo-notifications`). They are not push notifications and do not go through a server.

## Backups
Encrypted backups are created on device (scrypt + AES-256-GCM). You keep the file. Uninstalling the app can delete the local database — see `docs/recovery.md`.

## Biometric lock
Optional. Off by default. Unlocking uses the device biometric/PIN APIs. Notifications still fire when the UI is locked so you are not locked out of reminders.
