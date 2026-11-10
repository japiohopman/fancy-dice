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
- [ ] After the initial full load, enable Airplane mode and relaunch the app to verify the cached app shell and already-loaded game assets.

## Offline and update behaviour

The service worker precaches the app entry page, manifest, and app icon. Same-origin JavaScript, CSS, JSON, image, font, and WebAssembly assets are cached on first use. Google Fonts are external and may fall back to system fonts offline.

When a release changes a stable URL under `public/assets/`, increment `CACHE_NAME` in `public/sw.js` (for example, from `v1` to `v2`). The next activated service worker removes older Fancy Dice PWA caches.

The first visit still requires an internet connection. Offline testing should be done only after a complete online launch has loaded the dice engine, its themes, and other assets that will be needed.

## Debugging

On desktop Chrome, open:

`chrome://inspect/#devices`

For the installed PWA, inspect its WebView target and check the Console and Network panels. Confirm that requests for `assets/dice-box/` stay under `/fancy-dice/` and that the service worker controls the page.

For Android physical testing, record device model, Android version, Chrome version, and any failures in the project issue/PR rather than treating browser or emulator checks as physical-device verification.
