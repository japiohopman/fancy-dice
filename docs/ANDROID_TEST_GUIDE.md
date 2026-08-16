# Android Real Device Test Guide — Fancy Dice

This guide outlines the step-by-step procedure for building, installing, running, debugging, and testing **Fancy Dice 3D** on a physical Android device.

---

## 🛠️ Prerequisites & Environment Requirements

Before generating a test build, ensure your environment has the following installed and configured:

1. **Node.js & npm**: Node.js 18+ and npm 9+.
2. **Java Development Kit (JDK)**: JDK 17 or JDK 21. Verify with `java -version`.
3. **Android SDK & Build-Tools**:
   - `ANDROID_HOME` or `ANDROID_SDK_ROOT` environment variable set (e.g. `/opt/android-sdk` or `~/Android/Sdk`).
   - Android SDK Platform-Tools (`adb`).
   - Android SDK Build-Tools (version 34+ recommended).
   - Android SDK Platform `android-34` or `android-35`.
4. **Gradle**: Managed via Gradle Wrapper (`./gradlew`) in the `android/` directory (Gradle 8.14.3 included).

---

## 📲 Step 1: Prepare the Android Physical Device

1. **Enable Developer Options**:
   - On the Android device, go to **Settings > About Phone**.
   - Tap **Build Number** 7 times until a popup says *"You are now a developer!"*.
2. **Enable USB Debugging**:
   - Go to **Settings > System > Developer Options** (or **Settings > Developer Options**).
   - Enable **USB Debugging**.
3. **Connect Device to Computer**:
   - Connect the device via USB cable.
   - On the device, when prompted with *"Allow USB debugging?"*, select **Always allow from this computer** and tap **Allow**.
4. **Verify ADB Connection**:
   - Run in terminal:
     ```bash
     adb devices
     ```
   - Confirm your device is listed with state `device` (not `unauthorized` or `offline`).

---

## 🏗️ Step 2: Build the Android Application

Execute the reproducible build pipeline from the root directory:

### Option A: Using Single NPM Shortcut (Recommended)

```bash
npm run cap:build:apk
```

### Option B: Manual Step-by-Step Commands

1. **Compile Web Application**:
   ```bash
   npm run build
   ```
   *Output*: Generates production assets in `dist/`.

2. **Add Android Platform (if missing)**:
   ```bash
   npx cap add android
   ```

3. **Synchronize Web Assets to Capacitor**:
   ```bash
   npx cap sync android
   ```
   *Output*: Copies `dist/` into `android/app/src/main/assets/public/` (including 3D meshes, textures, sounds, and Ammo WASM binaries).

4. **Build Debug APK with Gradle**:
   ```bash
   cd android
   ./gradlew assembleDebug
   cd ..
   ```

### 📍 Generated APK Location

The compiled debug APK will be created at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```
*Approximate File Size*: ~18.2 MB

---

## 📦 Step 3: Install the APK on Real Device

### Via ADB (USB Cable):

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Direct Transfer (Wireless/Drive):

1. Copy `app-debug.apk` to Google Drive or transfer directly to the device's Downloads folder.
2. Open Files app on Android and tap `app-debug.apk`.
3. If prompted, allow installation from unknown sources for your file manager.

---

## 🚀 Step 4: Launch the Application

1. Locate **Fantastic Dice 3D** on the home screen or app drawer.
2. Tap the icon to launch.
3. Confirm the application opens in **Landscape orientation** without scrollbars.

---

## 🔍 Step 5: Inspect Logs & Remote Debugging

### Method A: Chrome Remote WebInspect (DOM, WebGL, Web Audio, Console Logs)

1. Open Google Chrome on your computer and navigate to:
   ```
   chrome://inspect/#devices
   ```
2. Locate your connected Android device under **Remote Target**.
3. Find **Fantastic Dice 3D** (`com.fantasticdice.app`) in the target list and click **inspect**.
4. Use Chrome Developer Tools to inspect console messages, network calls, WebGL errors, and performance frame rate.

### Method B: ADB System Logcat (Native Bridge & OS Logs)

Run in terminal to stream live Android native and WebView console logs:

```bash
adb logcat | grep -iE "Capacitor|Chromium|Console|FantasticDice"
```

---

## 🗑️ Step 6: Uninstall Test Build

To cleanly remove the test application from the device:

```bash
adb uninstall com.fantasticdice.app
```

---

## ⚠️ Common Failure Modes & Diagnostics

| Symptom / Failure Mode | Likely Root Cause | Diagnostic & Resolution Step |
| :--- | :--- | :--- |
| **Black screen or canvas fails to render 3D dice** | WebGL 2.0 acceleration unsupported or disabled in WebView. | Inspect `chrome://inspect` Console for `THREE.WebGLRenderer` context creation failure. Ensure `allowMixedContent: true` and hardware acceleration are enabled. |
| **Physics engine freeze / dice floating in mid-air** | WebAssembly (`ammo.wasm.wasm`) failed to load or parse over WebView assets file scheme. | Check Console for `Failed to load resource: net::ERR_FILE_NOT_FOUND` or WASM mime-type errors. Ensure `androidScheme: 'https'` is configured in `capacitor.config.ts`. |
| **Shake gesture does not trigger dice rattle / roll** | Hardware accelerometer disabled or `devicemotion` event listener blocked by Android OS privacy policies. | Test on device with hardware accelerometer. Verify motion sensor permissions in Android settings. Check logcat for `DeviceMotionEvent` dispatching. |
| **No roll impact audio or critical sound effects** | Web Audio API context in `AudioContext.state === 'suspended'` due to user interaction requirement. | Tap screen once to trigger initial AudioContext resume gesture. Check console for `audioManager` playback warnings. |
| **Haptic vibration not felt on roll** | Capacitor Haptics plugin permission missing or device hardware motor unsupported. | Verify `<uses-permission android:name="android.permission.VIBRATE" />` in `AndroidManifest.xml`. |
| **UI elements clipped or cut off by camera notch** | Android safe area inset or aspect ratio overflow on wide displays. | Verify CSS `--sat`, `--sab`, `--sal`, `--sar` padding variables and landscape viewport bounds. |
