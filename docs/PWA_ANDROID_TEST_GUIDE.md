# Fancy Dice — Android PWA test guide

## Published test URL

After the GitHub Pages deployment completes:

https://japiohopman.github.io/fancy-dice/

The app is served from the repository subpath `/fancy-dice/`. Vite sets that base path automatically in GitHub Actions builds; local development continues to use `/`.

## First install on Android

1. Open the published URL in **Chrome** on the Android phone.
2. Keep the phone online and wait until the dice table and controls have fully loaded.
3. Open Chrome's menu and select **Install app**. Depending on the Chrome version, this may appear as **Add to Home screen**.
4. Confirm the install.
5. Launch **Fancy Dice** from the home screen and check that it opens without the normal browser address bar.

If Chrome does not offer installation, check that the page loaded over HTTPS, the manifest is available, and the service worker is active. A first deployment can take a short time to become available after the workflow finishes.

## Functional smoke test

- [ ] App opens in standalone mode and uses the expected landscape layout.
- [ ] A single d20 roll completes and the result matches the visible die.
- [ ] Mixed and multiple dice (for example `4d6 + 1d20`) roll and settle correctly.
- [ ] Dice skins and table themes can be changed.
- [ ] Roll history updates and a previous roll can be repeated.
- [ ] Impact sounds and critical/fumble sounds play after a user interaction.
- [ ] Vibration works when vibration feedback is enabled and the device/browser permits it.
- [ ] Shake-to-roll responds to a deliberate shake and does not trigger repeatedly while the phone is still.
- [ ] App can be sent to the background and reopened without a blank WebGL canvas.
- [ ] After the service worker is active, relaunch once while online so the dice-engine assets have passed through the worker.
- [ ] Enable Airplane mode and relaunch to verify the app shell, generated bundles, and previously loaded game assets work offline.

## Offline and update behaviour

The service worker precaches the app entry page, manifest, SVG/PNG app icons, and the JavaScript/CSS files emitted by the Vite production build. A Vite build plugin injects those generated bundle URLs into the service worker, so the install step does not depend on guessed or hard-coded hashes.

Content-hashed Vite JavaScript and CSS bundles use cache-first because a changed bundle receives a new URL. Other same-origin static resources—including the dice engine's stable files under `public/assets/dice-box/`—use network-first with a cached fallback. This means an online launch refreshes stable game files instead of requiring a manual cache-version bump for every asset edit.

Google Fonts are external and may fall back to system fonts offline. The first visit still requires an internet connection. The dice engine's public assets are cached as they are requested through the active service worker, so complete one controlled online launch before relying on offline use.

Increment `CACHE_NAME` in `public/sw.js` when changing the service-worker cache strategy or the precache list. Activation removes older Fancy Dice PWA caches.

## Debugging

On desktop Chrome, open:

`chrome://inspect/#devices`

For the installed PWA, inspect its WebView target and check the Console and Network panels. Confirm that requests for `assets/dice-box/` stay under `/fancy-dice/` and that the service worker controls the page.

For Android physical testing, record device model, Android version, Chrome version, and any failures in the project issue/PR rather than treating browser or emulator checks as physical-device verification.
