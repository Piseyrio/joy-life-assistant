# JOY LIFE ASSISTANT (v1.0 — Half 1)

Private, offline-first Android productivity app. Reminder core for people who forget things.

**Local only.** No backend, accounts, analytics, or internet required at runtime.

## Stack
React Native · Expo · Expo Router · TypeScript (strict) · expo-sqlite · Drizzle schema · expo-notifications

## Docs
- [Product spec](docs/product-spec.md)
- [Architecture](docs/architecture.md)
- [Implementation plan](docs/implementation-plan.md)
- [Device test checklist](docs/device-test-checklist.md)

## Windows PowerShell setup

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
cd $env:USERPROFILE\Desktop\joy-life-assistant
npm install   # needs internet
```

## Run on a USB Android phone (dev build — not Expo Go)

```powershell
adb devices
npx expo run:android   # needs internet the first time for native deps
```

## Tests

```powershell
npm test
```

## Release APK

```powershell
npx expo prebuild --platform android --clean   # needs internet
cd android
.\gradlew.bat assembleRelease                  # needs internet first Gradle sync
# Output: android\app\build\outputs\apk\release\app-release.apk
adb install -r app\build\outputs\apk\release\app-release.apk
```

The finished APK works fully offline.

## Half 1 features
Today · Inbox · Quick capture · Task CRUD · Local reminders · Quiet hours · Snooze/Done actions · Evening review · Settings · ColorOS battery guide · Notification history

Projects / Calendar / Assistant tabs are **Coming in Half 2** placeholders.
