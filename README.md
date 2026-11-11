# JOY LIFE ASSISTANT (v1.0)

Private, offline-first Android productivity app. Reliable local reminders for people who forget things.

**Local only.** No backend, accounts, analytics, AI, or internet at runtime.

## Docs
- [Product spec](docs/product-spec.md)
- [Architecture](docs/architecture.md)
- [Implementation plan](docs/implementation-plan.md)
- [Device test checklist](docs/device-test-checklist.md)
- [Recovery](docs/recovery.md)
- [Privacy](docs/privacy.md)

## Windows PowerShell

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
cd $env:USERPROFILE\Desktop\joy-life-assistant
npm install                 # internet
npm test
adb devices
npx expo run:android        # internet first native build — not Expo Go
```

### APK (internet)

```powershell
npx eas-cli build -p android --profile preview
```

Local Gradle often fails on Windows path limits; prefer EAS or a short project path (`C:\jla`).

The finished APK works fully offline.

## Features
Today · Inbox · Projects (archive, not delete) · Notes + search · Calendar day/week · Local reminders · Quiet hours · Encrypted backup (scrypt + AES-256-GCM) · Optional biometric lock · ColorOS battery guide · Assistant placeholder (no AI)
