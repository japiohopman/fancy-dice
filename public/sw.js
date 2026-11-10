/* Fancy Dice PWA service worker.
 * Increment CACHE_NAME when changing stable public asset URLs so clients
 * discard previously cached copies after the next deployment.
 */
const CACHE_NAME = 'fancy-dice-pwa-v1';
const APP_SHELL_URL = new URL('.', self.registration.scope).href;
const MANIFEST_URL = new URL('manifest.webmanifest', APP_SHELL_URL).href;
const ICON_URL = new URL('icons/fancy-dice.svg', APP_SHELL_URL).href;
const SCOPE_PATH = new URL(self.registration.scope).pathname;
const STATIC_ASSET_PATTERN = /\.(?:avif|css|gif|ico|jpe?g|js|json|png|svg|webp|wasm|woff2?)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll([APP_SHELL_URL, MANIFEST_URL, ICON_URL]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('fancy-dice-pwa-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE_PATH)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(APP_SHELL_URL))),
    );
    return;
  }

  if (!STATIC_ASSET_PATTERN.test(url.pathname)) return;

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
