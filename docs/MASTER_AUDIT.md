# FANCY DICE — MASTER TECHNICAL AUDIT REPORT

**Repository**: `japiohopman/fancy-dice`
**Role**: Lead Engineering Auditor & Agentic Workflow Architect
**Scope**: Full Repository Audit (WebGL Physics, Android/Capacitor, Motion Sensors, Audio/Haptics, UX/UI, Code Quality, Documentation)
**Status**: Feature Complete — Polish & Optimization Phase Pre-Audit

---

## A. EXECUTIVE SUMMARY

Fancy Dice is a mobile-first, static-landscape 3D tabletop dice rolling application. Its core capabilities—realistic 3D polyhedral dice physics powered by Three.js and Ammo.js (`@3d-dice/dice-box`), custom TRPG notation parsing (`1d20+5`, `4d6kh3`, `4dF`), device shake/motion controls, Web Audio sound synthesis, felt table customizations, and collapsible sidebar panels—are functionally implemented and operational.

However, a rigorous technical audit reveals that while the application is functional as a web prototype, **it is not yet ready for release as a premium native Android application**.

### Primary Findings & Vulnerabilities:
1. **Unused / Dead Code & Architectural Duplication**: The codebase contains 6 legacy UI components (`DiceTray.tsx`, `RPGPresets.tsx`, `RollHistory.tsx`, `ThemeSelector.tsx`, `AndroidMobileGuide.tsx`, `RollResultModal.tsx`) that are never imported in `App.tsx`. They represent abandoned iterations from earlier development cycles.
2. **WebGL / WebAssembly Asset Initialization Vulnerabilities**: `@3d-dice/dice-box` assets in `public/assets/dice-box/` are prone to version desynchronization and corruption. The offscreen WASM physics bundle produces large bundle warnings (>1.4MB) during production builds.
3. **Android Capacitor Project Gap**: While `@capacitor/core`, `@capacitor/android`, `@capacitor/motion`, and `@capacitor/haptics` are declared in `package.json` and `capacitor.config.ts` exists, the native `android/` platform directory is omitted from source control (`.gitignore`). No native Android build target or adaptive splash/icon pipeline is committed.
4. **Motion Detector & Sensor Disconnect**: `ShakeDetector.ts` relies on standard `window.addEventListener('devicemotion')` and `navigator.vibrate()`, bypassing the installed `@capacitor/motion` and `@capacitor/haptics` plugins. Furthermore, `docs/ANDROID_ROADMAP.md` contradicts the current implementation by proposing native Kotlin sensor overrides in `MainActivity.kt`.
5. **Documentation Drift & Template Rot**: `README.md` is an unedited Google AI Studio template mentioning Gemini API keys. `docs/ARCHITECTURE.md` and `docs/ANDROID_ROADMAP.md` describe outdated native Kotlin procedures and missing UI elements.

---

## B. ARCHITECTURE ASSESSMENT

### Core React Architecture & State Management
- **State Organization**: Application state resides in root `App.tsx` (`currentFormula`, `currentResult`, `isRolling`, `isCupShaking`, `shakeSettings`, `history`, `materialTheme`, `tableTheme`, `diceTheme`).
- **Data Flow**: Unidirectional state flow passes setters and props to child components (`TopNotationBar`, `LeftOptionsPanel`, `RightOptionsPanel`, `BottomHistoryBar`, `ThreeDiceCanvas`).
- **Sidebar Panel Real-time Sync**: `LeftOptionsPanel.tsx` uses an internal `useEffect` on `stagedDice`, `modifier`, and `advantage` to call `onFormulaUpdate(formula)` in real-time, updating `App.tsx`'s `currentFormula`.
- **Async Closure Management**: `ThreeDiceCanvas.tsx` employs `onRollCompleteRef` to maintain the latest reference to `handleRollComplete` from `App.tsx`, avoiding stale closure bugs when Ammo.js physics callbacks resolve asynchronously.

### 3D Physics Engine (`@3d-dice/dice-box` & Three.js / Ammo.js)
- **Container Cleanup**: `ThreeDiceCanvas.tsx` explicitly resets `containerRef.current.innerHTML = ''` prior to `box.init()` to prevent duplicate WebGL canvases during React StrictMode double-mounting or Vite Hot Module Replacement (HMR).
- **Offscreen vs Main Thread**: DiceBox is instantiated with `offscreen: false` to guarantee synchronous canvas mounting on mobile WebViews.
- **Physical Result Mapping**: Physical dice roll outcomes are captured in `handleRollComplete` and mapped back into the structured formula result via `updateParsedResultWithPhysicalRolls()` in `diceParser.ts`.

---

## C. ANDROID READINESS

### Capacitor Bridge Analysis
| Component / Layer | Configured State | Audit Finding |
| :--- | :--- | :--- |
| **Capacitor CLI / Core** | Installed (`^8.5.0`) | Configured in `capacitor.config.ts` (`appId: com.fantasticdice.app`, `webDir: dist`). |
| **Android Native Project** | Ignored in `.gitignore` | `android/` folder does NOT exist in source tree; requires `npx cap add android`. |
| **Hardware Motion / Accelerometer** | Browser API (`devicemotion`) | Works in Chrome/WebView, but fails on iOS Safari without permission prompts; does not utilize `@capacitor/motion`. |
| **Haptic Feedback** | Web API (`navigator.vibrate`) | Web fallback used; `@capacitor/haptics` plugin is unlinked in code. |
| **App Icons & Launcher** | Default Android Studio assets | Adaptive icons, vector splash screens, and Android theme styling are missing. |

---

## D. PERFORMANCE ASSESSMENT

### Identified Bottlenecks

#### 1. Offscreen WebAssembly Physics Bundle Size (>1.4MB)
- **Problem**: Rollup outputs chunk size warnings during `npm run build` (`dist/assets/world.offscreen-C5e_o3iU.js` = 1,447 kB).
- **Evidence**: `vite build` terminal output.
- **Impact**: Slower cold-start initialization times on lower-tier Android mobile devices.
- **Confidence**: High.
- **Measurement Needed**: Measure Time-to-Interactive (TTI) and WebGL Context Creation time on low-end Android hardware.

#### 2. Sound Synthesis Garbage Collection
- **Problem**: `audioManager.playDiceRollSound()` creates multiple `AudioContext` oscillators, gain nodes, and noise buffers dynamically on every bounce (up to 14 timeouts per roll).
- **Evidence**: `src/lib/audioManager.ts` lines 60–98.
- **Impact**: Micro-stutters/jank during heavy dice collision physics if garbage collection runs mid-animation.
- **Confidence**: Medium.
- **Measurement Needed**: Chrome DevTools Performance CPU profiler during multi-dice rolls (`8d6`).

#### 3. Real-Time Conic Gradient Color Picker Drag Overhead
- **Problem**: Dragging on the interactive color wheel in `RightOptionsPanel.tsx` updates React state (`wheelH`, `wheelS`) and executes `onChangeMaterialTheme()` on every `touchmove` / `mousemove` frame without throttling.
- **Evidence**: `RightOptionsPanel.tsx` lines 140–165.
- **Impact**: Frame drops on 60Hz/120Hz mobile screens during color picking.
- **Confidence**: High.
- **Measurement Needed**: Frame rate recording during color wheel interaction using Chrome Performance tab.

---

## E. UX / UI ASSESSMENT

### Critical UX Findings
1. **Viewport Width Contraction on Mobile**: On screens between 768px and 1024px in landscape mode, expanding both `LeftOptionsPanel` (160px) and `RightOptionsPanel` (160px) consumes 320px of horizontal space, reducing the center 3D canvas stage to less than 50% of the screen width.
2. **Outcome Text Size Overflow**: `RollOutcomeOverlay.tsx` uses fixed font size classes (`text-[120px] sm:text-[160px]`). On 3-digit total results (e.g. `128`), text overflows mobile viewport bounds.

### Important UX Findings
1. **Redundant Top Notation Input**: The text input in `TopNotationBar.tsx` allows manual typing, but on mobile devices opening the software keyboard obscures the 3D dice canvas.
2. **Lack of Touch Visual Feedback on Quick Presets**: Quick preset chips lack tactile active states on mobile touch displays.

### Polish UX Findings
1. **Auto-Collapse Behavior Awareness**: Mobile users are not given a subtle hint or visual indicator when sidebars auto-collapse on screens under 768px width.

---

## F. CODE QUALITY ASSESSMENT

### Technical Debt & Maintenance Concerns
1. **Dead Code Accumulation**: 6 legacy files (`DiceTray.tsx`, `RPGPresets.tsx`, `RollHistory.tsx`, `ThemeSelector.tsx`, `AndroidMobileGuide.tsx`, `RollResultModal.tsx`) remain in `src/components/`, creating developer confusion.
2. **Magic Numbers in Motion Detection**: `ShakeDetector.ts` uses hardcoded speed thresholds (`2800`, `200`, `180`) and delay intervals (`70ms`, `350ms`) without named constants or adaptive Android calibration.
3. **Implicit `any` Types in Callback Handlers**: `handleRollComplete(physicalResults: any)` in `App.tsx` and `ThreeDiceCanvas.tsx` lacks full TypeScript interfaces for Ammo.js physical roll event payloads.

---

## G. DOCUMENTATION ASSESSMENT

1. **`README.md`**: Entirely outdated Google AI Studio boilerplate. Must be rewritten to reflect Fantastic Dice architecture, installation, build commands, and native Android sync procedures.
2. **`docs/ARCHITECTURE.md`**: Accurate overall, but missing details on current collapsible sidebar layout and real-time formula staging.
3. **`docs/ANDROID_ROADMAP.md`**: Recommends obsolete manual Kotlin code; should be updated to prioritize Capacitor native plugins and automated asset sync.
