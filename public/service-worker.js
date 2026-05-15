// ============================================================
// QUEZ APP LITE — Service worker
// Offline-first app shell. Cache the HTML + assets so the iPhone /
// iPad can launch the app cold with no network. Data is already
// localStorage so the rest just keeps working.
//
// Bump CACHE_VERSION on any change that should evict the cache —
// every fresh deploy effectively rebuilds the cache anyway because
// the JS/CSS filenames are hashed.
// ============================================================
const CACHE_VERSION = 'quez-v4';
const SCOPE = new URL('./', self.location.href).href;
const SHELL_URLS = [
  SCOPE,
  SCOPE + 'index.html',
  SCOPE + 'manifest.json',
  SCOPE + 'quez-seal.png',
  SCOPE + 'favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // addAll is atomic: if any URL fails the whole install rejects.
      // Tolerate missing optional assets by adding them individually.
      Promise.all(
        SHELL_URLS.map((url) =>
          cache.add(url).catch(() => undefined)
        )
      )
    )
  );
  // New SW activates immediately on next page load.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  // Take control of pages that were loaded before this SW installed.
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Cross-origin requests (EmailJS, weather, etc.) — pass through, no cache.
  if (url.origin !== self.location.origin) return;

  // Only GET requests are cacheable.
  if (req.method !== 'GET') return;

  // Navigation requests (the user typing / refreshing the URL).
  // Try the network first so updates flow through immediately when online,
  // fall back to cached index.html when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(SCOPE + 'index.html').then((cached) => cached || caches.match(SCOPE))
      )
    );
    return;
  }

  // Static assets — NETWORK-FIRST so fresh deploys ship immediately when
  // online. Fall back to the SW cache only if the network is unreachable.
  // (Cache-first caused users to keep running an older bundle even after a
  // deploy because their hashed JS file was already in the SW cache.)
  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
        }
        return response;
      })
      .catch(() => caches.match(req))
  );
});

// Allow the page to ask the SW to activate immediately (used by the
// "new version available" banner if we ever add one).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
