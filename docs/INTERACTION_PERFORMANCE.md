# Audio and color-picker interaction performance

This issue targets two interactions only: shake/roll audio synthesis and the custom dice color wheel. Keep the DiceBox physics and visual design unchanged.

## Source-level baseline before this change

The baseline was inspected on the `main` implementation before this branch:

| Interaction | Previous work per interaction |
| --- | --- |
| Shake rattle | Generate and fill a new 80 ms noise `AudioBuffer`; create a buffer source, band-pass filter and gain node. |
| Dice bounce audio | Schedule up to 14 JavaScript `setTimeout` callbacks. Each callback creates an oscillator and gain node for one bounce. |
| Color-wheel drag | Every pointer-move reads `getBoundingClientRect()`, updates two React state values, and immediately updates the app's material color. The parent then calls DiceBox `updateConfig()` for each changed color. |

These are structural counts, not measured CPU or frame-time results. No real-device performance trace was available as a trustworthy pre-change timing baseline; do not invent one.

## Changes in this branch

- Generate the short shake-noise buffer once per AudioContext and reuse it for later rattle sources.
- Schedule the entire dice-bounce sequence on the Web Audio clock in one synchronous pass; remove the per-bounce JavaScript timers.
- Route sound through one master gain so mute applies consistently to already-scheduled sound.
- Suspend the AudioContext when the page becomes hidden, and resume it on the next active-page sound request. Keep one context; do not repeatedly create/close contexts during mute toggles.
- Disconnect one-shot source/effect nodes after their envelopes finish.
- Read the color-wheel bounds once on pointer-down; reuse that rectangle for the complete pointer-captured drag.
- Coalesce wheel pointer input with `requestAnimationFrame`, keep the wheel marker responsive each frame, and limit expensive parent/DiceBox color previews to approximately 30 updates per second.
- Always commit the exact pointer-up (or pointer-cancel/lost-capture) color immediately. Skip unchanged HEX values.
- Record synchronous audio scheduling and color-wheel commit timings with the Performance API.

## Runtime measurements

After using the app, run this in DevTools Console:

```js
console.table(
  performance
    .getEntriesByType('measure')
    .filter(({ name }) => name.startsWith('fancy-dice:audio-') ||
                          name.startsWith('fancy-dice:color-wheel-') ||
                          name.startsWith('fancy-dice:dice-color-'))
    .map(({ name, duration }) => ({
      measurement: name,
      milliseconds: Math.round(duration * 1000) / 1000,
    })),
);
```

The audio measures capture JavaScript time spent scheduling audio nodes. They do not measure the physical speaker's output latency or audible quality. The color-wheel measure begins at the most recent pointer sample and includes waiting for the coalesced commit. The `fancy-dice:dice-color-config` measure records how long the asynchronous DiceBox material-color update takes to settle.

## Repeatable desktop and Android comparison

Use the same browser/device, viewport, sound volume, and test conditions before and after this change. Keep desktop and physical Android results separate.

1. Open Chrome DevTools **Performance**, disable CPU throttling, and record a 10-second burst of repeated shake feedback. On Android, use the real shake gesture; on desktop, use the app's simulated shake control.
2. Record ten `8d6` rolls. Listen for clipped/clicking sounds, missing impacts, and changed bounce timing; inspect main-thread scripting and long tasks during the physical roll.
3. Open the custom dice color wheel and drag continuously around the full wheel for 10 seconds, including a drag that leaves the wheel bounds before releasing. Inspect pointer event work, React commits, frame delivery, and the number of DiceBox color updates.
4. Repeat with sound muted, unmuted, and after switching the app to the background and back. Confirm audio resumes on the next user action and does not unexpectedly play while hidden.
5. Compare the same traces and user-visible behaviour on the same device. The wheel's final HEX value must match the release position exactly.

## Automated coverage

`tests/audioManager.test.ts` verifies noise-buffer reuse, scheduling the maximum bounce sequence without JavaScript timers, master-gain mute control, and background AudioContext suspension. The regular test command runs these tests with the dice notation suite.