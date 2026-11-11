# Android Native App Roadmap & Deployment Guide

This document outlines step-by-step instructions for converting the **Fantastic 3D Dice Roller** web app into a native Android application (`.apk` / `.aab`) with hardware accelerometer motion detection and haptic vibration feedback.

---

## 🚀 Option A: Capacitor Native Bridge (Recommended)

Capacitor by Ionic wraps our React + WebGL + Three.js web application into a native Android Studio project with full access to native Android Kotlin APIs, hardware sensors, and haptics.

### Step 1: Install Capacitor Dependencies in Project

Run the following commands in your project terminal:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npm install @capacitor/motion @capacitor/haptics
```

### Step 2: Initialize Capacitor Configuration

Initialize Capacitor with your app name and package ID:

```bash
npx cap init "Fantastic Dice 3D" "com.fantasticdice.app" --web-dir "dist"
```

In `capacitor.config.json`, enable mixed hardware acceleration:

```json
{
  "appId": "com.fantasticdice.app",
  "appName": "Fantastic Dice 3D",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  },
  "android": {
    "allowMixedContent": true,
    "captureInput": true,
    "webContentsDebuggingEnabled": true
  }
}
```

### Step 3: Add Android Platform Target

Add the native Android platform folder:

```bash
npx cap add android
```

### Step 4: Build Web App & Sync to Android

Compile the production bundle and copy assets into the Android native platform folder:

```bash
npm run build
npx cap sync android
```

---

## 📱 Hardware Shake & Sensor Integration (Native Android Kotlin)

Capacitor automatically bridges native Android accelerometer events. Alternatively, to write direct native Android Kotlin sensor listeners inside `android/app/src/main/java/com/fantasticdice/app/MainActivity.kt`:

```kotlin
package com.fantasticdice.app

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Bundle
import com.getcapacitor.BridgeActivity
import kotlin.math.sqrt

class MainActivity : BridgeActivity(), SensorEventListener {
    private lateinit var sensorManager: SensorManager
    private var accelCurrent = SensorManager.GRAVITY_EARTH
    private var accelLast = SensorManager.GRAVITY_EARTH
    private var shakeThreshold = 12.0f

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        sensorManager = getSystemService(SENSOR_SERVICE) as SensorManager
        sensorManager.registerListener(
            this,
            sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER),
            SensorManager.SENSOR_DELAY_GAME
        )
    }

    override fun onSensorChanged(event: SensorEvent) {
        val x = event.values[0]
        val y = event.values[1]
        val z = event.values[2]

        accelLast = accelCurrent
        accelCurrent = sqrt((x * x + y * y + z * z).toDouble()).toFloat()
        val delta = accelCurrent - accelLast

        if (delta > shakeThreshold) {
            // Dispatch custom event to WebGL Javascript context
            bridge.webView.post {
                bridge.webView.evaluateJavascript("window.dispatchEvent(new Event('devicemotion'));", null)
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
}
```

---

## 🔒 Android orientation policy

The installable PWA does not force an orientation: its manifest omits the `orientation` member so the device/operating system can choose portrait or landscape. The page uses safe-area insets to keep controls clear of display cutouts and system UI.

Keep a future Capacitor/native Android build separate from the PWA policy. **Do not add** `android:screenOrientation="landscape"` or `"sensorLandscape"` to `AndroidManifest.xml` by copying an old example. Leave the activity's orientation unspecified by default so Android can follow the device and user orientation settings. A fixed native orientation would require a separate, explicit product decision and physical-device verification.

For a native build, also verify the Android status/navigation bars, edge-to-edge behaviour and safe-area spacing together with the WebView content. The current repository does not declare a native orientation lock in `capacitor.config.ts`.

---

## 🛠️ Building the Android APK / App Bundle

### Open in Android Studio:

```bash
npx cap open android
```

1. Inside Android Studio, wait for Gradle sync to complete.
2. Select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
3. The generated `.apk` file will be located at:
   `android/app/build/outputs/apk/debug/app-debug.apk`
4. Transfer `app-debug.apk` to your Android device via USB/Google Drive and tap to install!

---

## ⚡ Option B: Trusted Web Activity (TWA) / Bubblewrap

For a lightweight web APK without native plugins:

1. Install Google's CLI:
   ```bash
   npm install -g @bubblewrap/cli
   ```
2. Initialize from your live HTTPS app URL:
   ```bash
   bubblewrap init --manifest=https://your-app-url.com/manifest.json
   ```
3. Build release APK:
   ```bash
   bubblewrap build
   ```

---

## 🗺️ Native Android Feature Roadmap

- [x] **3D Physics Engine**: Ammo.js WebGL rendering for d4–d100 & Fate dice.
- [x] **Motion Detection**: `DeviceMotionEvent` accelerometer shake handler.
- [ ] **Responsive portrait/landscape UI**: Validate the dice stage, overlays, header/footer and Android system bars in both orientations (issue #37).
- [x] **Auto-Fading Outcome**: Center result modal with critical success/fumble particle animations.
- [ ] **Native Capacitor Build**: Android Studio project generation (`npx cap add android`).
- [ ] **Custom App Icon & Splash**: 512x512 adaptive icon for Android home screen launcher.
- [ ] **Google Play Release**: Signed AAB bundle and Play Console publishing.
