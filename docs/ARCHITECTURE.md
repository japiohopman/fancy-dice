# Fantastic 3D Dice Roller — Project Architecture & Vision

## 1. Overview & Vision
Fantastic 3D Dice Roller is a high-performance, mobile-first 3D physics dice rolling application designed primarily for landscape tablet/mobile layouts. It features realistic 3D polyhedral dice physics powered by `@3d-dice/dice-box` and Three.js / Ammo.js, native motion-sensor gesture controls (shake-to-roll), sound and haptic feedback, customizable felt table surfaces, and a full DnD 5e / TRPG notation engine.

---

## 2. Core Functional Requirements

### 📱 Static Landscape UI (No Scrollbars)
- **Top Bar (`TopNotationBar.tsx`)**: Prominent current dice notation input (e.g., `1d20+10`, `4d4`), quick preset chips, roll trigger button, sound mute toggle, and shake sensor status indicator.
- **Center Canvas Stage (`ThreeDiceCanvas.tsx`)**: Fullscreen 3D WebGL viewport running Ammo.js rigid body collision physics for d4, d6, d8, d10, d12, d20, d100, and Fate dice.
- **Center Outcome Overlay (`RollOutcomeOverlay.tsx`)**: Non-blocking auto-fading result modal directly over the dice box that displays total, natural crits, fumbles, individual roll breakdowns, and confetti particle bursts before smoothly fading out.
- **Left Options Panel (`LeftOptionsPanel.tsx`)**: Collapsible panel containing quick die count adjusters (+/- d4 through d100), modifier controls, advantage/disadvantage toggles, and 1-tap RPG action presets (e.g., Fireball `8d6`, Attack Roll `1d20+5`).
- **Right Options Panel (`RightOptionsPanel.tsx`)**: Collapsible panel featuring 3D material themes (Emerald, Ruby, Gold, Cyber Neon, Obsidian, Ivory, Galaxy), table felt surfaces (Emerald, Sapphire, Crimson, Midnight, Leather), and motion accelerometer calibration controls.
- **Bottom History Bar (`BottomHistoryBar.tsx`)**: Horizontal ticker showing historical rolls with instant re-roll taps and clear options.

---

## 3. Technology Stack & Modules

- **UI Framework**: React 18, TypeScript, Tailwind CSS, Lucide Icons
- **3D Physics Engine**: `@3d-dice/dice-box` wrapper over Three.js and WebAssembly Ammo.js physics
- **Dice Notation Engine**: Custom regex parser supporting standard dice notation, keep high (`kh`), keep low (`kl`), modifiers, and Fate dice.
- **Motion Engine**: `DeviceMotionEvent` accelerometer listener (`ShakeDetector.ts`) with low-pass noise filtering and cross-axis threshold calculation.
- **Audio Engine**: Web Audio API Synthesizer (`audioManager.ts`) producing dynamic pitch-shifted wood/felt impact sounds, critical chime frequencies, and fumble thuds without external audio asset network dependencies.

---

## 4. Directory Structure

```
├── docs/
│   ├── ARCHITECTURE.md       # Architectural overview & design principles
│   └── ANDROID_ROADMAP.md    # Step-by-step native Android deployment guide
├── public/
│   └── assets/
│       └── dice-box/         # 3D meshes, WebAssembly physics & textures
├── src/
│   ├── components/
│   │   ├── ThreeDiceCanvas.tsx     # 3D DiceBox viewport
│   │   ├── RollOutcomeOverlay.tsx  # Auto-fading result display
│   │   ├── TopNotationBar.tsx      # Top formula bar & quick chips
│   │   ├── LeftOptionsPanel.tsx    # Staged dice builder & RPG presets
│   │   ├── RightOptionsPanel.tsx   # Material/Felt styles & motion controls
│   │   └── BottomHistoryBar.tsx    # Bottom history ticker
│   ├── lib/
│   │   ├── audioManager.ts         # Web Audio API sound synthesizer
│   │   ├── diceParser.ts           # RPG notation parser
│   │   └── shakeDetector.ts        # Sensor gesture handler
│   ├── App.tsx                     # Main layout & app state
│   └── types.ts                    # Global TypeScript interface definitions
```
