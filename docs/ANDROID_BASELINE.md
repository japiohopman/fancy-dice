# Android Real Device Baseline Test Sheet — Fancy Dice

This document serves as the formal baseline measurement sheet for evaluating **Fancy Dice 3D** on physical Android hardware.

> **Note**: Do NOT invent performance numbers. Fill in the observed results after performing physical testing on a real device.

---

## 📱 1. Device Metadata

| Attribute | Value |
| :--- | :--- |
| **Manufacturer** | *(e.g., Samsung, Google, Xiaomi)* |
| **Model** | *(e.g., Galaxy S23, Pixel 8)* |
| **Android Version / API** | *(e.g., Android 14 / API 34)* |
| **Screen Resolution** | *(e.g., 2340 x 1080)* |
| **Display Refresh Rate** | *(e.g., 60 Hz / 120 Hz)* |
| **Total System RAM** | *(e.g., 8 GB)* |
| **Chipset / GPU** | *(e.g., Snapdragon 8 Gen 2 / Adreno 740)* |

---

## 📦 2. Application & Build Metadata

| Attribute | Value |
| :--- | :--- |
| **App Name** | Fantastic Dice 3D (`com.fantasticdice.app`) |
| **App Version / Git Commit** | `v0.0.0` / Commit `0d0412b` (or current HEAD) |
| **Build Type** | Debug APK (`assembleDebug`) |
| **APK File Size** | `18.2 MB` (18,196,571 bytes) |
| **Build Timestamp** | 2026-08-16 22:39 UTC |

---

## ✅ 3. Functional Verification Checklist

Record `[x]` for PASS or `[ ]` for FAIL / UNTESTED on the physical target device:

- [ ] **App launches**: Application opens directly into fullscreen without crashing or blank screen.
- [ ] **DiceBox initializes**: `@3d-dice/dice-box` component instantiates without throwing JS exceptions.
- [ ] **WebGL renders**: 3D canvas viewport, lighting, and table felt surface render clearly.
- [ ] **Physics initializes**: Ammo.js rigid-body collision world initializes.
- [ ] **WASM loads**: `ammo.wasm.wasm` loads successfully via local WebView assets.
- [ ] **Dice can roll**: Tapping "Roll" triggers 3D physical dice trajectory and settlement.
- [ ] **Multiple dice work**: Staging multiple dice (e.g. `4d6 + 1d20`) rolls all dice simultaneously.
- [ ] **Modifiers work**: Positive and negative formula modifiers (e.g. `+5`, `-2`) compute correctly in total result.
- [ ] **Themes work**: Changing 3D dice materials (e.g. Gold, Emerald, Cyber Neon) updates dice textures dynamically.
- [ ] **Audio works**: Roll impacts, natural 20 chimes, and natural 1 fumble audio play accurately.
- [ ] **Haptics work**: Device vibration triggers on dice collision and roll triggers.
- [ ] **Shake detection works**: Shaking physical device triggers dice cup rattle sounds and table-stillness roll.
- [ ] **History works**: Roll history ticker logs roll results and supports 1-tap re-rolls.
- [ ] **UI controls work**: Left staged dice builder and Right theme/settings menus expand/collapse properly.
- [ ] **Landscape orientation works**: UI locks to landscape orientation without scrollbars or clipped overlays.
- [ ] **Background/foreground lifecycle works**: Minimizing app to home screen and returning restores WebGL context gracefully.
- [ ] **App can be reopened successfully**: Force closing and relaunching app opens cleanly without stale state corruption.

---

## 📊 4. Performance & Resource Observations

*To be measured during real device physical testing:*

| Metric | Target / Benchmark | Observed Result | Notes & Observations |
| :--- | :--- | :--- | :--- |
| **Startup Time (Cold Launch)** | < 2.5s | *[TBD]* | Time from tapping app icon to WebGL canvas render. |
| **Time to First Usable Screen** | < 3.0s | *[TBD]* | Time until top notation bar and controls are interactive. |
| **Time to First Roll** | < 1.0s | *[TBD]* | Latency from tapping "Roll" to dice motion start. |
| **FPS During 1 Die Roll** | 60 FPS | *[TBD]* | Frame rate during d20 roll animation. |
| **FPS During 10 Dice Roll** | >= 45 FPS | *[TBD]* | Frame rate during heavy multi-dice roll physics simulation. |
| **Perceived Frame Smoothness** | Smooth / Stutter-free | *[TBD]* | Subjective visual evaluation of motion jitter. |
| **Peak Memory Usage (RAM)** | < 250 MB | *[TBD]* | Android System RAM consumption during active rolls. |
| **Thermal Behaviour** | Normal / Warm | *[TBD]* | Heat buildup after 5 minutes of continuous rolling. |
| **Battery Behaviour** | Normal | *[TBD]* | Battery drain rate during extended 3D physics rendering session. |

---

## 📝 5. Defect & Observation Log

*Record any unexpected behaviors, WebGL crashes, audio glitches, or sensor issues observed during testing:*

| Issue # | Description | Severity (Low/Med/High) | Reproduction Steps |
| :--- | :--- | :--- | :--- |
| *1* | *Sample: [To be logged on real device]* | *—* | *—* |
