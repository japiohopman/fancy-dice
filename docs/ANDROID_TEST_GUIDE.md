# Fancy Dice — Android Physical Device Testing Guide

This guide provides step-by-step instructions for building, installing, running, and debugging **Fancy Dice** on a physical Android device (specifically tailored for testing on the **Samsung Galaxy S24**).

---

## Prerequisites & Environment Requirements

- **Java Development Kit**: JDK 21 (OpenJDK 21.0.10 or higher)
- **Node.js**: v22.x or higher
- **Android SDK**: Android 14 (API Level 34) / Android SDK Build-Tools 34.0.0
- **Android Command Line Tools**: `adb` (Android Debug Bridge) installed and added to `PATH`
- **Gradle**: 8.14.3 (handled via `./gradlew` wrapper in `android/`)

---

## Step 1: Enable Android Developer Mode

On the physical Android device (e.g., **Samsung Galaxy S24**):

1. Open **Settings**.
2. Scroll down and tap **About phone**.
3. Tap **Software information**.
4. Locate **Build number** and tap it **7 times** continuously.
5. Enter your device pattern, PIN, or password when prompted.
6. A toast notification will appear saying *"Developer mode has been turned on"*.

---

## Step 2: Enable USB Debugging

1. Go back to **Settings**.
2. Scroll to the bottom and select the new **Developer options** menu.
3. Scroll down to the **Debugging** section.
4. Toggle **USB debugging** to **ON**.
5. Confirm by tapping **OK** on the permission dialog.

---

## Step 3: Connect the Android Device to Workstation

1. Connect the phone to your computer using a high-quality USB-C cable.
2. Unlock the device screen.
3. When prompted on the device screen with *"Allow USB debugging?"*, check the box for **"Always allow from this computer"** and tap **Allow**.

---

## Step 4: Verify Device Recognition via ADB

Open a terminal on your host machine and run:

```bash
adb devices
```

**Expected Output:**

```text
List of devices attached
RF8X...    device
```

If the device state shows `unauthorized`, re-check your phone screen for the prompt and accept USB debugging permissions.

---

## Step 5: Build Fancy Dice Production Web Bundle

Before syncing with Capacitor, build the static Vite production assets:

```bash
npm run build
```

This compiles TypeScript, bundles React/WebGL code into `dist/`, and outputs production static assets.

---

## Step 6: Generate the Android Test APK

Execute the automated Capacitor sync and Gradle APK build pipeline:

```bash
npm run cap:build:apk
```

Or execute the individual steps manually:

```bash
# 1. Sync web assets to Capacitor Android assets folder
npx cap sync android

# 2. Build the Debug APK using Gradle wrapper
cd android
./gradlew assembleDebug
```

**Generated APK Location:**

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Step 7: Install the APK on Physical Device

Ensure your device is connected via ADB and run:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

- The `-r` flag forces re-installation if an existing test build is already installed on the device.

---

## Step 8: Launch Fancy Dice

You can launch Fancy Dice directly from your physical phone screen by tapping the **"Fantastic Dice 3D"** app icon, or trigger launch remotely via ADB:

```bash
adb shell am start -n com.fantasticdice.app/.MainActivity
```

---

## Step 9: View Real-time App Logs & Debugging

### Option A: View ADB Logcat Console Logs

Filter Android logs for WebGL, JS console statements, and Capacitor bridge events:

```bash
adb logcat -s Capacitor/Console WebGL ShakeDetector
```

### Option B: Remote Chrome DevTools Debugging (Recommended)

Since `webContentsDebuggingEnabled: true` is set in `capacitor.config.ts`, you can inspect live DOM, WebGL contexts, console output, and memory profiling on the physical device:

1. Open Chrome on your desktop computer.
2. Navigate to `chrome://inspect/#devices`.
3. Locate **Samsung Galaxy S24 (com.fantasticdice.app)** under Target.
4. Click **Inspect** to open full Chrome DevTools for the mobile WebView.

---

## Step 10: Uninstall the Test Build

To completely remove the test application and reset app data from the physical device:

```bash
adb uninstall com.fantasticdice.app
```

---

## 🛠️ Troubleshooting & Common Issues

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| **`adb devices` shows `offline` or empty** | Bad USB cable or missing USB debugging authorization. | Re-plug cable, toggle USB Debugging OFF/ON, or run `adb kill-server && adb start-server`. |
| **`INSTALL_FAILED_UPDATE_INCOMPATIBLE`** | Application ID conflict with an existing build signed with a different key. | Uninstall previous build via `adb uninstall com.fantasticdice.app` before installing. |
| **Black screen / WebGL context lost** | Hardware acceleration disabled or WebAssembly failed to load. | Verify `allowMixedContent: true` in `capacitor.config.ts` and inspect console via `chrome://inspect`. |
| **Shake detection not triggering** | WebView suppressing `devicemotion` events on non-HTTPS origins. | Native Java `SensorEventListener` in `MainActivity.java` automatically bridges accelerometer events directly to WebView. |
| **No audio output on roll** | Device set to Silent/Vibrate or Android audio policy restriction. | Toggle silent mode off or interact with the screen to initialize AudioContext playback. |
