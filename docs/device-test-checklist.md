# Real-device checklist — JOY LIFE ASSISTANT (Realme / ColorOS)

Use a development build or release APK (not Expo Go). Complete battery/autostart steps in **Settings → Realme / ColorOS battery guide** first.

## Checklist

1. **2-minute reminder while swiped away**
   - Create a task due in ~2 minutes.
   - Swipe the app away from Recents (or lock it in Recents after enabling autostart).
   - Lock the phone.
   - **Pass:** notification fires at due time.

2. **10-minute reminder while locked**
   - Schedule a task ~10 minutes ahead.
   - Lock the phone immediately.
   - **Pass:** notification fires.

3. **Survives reboot**
   - Schedule a reminder several minutes ahead.
   - Reboot the phone before it fires.
   - **Pass:** notification still fires (BOOT_COMPLETED + reconciliation on next launch; exact alarm may still fire if OS kept it).

4. **Snooze and Done actions**
   - When a reminder fires, tap **15 min** snooze → fires again ~15 minutes later (respecting quiet hours).
   - On another reminder, tap **Done** → all pending reminders for that task are cancelled.
   - **Pass:** snooze reschedules; Done cancels remaining.

5. **Quiet hours + no duplicates**
   - Set quiet hours to include the next few minutes; schedule a due time inside quiet hours → fires at quiet-hours end (or next allowed window).
   - Force-stop or restart the app multiple times.
   - Open **Notification history** / check system scheduled notifications.
   - **Pass:** quiet hours respected; no duplicate notifications after restart.

## Notes
- Android 13+: accept **POST_NOTIFICATIONS**.
- Android 12+: allow **Alarms & reminders** (exact alarms). If denied, timing may be inexact — app shows a clear message.
- ColorOS battery restrictions are the most common failure mode for background reminders.
