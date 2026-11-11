/* Fancy Dice PWA service worker.
 * Stable public assets use network-first so updated files replace cached
 * copies automatically. Content-hashed Vite bundles use cache-first because
 * a new build gets a new URL. Increment CACHE_NAME when changing the cache
 * strategy or the precache list.
 */
const CACHE_NAME = 'fancy-dice-pwa-v3';
const APP_SHELL_URL = new URL('.', self.registration.scope).href;
const MANIFEST_URL = new URL('manifest.webmanifest', APP_SHELL_URL).href;
const ICON_URLS = [
  new URL('icons/fancy-dice.svg', APP_SHELL_URL).href,
  new URL('icons/fancy-dice-192.png', APP_SHELL_URL).href,
  new URL('icons/fancy-dice-512.png', APP_SHELL_URL).href,
];
// Filled by the Vite build plugin with every generated JS chunk and CSS file.
const BUILD_ASSET_FILES = [];
const BUILD_ASSET_URLS = BUILD_ASSET_FILES.map((file) => new URL(file, APP_SHELL_URL).href);
const SCOPE_PATH = new URL(self.registration.scope).pathname;
const STATIC_ASSET_PATTERN = /\.(?:avif|css|gif|ico|jpe?g|js|json|png|svg|webp|wasm|woff2?)$/i;
// Vite names bundles like index-<hash>.js, not index.<hash>.js.
const HASHED_BUNDLE_PATTERN = /[-.][a-z0-9_-]{8,}\.(?:css|js)$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll([APP_SHELL_URL, MANIFEST_URL, ...ICON_URLS, ...BUILD_ASSET_URLS]),
      )
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

async function fetchAndCache(request, cacheKey = request) {
  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(cacheKey, response.clone());
    } catch (error) {
      // A cache quota/write failure must not turn a successful network
      // response into a failed page or game-asset request.
      console.warn('Fancy Dice could not update its offline cache:', error);
    }
  }
  return response;
}

async function networkFirst(request) {
  // A single app-shell cache key prevents query strings from creating
  // unbounded navigation entries.
  const cacheKey = request.mode === 'navigate' ? APP_SHELL_URL : request;
  try {
    return await fetchAndCache(request, cacheKey);
  } catch {
    const cached = await caches.match(cacheKey);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const appShell = await caches.match(APP_SHELL_URL);
      if (appShell) return appShell;
    }
    return Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    return await fetchAndCache(request);
  } catch {
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE_PATH)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  if (!STATIC_ASSET_PATTERN.test(url.pathname)) return;

  // Vite's fingerprinted JS/CSS URLs are immutable. Public game-engine assets
  // keep stable URLs, so check the network first and refresh their cache.
  event.respondWith(
    HASHED_BUNDLE_PATTERN.test(url.pathname) ? cacheFirst(request) : networkFirst(request),
  );
});
