# Android delivery status and roadmap

## 1. Current delivery: installable PWA

The current supported Android experience is the published Progressive Web App (PWA), not a native APK/AAB.

**Published URL:** https://japiohopman.github.io/fancy-dice/

The app is served under the GitHub Pages repository path /fancy-dice/. The Vite production build sets that base path in GitHub Actions; local development uses /.

To install:

1. Open the published URL in Chrome on Android while online.
2. Open Chrome's menu and select **Install app** or **Add to Home screen**.
3. Launch Fancy Dice from the home screen.

The web app manifest uses standalone display and intentionally omits a fixed orientation request. The app shell follows the device's current viewport and applies CSS safe-area insets.

## 2. What currently works through browser APIs

| Capability | Current implementation | Boundary |
| --- | --- | --- |
| Shake-to-roll | ShakeDetector.ts listens for browser DeviceMotionEvent on supported mobile/touch browsers. | Physical sensor behaviour and permission prompts require a real-device check. |
| Motion permission | Calls the browser DeviceMotionEvent.requestPermission API when the browser exposes it. | This is not a Capacitor permission flow. |
| Vibration | Uses navigator.vibrate when available and enabled. | Browser/device support varies. |
| Sound | Web Audio API synthesis in audioManager.ts. | Audio requires an appropriate user interaction and browser audio support. |
| 3D dice | DiceBox, Babylon.js and Ammo.js WebAssembly in the browser. | WebGL/WebAssembly availability and performance require physical-device verification. |
| Offline launch | Service worker precaches the app shell, icons, generated JS/CSS; same-origin stable game assets are cached when requested. | First visit needs internet. After the service worker is active, relaunch once while online and wait for the dice table to finish loading before relying on offline use. |

## 3. Capacitor status — configured dependencies, no native app yet

The repository currently contains:

- Capacitor Core, CLI, Android, Motion and Haptics dependencies in package.json.
- capacitor.config.ts with appId com.fantasticdice.app, appName Fantastic Dice 3D and webDir dist.
- Android WebView options in that config, including allowMixedContent, captureInput and webContentsDebuggingEnabled.

The repository does **not** contain a committed android/ platform directory. The directory is excluded by .gitignore. The active app source does not import or call @capacitor/motion or @capacitor/haptics; sensor and vibration behaviour currently uses browser APIs.

Consequently, there is no verified native Android Studio project, native plugin bridge, APK/AAB build or Play Store release in this repository. Do not describe the Capacitor packages as integrated native functionality.

## 4. Conditional native Android path

A native Android target should be created only after a separate product decision confirms that an APK/AAB is needed and defines its maintenance/release expectations. If approved, use this sequence:

1. Confirm the native app ID, display name, signing ownership, release target and the deliberate decision to track the Android platform directory.
2. Generate the platform with the installed Capacitor CLI (npx cap add android) and update repository ignore rules intentionally. Do not accidentally commit generated build output or signing secrets.
3. Integrate Capacitor Motion and Haptics behind a small platform adapter, retaining browser DeviceMotionEvent/navigator.vibrate fallbacks for the PWA. Do not add a custom Kotlin sensor event bridge unless a verified plugin limitation requires it.
4. Build the web app and sync it to the native project with npm run build and npx cap sync android.
5. Open the project in Android Studio, complete Gradle sync, inspect permissions and WebView settings, and verify the PWA/native capability differences on a physical Android device.
6. Validate rotation, status/navigation bars, safe-area spacing, WebGL context recovery, motion, haptics, audio lifecycle, app background/foreground and offline behaviour.
7. Only after those checks, configure app icons/splash resources, signing, APK/AAB output and any store release.

This is a possible future path, not an active native-release commitment. No Kotlin sensor implementation is currently maintained in the repository.

## 5. Orientation and device UI policy

Do not force the PWA or a future native activity to landscape. The current PWA manifest omits orientation and the app uses the live viewport. A future native target should preserve the system/user orientation preference unless a separate product decision explicitly changes it.

On physical devices check the system status bar, navigation area, display cutouts, keyboard and safe-area spacing. Browser viewport emulation is useful but does not replace a real-device test.

## 6. Test checklist

Use the detailed, repeatable procedure in PWA_ANDROID_TEST_GUIDE.md. At minimum verify:

- Install, standalone launch and relaunch.
- Portrait and landscape rotation.
- DiceBox startup, a single d20, multi-die rolls and physical result mapping.
- Motion permission, shake-to-roll and vibration where supported.
- Audio start, mute/unmute and background/foreground recovery.
- Theme/color changes, menu scrolling and history.
- Online launch followed by an offline relaunch.
- No content hidden by system UI or display cutouts.

Record device model, Android version, Chrome/WebView version, test date and observed failures in the relevant GitHub issue. Mark browser/emulator checks separately from physical-device results.
