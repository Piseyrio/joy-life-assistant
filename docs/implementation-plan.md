# Implementation Plan — Half 1

## Environment (inspected)
- Node / npm: required
- JDK: Android Studio JBR (`JAVA_HOME`)
- Android SDK: `%LOCALAPPDATA%\Android\Sdk` (`ANDROID_HOME`)
- adb: `%ANDROID_HOME%\platform-tools`
- Internet needed for: npm install, Expo/Gradle dependency download, GitHub push
- Finished APK: fully offline

## Dependencies
### Runtime
- expo, expo-router, react, react-native
- expo-sqlite, drizzle-orm
- expo-notifications, expo-device, expo-intent-launcher
- @react-native-community/datetimepicker
- date-fns, date-fns-tz, uuid
- react-native-safe-area-context, react-native-screens, react-native-gesture-handler, react-native-reanimated

### Dev
- typescript, drizzle-kit, jest, jest-expo, @types/jest, @types/uuid, ts-jest

## PowerShell commands

### One-time env (current session)
```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
cd $env:USERPROFILE\Desktop\joy-life-assistant
```

### Install (needs internet)
```powershell
npm install
```

### Development build on USB phone (needs internet first time for native deps)
```powershell
adb devices
npx expo run:android
```

### Unit tests
```powershell
npm test
```

### Release APK (needs internet for Gradle deps first time)
```powershell
npx expo prebuild --platform android --clean
cd android
.\gradlew.bat assembleRelease
# APK: android\app\build\outputs\apk\release\app-release.apk
```

### Install release APK on phone
```powershell
adb install -r android\app\build\outputs\apk\release\app-release.apk
```

## Milestones
1. Setup + docs
2. Theme + 5 tabs
3. SQLite + Drizzle + migrations
4. Inbox + task CRUD + quick capture
5. Today dashboard
6. Reminders + reconciliation
7. Settings + battery guide + evening review
8. Tests + device checklist

## Half 2 (not built)
Projects UI, Notes, Calendar agenda, AI Assistant features, backup/restore, encryption, biometric lock.
