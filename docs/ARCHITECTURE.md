# Fancy Dice — active architecture

## 1. Product and runtime

Fancy Dice is a standalone React/TypeScript dice roller delivered as an installable PWA. The app is responsive and orientation-neutral: it follows the current viewport and uses CSS safe-area insets. It does not require an account, backend or network connection for dice parsing and rolling after its required app and game assets have been loaded.

The active runtime uses:

- React 19 and TypeScript for the interface and application state.
- Vite for development, production builds and the PWA service-worker precache plugin.
- @3d-dice/dice-box with Babylon.js and Ammo.js WebAssembly for physical dice.
- A local notation parser and dice-builder model.
- Web Audio API for synthesized roll, shake, critical and fumble sounds.
- Browser DeviceMotionEvent and navigator.vibrate APIs for shake and vibration feedback.

Capacitor dependencies and a configuration file are present, but the current app does not call the Capacitor Motion or Haptics plugins. A native Android platform project is not committed. See ANDROID_ROADMAP.md for the distinction between the shipped PWA and possible future native work.

## 2. App shell and navigation

The interface has three persistent layout regions:

1. **Top notation bar — TopNotationBar.tsx.** The formula input, Roll action and Menu trigger remain visible. Formula errors are presented next to the input without discarding the user's text.
2. **Dice stage — ThreeDiceCanvas.tsx.** The full-width 3D table remains mounted and fills the central area. RollOutcomeOverlay.tsx displays the current result over the stage.
3. **Bottom history bar — BottomHistoryBar.tsx.** A compact, single-row history strip supports repeat rolls and clearing session history.

There are no permanent left/right sidebars. The Menu trigger opens one modal-style overlay above the dice stage. Its sections are:

- Dice — the die builder.
- Presets — built-in formula presets.
- Themes — dice material and tabletop themes.
- Dice Color — custom dice color selection.
- Options — shake, sound, vibration and sensor settings.
- About — short app description.

The overlay is absolutely positioned within the app shell and does not resize or remount the DiceBox stage. It includes backdrop dismissal, keyboard dismissal, focus management and section-level scrolling. The app shell and menu animations are implemented in App.tsx and the shared CSS.

## 3. Active component map

Only the following components are part of the active component tree:

| Component | Responsibility |
| --- | --- |
| App.tsx | Owns application state, formula execution, navigation, themes, shake settings, roll history and error handling. |
| TopNotationBar.tsx | Always-visible notation field, Roll action, formula validation display and Menu trigger. |
| ThreeDiceCanvas.tsx | Lazy-loads and initializes DiceBox, owns the 3D canvas lifecycle, queues pending rolls and collects physical die results. |
| RollOutcomeOverlay.tsx | Displays the completed roll result over the dice stage with an auto-fading overlay. |
| LeftOptionsPanel.tsx | Renders the die builder and built-in presets inside the menu. |
| RightOptionsPanel.tsx | Renders themes, the custom color wheel and device/audio/vibration options inside the menu. |
| BottomHistoryBar.tsx | Renders the horizontal session history, repeat-roll actions and clear action. |

The six obsolete components identified by the earlier audit were removed in Issue #43. RollHistoryEntry remains an active data type; the removed RollHistory.tsx component was not the current history implementation.

## 4. State ownership and data flow

App.tsx is the source of truth for:

- Current formula and formula/roll errors.
- Parsed/current roll result and rolling state.
- Shake/cup feedback state.
- Menu open/mounted state and active menu section.
- Dice material, tabletop theme and dice skin.
- Shake sensitivity, sound and vibration preferences.
- Current session roll history.

TopNotationBar edits the canonical formula through callbacks. LeftOptionsPanel keeps a local builder projection synchronized with that formula using diceBuilderModel.ts; a custom formula is preserved until the user deliberately changes it using the builder. Presets are defined in the active builder component, not in the removed legacy RPGPresets component.

A roll is validated in App.tsx before audio or DiceBox is started. Successful physical results are normalized and reconciled with the parsed result; chained explosions request another physical DiceBox wave before the result is finalized. Completed results are added to the in-memory session history, capped at 50 entries. The current source does not persist history remotely.

ThreeDiceCanvas uses refs for current callbacks and theme selections so asynchronous DiceBox callbacks do not require recreating the engine instance. Initialization and roll operations have timeouts and an error callback to return the app to an actionable state when the engine fails.

## 5. DiceBox loading and physical results

The DiceBox package is dynamically imported by ThreeDiceCanvas after the initial React render. This keeps the engine module out of the initial app entry chunk. DiceBox is configured with offscreen rendering disabled and assets resolved under the Vite base path.

A roll requested before DiceBox initialization completes is held as a pending roll. After initialization, the latest theme configuration is applied before the pending roll is released. Physical die completion events are collected by DiceBoxRollCollector and reconciled with the parsed formula by diceParser.ts.

Performance marks/measures cover app startup, DiceBox module loading, engine readiness and first-roll completion. Build chunk sizes and the repeatable timing procedure are documented in PERFORMANCE_BASELINE.md. Build-size changes alone are not proof of faster real-device startup.

## 6. Motion, audio and feedback

ShakeDetector.ts listens for browser devicemotion events on supported touch/mobile browsers. It requests DeviceMotionEvent permission where the browser exposes a permission API. Motion deltas determine shake pulses and the stillness window used to release the dice roll.

Vibration is triggered through navigator.vibrate when available and enabled. Audio is synthesized by audioManager.ts through one Web Audio AudioContext and a shared master gain. The app suspends audio when the page becomes hidden and handles a sound request that arrives while suspension is still settling.

No Capacitor Motion or Haptics plugin calls are currently present in the active source tree. Native plugin integration would be a separate implementation and physical-device validation task.

## 7. PWA delivery and offline behaviour

The app is published through GitHub Pages under the /fancy-dice/ repository path. Vite switches its production base path in GitHub Actions; local development uses /.

The web app manifest uses standalone display and does not request a fixed orientation. CSS applies top/right/bottom/left safe-area insets to the app shell. The service worker precaches the app shell, manifest, icons and generated JavaScript/CSS bundles. Fingerprinted Vite bundles use cache-first; other same-origin static assets, including stable DiceBox assets, use network-first with a cached fallback.

The first visit requires an internet connection. The service worker registers after the page load event and takes control only after activation; DiceBox can begin requesting its assets before that happens. Once the worker is active, relaunch the app while online and wait for the dice table to finish loading so those engine assets are requested under service-worker control. Google Fonts are external and may fall back to system fonts offline.

## 8. Scope boundary

Fancy Dice remains a standalone dice roller. Accounts, remote storage, multiplayer, remote rolling, Bluetooth and backend services are out of scope. The Artificer companion architecture is documented as a future concept only in FUTURE_COMPANION_INTEGRATION.md.
