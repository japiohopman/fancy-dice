# Fancy Dice — master technical audit

**Repository:** japiohopman/fancy-dice  
**Snapshot date:** 14 November 2026  
**Scope:** Active application architecture, dice physics, notation and roll lifecycle, PWA delivery, browser motion/audio, performance, maintenance and documentation.  
**Verification labels:** [Verified in source], [Verified in build/CI], [Inferred], [Requires physical-device measurement].

## A. Executive summary

Fancy Dice is an installable, orientation-neutral 3D dice-roller PWA published through GitHub Pages. Its active interface has a persistent notation bar, a full-width 3D dice stage, a single overlay menu and a compact bottom history bar. It is designed to remain a standalone client-side app.

The repository contains Capacitor dependencies and configuration, but it does not contain a committed Android platform project. The current app uses browser motion and vibration APIs; Capacitor Motion/Haptics are not integrated. The current shipped Android experience is therefore the PWA installed from Chrome, not a native APK/AAB.

The six unused legacy UI files identified by the previous audit were removed in Issue #43. The active component map is in ARCHITECTURE.md.

## B. Product scope

The existing product is a standalone dice roller. The active backlog is limited to performance, reliability, usability, accessibility, responsive behaviour, visual quality, maintainability and PWA/device compatibility.

Out of scope: accounts, cloud synchronization, multiplayer, remote rolling, Bluetooth, backend services and implementation of the future Artificer companion concept. FUTURE_COMPANION_INTEGRATION.md remains a concept note only.

## C. Active application architecture

### Application state and composition [Verified in source]

App.tsx owns the canonical formula, formula/roll errors, current result, rolling state, shake feedback, menu state, themes, shake/audio/vibration settings and in-memory session history.

The active component tree is:

| Component | Responsibility |
| --- | --- |
| TopNotationBar.tsx | Persistent formula input, Roll action, validation feedback and Menu trigger. |
| ThreeDiceCanvas.tsx | Asynchronous DiceBox import/init, 3D stage, pending roll, physical result collection and engine error handling. |
| RollOutcomeOverlay.tsx | Auto-fading result display above the dice stage. |
| LeftOptionsPanel.tsx | Dice builder and formula presets inside the menu overlay. |
| RightOptionsPanel.tsx | Dice/table themes, custom color wheel and device/audio settings inside the menu overlay. |
| BottomHistoryBar.tsx | Compact one-row session history, repeat roll and clear action. |

The menu is a modal-style overlay above the mounted dice stage; permanent left/right sidebars are not part of the active layout. App shell safe-area spacing is defined in src/index.css.

### Roll flow [Verified in source]

1. The notation is parsed and validated in App.tsx before audio or physical DiceBox rolling begins.
2. The parsed result becomes the active roll context and ThreeDiceCanvas receives the request.
3. ThreeDiceCanvas lazily imports @3d-dice/dice-box and initializes the engine. A request received before initialization is held as a pending roll.
4. DiceBox physical die events are collected and reconciled with the parsed formula.
5. Exploding dice may trigger subsequent physical roll waves. The result is finalized only when no pending explosion dice remain.
6. The completed roll is added to in-memory history, capped at 50 entries.

Initialization and roll timeouts/error callbacks are present so failures can return the interface to an actionable state. Detailed implementation acceptance for notation and roll lifecycle is tracked in Issues #38–#40.

## D. PWA and Android readiness

| Area | Current repository state | Verification |
| --- | --- | --- |
| PWA delivery | Published at https://japiohopman.github.io/fancy-dice/ under /fancy-dice/. | [Verified in README, Vite config and deployment workflow] |
| Orientation | Manifest omits orientation; app follows live viewport. | [Verified in manifest and CSS] |
| Safe areas | App shell applies top/right/bottom/left env(safe-area-inset-*) padding. | [Verified in src/index.css] |
| Offline | Service worker precaches app shell, manifest, icons and generated JS/CSS; same-origin static assets are cached as requested. | [Verified in sw.js and Vite build plugin]; first visit still needs internet. |
| Motion | ShakeDetector uses browser DeviceMotionEvent. | [Verified in source]; physical sensor/permission behaviour requires device testing. |
| Vibration | Uses navigator.vibrate when available and enabled. | [Verified in source]; actual device behaviour requires device testing. |
| Audio | Web Audio AudioContext synthesis with shared master gain and hidden-page lifecycle handling. | [Verified in source]; audible quality requires device testing. |
| Capacitor packages | Core, CLI, Android, Motion and Haptics dependencies plus capacitor.config.ts exist. | [Verified in package.json and config] |
| Native Android project | android/ is excluded by .gitignore and is absent from the repository tree. | [Verified in source tree] |
| Native plugin integration | Active source has no Capacitor Motion/Haptics plugin calls. | [Verified by source inspection] |
| APK/AAB or Play Store | No committed native project or verified native build/release is present. | [Verified in repository tree; release not claimed] |

Do not describe the current app as a shipped native Android app. See ANDROID_ROADMAP.md for the conditional native path.

## E. Performance assessment

### DiceBox initial-load split [Verified in build output]

Issue #41 introduced a dynamic import of @3d-dice/dice-box after the initial React render. The recorded build comparison in PERFORMANCE_BASELINE.md shows the app entry chunk reduced from 459.48 kB to 262.82 kB (42.8% smaller); gzip size fell from 121.79 kB to 81.43 kB (33.1% smaller).

The dependent DiceBox and physics assets remain substantial and are loaded/cached for the engine. This build-size improvement is not itself proof of faster user-perceived startup or first-roll latency. Matched runtime measurements remain the standard; see PERFORMANCE_BASELINE.md.

### Audio and color wheel [Verified in source; runtime gains require device measurement]

Issue #42's implementation was merged in PR #61:

- Shake noise AudioBuffer is generated once per AudioContext and reused.
- Dice bounce sounds are scheduled on the Web Audio clock rather than through separate JavaScript timers.
- Sounds share a master gain; one-shot nodes are disconnected after playback.
- Hidden-page handling stops active sources and suspends the context; a sound request during a pending suspension is handled after it settles.
- The color wheel caches its bounds for a drag, coalesces pointer input through animation frames, limits parent/DiceBox previews to about 30 Hz and commits the final selection.
- Performance measures record JavaScript scheduling/commit work.

No matched physical-device CPU/frame-time trace or speaker-latency result is claimed here. Issue #42 remains open until manual sound, color, mute and background/foreground acceptance is completed.

### Remaining measurement limits

- [Requires physical-device measurement] Cold/warm PWA startup, DiceBox-ready time and first-roll latency on representative Android hardware.
- [Requires physical-device measurement] Audio quality, motion permission, vibration and app background/foreground behaviour.
- [Requires physical-device measurement] Color-wheel responsiveness and main-thread/frame-time comparison on the same phone/browser before and after the change.

## F. Logic and reliability status

- Strict notation validation, full-input checking, limits and chained physical explosions are implemented in PR #56; Issue #38 remains open for manual formula/preset/Fate/keep-drop/explosion verification.
- Notation/builder/preset/history synchronization is closed in Issue #39.
- Roll lifecycle, error handling and sensor listener lifecycle work is closed in Issue #40.
- These implementation statuses do not replace the manual acceptance still listed on the open issues.

## G. Maintenance and documentation

- [Resolved in #43] Six unused UI components removed: DiceTray.tsx, RPGPresets.tsx, RollHistory.tsx, ThemeSelector.tsx, AndroidMobileGuide.tsx and RollResultModal.tsx.
- [Resolved in #43] Orphaned DicePreset type and confetti runtime/type dependencies removed.
- RollHistoryEntry remains active and is used by App.tsx and BottomHistoryBar.tsx.
- The active component map and state ownership are described in ARCHITECTURE.md.
- The published PWA and conditional native Android path are described in ANDROID_ROADMAP.md.
- Current priorities and issue dependencies are summarized in ROADMAP.md.

## H. Current open acceptance items

| Issue | Remaining verification |
| --- | --- |
| #38 | Manual valid/invalid formula, presets, keep/drop, Fate and chained-explosion checks. |
| #42 | Physical-device audio/color-wheel/mute/background checks and matched performance traces where available. |
| #44 | Keep architecture, roadmap, Android guide and this audit aligned with source reality. |
| #55 | Gradual Tavern Table visual direction; no global rebrand. |

Use the GitHub issues as the live source of truth for status. Re-run this audit when a material product/runtime boundary changes; do not retain old claims simply because they appeared in an earlier audit.
