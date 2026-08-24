# 🚀 Efficient Me — Execution & Build Operations Manual

This guide contains complete, step-by-step instructions for running **Efficient Me** in local development, testing on physical devices/emulators, and generating standalone Android **APK** and **AAB** installation binaries.

---

## 📋 Table of Contents
1. [Prerequisites & Environment Setup](#1-prerequisites--environment-setup)
2. [Running in Local Development](#2-running-in-local-development)
3. [Type Checking & Static Analysis](#3-type-checking--static-analysis)
4. [Building Standalone Android APK (2 Methods)](#4-building-standalone-android-apk)
   - [Method A: Fast Local Gradle Build (No Cloud Required)](#method-a-fast-local-gradle-build-free--offline)
   - [Method B: EAS Build (Cloud / Automated Pipeline)](#method-b-eas-build-cloud--local-eas-cli)
5. [Installing & Sideloading APK to Device](#5-installing--sideloading-apk-to-device)
6. [Generating Production Play Store AAB Bundle](#6-generating-production-play-store-aab-bundle)
7. [Troubleshooting & Quick Fixes](#7-troubleshooting--quick-fixes)

---

## 1. 🛠️ Prerequisites & Environment Setup

### Required Tools
* **Node.js**: v18.x or v20.x LTS installed.
* **npm**: (bundled with Node.js) or `yarn` / `pnpm`.
* **Java Development Kit (JDK)**: OpenJDK 17 (required for Android builds).
* **Android Studio & SDK**:
  * Android SDK Command-line Tools
  * Android SDK Build-Tools (v34+)
  * Android SDK Platform-Tools (`adb`)
  * Environment variables configured:
    * `ANDROID_HOME` pointing to your Android SDK directory (e.g., `C:\Users\<User>\AppData\Local\Android\Sdk`).
    * `%ANDROID_HOME%\platform-tools` added to system `PATH`.

### Optional (Recommended for Cloud Builds)
```bash
npm install -g eas-cli
```

---

## 2. 💻 Running in Local Development

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Metro Development Server
```bash
# Standard start
npm start

# Or start and clear cache (recommended if assets/dependencies change)
npx expo start -c
```

### Step 3: Launch on Target Platform

#### A. Run in Android Emulator / USB Connected Android Device:
```bash
npm run android
# Or:
npx expo run:android
```

#### B. Run in Web Browser (Fast UI & Design Testing):
```bash
npm run web
# Or:
npx expo start --web
```

#### C. Run on Physical Phone via Expo Go (Over LAN / Tunnel):
1. Install **Expo Go** from Google Play Store or iOS App Store.
2. Run:
   ```bash
   npx expo start --tunnel
   ```
3. Scan the terminal QR code with your phone camera (iOS) or Expo Go app (Android).

---

## 3. 🔍 Type Checking & Static Analysis

Always run static analysis before committing or generating builds to ensure strict type safety:

```bash
npx tsc --noEmit
```

---

## 4. 📦 Building Standalone Android APK

An APK allows you to directly install the app on any Android phone without needing Expo Go or a development server.

### Method A: Fast Local Gradle Build (Free & Offline)

This method compiles the native binary directly on your machine using the local Gradle wrapper.

#### Step 1: Ensure Native Android Directory Exists
```bash
# If android/ directory is not generated or needs syncing:
npx expo prebuild --platform android
```

#### Step 2: Compile Debug APK
```bash
# On Windows (PowerShell):
cd android
.\gradlew.bat assembleDebug

# On macOS / Linux:
cd android
./gradlew assembleDebug
```

* **Output APK Location**:
  ```
  android/app/build/outputs/apk/debug/app-debug.apk
  ```

#### Step 3: Compile Release APK (Optimized & Minified)
```bash
# On Windows (PowerShell):
cd android
.\gradlew.bat assembleRelease

# On macOS / Linux:
cd android
./gradlew assembleRelease
```

* **Output APK Location**:
  ```
  android/app/build/outputs/apk/release/app-release.apk
  ```

---

### Method B: EAS Build (Cloud / Local EAS CLI)

Uses Expo Application Services (EAS) configured via [`eas.json`](./eas.json).

#### Step 1: Log in to Expo
```bash
eas login
```

#### Step 2: Build APK via Cloud Pipeline
```bash
# Triggers cloud build for standalone APK:
eas build -p android --profile preview
```
* Once completed, EAS will provide a direct download URL and QR code in the terminal to download the `.apk` straight to your phone.

#### Step 3: Build APK Locally with EAS (Optional)
```bash
eas build --platform android --profile preview --local
```

---

## 5. 📲 Installing & Sideloading APK to Device

### Option 1: Via USB & ADB (Fastest)
1. Enable **Developer Options** and **USB Debugging** on your Android phone.
2. Connect phone to PC via USB.
3. Verify device connection:
   ```bash
   adb devices
   ```
4. Install APK directly:
   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Option 2: Direct File Transfer
1. Copy `app-debug.apk` or `app-release.apk` to your phone via USB cable, Google Drive, Telegram, or WhatsApp.
2. Open the file on your phone and tap **Install** (allow "Install Unknown Apps" permission if prompted).

---

## 6. 🌐 Generating Production Play Store AAB Bundle

To generate the Android App Bundle (`.aab`) required for publishing on the **Google Play Console**:

### Via EAS Cloud Build:
```bash
eas build -p android --profile production
```

### Via Local Gradle:
```bash
cd android
.\gradlew.bat bundleRelease
```
* **Output AAB Location**:
  ```
  android/app/build/outputs/bundle/release/app-release.aab
  ```

---

## 7. 🔧 Troubleshooting & Quick Fixes

| Issue | Resolution |
| :--- | :--- |
| **Port 8081 already in use** | Run `npx kill-port 8081` or restart terminal. |
| **Metro Bundler Cache Issues** | Run `npx expo start -c` to clear Metro and Babel cache. |
| **Android Build Fails in Gradle** | Clean Gradle build artifacts: `cd android; .\gradlew.bat clean; cd ..` |
| **ADB Device Not Found** | Reconnect USB cable and ensure **USB Debugging** is turned ON in Android Developer Options. |
| **TypeScript Errors** | Run `npx tsc --noEmit` and resolve strict type warnings. |
| **Corrupted `node_modules`** | Delete `node_modules` and `package-lock.json`, then run `npm install`. |

---

> **Efficient Me**: Built with React Native (Fabric/New Architecture), Expo 54, and Local-First SQLite.
