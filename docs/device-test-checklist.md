# Real-device checklist — JOY LIFE ASSISTANT (Realme / ColorOS)

Use a development build or release APK (**not Expo Go**). Complete **Settings → Realme / ColorOS battery guide** first.

1. **2-minute reminder while swiped away** — due in ~2 minutes, swipe away, lock. Must fire.
2. **10-minute reminder while locked** — lock immediately. Must fire.
3. **Survives reboot** — schedule, reboot before fire. Must still fire.
4. **Snooze and Done** — 15 min snooze reschedules; Done cancels remaining for that task.
5. **Quiet hours + no duplicates** — due inside quiet hours fires at window end; restart app; no duplicate OS notifications.
6. **Backup round trip** — export encrypted backup, uninstall, reinstall, restore with password: all data returns (merge or empty replace). Wrong password and a truncated file must be rejected.

Also: POST_NOTIFICATIONS (Android 13+), Alarms & reminders (Android 12+), lock app in Recents, optional biometric lock does not stop notifications.
