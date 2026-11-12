# Real-device checklist — JOY LIFE ASSISTANT (Realme / ColorOS)

Use a development build or release APK (**not Expo Go**). Complete **Settings → Realme / ColorOS battery guide** first.

Mark each item on the phone. Unit tests (`npm test`) cover scheduling math, backup crypto, and CRUD; they do **not** replace these checks.

## Permissions & ColorOS
- [ ] Android 13+: grant POST_NOTIFICATIONS
- [ ] Android 12+: Alarms & reminders allowed for this app
- [ ] Auto-start allowed; battery unrestricted; lock in Recents
- [ ] Optional app lock (Settings) does **not** stop notifications

## Core reminders
1. [ ] **2-minute reminder while swiped away** — due in ~2 minutes, swipe away, lock. Must fire.
2. [ ] **10-minute reminder while locked** — lock immediately. Must fire.
3. [ ] **Survives reboot** — schedule, reboot before fire. Must still fire.
4. [ ] **Snooze and Done** — 15 min snooze reschedules; Done cancels remaining for that task.
5. [ ] **Quiet hours + no duplicates** — due inside quiet hours fires at window end; restart app; no duplicate OS notifications.

## Today, Inbox, Projects, Notes, Calendar
6. [ ] **Today** — overdue, due today, top 3, completed today; 7-day backup banner when never backed up.
7. [ ] **Inbox** — add / edit / delete with confirmation; set due & priority; **move to a project** (task leaves Inbox).
8. [ ] **Projects** — create with color; open project; progress; **archive** (not delete); unarchive from Archived list.
9. [ ] **Notes** — create, search title/body, optional link to project or task, delete with confirmation.
10. [ ] **Calendar** — day and week agenda; prev/next; tap date for today; due tasks appear on the local date (Asia/Phnom_Penh).

## Backup, lock, Assistant
11. [ ] **Backup round trip** — export encrypted backup, uninstall, reinstall, restore with password: data returns (merge or empty replace). Wrong password and a truncated file must be rejected.
12. [ ] **7-day backup reminder** — Settings toggle; Today banner when last backup is never or ≥ 7 days.
13. [ ] **Biometric lock** — off by default; enabling requires authenticate; overlay on resume; reminders still fire while UI is locked; PIN fallback works.
14. [ ] **Assistant** — placeholder copy; local overdue/due snapshot; no network call.

## After restore
- [ ] Open the app once so reminders reconcile
- [ ] Confirm a 2-minute test reminder still fires
