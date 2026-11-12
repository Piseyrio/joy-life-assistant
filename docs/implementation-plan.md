# Implementation Plan — v1.0 full

## Environment
- Node / npm
- JDK: Android Studio JBR (`JAVA_HOME`)
- Android SDK: `%LOCALAPPDATA%\Android\Sdk`
- adb in `platform-tools`
- Internet: npm install, Gradle/EAS native build, GitHub push
- Finished APK: fully offline

## Runtime dependencies
expo, expo-router, react, react-native, expo-sqlite, drizzle-orm, expo-notifications, expo-device, expo-intent-launcher, expo-secure-store, expo-local-authentication, expo-file-system, expo-sharing, expo-document-picker, @react-native-community/datetimepicker, date-fns, date-fns-tz, @noble/ciphers, @noble/hashes

## Dev
typescript, drizzle-kit, jest, ts-jest, better-sqlite3

## PowerShell

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
cd $env:USERPROFILE\Desktop\joy-life-assistant
npm install                 # internet
npm test
adb devices
npx expo run:android        # internet first native build; not Expo Go
```

### Release APK (EAS — internet)
```powershell
npx eas-cli build -p android --profile preview
```

### Local Gradle (may fail on Windows MAX_PATH; use a short path or EAS)
```powershell
npx expo prebuild --platform android
cd android
$env:GRADLE_USER_HOME = "C:\g"
.\gradlew.bat assembleRelease
```

## Milestones
1. Setup + docs — done  
2. Theme + 5 tabs — done  
3. SQLite + Drizzle + migrations — done  
4. Inbox + task CRUD — done  
5. Today dashboard — done  
6. Reminders + reconciliation — done  
7. Settings + battery + evening review — done  
8. Projects + Notes — done  
9. Calendar agenda — done  
10. Encrypted backup/restore + 7-day reminder — done  
11. Biometric lock — done  
12. Assistant placeholder + polish — done  
13. Full tests + device checklist — done (device boxes still for Realme)  
