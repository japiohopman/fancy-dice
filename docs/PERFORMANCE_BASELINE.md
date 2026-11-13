# Performance baseline and measurement guide

This document records the pre-optimization build baseline and the repeatable checks used to compare app startup, DiceBox initialization, and the first physical roll.

## Baseline before the lazy-load change

Source: GitHub Actions production build, run [43415916840](https://github.com/japiohopman/fancy-dice/actions/runs/43415916840), captured on 13 November 2026 before the performance change. The build transformed 1,690 modules and completed in 3.89 seconds.

| Output file | Size | Gzip |
| --- | ---: | ---: |
| `index-Du7yx2tZ.js` (app entry) | 459.48 kB | 121.79 kB |
| `Dice-C2iRQpv2.js` (DiceBox engine) | 691.34 kB | 168.47 kB |
| `world.offscreen-C5e_o3iU.js` (physics runtime) | 1,447.26 kB | 412.36 kB |
| `world.onscreen-CV6qfT6f.js` | 391.11 kB | 87.51 kB |
| `world.none-BT84GWc2.js` | 2.54 kB | 1.10 kB |
| `index-CnXePHt1.css` | 51.53 kB | 9.85 kB |

These are generated asset sizes, not a measurement of browser startup time. The pre-change build also precached every generated JavaScript chunk during service-worker installation, so simply splitting the entry bundle would not have avoided downloading the engine during PWA installation.

A real-device runtime baseline (navigation-to-app-ready, DiceBox-ready, and first-roll latency) has not yet been captured for the old production build. Do not infer those numbers from build output. Capture them on the currently deployed version before deploying this optimization, then repeat under the same device, browser, network, and cache conditions.

## Runtime timings after the instrumentation change

The app records these User Timing measures in the browser:

- `fancy-dice:app-startup`: navigation time origin to the first committed app render.
- `fancy-dice:dicebox-module-load`: start of the first DiceBox initialization attempt to completion of the lazy module download.
- `fancy-dice:dicebox-ready-time`: start of the first initialization attempt to DiceBox finishing `init()`, including module loading and physics setup.
- `fancy-dice:first-roll`: user requesting the first valid roll to the completed physical result. This includes any lazy engine loading required by that roll.

After completing a roll, run this in the browser DevTools Console:

```js
console.table(
  performance
    .getEntriesByType('measure')
    .filter(({ name }) => name.startsWith('fancy-dice:'))
    .map(({ name, duration }) => ({
      measurement: name,
      milliseconds: Math.round(duration),
    })),
);
```

For navigation milestones, run:

```js
const navigation = performance.getEntriesByType('navigation')[0];
console.table({
  domInteractiveMs: Math.round(navigation.domInteractive),
  domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
  loadEventMs: Math.round(navigation.loadEventEnd),
});
```

## Repeatable comparison procedure

1. Use the same device, browser version, orientation, network, and deployment URL for each comparison.
2. For a cold-cache run, use a fresh browser profile or clear the site's storage and unregister its service worker before opening the app. Keep DevTools Network cache disabled during the run.
3. Open the app and record navigation timing plus `fancy-dice:app-startup`.
4. Make the first roll a `1d20`; record DiceBox module load, DiceBox ready, and first-roll duration.
5. Reload with the same cold-cache conditions and make the first roll `8d6`; record the same measures.
6. Repeat once with the service worker and warmed engine cache to measure repeat-launch/offline-cache behaviour separately.
7. On Android, repeat the single-die and `8d6` cases on the physical phone. Keep those measurements separate from desktop results.

## Build after the lazy-load change

Source: GitHub Actions PR build, run [43421219808](https://github.com/japiohopman/fancy-dice/actions/runs/43421219808), on 13 November 2026.

| Output file | Size | Gzip |
| --- | ---: | ---: |
| `index-SJ8ClNbn.js` (app entry) | 262.82 kB | 81.43 kB |
| `dice-box.es-CRq36shK.js` (deferred DiceBox module entry) | 198.12 kB | 40.78 kB |
| `Dice-CfcuzxNX.js` | 691.35 kB | 168.48 kB |
| `world.offscreen-C5e_o3iU.js` | 1,447.26 kB | 412.36 kB |
| `world.onscreen-CrwVg6U4.js` | 391.14 kB | 87.53 kB |
| `world.none-DlJlViU4.js` | 2.58 kB | 1.11 kB |
| `index-CnXePHt1.css` | 51.53 kB | 9.85 kB |

The app entry chunk fell from 459.48 kB to 262.82 kB (42.8% smaller); its gzip size fell from 121.79 kB to 81.43 kB (33.1% smaller). DiceBox now has a separate dynamic-import entry. Its larger dependent physics chunks remain available for the engine and are still included in the existing service-worker precache, preserving the pre-change offline asset warm-up behaviour.

This is a concrete bundle-splitting result, not yet proof of faster user-perceived startup or first-roll latency. The runtime measures above must still be collected on desktop and physical Android under matched cold-cache and warm-cache conditions.

The first-roll measure is emitted only once per page session. Reload before each scenario so the `1d20` and `8d6` results are independently comparable.
