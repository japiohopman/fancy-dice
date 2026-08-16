# FANCY DICE — MASTER ROADMAP (P0 – P3)

This roadmap outlines all prioritized polish, performance, Android readiness, and refactoring tasks for **Fancy Dice**.

---

## PRIORITIZATION SUMMARY

- **P0 (Critical — Blocker)**: Must be completed for basic project integrity and native Android compilation.
- **P1 (High — Priority)**: Essential performance optimizations, hardware sensor bridging, and UX bug fixes.
- **P2 (Medium — Quality)**: Code cleanup, dead code removal, and responsive UI refinements.
- **P3 (Polish — Enhancement)**: Visual enhancements and documentation synchronization.

---

## TASK SPECIFICATIONS

### P0-1: Dead Code Removal & Workspace Sanitation
- **Objective**: Remove unimported legacy UI components (`DiceTray.tsx`, `RPGPresets.tsx`, `RollHistory.tsx`, `ThemeSelector.tsx`, `AndroidMobileGuide.tsx`, `RollResultModal.tsx`).
- **Problem**: 6 legacy files consume maintenance bandwidth and confuse developers.
- **Reason**: Unused components bloat the repository and create type-checking noise.
- **Affected Area**: `src/components/`.
- **Expected Outcome**: Clean, unambiguous component directory containing only active components.
- **Validation Method**: `npm run lint` and `npm run build` pass cleanly with zero references to deleted files.
- **Risk**: Low.
- **Dependencies**: None.
- **Estimated Complexity**: Low.

### P0-2: Native Android Project Generation & Capacitor Sync
- **Objective**: Initialize and commit the native `android/` platform project via Capacitor CLI.
- **Problem**: `android/` directory is missing from source control (`.gitignore`), preventing APK compilation.
- **Reason**: Application cannot be compiled for Android without the native wrapper project.
- **Affected Area**: `.gitignore`, `android/` directory.
- **Expected Outcome**: Native Android project checked into git with correct `appId` (`com.fantasticdice.app`) and Capacitor bridge settings.
- **Validation Method**: `npx cap sync android` executes with 0 errors; Android Studio syncs Gradle cleanly.
- **Risk**: Medium.
- **Dependencies**: P0-1.
- **Estimated Complexity**: Medium.

---

### P1-1: Capacitor Hardware Motion & Haptic Plugin Integration
- **Objective**: Upgrade `ShakeDetector.ts` to utilize `@capacitor/motion` and `@capacitor/haptics` when running inside Capacitor Android WebView, with Web API fallback for browsers.
- **Problem**: Current implementation uses browser `DeviceMotionEvent` and `navigator.vibrate()`, which fail or behave inconsistently across native mobile environments.
- **Reason**: Native Capacitor plugins ensure reliable background/foreground hardware sensor access on Android.
- **Affected Area**: `src/lib/shakeDetector.ts`, `src/App.tsx`.
- **Expected Outcome**: Flawless shake-to-roll gesture detection and haptic feedback on real Android devices.
- **Validation Method**: Manual hardware testing on physical Android device.
- **Risk**: Medium.
- **Dependencies**: P0-2.
- **Estimated Complexity**: Medium.

### P1-2: WebGL Bundle & Physics Chunk Optimization
- **Objective**: Optimize Vite build configuration and `@3d-dice/dice-box` dynamic imports to eliminate Rollup >500kB chunk warnings.
- **Problem**: Production build outputs a 1.4MB offscreen WebAssembly chunk (`world.offscreen.js`).
- **Reason**: Large initial chunk slows WebGL initialization on budget mobile devices.
- **Affected Area**: `vite.config.ts`, `src/components/ThreeDiceCanvas.tsx`.
- **Expected Outcome**: Reduced chunk size warnings and faster 3D stage loading.
- **Validation Method**: `npm run build` produces optimized chunk sizes with zero warnings.
- **Risk**: Medium.
- **Dependencies**: P0-1.
- **Estimated Complexity**: Medium.

### P1-3: Mobile Landscape Viewport & Overlay Overflow Fixes
- **Objective**: Prevent `RollOutcomeOverlay.tsx` text overflow and optimize left/right panel width in landscape mode on screens under 1024px.
- **Problem**: 3-digit totals overflow viewports, and expanded sidebars squeeze the 3D canvas stage.
- **Reason**: Ensures mobile landscape users have an uncluttered, responsive 3D viewport.
- **Affected Area**: `src/components/RollOutcomeOverlay.tsx`, `src/components/LeftOptionsPanel.tsx`, `src/components/RightOptionsPanel.tsx`.
- **Expected Outcome**: Responsive text scaling for total values and optimized sidebar widths on compact mobile devices.
- **Validation Method**: Multi-resolution mobile viewport testing in Chrome DevTools / Playwright.
- **Risk**: Low.
- **Dependencies**: None.
- **Estimated Complexity**: Low.

---

## P2 & P3 TASKS

### P2-1: Color Wheel Interaction Throttling
- **Objective**: Throttle drag event handlers on the interactive color picker in `RightOptionsPanel.tsx`.
- **Affected Area**: `src/components/RightOptionsPanel.tsx`.
- **Expected Outcome**: Smooth 60fps color updates without frame drops.

### P2-2: Audio Manager Web Audio Node Pooling
- **Objective**: Reuse `AudioContext` and gain nodes in `audioManager.ts` to prevent GC pauses during rapid multi-dice rolls.
- **Affected Area**: `src/lib/audioManager.ts`.
- **Expected Outcome**: Zero audio buffer allocation overhead during physics rolls.

### P3-1: Documentation Synchronization & README Rewrite
- **Objective**: Rewrite `README.md` and synchronize `docs/ARCHITECTURE.md` and `docs/ANDROID_ROADMAP.md` with current codebase reality.
- **Affected Area**: `README.md`, `docs/`.
- **Expected Outcome**: Precise, authoritative project documentation.
