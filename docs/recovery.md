# Recovery — JOY LIFE ASSISTANT

## Important
**Uninstalling the app, clearing app data, or a factory reset can permanently remove the local SQLite database.** Keep encrypted backups **outside the phone** (computer, USB drive, or another device you control). Joy never uploads backups.

## Export a backup
1. Open **Settings → Backup & restore**.
2. Choose a password you will remember (it cannot be recovered).
3. Export. Use the share sheet to save the `.joybackup` file somewhere safe.
4. The file includes: format version, app version, created date, record counts, salt, nonce, ciphertext, and a checksum.

## Restore on the same phone or a new Android device
1. Install JOY LIFE ASSISTANT (development/release APK — not Expo Go).
2. Open **Settings → Backup & restore**.
3. Pick the `.joybackup` file.
4. Enter the password.
5. Joy verifies the checksum, decrypts, and checks version/contents **before** writing.
6. Choose:
   - **Merge** — insert rows whose IDs are not already present (never silently overwrite).
   - **Replace into empty database** — only allowed when this install has no existing records.

If the password is wrong, the file is corrupted, or the version is unsupported, restore is rejected.

## After restore
- Open the app once so reminders **reconcile** against SQLite.
- Allow notifications, exact alarms, and ColorOS autostart (see the in-app battery guide).
- Confirm a test reminder 2 minutes ahead.

## If you forget the backup password
The backup cannot be decrypted. There is no master key and no cloud recovery.

## Seven-day reminder
If a backup is older than 7 days (or never made), Joy can nudge you to export. Turn this off in Settings.
