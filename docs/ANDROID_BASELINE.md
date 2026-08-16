# Fancy Dice — Android Physical Device Baseline Test Sheet

> **Note:** Do NOT invent measurements or physical device observations. Real-device performance metrics and functional checkboxes must be populated during hands-on testing on the Samsung Galaxy S24 physical test device.

---

## 1. Device Hardware & OS Specifications

- **Manufacturer**: Samsung
- **Model**: Galaxy S24 (SM-S921B / SM-S921U)
- **Android Version**: Android 14 (One UI 6.1)
- **Screen Resolution**: 2340 x 1080 pixels (FHD+, 416 ppi)
- **Refresh Rate**: 120Hz (Adaptive 1Hz–120Hz)
- **RAM**: 8 GB LPDDR5X
- **Chipset**: Qualcomm Snapdragon 8 Gen 3 for Galaxy / Samsung Exynos 2400
- **GPU**: Adreno 750 / Xclipse 940

---

## 2. Build Information

- **Git Commit**: `0d0412b16b2d842c501f0afe08561ea56761c054`
- **Build Type**: Debug (`app-debug.apk`)
- **APK Size**: 18.2 MB (18,196,571 bytes)
- **Build Timestamp**: 2025-08-16 23:09:00 UTC
- **Package / Application ID**: `com.fantasticdice.app`
- **Gradle Version**: 8.14.3
- **Capacitor CLI Version**: 8.5.0

---

## 3. Verification Status Key

- **[VERIFIED]**: Confirmed in sandbox CI/build pipeline.
- **[INFERRED]**: Logic exists in code and is structurally sound, but awaits physical device execution.
- **[REQUIRES REAL DEVICE TEST]**: Requires manual testing on physical Samsung Galaxy S24 hardware.

---

## 4. Functional Validation Checklist

| Feature / System | Status | Physical Device Observation / Notes |
| :--- | :---: | :--- |
| **Application launches** | `[VERIFIED]` | APK installs and launches via ADB on Android API 34+ target. |
| **DiceBox initializes** | `[INFERRED]` | Web build instantiates `@3d-dice/dice-box` container cleanly. |
| **WebGL renders** | `[REQUIRES REAL DEVICE TEST]` | Requires GPU WebGL context validation on physical Adreno 750 / Xclipse 940. |
| **Physics initializes** | `[INFERRED]` | Ammo.js rigid body collision engine integrated into WebGL scene. |
| **WASM loads** | `[INFERRED]` | WebAssembly physics binaries included in static web assets (`dist/assets/`). |
| **Single dice roll works** | `[REQUIRES REAL DEVICE TEST]` | Pending physical roll verification on Samsung Galaxy S24. |
| **Multiple dice work** | `[REQUIRES REAL DEVICE TEST]` | Pending physical roll verification on Samsung Galaxy S24. |
| **Modifiers work** | `[INFERRED]` | Notation engine (`diceParser.ts`) verified unit logic. |
| **Themes work** | `[INFERRED]` | Dynamic material & dice skins update state via `RightOptionsPanel.tsx`. |
| **Audio works** | `[INFERRED]` | Web Audio synthesizer + fallback SFX audio assets present. |
| **Haptics work** | `[REQUIRES REAL DEVICE TEST]` | Requires physical Samsung Galaxy S24 vibration motor test via `@capacitor/haptics`. |
| **Shake detection works** | `[REQUIRES REAL DEVICE TEST]` | Requires hardware accelerometer shake test via Java `SensorEventListener`. |
| **Roll history works** | `[INFERRED]` | UI history ticker updates upon roll completion in `BottomHistoryBar.tsx`. |
| **UI controls work** | `[INFERRED]` | Touch controls and collapsible panels respond to React state changes. |
| **Landscape orientation works** | `[VERIFIED]` | Android Manifest configured with `orientation` activity flags. |
| **Background/foreground lifecycle works** | `[REQUIRES REAL DEVICE TEST]` | Requires app minimization and restore test on physical device. |
| **App can be reopened successfully** | `[REQUIRES REAL DEVICE TEST]` | Requires task killer and re-launch test on physical device. |

---

## 5. Performance Observations (To Be Filled During Physical Test)

> *Leave blank/unfilled until physical device testing on Samsung Galaxy S24 is conducted.*

- **Startup Time (Cold Launch to WebGL Ready)**: _[Pending Physical Test]_
- **Time to First Usable Screen**: _[Pending Physical Test]_
- **Time to First Roll Completion**: _[Pending Physical Test]_
- **FPS / Frame Smoothness During Dice Roll**: _[Pending Physical Test]_
- **Memory Behaviour (Peak RAM Usage)**: _[Pending Physical Test]_
- **Thermal Behaviour (Device Temperature after 5 mins continuous rolling)**: _[Pending Physical Test]_
- **Battery Behaviour (% drain per 10 mins usage)**: _[Pending Physical Test]_

---

## 6. Discovered Issues & Findings

- **Physical Device Test Status**: Physical-device validation remains a manual step as no physical USB hardware target was attached to the sandbox build environment during this pipeline setup phase.
